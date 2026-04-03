# 🛠️ Guia de Desenvolvimento - EBD Pro

## Setup inicial

```bash
# 1. Clonar e entrar no projeto
git clone <repo>
cd ebd-pro

# 2. Rodar setup automatizado
chmod +x setup.sh
./setup.sh

# OU setup manual:
cp .env.example .env
docker compose up -d
docker exec -it ebd-pro-api sh -c "cd packages/database && pnpm db:push && pnpm db:seed"
```

## Desenvolvimento local (sem Docker)

```bash
# Instalar dependências
pnpm install

# Subir banco local
# Você precisa de PostgreSQL e Redis rodando

# Setup do banco
cd packages/database
pnpm db:push
pnpm db:seed
cd ../..

# Rodar tudo em dev
pnpm dev

# OU rodar separado:
cd apps/api && pnpm dev     # Backend em :3333
cd apps/web && pnpm dev     # Frontend em :3000
```

## Comandos úteis

### Banco de dados
```bash
# Gerar Prisma Client
cd packages/database && pnpm db:generate

# Push schema (sem migrations)
pnpm db:push

# Abrir Prisma Studio
pnpm db:studio

# Resetar e popular
pnpm db:push && pnpm db:seed
```

### Docker
```bash
# Ver logs
docker compose logs -f
docker compose logs -f api
docker compose logs -f web

# Reiniciar um serviço
docker compose restart api

# Reconstruir imagem
docker compose build api
docker compose up -d api

# Parar tudo
docker compose down

# Parar e limpar volumes
docker compose down -v
```

### Build e produção
```bash
# Build tudo
pnpm build

# Testar build localmente
cd apps/api && pnpm start
cd apps/web && pnpm start
```

## Estrutura de pastas

```
apps/
├── api/src/
│   ├── routes/       # Rotas da API
│   │   ├── auth.ts
│   │   ├── chamada.ts
│   │   ├── dashboard.ts
│   │   └── ...
│   └── server.ts     # Entry point
│
└── web/app/
    ├── dashboard/    # Telas logadas
    ├── globals.css
    ├── layout.tsx
    └── page.tsx      # Login

packages/
└── database/
    ├── schema.prisma # Schema do Prisma
    ├── seed.ts       # Dados iniciais
    └── index.ts      # Prisma Client
```

## Adicionando novas features

### 1. Nova rota no backend

```typescript
// apps/api/src/routes/minha-rota.ts
import { FastifyInstance } from 'fastify'
import { prisma } from '@ebd-pro/database'

export async function minhaRota(app: FastifyInstance) {
  app.get('/', {
    onRequest: [app.authenticate], // Proteger rota
  }, async (request, reply) => {
    const igrejaId = (request.user as any).igrejaId
    
    const data = await prisma.aluno.findMany({
      where: { igrejaId }
    })
    
    return data
  })
}

// apps/api/src/server.ts
import { minhaRota } from './routes/minha-rota'
await app.register(minhaRota, { prefix: '/api/minha-rota' })
```

### 2. Nova tabela no banco

```prisma
// packages/database/schema.prisma
model MinhaTabela {
  id        String   @id @default(cuid())
  nome      String
  igrejaId  String
  igreja    Igreja   @relation(fields: [igrejaId], references: [id])
  
  @@map("minha_tabela")
}

// Depois:
cd packages/database
pnpm db:push
```

### 3. Nova página no frontend

```tsx
// apps/web/app/dashboard/minha-pagina/page.tsx
'use client'

export default function MinhaPagina() {
  return <div>Minha página</div>
}
```

## Firebase (quando quiser integrar)

```typescript
// 1. Instalar
pnpm add firebase firebase-admin

// 2. Criar lib/firebase.ts
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  // ...
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)

// 3. Usar no login
import { signInWithEmailAndPassword } from 'firebase/auth'
await signInWithEmailAndPassword(auth, email, senha)
```

## Troubleshooting

### Banco não conecta
```bash
# Verificar se PostgreSQL está rodando
docker compose ps

# Ver logs do banco
docker compose logs postgres

# Resetar volumes
docker compose down -v
docker compose up -d
```

### Frontend não conecta na API
```bash
# Verificar NEXT_PUBLIC_API_URL no .env
cat .env | grep NEXT_PUBLIC_API_URL

# Deve ser: http://localhost:3333
```

### Erro de permissão (RBAC)
```typescript
// Verificar role do usuário
const role = (request.user as any).role

// Roles disponíveis:
// SUPER_ADMIN, ADMIN_IGREJA, SECRETARIO, PROFESSOR, ALUNO
```

## Deploy

### Railway
```bash
railway login
railway init
railway add # Adicionar PostgreSQL
railway up
```

### Variáveis de ambiente necessárias
- `DATABASE_URL`
- `JWT_SECRET`
- `FRONTEND_URL`
- `NEXT_PUBLIC_API_URL`

## Contribuindo

1. Fork o repo
2. Crie branch: `git checkout -b feature/minha-feature`
3. Commit: `git commit -m 'Adiciona feature X'`
4. Push: `git push origin feature/minha-feature`
5. Abra PR

## Dúvidas?

Abra uma issue ou entre no Discord!
