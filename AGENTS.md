# Repository Guidelines

## Project Structure & Module Organization

`PostCommander` is an npm workspace monorepo with three packages. `client/` contains the React 19 + Vite frontend; feature pages live in `client/src/pages`, reusable UI in `client/src/components`, hooks in `client/src/hooks`, and translations in `client/public/locales`. `server/` contains the Express API, PostgreSQL (Drizzle) migration logic, and external integrations; start in `server/src/index.ts`, `server/src/app.ts`, `server/src/routes`, and `server/src/services`. `shared/` holds common types and constants in `shared/src`. Treat `client/dist` and `shared/dist` as generated output, not hand-edited source.

## Build, Test, and Development Commands

Run `npm install` once at the repo root. Use `docker-compose up -d` to start the PostgreSQL & Redis infrastructure. Use `npm run dev` to start the server and client together. Use `npm run build` to compile `shared`, `server`, and `client` in workspace order. Run `npm run lint` for ESLint and `npm run typecheck` for strict TypeScript checks. For focused work, use `npm test` for Vitest unit tests, and `npm run test:e2e` for Playwright end-to-end tests.

## Coding Style & Naming Conventions

This repo uses TypeScript, ESLint 9, and Prettier 3. Prettier enforces 2-space indentation, semicolons, single quotes, trailing commas, and a 100-character line width. Use `PascalCase` for React components, `useX` for hooks, and `camelCase` for functions and variables. Keep shared contracts in `shared/src` rather than duplicating request or platform types across packages.

## Testing Guidelines

Vitest is used in `server/` and `shared/`; server route tests also use Supertest. Follow the existing `*.test.ts` pattern, colocating server tests under `server/src` and shared tests under `shared/tests`. There is no coverage gate configured in this checkout, so add or update tests for every behavior change and run the relevant workspace test command before opening a PR.

## Commit & Pull Request Guidelines

Git history is not available in this workspace snapshot, so commit conventions could not be verified from local history. Until that is available, prefer short imperative commits such as `server: add auth regression test` or `client: fix billing page redirect`. PRs should include a clear summary, affected packages (`client`, `server`, `shared`), linked issues, setup or migration notes, and screenshots for UI changes.

## Security & Configuration Tips

Copy `.env.example` to `.env` and keep secrets out of Git. Review API keys, OAuth credentials, Stripe settings, and `ENCRYPTION_KEY` before running the server. Generate new SQL migrations using `npx drizzle-kit generate`, which output to `server/drizzle`.
