//! Passphrase-encrypted backups.
//!
//! API keys are encrypted at rest with a per-device master key, so a plain backup file would have to
//! carry them as readable text to be restorable on another machine. This module lets the user protect
//! the whole backup with a passphrase instead: the passphrase is stretched into a 256-bit key with
//! Argon2id and the file is encrypted with AES-256-GCM.
//!
//! The file is a small JSON envelope, so it can be recognised and the key-derivation settings travel
//! with it (they are range-checked on read so a crafted file cannot demand absurd memory or time):
//!
//! ```json
//! { "format": "localmind-encrypted-backup", "version": 1,
//!   "kdf": { "name": "argon2id", "m": 65536, "t": 3, "p": 1, "salt": "<base64>" },
//!   "cipher": "aes-256-gcm", "nonce": "<base64>", "data": "<base64>" }
//! ```
//!
//! There is no recovery: a forgotten passphrase means the file cannot be opened.

use aes_gcm::aead::rand_core::RngCore;
use aes_gcm::aead::{Aead, AeadCore, KeyInit, OsRng, Payload};
use aes_gcm::{Aes256Gcm, Key, Nonce};
use argon2::{Algorithm, Argon2, Params, Version};
use base64::engine::general_purpose::STANDARD as B64;
use base64::Engine;
use serde::{Deserialize, Serialize};

pub const FORMAT: &str = "localmind-encrypted-backup";
const VERSION: u32 = 1;
const AAD: &[u8] = b"localmind/backup/v1";
const SALT_LEN: usize = 16;
const NONCE_LEN: usize = 12;
const MIN_PASSPHRASE_CHARS: usize = 8;
const MAX_PASSPHRASE_CHARS: usize = 256;
/// A backup is a few hundred KB at most; this stops a huge file from being pushed through the cipher.
const MAX_BACKUP_BYTES: usize = 32 * 1024 * 1024;

/// Argon2id settings. Memory in KiB.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct KdfParams {
    pub m: u32,
    pub t: u32,
    pub p: u32,
}

/// What new backups use: 64 MiB, 3 passes, 1 lane (above the OWASP minimum of 19 MiB / 2 passes).
pub const DEFAULT_PARAMS: KdfParams = KdfParams { m: 64 * 1024, t: 3, p: 1 };
/// The most a file may ask for when it is opened.
const MAX_PARAMS: KdfParams = KdfParams { m: 256 * 1024, t: 10, p: 4 };
const MIN_M: u32 = 8 * 1024;

#[derive(Serialize, Deserialize)]
struct Kdf {
    name: String,
    m: u32,
    t: u32,
    p: u32,
    salt: String,
}

#[derive(Serialize, Deserialize)]
struct Envelope {
    format: String,
    version: u32,
    kdf: Kdf,
    cipher: String,
    nonce: String,
    data: String,
}

pub fn check_passphrase(passphrase: &str) -> Result<(), String> {
    let n = passphrase.chars().count();
    if n < MIN_PASSPHRASE_CHARS {
        return Err(format!("The passphrase must be at least {MIN_PASSPHRASE_CHARS} characters."));
    }
    if n > MAX_PASSPHRASE_CHARS {
        return Err(format!("The passphrase must be at most {MAX_PASSPHRASE_CHARS} characters."));
    }
    Ok(())
}

fn derive_key(passphrase: &str, salt: &[u8], params: KdfParams) -> Result<[u8; 32], String> {
    let argon_params = Params::new(params.m, params.t, params.p, Some(32)).map_err(|_| "Invalid key settings in the file.".to_string())?;
    let argon = Argon2::new(Algorithm::Argon2id, Version::V0x13, argon_params);
    let mut key = [0u8; 32];
    argon
        .hash_password_into(passphrase.as_bytes(), salt, &mut key)
        .map_err(|_| "Could not derive the encryption key.".to_string())?;
    Ok(key)
}

/// Encrypt backup text with a passphrase. Returns the envelope JSON to write to a file.
pub fn encrypt_with(plaintext: &str, passphrase: &str, params: KdfParams) -> Result<String, String> {
    check_passphrase(passphrase)?;
    if plaintext.len() > MAX_BACKUP_BYTES {
        return Err("The backup is too large to encrypt.".into());
    }
    let mut salt = [0u8; SALT_LEN];
    OsRng.fill_bytes(&mut salt);
    let key = derive_key(passphrase, &salt, params)?;
    let cipher = Aes256Gcm::new(Key::<Aes256Gcm>::from_slice(&key));
    let nonce = Aes256Gcm::generate_nonce(&mut OsRng);
    let data = cipher
        .encrypt(&nonce, Payload { msg: plaintext.as_bytes(), aad: AAD })
        .map_err(|_| "Encryption failed.".to_string())?;
    let envelope = Envelope {
        format: FORMAT.into(),
        version: VERSION,
        kdf: Kdf { name: "argon2id".into(), m: params.m, t: params.t, p: params.p, salt: B64.encode(salt) },
        cipher: "aes-256-gcm".into(),
        nonce: B64.encode(nonce),
        data: B64.encode(data),
    };
    serde_json::to_string_pretty(&envelope).map_err(|_| "Could not write the backup.".to_string())
}

/// Open an envelope. A wrong passphrase and a damaged file look the same to the cipher, so the message says both.
pub fn decrypt(envelope_text: &str, passphrase: &str) -> Result<String, String> {
    let wrong = || "Wrong passphrase, or the file has been changed.".to_string();
    let envelope: Envelope =
        serde_json::from_str(envelope_text).map_err(|_| "This is not an encrypted LocalMind backup.".to_string())?;
    if envelope.format != FORMAT {
        return Err("This is not an encrypted LocalMind backup.".into());
    }
    if envelope.version != VERSION || envelope.cipher != "aes-256-gcm" || envelope.kdf.name != "argon2id" {
        return Err("This backup was made by a newer version of LocalMind. Update the app to open it.".into());
    }
    let params = KdfParams { m: envelope.kdf.m, t: envelope.kdf.t, p: envelope.kdf.p };
    if params.m < MIN_M || params.m > MAX_PARAMS.m || params.t < 1 || params.t > MAX_PARAMS.t || params.p < 1 || params.p > MAX_PARAMS.p {
        return Err("The key settings in this file are outside what LocalMind accepts.".into());
    }
    let salt = B64.decode(&envelope.kdf.salt).map_err(|_| "The backup file is damaged.".to_string())?;
    let nonce = B64.decode(&envelope.nonce).map_err(|_| "The backup file is damaged.".to_string())?;
    let data = B64.decode(&envelope.data).map_err(|_| "The backup file is damaged.".to_string())?;
    if salt.len() < 8 || nonce.len() != NONCE_LEN {
        return Err("The backup file is damaged.".into());
    }
    if passphrase.chars().count() > MAX_PASSPHRASE_CHARS || passphrase.is_empty() {
        return Err(wrong());
    }
    let key = derive_key(passphrase, &salt, params)?;
    let cipher = Aes256Gcm::new(Key::<Aes256Gcm>::from_slice(&key));
    let plain = cipher
        .decrypt(Nonce::from_slice(&nonce), Payload { msg: &data, aad: AAD })
        .map_err(|_| wrong())?;
    String::from_utf8(plain).map_err(|_| "The backup file is damaged.".to_string())
}

#[tauri::command]
pub async fn encrypt_backup(text: String, passphrase: String) -> Result<String, String> {
    let result = tauri::async_runtime::spawn_blocking(move || encrypt_with(&text, &passphrase, DEFAULT_PARAMS))
        .await
        .map_err(|e| e.to_string())?;
    match &result {
        Ok(_) => crate::applog::info("backup", "Created a passphrase-protected backup"),
        Err(message) => crate::applog::warn("backup", &format!("Could not protect the backup: {message}")),
    }
    result
}

#[tauri::command]
pub async fn decrypt_backup(text: String, passphrase: String) -> Result<String, String> {
    let result = tauri::async_runtime::spawn_blocking(move || decrypt(&text, &passphrase))
        .await
        .map_err(|e| e.to_string())?;
    match &result {
        Ok(_) => crate::applog::info("backup", "Opened a passphrase-protected backup"),
        Err(message) => crate::applog::warn("backup", &format!("Could not open the backup: {message}")),
    }
    result
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Cheap settings so the tests run fast; the format is identical, only the cost differs.
    const FAST: KdfParams = KdfParams { m: 8 * 1024, t: 1, p: 1 };
    const PASS: &str = "correct horse battery";

    #[test]
    fn round_trips_text_including_unicode() {
        let text = r#"{"keys":[{"key":"gsk_secret"}],"note":"héllo ✓"}"#;
        let file = encrypt_with(text, PASS, FAST).unwrap();
        assert_eq!(decrypt(&file, PASS).unwrap(), text);
    }

    #[test]
    fn the_file_does_not_contain_the_plaintext_or_the_passphrase() {
        let file = encrypt_with("gsk_VERYSECRETKEY123", PASS, FAST).unwrap();
        assert!(!file.contains("VERYSECRET"));
        assert!(!file.contains(PASS));
        assert!(file.contains(FORMAT));
    }

    #[test]
    fn a_wrong_passphrase_is_refused() {
        let file = encrypt_with("hello", PASS, FAST).unwrap();
        let err = decrypt(&file, "another passphrase").unwrap_err();
        assert!(err.contains("Wrong passphrase"), "{err}");
    }

    #[test]
    fn every_backup_gets_a_fresh_salt_and_nonce() {
        let a = encrypt_with("same", PASS, FAST).unwrap();
        let b = encrypt_with("same", PASS, FAST).unwrap();
        assert_ne!(a, b);
    }

    #[test]
    fn tampering_with_any_field_is_detected() {
        let file = encrypt_with("hello", PASS, FAST).unwrap();
        let mut v: serde_json::Value = serde_json::from_str(&file).unwrap();
        // Flip a character of the ciphertext.
        let data = v["data"].as_str().unwrap().to_string();
        let flipped = if data.starts_with('A') { format!("B{}", &data[1..]) } else { format!("A{}", &data[1..]) };
        v["data"] = flipped.into();
        assert!(decrypt(&v.to_string(), PASS).is_err());
        // Changing the KDF cost changes the derived key.
        let mut v: serde_json::Value = serde_json::from_str(&file).unwrap();
        v["kdf"]["t"] = 2.into();
        assert!(decrypt(&v.to_string(), PASS).is_err());
    }

    #[test]
    fn short_and_overlong_passphrases_are_refused_before_any_work() {
        assert!(encrypt_with("x", "short", FAST).is_err());
        assert!(encrypt_with("x", &"a".repeat(257), FAST).is_err());
        assert!(check_passphrase("long enough").is_ok());
        // Counted in characters, not bytes.
        assert!(check_passphrase("ééééééé").is_err());
        assert!(check_passphrase("éééééééé").is_ok());
    }

    #[test]
    fn non_backups_and_future_versions_get_clear_messages() {
        assert!(decrypt("not json", PASS).unwrap_err().contains("not an encrypted LocalMind backup"));
        assert!(decrypt(r#"{"format":"something-else"}"#, PASS).unwrap_err().contains("not an encrypted"));
        let file = encrypt_with("x", PASS, FAST).unwrap();
        let mut v: serde_json::Value = serde_json::from_str(&file).unwrap();
        v["version"] = 2.into();
        assert!(decrypt(&v.to_string(), PASS).unwrap_err().contains("newer version"));
    }

    #[test]
    fn a_crafted_file_cannot_demand_unreasonable_work() {
        let file = encrypt_with("x", PASS, FAST).unwrap();
        for (field, value) in [("m", 4_000_000u64), ("m", 1), ("t", 1000), ("t", 0), ("p", 64)] {
            let mut v: serde_json::Value = serde_json::from_str(&file).unwrap();
            v["kdf"][field] = value.into();
            let err = decrypt(&v.to_string(), PASS).unwrap_err();
            assert!(err.contains("outside what LocalMind accepts"), "{field}={value}: {err}");
        }
    }

    #[test]
    fn damaged_encodings_are_reported_not_panicked_on() {
        let file = encrypt_with("x", PASS, FAST).unwrap();
        for field in ["nonce", "data"] {
            let mut v: serde_json::Value = serde_json::from_str(&file).unwrap();
            v[field] = "!!!not base64!!!".into();
            assert!(decrypt(&v.to_string(), PASS).unwrap_err().contains("damaged"));
        }
        let mut v: serde_json::Value = serde_json::from_str(&file).unwrap();
        v["nonce"] = B64.encode([1u8, 2, 3]).into();
        assert!(decrypt(&v.to_string(), PASS).unwrap_err().contains("damaged"));
    }

    #[test]
    fn new_backups_use_the_strong_default_settings() {
        let file = encrypt_with("x", PASS, DEFAULT_PARAMS).unwrap();
        let v: serde_json::Value = serde_json::from_str(&file).unwrap();
        assert_eq!(v["kdf"]["m"], 65536);
        assert_eq!(v["kdf"]["t"], 3);
        assert_eq!(decrypt(&file, PASS).unwrap(), "x");
    }
}
