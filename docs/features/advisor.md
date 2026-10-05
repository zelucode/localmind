# Advisor (built, currently hidden)

The Free Tier Advisor answers "how do I do X using only free AI tools?". It is **fully built and tested but hidden**, because it only supports one provider and we haven't decided which providers it should use. Nothing was deleted.

## Hidden by a feature flag

`src/config/features.ts`:

```ts
export const FEATURES = { advisor: false } as const;
```

While `false`, these are all absent: the floating **Ask Advisor** button, the `A` shortcut (and its line in the shortcut sheet), the Ctrl+K "AI Architecture Advisor" action, and the Omnibar **Which Tool?** button. The modal isn't rendered.

**To bring it back, set `advisor: true`.** `src/App.advisor.test.tsx` covers the enabled state, and `App.test.tsx` covers the hidden state.

## How it works

- `AIAdvisorModal.tsx` takes the question and a Gemini key (`geminiKey`, chosen in `App.tsx`: a verified Gemini key from the Key Vault if there is one, otherwise the first).
- It calls `askAdvisor()` (`src/lib/backend.ts`), which invokes the Rust command `ask_advisor` (`src-tauri/src/advisor.rs`).
- Rust validates the question (non-empty, up to 2000 characters), then calls Gemini (`gemini-2.5-flash`) over HTTPS with the key in an `x-goog-api-key` header and a system prompt that restricts advice to free tools and requires saying whether a tool can edit local files. Safety blocks, empty answers and HTTP errors become readable messages (bad key → "check it in the Key Vault", rate limit, server error).
- With no Gemini key, the modal asks the user to add one instead of calling anything.

## Tests
- **Rust** (`advisor::tests`): query validation, request body, response text extraction, blocked and empty responses, error messages, missing key without network.
- **Frontend** (`AIAdvisorModal.test.tsx`): no key → hint and no backend call, success path with the vault key, backend error shown, prompt prefill.

## Open questions (backlog Task 14)
Which providers should the Advisor support (Gemini, Groq, OpenRouter, local Ollama)? Should the user choose the key? Should there be an offline fallback built from the catalog, as the original app had?
