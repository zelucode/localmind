//! Encryption of stored API keys.
//!
//! The webview keeps keys in `localStorage`, which any script in the page could
//! read. Before a key is written there, the frontend sends it here to be
//! encrypted with AES-256-GCM. The 256-bit master key never leaves Rust: it is
//! generated on first use and kept in the operating system's credential store
//! (Windows Credential Manager, macOS Keychain, Linux keyutils).
//!
//! Token format: `enc:v1:` + base64(12-byte nonce || ciphertext+tag).
//! The format version is also bound into the AEAD as associated data, so a token
//! can't be replayed under a different scheme.

use aes_gcm::aead::{Aead, AeadCore, KeyInit, OsRng, Payload};
use aes_gcm::{Aes256Gcm, Key, Nonce};
use base64::engine::general_purpose::STANDARD as B64;
use base64::Engine;
use serde::Serialize;

pub const TOKEN_PREFIX: &str = "enc:v1:";
const AAD: &[u8] = b"localmind/secret/v1";
const NONCE_LEN: usize = 12;
const KEYRING_SERVICE: &str = "LocalMind";
const KEYRING_USER: &str = "master-key-v1";
const MAX_SECRETS_PER_CALL: usize = 256;
const MAX_SECRET_LEN: usize = 8192;

pub type MasterKey = [u8; 32];

// ---------------------------------------------------------------------------
// Crypto core (pure, no I/O)
// ---------------------------------------------------------------------------

pub fn encrypt(key: &MasterKey, plaintext: &str) -> Result<String, String> {
    if plaintext.len() > MAX_SECRET_LEN {
        return Err("Secret is too long.".into());
    }
    let cipher = Aes256Gcm::new(Key::<Aes256Gcm>::from_slice(key));
    let nonce = Aes256Gcm::generate_nonce(&mut OsRng);
    let ciphertext = cipher
        .encrypt(&nonce, Payload { msg: plaintext.as_bytes(), aad: AAD })
        .map_err(|_| "Encryption failed.".to_string())?;
    let mut blob = Vec::with_capacity(NONCE_LEN + ciphertext.len());
    blob.extend_from_slice(&nonce);
    blob.extend_from_slice(&ciphertext);
    Ok(format!("{TOKEN_PREFIX}{}", B64.encode(blob)))
}

pub fn decrypt(key: &MasterKey, token: &str) -> Result<String, String> {
    let encoded = token.strip_prefix(TOKEN_PREFIX).ok_or_else(|| "Not an encrypted value.".to_string())?;
    let blob = B64.decode(encoded).map_err(|_| "Encrypted value is corrupted.".to_string())?;
    if blob.len() <= NONCE_LEN {
        return Err("Encrypted value is corrupted.".into());
    }
    let (nonce, ciphertext) = blob.split_at(NONCE_LEN);
    let cipher = Aes256Gcm::new(Key::<Aes256Gcm>::from_slice(key));
    let plain = cipher
        .decrypt(Nonce::from_slice(nonce), Payload { msg: ciphertext, aad: AAD })
        .map_err(|_| "Could not decrypt: wrong key or tampered data.".to_string())?;
    String::from_utf8(plain).map_err(|_| "Decrypted value is not valid text.".to_string())
}

// ---------------------------------------------------------------------------
// Master key storage
// ---------------------------------------------------------------------------

pub trait MasterKeyStore {
    /// Return the master key, creating and saving it on first use.
    fn get_or_create(&self) -> Result<MasterKey, String>;
}

/// Master key held in the OS credential store.
pub struct OsKeyStore;

impl OsKeyStore {
    fn entry() -> Result<keyring::Entry, String> {
        keyring::Entry::new(KEYRING_SERVICE, KEYRING_USER).map_err(|e| format!("Credential store unavailable: {e}"))
    }
}

impl MasterKeyStore for OsKeyStore {
    fn get_or_create(&self) -> Result<MasterKey, String> {
        let entry = Self::entry()?;
        match entry.get_password() {
            Ok(stored) => {
                let bytes = B64.decode(stored).map_err(|_| "Stored master key is corrupted.".to_string())?;
                bytes.try_into().map_err(|_| "Stored master key has the wrong length.".to_string())
            }
            Err(keyring::Error::NoEntry) => {
                let key: MasterKey = Aes256Gcm::generate_key(&mut OsRng).into();
                entry
                    .set_password(&B64.encode(key))
                    .map_err(|e| format!("Could not save the master key to the credential store: {e}"))?;
                Ok(key)
            }
            Err(e) => Err(format!("Could not read the credential store: {e}")),
        }
    }
}

// ---------------------------------------------------------------------------
// Batch operations (generic over the key store so tests need no OS keychain)
// ---------------------------------------------------------------------------

fn check_batch(len: usize) -> Result<(), String> {
    if len > MAX_SECRETS_PER_CALL {
        return Err(format!("Too many values (max {MAX_SECRETS_PER_CALL})."));
    }
    Ok(())
}

pub fn encrypt_all(store: &dyn MasterKeyStore, values: &[String]) -> Result<Vec<String>, String> {
    check_batch(values.len())?;
    if values.is_empty() {
        return Ok(vec![]);
    }
    let key = store.get_or_create()?;
    values.iter().map(|v| encrypt(&key, v)).collect()
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DecryptResult {
    /// The plaintext, or `None` if this value could not be decrypted.
    pub value: Option<String>,
    pub error: Option<String>,
}

/// Decrypt each token independently, so one bad value doesn't hide the others.
/// Failing to reach the master key at all is an error for the whole call.
pub fn decrypt_all(store: &dyn MasterKeyStore, tokens: &[String]) -> Result<Vec<DecryptResult>, String> {
    check_batch(tokens.len())?;
    if tokens.is_empty() {
        return Ok(vec![]);
    }
    let key = store.get_or_create()?;
    Ok(tokens
        .iter()
        .map(|t| match decrypt(&key, t) {
            Ok(v) => DecryptResult { value: Some(v), error: None },
            Err(e) => DecryptResult { value: None, error: Some(e) },
        })
        .collect())
}

#[tauri::command]
pub async fn encrypt_secrets(values: Vec<String>) -> Result<Vec<String>, String> {
    let result = tauri::async_runtime::spawn_blocking(move || encrypt_all(&OsKeyStore, &values))
        .await
        .map_err(|e| e.to_string())?;
    if let Err(message) = &result {
        crate::applog::error("secrets", &format!("Encrypting failed: {message}"));
    }
    result
}

#[tauri::command]
pub async fn decrypt_secrets(tokens: Vec<String>) -> Result<Vec<DecryptResult>, String> {
    let result = tauri::async_runtime::spawn_blocking(move || decrypt_all(&OsKeyStore, &tokens))
        .await
        .map_err(|e| e.to_string())?;
    match &result {
        Err(message) => crate::applog::error("secrets", &format!("Decrypting failed: {message}")),
        Ok(items) => {
            let failed = items.iter().filter(|r| r.value.is_none()).count();
            if failed > 0 {
                crate::applog::warn("secrets", &format!("{failed} of {} stored keys could not be decrypted", items.len()));
            }
        }
    }
    result
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::Mutex;

    /// In-memory stand-in for the OS credential store.
    struct MemoryStore {
        key: Mutex<Option<MasterKey>>,
        creations: Mutex<u32>,
    }
    impl MemoryStore {
        fn new() -> Self {
            Self { key: Mutex::new(None), creations: Mutex::new(0) }
        }
    }
    impl MasterKeyStore for MemoryStore {
        fn get_or_create(&self) -> Result<MasterKey, String> {
            let mut slot = self.key.lock().unwrap();
            if slot.is_none() {
                *slot = Some(Aes256Gcm::generate_key(&mut OsRng).into());
                *self.creations.lock().unwrap() += 1;
            }
            Ok(slot.unwrap())
        }
    }

    struct BrokenStore;
    impl MasterKeyStore for BrokenStore {
        fn get_or_create(&self) -> Result<MasterKey, String> {
            Err("Credential store unavailable: locked".into())
        }
    }

    fn key(byte: u8) -> MasterKey {
        [byte; 32]
    }

    #[test]
    fn round_trips_and_hides_the_plaintext() {
        let token = encrypt(&key(1), "AIzaSyExampleKey123").unwrap();
        assert!(token.starts_with(TOKEN_PREFIX));
        assert!(!token.contains("AIzaSy"));
        assert_eq!(decrypt(&key(1), &token).unwrap(), "AIzaSyExampleKey123");
    }

    #[test]
    fn handles_empty_and_unicode_secrets() {
        for s in ["", "kéy-密钥-🔑"] {
            let t = encrypt(&key(1), s).unwrap();
            assert_eq!(decrypt(&key(1), &t).unwrap(), s);
        }
    }

    #[test]
    fn same_plaintext_encrypts_differently_each_time() {
        let a = encrypt(&key(1), "secret").unwrap();
        let b = encrypt(&key(1), "secret").unwrap();
        assert_ne!(a, b, "a fresh nonce must be used per encryption");
    }

    #[test]
    fn wrong_master_key_cannot_decrypt() {
        let token = encrypt(&key(1), "secret").unwrap();
        assert!(decrypt(&key(2), &token).is_err());
    }

    #[test]
    fn tampering_is_detected() {
        let token = encrypt(&key(1), "secret").unwrap();
        let mut bytes = B64.decode(token.strip_prefix(TOKEN_PREFIX).unwrap()).unwrap();
        let last = bytes.len() - 1;
        bytes[last] ^= 0x01;
        let tampered = format!("{TOKEN_PREFIX}{}", B64.encode(bytes));
        assert!(decrypt(&key(1), &tampered).is_err());
    }

    #[test]
    fn rejects_malformed_tokens() {
        assert!(decrypt(&key(1), "plain-text-key").is_err());
        assert!(decrypt(&key(1), "enc:v1:").is_err());
        assert!(decrypt(&key(1), "enc:v1:@@not-base64@@").is_err());
        assert!(decrypt(&key(1), &format!("{TOKEN_PREFIX}{}", B64.encode([0u8; 5]))).is_err());
    }

    #[test]
    fn rejects_oversized_secrets() {
        assert!(encrypt(&key(1), &"x".repeat(MAX_SECRET_LEN + 1)).is_err());
    }

    #[test]
    fn batch_round_trip_uses_one_master_key() {
        let store = MemoryStore::new();
        let tokens = encrypt_all(&store, &["a".into(), "b".into(), "c".into()]).unwrap();
        let out = decrypt_all(&store, &tokens).unwrap();
        let values: Vec<_> = out.iter().map(|r| r.value.clone().unwrap()).collect();
        assert_eq!(values, vec!["a", "b", "c"]);
        assert_eq!(*store.creations.lock().unwrap(), 1, "master key is created once and reused");
    }

    #[test]
    fn one_bad_token_does_not_hide_the_good_ones() {
        let store = MemoryStore::new();
        let good = encrypt_all(&store, &["good".into()]).unwrap().remove(0);
        let out = decrypt_all(&store, &[good, "enc:v1:garbage".into(), "plain".into()]).unwrap();
        assert_eq!(out[0].value.as_deref(), Some("good"));
        assert!(out[1].value.is_none() && out[1].error.is_some());
        assert!(out[2].value.is_none() && out[2].error.is_some());
    }

    #[test]
    fn tokens_from_another_device_report_a_decryption_error() {
        let a = MemoryStore::new();
        let b = MemoryStore::new();
        let token = encrypt_all(&a, &["secret".into()]).unwrap().remove(0);
        let out = decrypt_all(&b, &[token]).unwrap();
        assert!(out[0].value.is_none());
        assert!(out[0].error.as_ref().unwrap().contains("wrong key"));
    }

    #[test]
    fn empty_batches_never_touch_the_key_store() {
        assert_eq!(encrypt_all(&BrokenStore, &[]).unwrap(), Vec::<String>::new());
        assert!(decrypt_all(&BrokenStore, &[]).unwrap().is_empty());
    }

    #[test]
    fn unreachable_key_store_is_an_error_for_the_whole_call() {
        assert!(encrypt_all(&BrokenStore, &["x".into()]).unwrap_err().contains("Credential store"));
        assert!(decrypt_all(&BrokenStore, &["enc:v1:abc".into()]).unwrap_err().contains("Credential store"));
    }

    #[test]
    fn batch_size_is_limited() {
        let many: Vec<String> = (0..=MAX_SECRETS_PER_CALL).map(|i| i.to_string()).collect();
        assert!(encrypt_all(&MemoryStore::new(), &many).is_err());
        assert!(decrypt_all(&MemoryStore::new(), &many).is_err());
    }

    /// Talks to the real OS credential store, so it is opt-in:
    /// `cargo test -- --ignored os_credential_store`
    #[test]
    #[ignore]
    fn os_credential_store_persists_one_master_key() {
        let first = OsKeyStore.get_or_create().unwrap();
        let second = OsKeyStore.get_or_create().unwrap();
        assert_eq!(first, second);
    }
}
