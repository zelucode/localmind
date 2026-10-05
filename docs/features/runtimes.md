# Runtimes

## What the user sees

The **Runtimes** page shows four local AI servers and whether something is listening on each one's port:

| Service | Port |
|---|---|
| OmniRoute Gateway | 8000 |
| Ollama Daemon | 11434 |
| LM Studio Server | 1234 |
| Jan.ai Cortex Server | 1337 |

Each card shows Online (with the connect time in ms) or Offline, the command to start that server (with a copy button) and a docs link. A header badge reads *OmniRoute Active* or *OmniRoute Standby*. **Scan Local Ports** rescans (the page also scans when it opens), **How to Run OmniRoute** expands a setup guide, and **Test another local AI server port** checks any port from 1 to 65535.

If the scan can't run (for example the app is open in a plain browser through `pnpm dev`), the page says "Scanning local ports needs the LocalMind desktop app." and shows every service as offline. It never shows a made-up "online".

## How it works

- The check is a **TCP connect to `127.0.0.1:<port>`** from Rust (`src-tauri/src/probe.rs`, command `probe_ports`). It has to be Rust because the webview can't `fetch` localhost without CORS problems.
- The command takes up to 32 ports, rejects 0 and anything above 65535, removes duplicates, probes them concurrently (800 ms timeout each) and returns results in request order. Latency is the connect time, never below 1 ms.
- The frontend wrapper is `probePorts()` in `src/lib/backend.ts`; the page is `OmniRouteWidget.tsx`.
- The custom-port field is a numeric text field. It strips non-digits, limits the length, validates the range before calling the backend and shows an inline error. Enter submits.

## Tests
- **Rust** (`probe::tests`): a real listening socket reports online with latency; a closed port reports offline; port 0; range, empty and oversize validation; de-duplication and order; the async command's result order.
- **Frontend** (`OmniRouteWidget.test.tsx`): scans the four known ports on mount, shows only what the backend reports, never claims "online" when the backend is unavailable, rescan, custom port success / unreachable / invalid input.

## Limits
- A TCP connect only proves that *something* listens on the port, not that it is that service. A future version could request each server's health endpoint (for example Ollama's `/api/tags`) to confirm.
- Status isn't shown on Home or in the sidebar yet (backlog Task 12).
