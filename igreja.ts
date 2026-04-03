import { FastifyInstance } from 'fastify'
import { prisma } from '@ebd-pro/database'

export async function igrejaRoutes(app: FastifyInstance) {
  // Listar igrejas (apenas super admin)
  app.get('/', {
    onRequest: [app.authenticate],
  }, async (request, reply) => {
    const role = (request.user as any).role

    if (role !== 'SUPER_ADMIN') {
      return reply.status(403).send({ error: 'Acesso negado' })
    }

    const igrejas = await prisma.igreja.findMany({
      include: {
        _count: {
          select: {
            usuarios: true,
            classes: true,
            alunos: true,
          },
        },
      },
    })

    return igrejas
  })

  // Buscar dados da própria igreja
  app.get('/minha', {
    onRequest: [app.authenticate],
  }, async (request, reply) => {
    const igrejaId = (request.user as any).igrejaId

    const igreja = await prisma.igreja.findUnique({
      where: { id: igrejaId },
      include: {
        config: true,
        _count: {
          select: {
            usuarios: true,
            classes: true,
            alunos: true,
          },
        },
      },
    })

    if (!igreja) {
      return reply.status(404).send({ error: 'Igreja não encontrada' })
    }

    return igreja
  })
}
