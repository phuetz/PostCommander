# PostCommander

An intelligent social media content generation and publishing platform powered by AI. Generate, optimize, and publish posts across multiple platforms (Twitter, LinkedIn, Facebook, Instagram, TikTok, Pinterest) with data-driven insights and A/B testing capabilities.

## Quickstart (3 minutes)

```bash
npm install
npm run dev
# → http://localhost:5173/app
```

1. The dev environment auto-logs you in (`DEV_AUTO_LOGIN_EMAIL` in `.env`).
2. Land on the **Hub** at `/app` — four guided workflows.
3. *(Optional)* Open **Réglages → Compte ChatGPT Pro** and click **Se connecter**. The server opens an OAuth flow on `localhost:1455`; complete it in your browser to use your ChatGPT Pro subscription instead of an API key.
4. From the Hub, launch **Créer un post**, **Lancer un blog auto**, **Lancer une campagne outreach** or **Analyser ma performance**. Each is a guided wizard with a side help panel and an **✨ IA** button next to each field for AI-suggested values.
5. Need every page? Toggle **Mode Expert** at the bottom of the sidebar to reveal the 25+ advanced screens.

### ChatGPT Pro CLI fallback

If port 1455 is occupied or you're running on a remote server, use the standalone login:

```bash
node scripts/pc-login-chatgpt.mjs
# (or pc-login-chatgpt.cmd on Windows, pc-login-chatgpt.sh on Unix)
```

The script writes the encrypted tokens to `~/.postcommander/auth/openai.json`. The server imports them into the DB on the next `getChatGptAuth()` call.



## Features

**🚀 Core Platform & Multi-Channel Publishing**
- **Multi-Platform Integrations** — Connect and publish natively to Twitter/X, LinkedIn, Facebook, Instagram, TikTok, and Pinterest.
- **Visual Content Calendar** — Schedule posts, manage queues, and orchestrate your entire publishing strategy.
- **Analytics & Insights** — Track engagement metrics, trending topics, and viral patterns across all accounts.
- **Team Workspaces** — Collaborate with team members using role-based access control.
- **Integrated Billing** — Full SaaS subscription management powered by Stripe.

**🧠 AI-Powered Content Engine**
- **Multi-LLM Architecture** — Generate content using OpenAI, Anthropic, Google, Mistral, or local Ollama models.
- **Custom Writing Styles** — Train the AI to mimic your unique voice by analyzing your past successful posts.
- **Content Pillars & Ideas Board** — Organize your strategy with color-coded pillars and manage an idea backlog.
- **Rich Media Generation** — Generate and attach AI images directly within the post composer.
- **A/B Testing Simulator** — Test different hooks and post variations to predict and optimize engagement.
- **Hooks, Carousels & Templates** — Access pre-built generators for high-converting formats.

**⚙️ Autopilot & Advanced Automation**
- **Autoblog Engine** — Configure recurring background jobs that autonomously research and draft expert-level blog articles based on your chosen frequency and topic.
- **Automated Outreach Campaigns** — Discover prospects via targeted keywords, score profiles, and automatically dispatch personalized DM campaigns.
- **Autonomous SDR Agent** — Automatically scrape, qualify, and converse with leads in the comments section using stateful, multi-turn ReAct dialogue.
- **Dynamic Auto-Plug** — Automatically append promotional CTAs or links to your posts the exact moment they hit virality thresholds.
- **Evergreen Recycling** — Automatically identify, recycle, and republish your top-performing historical content.

**🧩 Chrome Extension (Growth Hacker Suite)**
- **Ghostwriter (`/ai`)** — Type `/ai` directly into native social media comment boxes to auto-generate context-aware replies on the fly.
- **Web Clipper (Repurposing)** — Draft social posts instantly from any active article or YouTube video tab.
- **Shadow Profiling** — Silently extract CRM data and lead insights from visited LinkedIn profiles.
- **Virality Checker** — Real-time post quality scoring overlay displayed directly on LinkedIn and Twitter.

## Tech Stack

- **Frontend**: React 19 + Vite, TanStack Query, Tailwind CSS
- **Backend**: Express.js + TypeScript, SQLite (with Drizzle ORM)
- **Chrome Extension**: Manifest V3, React, CRXJS Vite Plugin
- **Job Queue**: BullMQ (Redis-backed)
- **LLM Integration**: Vercel AI SDK
- **Testing**: Playwright (e2e), Vitest (unit/integration)
- **Package Management**: npm workspaces (monorepo)

## Quick Start

### Prerequisites

- Node.js 18+
- npm 9+
- Redis (for job queue)
- At least one LLM provider API key (OpenAI, Anthropic, Google, Mistral, or local Ollama)

### Installation

```bash
# Install dependencies
npm install

# Copy environment template and configure
cp .env.example .env

# Set required variables in .env:
# - JWT_SECRET (any random string)
# - ENCRYPTION_KEY (32-byte hex key)
# - At least one LLM provider key (OPENAI_API_KEY, ANTHROPIC_API_KEY, etc.)
# - REDIS_URL (default: redis://localhost:6379)

# For development auto-login (optional):
# DEV_AUTO_LOGIN_EMAIL=your-email@example.com
```

### Development

```bash
# Start dev server (client at http://localhost:5173, API at http://localhost:3001)
npm run dev

# Run tests
npm run test                    # unit + integration tests
npm run test:e2e               # end-to-end tests with Playwright

# Lint and format
npm run lint
npm run format

# Type checking
npm run typecheck

# Full verification (lint + build + test)
npm run verify
npm run verify:release         # includes e2e tests
```

### Database

```bash
# Reset database (deletes all data)
npm run db:reset

# Backup database
npm run db:backup --keep 5 --out backups/
```

## Architecture

See [CLAUDE.md](./CLAUDE.md) for detailed architecture documentation including:

- Monorepo structure and build order
- Server boot sequence and job workers
- Database migrations and schema
- Client structure and routing
- LLM provider abstraction
- Authentication and authorization

## API Documentation

### Health Checks

- `GET /api/health` — Full health check (database, Redis, queue status)
- `GET /api/live` — Lightweight liveness check (uptime, version)

### Main Endpoints

- `/api/auth` — Authentication (login, register, password reset)
- `/api/generate` — Content generation
- `/api/posts` — Post management and publishing
- `/api/platforms` — Social platform connections
- `/api/analytics` — Post analytics and performance
- `/api/templates` — Content templates
- `/api/images` — Image generation and management
- `/api/workspaces` — Team workspace management

For detailed API routes, see `server/src/routes/`.

## Environment Variables

See `.env.example` for all available options. Key variables:

**Required in production:**

- `JWT_SECRET` — Session token signing key
- `ENCRYPTION_KEY` — User data encryption (32-byte hex)
- `REDIS_URL` — Redis connection for job queue
- At least one LLM provider key

**Optional:**

- `DEV_AUTO_LOGIN_EMAIL` — Auto-login in development
- `ADMIN_EMAILS` — Comma-separated list of admin emails
- `BASE_URL` — Public-facing URL (must be HTTPS for social platform callbacks)
- `STRIPE_*` — Stripe payment configuration

## Contributing

1. Create a feature branch from `main`
2. Make your changes following the conventions in [CLAUDE.md](./CLAUDE.md)
3. Run `npm run verify:release` to ensure quality
4. Commit and push to your branch
5. Open a pull request

## License

Proprietary — All rights reserved

## Support

For issues, questions, or feedback, open an issue on GitHub or contact the development team.
