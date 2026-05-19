# Audit complet PostCommander — guide de relecture

Daté du **2026-05-19**. Le rapport principal est [`audit-complet-postcommander.md`](./audit-complet-postcommander.md).

## Structure

```
audit/
├── audit-complet-postcommander.md     # ← Rapport unique consolidé (18 dimensions + synthèse exécutive)
├── README.md                          # ce fichier
└── pocs/                              # preuves brutes et scripts POC
    ├── deps/                          # npm audit JSON par workspace
    ├── static/                        # madge, jscpd, audit-summary agrégé
    ├── injection/                     # script Zod coverage
    ├── auth/, crypto/, oauth/, db/, workers/, gdpr/    # POCs sécurité (à exécuter)
    ├── perf-back/, perf-front/, a11y/, i18n/           # POCs perf/qualité (à exécuter)
    ├── ci-infra/, tests/, observability/, frontend/    # POCs ops (à exécuter)
    └── arch/, docs/                                    # divers
```

## Comment relire

1. **Lecture rapide (10 min)** : juste la **synthèse exécutive** (section 0) du rapport — score global, top 10 risques, roadmap 30/60/90.
2. **Lecture standard (1 h)** : les 18 sections du rapport (chacune autonome, ~3-5 min).
3. **Vérification approfondie** : pour chaque constat **🔴 Critique / 🟠 Élevé**, suivre le lien `file:line` vers le code source ou le POC dans `pocs/`.

## Comment reproduire

Les analyses **déjà exécutées** dans cette passe ont leurs sorties dans `pocs/` (cf. Annexe A du rapport).

Les analyses **à exécuter** (Annexe B du rapport) listent leurs commandes exactes. Exemple minimal :

```bash
# Re-générer npm audit
npm audit --json --omit=dev > audit/pocs/deps/npm-audit-root.json
(cd server && npm audit --json --omit=dev > ../audit/pocs/deps/npm-audit-server.json)
(cd client && npm audit --json --omit=dev > ../audit/pocs/deps/npm-audit-client.json)

# Re-générer la synthèse agrégée
node audit/pocs/static/summarize.mjs > audit/pocs/static/audit-summary.txt

# Détecter cycles d'imports
npx madge --circular --extensions ts,tsx server/src
npx madge --circular --extensions ts,tsx client/src

# Duplication
npx jscpd server/src --min-tokens 60 --reporters json --output audit/pocs/static/
npx jscpd client/src --min-tokens 60 --reporters json --output audit/pocs/static/jscpd-client/
```

## Vérifier qu'aucun code applicatif n'a été modifié

```powershell
git diff --stat -- ':!audit/'
# → ne doit montrer que les modifications PRÉ-audit (cf. git status d'origine)
```

## Limites de cette passe

Cf. Annexe E du rapport : mesures dynamiques (Lighthouse, autocannon, axe, vitest coverage, trivy, gitleaks, POCs SSRF/IDOR runtime) **non exécutées**. Une Phase 5 estimée à 3-5 j-h supplémentaires les couvrira.
