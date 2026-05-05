# ---------- Étape 1 : Build ----------
FROM node:22-alpine AS builder

WORKDIR /app

# Copie des fichiers de configuration
COPY package*.json ./
COPY tsconfig.base.json ./
COPY shared/package.json ./shared/
COPY server/package.json ./server/
COPY client/package.json ./client/

# Installation des dépendances (y compris devDependencies pour le build)
RUN npm ci

# Copie du code source
COPY shared ./shared
COPY server ./server
COPY client ./client

# Build des trois packages
RUN npm run build

# ---------- Étape 2 : Production ----------
FROM node:22-alpine AS runner

WORKDIR /app

# Définition de l'environnement de production
ENV NODE_ENV=production

# Copie des fichiers package.json
COPY package*.json ./
COPY shared/package.json ./shared/
COPY server/package.json ./server/

# Installation des dépendances de production uniquement
RUN npm ci --omit=dev

# Copie des builds depuis l'étape précédente
COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/client/dist ./client/dist
# Le backend servira le client statique s'il est configuré pour, 
# sinon on s'assure juste que les fichiers sont là pour un serveur web comme Nginx.

# Copie des fichiers de migration DB et autres assets du serveur
COPY server/src/db/migrations ./server/dist/db/migrations

# Création du dossier pour la base de données SQLite
RUN mkdir -p /app/server/data && chown -R node:node /app/server/data

# Changement d'utilisateur pour des raisons de sécurité
USER node

# Exposition du port du serveur
EXPOSE 3001

# Node lui-même fait le check — pas de dépendance sur curl/wget.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://localhost:3001/api/live').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

# Commande de démarrage
CMD ["npm", "start"]
