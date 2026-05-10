# PostCommander

PostCommander is an AI-powered social media management platform designed to help users generate, schedule, and analyze content across multiple platforms (LinkedIn, Twitter/X, Meta, TikTok, Pinterest). It leverages various LLMs (OpenAI, Anthropic, Google, Mistral, Ollama) to provide content generation, hook generation, carousel creation, content repurposing, and engagement analysis.

## Project Overview

- **Architecture:** Monorepo using npm workspaces.
  - `client`: React + Vite frontend.
  - `server`: Express + TypeScript backend.
  - `shared`: Common types and constants used by both.
- **Tech Stack:**
  - **Frontend:** React 19, Vite, Tailwind CSS, TanStack Query, i18next, Lucide React.
  - **Backend:** Express, better-sqlite3 (SQLite), AI SDK (Vercel AI), Stripe.
  - **Database:** SQLite with a custom migration system in `server/src/db`.
- **Key Features:**
  - AI Post Generation (streaming support).
  - Hook & Carousel Generators.
  - Content Repurposing & Pillar Strategy.
  - Performance Simulation & Engagement Analysis.
  - Stripe Integration for subscription management.
  - Multi-platform OAuth integrations.

## Building and Running

### Prerequisites

- Node.js (v18+)
- npm

### Development

1. Install dependencies:
   ```bash
   npm install
   ```
2. Set up environment variables:
   - Copy `.env.example` to `.env` in the root (or in `server/` if needed).
   - Fill in required API keys (at least one LLM provider).
3. Start the development environment:
   ```bash
   npm run dev
   ```
   This runs both the client (default: `http://localhost:5173`) and the server (default: `http://localhost:3001`) concurrently.

### Production

1. Build all packages:
   ```bash
   npm run build
   ```
2. Start the server:
   ```bash
   npm start
   ```

## Development Conventions

- **TypeScript:** Strict typing is used across the project. Shared types are located in `shared/src/types`.
- **Database Migrations:** SQL files in `server/src/db/migrations` are automatically applied on server startup. New migrations should follow the `00X_name.sql` pattern.
- **API Response Pattern:** All API responses follow a consistent `ApiResponse<T>` or `PaginatedResponse<T>` structure.
- **Styling:** Vanilla CSS variables combined with Tailwind CSS classes.
- **State Management:** TanStack Query (React Query) for server state; standard React hooks for local state.
- **Internationalization:** i18next is used for frontend translations, with files located in `client/public/locales`.

## Key Directories

- `client/src/components`: UI components organized by feature (analytics, calendar, post, ui, etc.).
- `server/src/controllers`: Business logic for handling API requests.
- `server/src/services`: Core logic for LLM interactions, image generation, and third-party integrations.
- `shared/src/constants`: Centralized lists for platforms, tones, and LLM providers.
