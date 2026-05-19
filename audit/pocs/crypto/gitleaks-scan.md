# Gitleaks / Trufflehog scan procedure

**Status (2026-05-19)** : `gitleaks` and `trufflehog` are **not installed locally** on this machine — the binaries aren't on PATH. Below is the exact procedure to run when ops or a CI job is set up.

## Why

C4 in the audit (dim 3) calls for a historical git scan to detect any secret that was committed before being moved to env vars. Even a deleted commit lives forever in `git reflog` and remote `.git/objects/`, so a one-shot scan is necessary every time the team changes provider keys or rotates secrets.

## One-shot scan (run from repo root)

```bash
# 1. Install gitleaks (Windows via scoop / chocolatey / direct binary)
#    https://github.com/gitleaks/gitleaks/releases
scoop install gitleaks    # OR: choco install gitleaks   OR: download release zip

# 2. Scan FULL history (not just HEAD)
gitleaks detect \
  --source . \
  --log-opts="--all" \
  --report-format=json \
  --report-path=audit/pocs/crypto/gitleaks-report.json \
  --verbose

# 3. Trufflehog as secondary scanner (different rule set, fewer false positives on some patterns)
#    Install: https://github.com/trufflesecurity/trufflehog/releases
trufflehog filesystem . \
  --no-update \
  --json \
  > audit/pocs/crypto/trufflehog-report.json

# 4. Review both reports
#    gitleaks: each finding has `Description`, `File`, `Commit`, `Match` (the redacted secret),
#              `RuleID`. False positives are common on `.env.example` and test fixtures —
#              add them to `.gitleaksignore` (one fingerprint per line).
#    trufflehog: same idea, look at `SourceMetadata.Data.Filesystem.file`.
```

## What to do if a real secret is found

1. **Rotate the secret immediately** at the provider (Stripe, OpenAI, LinkedIn, etc.) — the commit is public on GitHub if the repo is or has ever been public.
2. **Update the env var** in all environments (`.env`, prod secrets manager, GitHub Actions secrets).
3. **Rewrite git history** to scrub the commit:
   ```bash
   # Preferred: git-filter-repo (modern, preserves commit metadata)
   pip install git-filter-repo
   git filter-repo --invert-paths --path <leaked-file> --force
   # OR: replace the secret text everywhere in history
   git filter-repo --replace-text <(echo 'SECRET_LITERAL==>REDACTED')
   ```
4. **Force-push** (coordinated with the team — everyone must re-clone).
5. **Document the incident** in `docs/post-mortems/` (template TBD per SLO doc).

## Automation candidates

- **Pre-commit hook** : add `gitleaks protect --staged --redact` via `lefthook` / `husky`.
- **CI gate** : add to `.github/workflows/ci.yml` a `gitleaks` step that runs `gitleaks detect --source . --no-git` on the PR's diff (fast — doesn't scan history each time).
- **Scheduled full scan** : nightly cron in CI doing `gitleaks detect --log-opts="--all"` and uploading the report as an artifact.

## Out of scope for this session

- Installing gitleaks/trufflehog on the dev machine.
- Running the scan (would mutate `audit/pocs/crypto/` with potentially sensitive fingerprints).
- Adding the CI gate (requires PR review on the workflow).

The procedure above is durable: re-run any time without re-reading the audit.
