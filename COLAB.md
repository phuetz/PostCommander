# COLAB.md — PostCommander

> Version: 1.0.0
> Date: 2026-05-17
> Statut: en cours

## 1. Règles de collaboration
Conformes à la spec canonique `d:\CascadeProjects\claude-et-patrice\COLAB.md`.
- Max 10 fichiers modifiés par itération.
- Boucle de rétroaction systématique après chaque modification.
- Documenter le journal de bord dans `claude-et-patrice/journal/ministar-postcommander.md`.

## 2. Audit global
- **Maturité** : Avancée. 
- **Tech Stack** : React 19, Vite, Tailwind, Express, SQLite, Vercel AI SDK.
- **État de Linting** : 0 erreurs fatales. 106 avertissements (`any`, `unused-vars`).
- **Tests** : Tests E2E Playwright intégrés pour les flux critiques.

## 3. Architecture cible
Faire de PostCommander un véritable "Growth Engine" Enterprise, totalement pilotable de l'extérieur par des agents IA (Headless via MCP et OpenAPI) tout en conservant une interface "Nexus" premium (glassmorphism, réactivité).

## 4. Phases de travail
- `[x]` Modernisation UI (Command Palette, Dashboard BI, Templates dynamiques) — Codex (17 mai 2026)
- `[x]` Intégration AI-Friendly (Serveur MCP et OpenAPI) — Codex (17 mai 2026)
- `[x]` Tests E2E Playwright de la nouvelle interface — Codex (17 mai 2026)
- `[ ]` Compléter la couverture de tests unitaires (Vitest)
- `[ ]` Gérer le caching distant (Redis) pour le scaling

## 5. Journal de bord
Voir `d:\CascadeProjects\claude-et-patrice\journal\ministar-postcommander.md`.

## 6. Blocages
Aucun blocage actuel. Base de code propre.

## 7. Protocole de validation
```bash
npm run format
npm run lint
npm run build
npx playwright test
```
