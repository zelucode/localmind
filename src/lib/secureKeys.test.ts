import { afterEach, describe, expect, it, vi } from 'vitest';

const encryptMock = vi.fn();
const decryptMock = vi.fn();
vi.mock('./backend', () => ({
  encryptSecrets: (...a: unknown[]) => encryptMock(...a),
  decryptSecrets: (...a: unknown[]) => decryptMock(...a),
}));

import { ENC_PREFIX, keyProblem, keysForBackup, parseStoredKeys, serializeKeys, unlockKeys } from './secureKeys';
import { StoredApiKey } from '../types';

// Stand-in for the Rust side: reversible, but obviously not plaintext.
const fakeEncrypt = (values: string[]) => Promise.resolve(values.map((v) => ENC_PREFIX + btoa(v)));
const fakeDecrypt = (tokens: string[]) =>
  Promise.resolve(
    tokens.map((t) => {
      try {
        return { value: atob(t.slice(ENC_PREFIX.length)), error: null };
      } catch {
        return { value: null, error: 'bad' };
      }
    })
  );

function setTauri(on: boolean) {
  if (on) (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__ = {};
  else delete (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__;
}

afterEach(() => {
  setTauri(false);
  encryptMock.mockReset();
  decryptMock.mockReset();
});

const key = (over: Partial<StoredApiKey> = {}): StoredApiKey => ({
  id: 'k1',
  provider: 'gemini',
  providerName: 'Google Gemini',
  key: 'AIzaPLAINTEXT',
  label: 'Dev',
  createdAt: '2026-01-01',
  freeTierNotes: '',
  getKeyUrl: '',
  ...over,
});

describe('parseStoredKeys', () => {
  it('returns [] for missing, malformed or non-array data', () => {
    expect(parseStoredKeys(null)).toEqual([]);
    expect(parseStoredKeys('not json')).toEqual([]);
    expect(parseStoredKeys('{"a":1}')).toEqual([]);
  });

  it('skips entries that are not keys', () => {
    expect(parseStoredKeys(JSON.stringify([null, 5, { id: 'x' }, key()]))).toHaveLength(1);
  });

  it('loads encrypted entries locked, keeping the token as blob', () => {
    const [k] = parseStoredKeys(JSON.stringify([key({ key: ENC_PREFIX + 'abc' })]));
    expect(k.key).toBe('');
    expect(k.blob).toBe(ENC_PREFIX + 'abc');
  });

  it('keeps legacy plaintext entries as they are', () => {
    const [k] = parseStoredKeys(JSON.stringify([key()]));
    expect(k.key).toBe('AIzaPLAINTEXT');
    expect(k.blob).toBeUndefined();
  });
});

describe('unlockKeys', () => {
  it('does nothing outside the desktop app', async () => {
    const keys = [key({ key: '', blob: ENC_PREFIX + 'x' })];
    const res = await unlockKeys(keys);
    expect(res).toEqual({ keys, needsSave: false });
    expect(decryptMock).not.toHaveBeenCalled();
  });

  it('decrypts locked keys', async () => {
    setTauri(true);
    decryptMock.mockImplementation(fakeDecrypt);
    const token = (await fakeEncrypt(['AIzaSECRET']))[0];
    const res = await unlockKeys([key({ key: '', blob: token })]);
    expect(res.keys[0]).toMatchObject({ key: 'AIzaSECRET', blob: token, undecryptable: false });
    expect(res.needsSave).toBe(false);
  });

  it('marks keys that cannot be decrypted without losing their token', async () => {
    setTauri(true);
    decryptMock.mockResolvedValue([{ value: null, error: 'wrong key' }]);
    const res = await unlockKeys([key({ key: '', blob: ENC_PREFIX + 'from-another-device' })]);
    expect(res.keys[0]).toMatchObject({ key: '', undecryptable: true, blob: ENC_PREFIX + 'from-another-device' });
  });

  it('migrates legacy plaintext keys and asks to be saved', async () => {
    setTauri(true);
    encryptMock.mockImplementation(fakeEncrypt);
    const res = await unlockKeys([key()]);
    expect(res.needsSave).toBe(true);
    expect(res.keys[0].key).toBe('AIzaPLAINTEXT');
    expect(res.keys[0].blob).toBe(ENC_PREFIX + btoa('AIzaPLAINTEXT'));
  });

  it('handles a mix without calling the backend for nothing', async () => {
    setTauri(true);
    encryptMock.mockImplementation(fakeEncrypt);
    decryptMock.mockImplementation(fakeDecrypt);
    const locked = key({ id: 'a', key: '', blob: (await fakeEncrypt(['A']))[0] });
    const plain = key({ id: 'b', key: 'B' });
    const res = await unlockKeys([locked, plain]);
    expect(res.keys.map((k) => k.key)).toEqual(['A', 'B']);
    expect(decryptMock).toHaveBeenCalledWith([locked.blob]);
    expect(encryptMock).toHaveBeenCalledWith(['B']);
  });

  it('is a no-op when everything is already unlocked', async () => {
    setTauri(true);
    const keys = [key({ blob: ENC_PREFIX + 'x' })];
    expect((await unlockKeys(keys)).keys).toBe(keys);
    expect(decryptMock).not.toHaveBeenCalled();
    expect(encryptMock).not.toHaveBeenCalled();
  });

  it('propagates backend failures so the app can warn', async () => {
    setTauri(true);
    decryptMock.mockRejectedValue(new Error('Credential store unavailable'));
    await expect(unlockKeys([key({ key: '', blob: ENC_PREFIX + 'x' })])).rejects.toThrow('Credential store');
  });
});

describe('serializeKeys', () => {
  it('never writes plaintext inside the desktop app', async () => {
    setTauri(true);
    encryptMock.mockImplementation(fakeEncrypt);
    const json = await serializeKeys([key()]);
    expect(json).not.toContain('AIzaPLAINTEXT');
    expect(JSON.parse(json)[0].key.startsWith(ENC_PREFIX)).toBe(true);
  });

  it('reuses existing tokens instead of re-encrypting', async () => {
    setTauri(true);
    const json = await serializeKeys([key({ blob: ENC_PREFIX + 'existing' })]);
    expect(JSON.parse(json)[0].key).toBe(ENC_PREFIX + 'existing');
    expect(encryptMock).not.toHaveBeenCalled();
  });

  it('keeps undecryptable keys exactly as stored', async () => {
    setTauri(true);
    const json = await serializeKeys([key({ key: '', undecryptable: true, blob: ENC_PREFIX + 'orphan' })]);
    const [saved] = JSON.parse(json);
    expect(saved.key).toBe(ENC_PREFIX + 'orphan');
    expect(saved.undecryptable).toBeUndefined();
    expect(saved.blob).toBeUndefined();
  });

  it('only encrypts the keys that need it', async () => {
    setTauri(true);
    encryptMock.mockImplementation(fakeEncrypt);
    await serializeKeys([key({ id: 'a', blob: ENC_PREFIX + 'x' }), key({ id: 'b', key: 'NEW' })]);
    expect(encryptMock).toHaveBeenCalledWith(['NEW']);
  });

  it('throws, and writes nothing, when encryption fails', async () => {
    setTauri(true);
    encryptMock.mockRejectedValue(new Error('Could not read the credential store'));
    await expect(serializeKeys([key()])).rejects.toThrow('credential store');
  });

  it('stores plaintext in a plain browser (development only)', async () => {
    const json = await serializeKeys([key()]);
    expect(JSON.parse(json)[0].key).toBe('AIzaPLAINTEXT');
    expect(encryptMock).not.toHaveBeenCalled();
  });

  it('does not leak in-memory fields into storage', async () => {
    const [saved] = JSON.parse(await serializeKeys([key({ blob: undefined, undecryptable: false })]));
    expect(saved).not.toHaveProperty('blob');
    expect(saved).not.toHaveProperty('undecryptable');
  });
});

describe('keysForBackup', () => {
  it('exports plaintext keys without per-device data and skips unusable ones', () => {
    const out = keysForBackup([
      key({ id: 'ok', blob: ENC_PREFIX + 'x' }),
      key({ id: 'locked', key: '', blob: ENC_PREFIX + 'y' }),
      key({ id: 'orphan', key: '', undecryptable: true, blob: ENC_PREFIX + 'z' }),
    ]);
    expect(out.map((k) => k.id)).toEqual(['ok']);
    expect(out[0]).not.toHaveProperty('blob');
    expect(out[0].key).toBe('AIzaPLAINTEXT');
  });
});

describe('keyProblem', () => {
  it('explains undecryptable and locked keys, and is silent for usable ones', () => {
    expect(keyProblem(key({ key: '', undecryptable: true }))).toMatch(/couldn't be decrypted/);
    expect(keyProblem(key({ key: '', blob: ENC_PREFIX + 'x' }))).toMatch(/desktop app/);
    expect(keyProblem(key())).toBeNull();
  });
});
