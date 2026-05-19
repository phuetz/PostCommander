# ADR 0003 — Vercel AI SDK as the LLM provider abstraction

**Status** : Accepted  
**Deciders** : Platform team

## Context

PostCommander needs to call LLMs from 5 providers :
- OpenAI (gpt-4o, gpt-4o-mini, o1)
- Anthropic (Claude 3.5 Sonnet, Claude 4 Opus/Sonnet/Haiku)
- Google (Gemini 1.5 / 2.0)
- Mistral (mistral-large)
- Ollama (local self-hosted models)

Use cases include both streaming (post generation UI) and non-streaming (analytics scoring, hashtag research). The product also stores user-provided API keys per-user (encrypted) so the same provider can run against the user's quota.

## Decision

Use the **Vercel AI SDK** (`ai` + `@ai-sdk/{openai,anthropic,google,mistral}`) as the single abstraction layer.

- `services/llm/provider-factory.ts` exports `createModel(provider, model, userId?)` which (a) resolves the API key (user-stored > env), (b) returns a unified `LanguageModelV1` object.
- `services/llm/_runtime.ts` exports `runLLM<T>({ provider, model, userId, system, user, schema?, retries? })` — single entry point for every non-streaming call, with parse + Zod validate + retry built in.
- Streaming uses `streamText` directly (no wrapper yet ; `services/llm/index.ts` is the main consumer).

## Consequences

**Positive** :
- One library for 5 providers, future-proof against new model launches (Vercel pushes provider packages weekly).
- Built-in support for tools, multi-modal, JSON mode.
- Streaming + non-streaming share the same model object.
- `@ai-sdk/*` packages decouple provider releases from `ai` core releases.

**Negative** :
- SEMVER MAJOR bumps of `ai` package break call signatures across 9+ LLM service files (`generateText` / `streamText` parameters drift). Audit dim 7 flags `ai@4 → 6` as a chantier.
- Filetype whitelist bypass CVE in <=5.0.51 (audited, gated to text-only usage in our codebase).
- Less granular control over per-provider quirks (e.g. Anthropic prompt caching, OpenAI structured outputs) compared to native SDKs ; for the 95% case the abstraction is the right call.

## Alternatives considered

- **Native SDKs (openai-node + @anthropic-ai/sdk + @google/generative-ai + @mistralai/mistralai)** : 4 different APIs, 4× the maintenance burden, no migration path between providers.
- **LangChain** : heavyweight, opinionated chains/agents we don't need ; also part of the `@browserbasehq/stagehand` CVE chain (audit dim 7).
- **Build our own** : not worth it ; Vercel maintains drivers we'd otherwise have to write.

## Migration to `_runtime.ts` wrapper

To eliminate duplicated boilerplate (`parseJsonResponse`, `createModel`, `generateText`, error handling) across 17 `services/llm/*.ts` files, batch 5+6 introduced `runLLM` :

- 9 of the simple files (ab-testing, carousel, engagement, hashtags, hooks, repurpose, simulator, trending, video, assist) migrated.
- 3 complex files (`index.ts`, `community.ts`, `chatgpt-pro/sdk-wrapper.ts`) still use direct `generateText` / `streamText` / `generateObject` calls — chantier for a streaming-aware wrapper.

## References

- Vercel AI SDK : <https://sdk.vercel.ai/>
- `_runtime.ts` wrapper : `server/src/services/llm/_runtime.ts` (10 unit tests)
- Provider factory : `server/src/services/llm/provider-factory.ts`
