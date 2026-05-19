# ADR 0004 — Stagehand (Browserbase) for outreach browser automation

**Status** : Accepted (with caveats)  
**Deciders** : Platform team

## Context

The outreach worker needs to perform actions on LinkedIn that are not available via the official API :
- Send connection requests / DMs at scale
- Read profile fields not exposed in `/v2/userinfo`
- Discover prospects matching campaign criteria

LinkedIn's official API requires Marketing Partner approval (weeks/months), and even then forbids most of these flows. Browser automation is the only practical path.

## Decision

Use **`@browserbasehq/stagehand`** :
- LLM-driven browser actions (`stagehand.act("Click the message button")`) — resilient to LinkedIn DOM changes vs brittle CSS selectors
- Runs against Browserbase (cloud-hosted Chrome) by default, with local fallback for dev
- Cookie injection (`li_at`) bypasses the login wall

Bounded by `withTimeout` (60s nav, 90s locate, 60s type, 30s send) so a hung session doesn't block the worker forever.

## Consequences

**Positive** :
- Resilient to LinkedIn UI redesigns — LLM understands "the Message button" without depending on a CSS class.
- Browserbase handles session pool, residential IPs, captcha solving.
- Stagehand's API maps naturally to outreach steps (`act` / `extract` / `observe`).

**Negative** :
- **TOS risk** : LinkedIn forbids automation in their TOS. Stored session cookies can be invalidated mass-scale if LinkedIn detects abuse patterns. `OUTREACH_DRY_RUN=true` is the default for new envs.
- **High variable cost** : Browserbase bills per browser-second + Stagehand bills per `act` (LLM call). One outreach cycle for 10 prospects ≈ $0.50.
- **LangChain dependency** : Stagehand pulls `@langchain/core` which has high-severity CVEs (audit dim 7). Downgrade to Stagehand 2.5.8 is a tracked option but loses features.
- **`LINKEDIN_SESSION_COOKIE`** is a long-lived secret stored as an env var (chantier C7 : move to per-user encrypted setting).

## Alternatives considered

- **Playwright / Puppeteer raw** : 2-3× faster + cheaper, but CSS selectors break on every LinkedIn redesign. Maintenance burden too high.
- **Apify** : SaaS scrapers, but per-action-pricing similar to Stagehand and less control over the LLM layer.
- **Headless Chrome on AWS Lambda** : DIY infra ; doesn't solve the residential IP / captcha problem.
- **LinkedIn Marketing API only** : insufficient feature coverage (no DMs, no automated discovery).

## Operational policy

- `OUTREACH_AUTO_DISCOVERY=false` by default. When enabling, monitor LinkedIn account health closely.
- Auto-discovery is currently **not implemented** (only the messaging step is real) — the worker logs a warning and skips when the flag is on (audit batch 1 fix).
- `OUTREACH_DRY_RUN=true` makes Stagehand type the message but click "Discard" instead of "Send" ; flip only after a manual canary run.

## References

- Stagehand : <https://github.com/browserbase/stagehand>
- LinkedIn TOS (sec. 8) : <https://www.linkedin.com/legal/user-agreement#dos>
- `outreach.worker.ts` : main consumer
- `withTimeout` utility : `server/src/utils/worker-helpers.ts`
