# 🚀 EBD Pro

Sistema completo de gestão de Escola Bíblica Dominical com suporte multi-igrejas, chamada digital, relatórios avançados e muito mais.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)

## ✨ Features

### 🎯 Core
- ✅ **Multi-tenant** - Suporte para múltiplas igrejas isoladas
- ✅ **RBAC** - Sistema de permissões (Super Admin, Admin Igreja, Secretário, Professor)
- ✅ **Chamada Digital** - Registro de presença, bíblias e revistas
- ✅ **Visitantes** - Controle de visitantes e acompanhamento
- ✅ **Dashboard** - Visão geral em tempo real
- ✅ **Relatórios** - Semanais, mensais e trimestrais
- ✅ **PWA Ready** - Instalável como app

### 📊 Funcionalidades para Secretária
- Dashboard consolidado de todas as classes
- Exportação de relatórios em PDF
- Análise de tendências e crescimento
- Alertas de metas não atingidas
- Estatísticas de visitantes

### 👨‍🏫 Funcionalidades para Professor
- Chamada simplificada e rápida
- Histórico de presença dos alunos
- Observações por aluno
- Sincronização em tempo real
- Modo offline com sync automático

## 🛠️ Tech Stack

- **Frontend:** Next.js 14, React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Fastify, TypeScript
- **Database:** PostgreSQL + Prisma ORM
- **Cache:** Redis
- **Auth:** JWT + NextAuth.js (preparado para Firebase)
- **Deploy:** Docker, Railway/Render

## 📦 Instalação

### Pré-requisitos

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Docker e Docker Compose (recomendado)

### Opção 1: Docker (Recomendado)

```bash
# 1. Clonar repositório
git clone https://github.com/seu-usuario/ebd-pro.git
cd ebd-pro

# 2. Copiar variáveis de ambiente
cp .env.example .env

# 3. Subir containers
docker compose up -d

# 4. Rodar migrations e seed
docker exec -it ebd-pro-api sh -c "cd packages/database && pnpm db:push && pnpm db:seed"

# 5. Acessar
# Frontend: http://localhost:3000
# API: http://localhost:3333
```

### Opção 2: Local (sem Docker)

```bash
# 1. Instalar dependências
pnpm install

# 2. Configurar .env
cp .env.example .env
# Editar .env com suas credenciais

# 3. Subir banco PostgreSQL e Redis localmente
# (ou usar serviços cloud)

# 4. Rodar migrations
cd packages/database
pnpm db:push
pnpm db:seed

# 5. Rodar em desenvolvimento
cd ../..
pnpm dev
```

## 🔐 Logins de Demonstração

Após rodar o seed, use:

- **Secretária:** `secretaria@adpv.org` / `senha123`
- **Professor:** `carlos@adpv.org` / `senha123`
- **Admin:** `admin@adpv.org` / `senha123`

## 📁 Estrutura do Projeto

```
ebd-pro/
├── apps/
│   ├── api/              # Backend Fastify
│   │   ├── src/
│   │   │   ├── routes/   # Rotas da API
│   │   │   └── server.ts # Servidor principal
│   │   └── Dockerfile
│   │
│   └── web/              # Frontend Next.js
│       ├── app/          # App Router
│       │   ├── dashboard/
│       │   └── page.tsx  # Login
│       └── Dockerfile
│
├── packages/
│   └── database/         # Prisma Schema e Client
│       ├── schema.prisma
│       ├── seed.ts
│       └── index.ts
│
├── docker-compose.yml
├── turbo.json
└── package.json
```

## 🗄️ Schema do Banco

### Principais entidades

- **Igreja** - Multi-tenant principal
- **Usuario** - Autenticação e permissões
- **Classe** - Turmas da EBD
- **Aluno** - Alunos cadastrados
- **Chamada** - Registro de presença
- **Presenca** - Presença individual
- **Visitante** - Controle de visitantes

## 🚀 Deploy

### Railway (Recomendado)

```bash
# 1. Instalar Railway CLI
npm i -g @railway/cli

# 2. Login
railway login

# 3. Criar projeto
railway init

# 4. Adicionar PostgreSQL
railway add

# 5. Deploy
railway up
```

### Render

1. Conectar repositório no Render
2. Criar Web Service do backend
3. Criar Web Service do frontend
4. Adicionar PostgreSQL addon
5. Configurar variáveis de ambiente

## 🔮 Roadmap

- [ ] Modo offline completo com sync
- [ ] Notificações push para professores
- [ ] App mobile nativo (React Native / Capacitor)
- [ ] Integração com WhatsApp para lembretes
- [ ] IA para análise preditiva de evasão
- [ ] Sistema de badges e gamificação
- [ ] Exportação de dados para Excel
- [ ] API pública com webhooks
- [ ] Módulo de doações/financeiro

## 🔥 Firebase (Próximos passos)

O sistema já está preparado para Firebase. Para ativar:

1. Criar projeto no [Firebase Console](https://console.firebase.google.com)
2. Habilitar Authentication (Email/Password)
3. Copiar credenciais para `.env`
4. Descomentar imports do Firebase no código

```env
NEXT_PUBLIC_FIREBASE_API_KEY="..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="..."
NEXT_PUBLIC_FIREBASE_PROJECT_ID="..."
# ... etc
```

## 🤝 Contribuindo

Contribuições são bem-vindas!

1. Fork o projeto
2. Crie sua feature branch (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## 📝 License

MIT License - veja [LICENSE](LICENSE) para detalhes.

## 💬 Suporte

- Issues: [GitHub Issues](https://github.com/seu-usuario/ebd-pro/issues)
- Email: contato@ebdpro.com
- Discord: [Link do servidor]

---

Feito com ❤️ para igrejas do Brasil 🇧🇷
