# PostCommander

An intelligent social media content generation and publishing platform powered by AI. Generate, optimize, and publish posts across multiple platforms (Twitter, LinkedIn, Facebook, Instagram, TikTok, Pinterest) with data-driven insights and A/B testing capabilities.

## Features

- **AI-Powered Content Generation** — Generate posts using multiple LLM providers (OpenAI, Anthropic, Google, Mistral, Ollama)
- **Multi-Platform Publishing** — Publish directly to Twitter, LinkedIn, Facebook, Instagram, TikTok, and Pinterest
- **Content Calendar** — Schedule posts and manage your publishing strategy
- **Analytics & Insights** — Track engagement, trending topics, and viral patterns
- **Image Generation** — Generate and attach images to posts
- **A/B Testing** — Test different post variations to optimize engagement
- **Hooks & Templates** — Pre-built templates for different content types
- **Workspace Collaboration** — Work with teams on shared content
- **Evergreen Content Recycling** — Automatically recycle and republish top-performing content

## Tech Stack

- **Frontend**: React 19 + Vite, TanStack Query, Tailwind CSS
- **Backend**: Express.js + TypeScript, SQLite (with Drizzle ORM)
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
