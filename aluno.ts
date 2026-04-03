import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '@ebd-pro/database'

export async function alunoRoutes(app: FastifyInstance) {
  // Listar alunos de uma classe
  app.get('/classe/:classeId', {
    onRequest: [app.authenticate],
  }, async (request, reply) => {
    const paramsSchema = z.object({
      classeId: z.string(),
    })

    const { classeId } = paramsSchema.parse(request.params)
    const igrejaId = (request.user as any).igrejaId

    const alunos = await prisma.aluno.findMany({
      where: {
        classeId,
        igrejaId,
      },
      orderBy: {
        nome: 'asc',
      },
    })

    return alunos
  })

  // Buscar aluno específico
  app.get('/:id', {
    onRequest: [app.authenticate],
  }, async (request, reply) => {
    const paramsSchema = z.object({
      id: z.string(),
    })

    const { id } = paramsSchema.parse(request.params)
    const igrejaId = (request.user as any).igrejaId

    const aluno = await prisma.aluno.findFirst({
      where: { id, igrejaId },
      include: {
        classe: {
          select: {
            nome: true,
          },
        },
        presencas: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
          include: {
            chamada: {
              select: {
                data: true,
              },
            },
          },
        },
      },
    })

    if (!aluno) {
      return reply.status(404).send({ error: 'Aluno não encontrado' })
    }

    // Calcular estatísticas
    const totalPresencas = aluno.presencas.length
    const presentes = aluno.presencas.filter(p => p.presente).length
    const percentualPresenca = totalPresencas > 0 
      ? Math.round((presentes / totalPresencas) * 100) 
      : 0

    return {
      ...aluno,
      estatisticas: {
        totalRegistros: totalPresencas,
        presentes,
        faltas: totalPresencas - presentes,
        percentualPresenca,
      },
    }
  })

  // Criar aluno
  app.post('/', {
    onRequest: [app.authenticate],
  }, async (request, reply) => {
    const createSchema = z.object({
      nome: z.string().min(3),
      dataNascimento: z.string().datetime().optional(),
      telefone: z.string().optional(),
      endereco: z.string().optional(),
      responsavel: z.string().optional(),
      classeId: z.string(),
    })

    const data = createSchema.parse(request.body)
    const igrejaId = (request.user as any).igrejaId

    const aluno = await prisma.aluno.create({
      data: {
        ...data,
        dataNascimento: data.dataNascimento ? new Date(data.dataNascimento) : undefined,
        igrejaId,
      },
      include: {
        classe: {
          select: {
            nome: true,
          },
        },
      },
    })

    return reply.status(201).send(aluno)
  })
}
