import { callBackend } from './tauri';

export interface ProbeResult {
  port: number;
  online: boolean;
  latencyMs: number | null;
}

export type VerifyStatus = 'valid' | 'invalid' | 'error' | 'unsupported';

export interface VerifyResult {
  status: VerifyStatus;
  message: string;
}

/** Check which of the given localhost TCP ports have something listening. */
export function probePorts(ports: number[]): Promise<ProbeResult[]> {
  return callBackend<ProbeResult[]>('probe_ports', { ports }, 'Scanning local ports');
}

/** Ask the provider whether an API key is accepted. The key only goes to that provider. */
export function verifyApiKey(provider: string, key: string): Promise<VerifyResult> {
  return callBackend<VerifyResult>('verify_api_key', { request: { provider, key } }, 'Verifying keys');
}

/** Ask the Free Tier Advisor (Gemini, using the user's own key). */
export function askAdvisor(query: string, apiKey: string): Promise<string> {
  return callBackend<string>('ask_advisor', { request: { query, apiKey } }, 'The Advisor');
}

/** Download the remote data feed as text (HTTPS only, size-limited). The caller validates the content. */
export function fetchFeed(url: string): Promise<string> {
  return callBackend<string>('fetch_feed', { url }, 'Updating the data feed');
}

export interface LogInfo {
  /** Folder that holds app.log. */
  dir: string;
  /** Full path of app.log. */
  file: string;
}

/** Add one line to app.log (the same file the Rust side writes to). */
export function logEvent(level: 'info' | 'warn' | 'error', source: string, message: string): Promise<void> {
  return callBackend<void>('log_event', { level, source, message }, 'Logging');
}

/** Where app.log lives. */
export function getLogInfo(): Promise<LogInfo> {
  return callBackend<LogInfo>('log_info', undefined, 'The log folder');
}

/** The text "Report a Problem" would save: version, OS and recent log lines, keys blanked. */
export function previewDiagnostics(): Promise<string> {
  return callBackend<string>('preview_diagnostics', undefined, 'Diagnostics');
}

/** Save the diagnostics file (Downloads folder) and return its path. */
export function saveDiagnostics(): Promise<string> {
  return callBackend<string>('save_diagnostics', undefined, 'Diagnostics');
}

export interface DecryptResult {
  value: string | null;
  error: string | null;
}

/** Encrypt secrets with the master key held in the OS credential store. Returns `enc:v1:` tokens. */
export function encryptSecrets(values: string[]): Promise<string[]> {
  return callBackend<string[]>('encrypt_secrets', { values }, 'Encrypting keys');
}

/** Decrypt `enc:v1:` tokens. A token that can't be decrypted comes back with `value: null`. */
export function decryptSecrets(tokens: string[]): Promise<DecryptResult[]> {
  return callBackend<DecryptResult[]>('decrypt_secrets', { tokens }, 'Unlocking keys');
}

/** Port-probe results keyed by port, for merging into a service list. */
export function indexProbeResults(results: ProbeResult[]): Map<number, ProbeResult> {
  return new Map(results.map((r) => [r.port, r]));
}
