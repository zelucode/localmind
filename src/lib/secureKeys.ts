import { StoredApiKey } from '../types';
import { decryptSecrets, encryptSecrets } from './backend';
import { isTauri } from './tauri';

/** Stored keys that were encrypted by the Rust side start with this prefix. */
export const ENC_PREFIX = 'enc:v1:';

/**
 * How API keys are kept:
 *  - On disk (localStorage) a key is an `enc:v1:` token produced by the Rust backend (AES-256-GCM,
 *    master key in the OS credential store).
 *  - In memory a key is plaintext in `key`, with the stored token kept in `blob`.
 *  - A key whose token cannot be decrypted (other device, wiped credential store) has `key: ''`
 *    and `undecryptable: true`; its `blob` is preserved so nothing is lost silently.
 *  - Outside the desktop app (`pnpm dev`) there is no backend, so keys stay plaintext. That path
 *    exists for development only.
 */

/** Read stored keys synchronously. Encrypted entries come back locked (`key: ''`, `blob` set). */
export function parseStoredKeys(raw: string | null): StoredApiKey[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((k): k is StoredApiKey => !!k && typeof k.id === 'string' && typeof k.key === 'string')
      .map((k) => (k.key.startsWith(ENC_PREFIX) ? { ...k, key: '', blob: k.key } : k));
  } catch {
    return [];
  }
}

export interface UnlockResult {
  keys: StoredApiKey[];
  /** True when plaintext keys were encrypted (migration) and the caller should save again. */
  needsSave: boolean;
}

/** Decrypt locked keys and encrypt any plaintext ones left over from older versions. */
export async function unlockKeys(keys: StoredApiKey[]): Promise<UnlockResult> {
  if (!isTauri()) return { keys, needsSave: false };

  const locked = keys.filter((k) => k.blob && !k.key && !k.undecryptable);
  const plain = keys.filter((k) => !k.blob && k.key);
  if (locked.length === 0 && plain.length === 0) return { keys, needsSave: false };

  const decrypted = locked.length ? await decryptSecrets(locked.map((k) => k.blob as string)) : [];
  const encrypted = plain.length ? await encryptSecrets(plain.map((k) => k.key)) : [];

  const decryptedById = new Map(locked.map((k, i) => [k.id, decrypted[i]]));
  const encryptedById = new Map(plain.map((k, i) => [k.id, encrypted[i]]));

  return {
    keys: keys.map((k) => {
      const d = decryptedById.get(k.id);
      if (d) return { ...k, key: d.value ?? '', undecryptable: d.value == null };
      const blob = encryptedById.get(k.id);
      if (blob) return { ...k, blob };
      return k;
    }),
    needsSave: plain.length > 0,
  };
}

/**
 * Produce the JSON to store. Inside the desktop app a plaintext key is never written: if
 * encryption fails this throws and the caller keeps the keys in memory only.
 */
export async function serializeKeys(keys: StoredApiKey[]): Promise<string> {
  const desktop = isTauri();
  const needEncryption = keys.filter((k) => !k.blob && k.key);
  const tokens = desktop && needEncryption.length ? await encryptSecrets(needEncryption.map((k) => k.key)) : [];
  const tokenById = new Map(needEncryption.map((k, i) => [k.id, tokens[i]]));

  const out = keys.map((k) => {
    const { blob, undecryptable: _undecryptable, ...rest } = k;
    if (blob) return { ...rest, key: blob };
    if (desktop && k.key) return { ...rest, key: tokenById.get(k.id) as string };
    return { ...rest, key: k.key };
  });
  return JSON.stringify(out);
}

/** The shape written to a backup file: plaintext keys only, without per-device encryption data. */
export function keysForBackup(keys: StoredApiKey[]): StoredApiKey[] {
  return keys
    .filter((k) => k.key && !k.undecryptable)
    .map(({ blob: _blob, undecryptable: _undecryptable, ...rest }) => rest);
}

/** Why a key can't be used right now, or null if it can. */
export function keyProblem(k: StoredApiKey): string | null {
  if (k.undecryptable) return "This key couldn't be decrypted on this device. Delete it and add it again.";
  if (!k.key && k.blob) return 'This key is encrypted. It unlocks in the LocalMind desktop app.';
  return null;
}
