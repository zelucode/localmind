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

/** Port-probe results keyed by port, for merging into a service list. */
export function indexProbeResults(results: ProbeResult[]): Map<number, ProbeResult> {
  return new Map(results.map((r) => [r.port, r]));
}
