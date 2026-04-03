import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import cookie from '@fastify/cookie'
import { config } from 'dotenv'

import { authRoutes } from './routes/auth'
import { igrejaRoutes } from './routes/igreja'
import { classeRoutes } from './routes/classe'
import { alunoRoutes } from './routes/aluno'
import { chamadaRoutes } from './routes/chamada'
import { dashboardRoutes } from './routes/dashboard'

config()

const PORT = Number(process.env.PORT) || 3333
const HOST = process.env.HOST || '0.0.0.0'

const app = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  },
})

async function start() {
  try {
    // Plugins
    await app.register(cors, {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
    })

    await app.register(cookie)

    await app.register(jwt, {
      secret: process.env.JWT_SECRET || 'supersecret-change-in-production',
      sign: {
        expiresIn: '7d',
      },
      cookie: {
        cookieName: 'token',
        signed: false,
      },
    })

    // Decorator para verificar autenticação
    app.decorate('authenticate', async function (request: any, reply: any) {
      try {
        await request.jwtVerify()
      } catch (err) {
        reply.status(401).send({ error: 'Não autorizado' })
      }
    })

    // Health check
    app.get('/health', async () => {
      return { status: 'ok', timestamp: new Date().toISOString() }
    })

    // Rotas
    await app.register(authRoutes, { prefix: '/api/auth' })
    await app.register(igrejaRoutes, { prefix: '/api/igrejas' })
    await app.register(classeRoutes, { prefix: '/api/classes' })
    await app.register(alunoRoutes, { prefix: '/api/alunos' })
    await app.register(chamadaRoutes, { prefix: '/api/chamadas' })
    await app.register(dashboardRoutes, { prefix: '/api/dashboard' })

    await app.listen({ port: PORT, host: HOST })

    console.log(`
🚀 EBD Pro API rodando!
   
📍 URL: http://${HOST}:${PORT}
📊 Health: http://${HOST}:${PORT}/health
🔐 Auth: http://${HOST}:${PORT}/api/auth/login
    `)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
