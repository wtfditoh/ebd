import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '@ebd-pro/database'

export async function classeRoutes(app: FastifyInstance) {
  // Listar classes da igreja
  app.get('/', {
    onRequest: [app.authenticate],
  }, async (request, reply) => {
    const igrejaId = (request.user as any).igrejaId

    const classes = await prisma.classe.findMany({
      where: { igrejaId },
      include: {
        professor: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
        _count: {
          select: {
            alunos: true,
          },
        },
      },
      orderBy: {
        nome: 'asc',
      },
    })

    return classes
  })

  // Buscar classe específica
  app.get('/:id', {
    onRequest: [app.authenticate],
  }, async (request, reply) => {
    const paramsSchema = z.object({
      id: z.string(),
    })

    const { id } = paramsSchema.parse(request.params)
    const igrejaId = (request.user as any).igrejaId

    const classe = await prisma.classe.findFirst({
      where: { id, igrejaId },
      include: {
        professor: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
        alunos: {
          where: {
            status: 'ATIVO',
          },
          orderBy: {
            nome: 'asc',
          },
        },
      },
    })

    if (!classe) {
      return reply.status(404).send({ error: 'Classe não encontrada' })
    }

    return classe
  })

  // Criar classe
  app.post('/', {
    onRequest: [app.authenticate],
  }, async (request, reply) => {
    const createSchema = z.object({
      nome: z.string().min(3),
      descricao: z.string().optional(),
      faixaEtaria: z.enum(['INFANTIL', 'JUVENIS', 'JOVENS', 'ADULTOS', 'MELHOR_IDADE']),
      capacidade: z.number().default(40),
      professorId: z.string().optional(),
    })

    const data = createSchema.parse(request.body)
    const igrejaId = (request.user as any).igrejaId
    const role = (request.user as any).role

    if (!['ADMIN_IGREJA', 'SECRETARIO'].includes(role)) {
      return reply.status(403).send({ error: 'Acesso negado' })
    }

    const classe = await prisma.classe.create({
      data: {
        ...data,
        igrejaId,
      },
      include: {
        professor: {
          select: {
            nome: true,
          },
        },
      },
    })

    return reply.status(201).send(classe)
  })
}
