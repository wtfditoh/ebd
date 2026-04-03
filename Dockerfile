FROM node:20-alpine AS base

# Instalar pnpm
RUN corepack enable && corepack prepare pnpm@8.15.0 --activate

FROM base AS deps
WORKDIR /app

# Copiar arquivos de dependências
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/database/package.json ./packages/database/

# Instalar dependências
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app

# Copiar dependências
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/packages/database/node_modules ./packages/database/node_modules

# Copiar código
COPY . .

# Gerar Prisma Client
WORKDIR /app/packages/database
RUN pnpm db:generate

# Build do backend
WORKDIR /app/apps/api
RUN pnpm build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copiar node_modules e build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/packages ./packages

# Expor porta
EXPOSE 3333

# Comando de start
CMD ["node", "apps/api/dist/server.js"]
