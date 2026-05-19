# Politique de confidentialité — PostCommander

**Dernière mise à jour** : 2026-05-19  
**Responsable du traitement** : PostCommander  
**Contact DPO** : privacy@postcommander.app

> Version interne destinée au site (à publier sur `/privacy`). À faire relire par un juriste avant production.

## 1. Données collectées

| Catégorie | Données | Finalité | Base légale |
|---|---|---|---|
| Compte | email, mot de passe (bcrypt hashé), nom | Authentification, communications service | Contrat |
| Contenu utilisateur | posts, prompts, hashtags, styles d'écriture, images générées | Fourniture du service | Contrat |
| Intégrations sociales | access tokens chiffrés (AES-256-GCM), nom de compte de la plateforme | Publication sur les réseaux | Contrat |
| Clés API LLM | clés OpenAI/Anthropic/Google/Mistral chiffrées dans `settings` | Utilisation des modèles tiers avec votre quota | Consentement explicite |
| Facturation | Stripe customer ID, statut d'abonnement, factures | Gestion des paiements | Contrat + obligation comptable |
| Logs techniques | requestId, IP, user-agent (anonymisés via Pino redact) | Sécurité, debugging | Intérêt légitime |
| Analytics produit (optionnel) | événements de navigation PostHog | Amélioration UX | **Consentement** (cookie banner) |
| Crash reports (optionnel) | stacktrace, requestId, contexte sans PII (scrubbé via Sentry beforeSend) | Stabilité | **Consentement** (cookie banner) |

## 2. Cookies

| Cookie | Type | Finalité | Durée |
|---|---|---|---|
| `token` | strictement nécessaire | session authentifiée (JWT httpOnly + sameSite) | 7 jours |
| `pc-cookie-consent` | strictement nécessaire | mémorise votre choix | persistant |
| PostHog | analytique | navigation, parcours utilisateur | 13 mois (consentement requis) |
| Sentry | technique | session replay anonymisé | 14 jours (consentement requis) |

Cookies strictement nécessaires : aucun consentement requis (CNIL, ePrivacy art. 5.3 exception).  
Cookies analytiques : déposés **uniquement** après "Tout accepter" dans la bannière. Vous pouvez modifier votre choix en supprimant `pc-cookie-consent` depuis votre navigateur (la bannière réapparaîtra).

## 3. Vos droits

Conformément au RGPD :

- **Accès / portabilité (art. 15 & 20)** : `GET /api/auth/export` (Settings → Exporter mes données) → JSON contenant l'ensemble de vos données.
- **Suppression (art. 17)** : `DELETE /api/auth/account` (Settings → Supprimer mon compte) avec confirmation `DELETE` + mot de passe. La suppression est immédiate et atomique (cf. `services/account/index.ts` — transaction Drizzle). Un audit hash est conservé 5 ans pour obligations légales.
- **Rectification (art. 16)** : modifier votre profil dans Settings, ou par email.
- **Opposition / retrait du consentement (art. 7§3, 21)** : retirer le consentement analytics via la bannière ; ce retrait n'affecte pas la licéité des traitements antérieurs.
- **Plainte** : auprès de la CNIL (<https://www.cnil.fr>).

## 4. Conservation

| Catégorie | Durée |
|---|---|
| Compte actif | tant que le compte existe |
| Logs techniques | 30 jours |
| Audit de suppression (`deleted_account_audits`, `deleted_billing_records`) | 5 ans (obligation comptable) |
| Factures Stripe | 10 ans (Code de commerce art. L123-22) |
| Backups DB | 30 jours rolling |

## 5. Sous-traitants (tiers)

| Sous-traitant | Données transférées | Localisation | Base juridique du transfert |
|---|---|---|---|
| Stripe | email, payment method tokens | UE/US | Clauses contractuelles types + Data Processing Agreement |
| OpenAI / Anthropic / Google / Mistral / Ollama | contenu du prompt | US/UE | Vos données ne sont **pas** utilisées pour entraîner leurs modèles (cf. leurs DPA) |
| Resend (emails) | email, contenu du mail | US/UE | DPA + chiffrement en transit |
| Browserbase (Stagehand) | URLs visitées par les workers outreach | US | DPA |
| Sentry (crash reports, optionnel) | stacktraces scrubbés | UE (Frankfurt) | DPA, PII scrubbing actif |
| PostHog (analytics, optionnel) | événements de navigation | UE (Frankfurt) | DPA |

## 6. Sécurité technique

- Mots de passe : bcrypt cost factor 10
- Tokens OAuth + clés API user : AES-256-GCM avec IV unique par chiffrement
- JWT : HS256 signé, httpOnly cookie, révocation possible via table `revoked_tokens`
- HTTPS obligatoire en production (HSTS via Helmet)
- Logs : Pino `redact` sur password, tokens, cookies, authorization headers
- Audit de sécurité documenté : voir `audit/audit-complet-postcommander.md`

## 7. Modifications

Toute modification matérielle de cette politique est notifiée par email aux utilisateurs actifs au moins 30 jours avant prise d'effet.

## 8. Contact

Pour toute question relative à vos données : **privacy@postcommander.app**
