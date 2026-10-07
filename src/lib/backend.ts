import { listen } from '@tauri-apps/api/event';
import { BackendUnavailableError, callBackend, isTauri } from './tauri';

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

/** Encrypt backup text with a passphrase (Argon2id + AES-256-GCM). Returns the text of the protected file. */
export function encryptBackup(text: string, passphrase: string): Promise<string> {
  return callBackend<string>('encrypt_backup', { text, passphrase }, 'Protecting the backup');
}

/** Open a passphrase-protected backup file and return the backup JSON. Fails with a readable message on a wrong passphrase. */
export function decryptBackup(text: string, passphrase: string): Promise<string> {
  return callBackend<string>('decrypt_backup', { text, passphrase }, 'Opening the protected backup');
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

export interface SetupRecipe {
  id: string;
  name: string;
  description: string;
  /** The exact command the install runs on this system; null when there is no one-click install here. */
  command: string | null;
  /** What must already be installed, for this system. */
  requires: string[];
  manualUrl: string;
}

export type SetupStatus = 'installed' | 'not-installed' | 'missing-requirement';

export interface SetupDetectResult {
  id: string;
  status: SetupStatus;
  /** Version number, when the tool was found by running it. */
  version: string | null;
  /** File or folder that showed the tool is installed, when it was found that way. */
  location: string | null;
  /** Name of the missing requirement when status is `missing-requirement`. */
  missing: string | null;
}

/** The curated setup recipes (compiled into the app) with the exact command each would run here. */
export function listSetupRecipes(): Promise<SetupRecipe[]> {
  return callBackend<SetupRecipe[]>('list_setup_recipes', undefined, 'Tool setup');
}

/** Find out which recipes are installed by running their version command. */
export function detectSetupTools(ids: string[]): Promise<SetupDetectResult[]> {
  return callBackend<SetupDetectResult[]>('detect_setup_tools', { ids }, 'Tool setup');
}

/**
 * Run a recipe's install (by id only) and call `onLine` for each output line as it arrives.
 * Resolves with a short success message; rejects with the reason when it fails or is cancelled.
 */
export async function installSetupTool(id: string, onLine: (line: string) => void): Promise<string> {
  if (!isTauri()) throw new BackendUnavailableError('Tool setup');
  const unlisten = await listen<{ id: string; line: string }>('setup-output', (event) => {
    if (event.payload.id === id) onLine(event.payload.line);
  });
  try {
    return await callBackend<string>('install_setup_tool', { id }, 'Tool setup');
  } finally {
    unlisten();
  }
}

/** Ask the running install to stop. */
export function cancelSetupInstall(): Promise<void> {
  return callBackend<void>('cancel_setup_install', undefined, 'Tool setup');
}

/** Port-probe results keyed by port, for merging into a service list. */
export function indexProbeResults(results: ProbeResult[]): Map<number, ProbeResult> {
  return new Map(results.map((r) => [r.port, r]));
}
