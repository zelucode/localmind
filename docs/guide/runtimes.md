# Runtimes

The Runtimes page shows which local AI servers are running on your computer right now. It is under **Developer** in the sidebar.

## What it checks

| Service | Port |
|---|---|
| OmniRoute Gateway | 8000 |
| Ollama | 11434 |
| LM Studio Server | 1234 |
| Jan.ai Cortex Server | 1337 |

LocalMind tries to open a connection to each port on your own computer (`127.0.0.1`). Each card then shows **Online** with the connection time in milliseconds, or **Offline**, together with the command that starts that server (with a copy button) and a link to its documentation.

A badge at the top reads *OmniRoute Active* or *OmniRoute Standby*.

## Buttons

- **Scan Local Ports** checks again. The page also scans when you open it.
- **How to Run OmniRoute** expands a short guide to putting free Gemini, Groq and Mistral keys behind OmniRoute's OpenAI-compatible address, `http://localhost:8000/v1`.
- **Test another local AI server port** checks any port from 1 to 65535. Type the number and press Enter.

## Installed but not running

If a server is installed on this computer but nothing is listening, its card shows an **Installed** pill and says it is set up but not running, instead of a plain Offline. See [Setup](/guide/setup) for how detection works.

## What Online means

Online means *something* is accepting connections on that port. LocalMind does not check that it is the server you expect, so if another program uses port 8000, OmniRoute will show as online. Treat it as a quick pointer, not proof.

## Requires the desktop app

Port scanning needs the installed desktop app. If it cannot run, the page says so and shows every service as offline. It never invents an "online" result.
