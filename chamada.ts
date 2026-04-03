import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '@ebd-pro/database'

export async function chamadaRoutes(app: FastifyInstance) {
  // Criar nova chamada
  app.post('/', {
    onRequest: [app.authenticate],
  }, async (request, reply) => {
    const createSchema = z.object({
      classeId: z.string(),
      data: z.string().datetime().optional(),
      observacoes: z.string().optional(),
    })

    const data = createSchema.parse(request.body)
    const userId = (request.user as any).id
    const igrejaId = (request.user as any).igrejaId

    // Verificar se já existe chamada para essa classe nesse dia
    const dataInicio = new Date(data.data || new Date())
    dataInicio.setHours(0, 0, 0, 0)
    
    const dataFim = new Date(dataInicio)
    dataFim.setHours(23, 59, 59, 999)

    const chamadaExistente = await prisma.chamada.findFirst({
      where: {
        classeId: data.classeId,
        data: {
          gte: dataInicio,
          lte: dataFim,
        },
      },
    })

    if (chamadaExistente) {
      return reply.status(400).send({ 
        error: 'Já existe uma chamada para esta classe hoje',
        chamadaId: chamadaExistente.id,
      })
    }

    const chamada = await prisma.chamada.create({
      data: {
        classeId: data.classeId,
        igrejaId,
        professorId: userId,
        data: data.data ? new Date(data.data) : new Date(),
        observacoes: data.observacoes,
      },
      include: {
        classe: {
          include: {
            alunos: true,
          },
        },
      },
    })

    // Criar presenças vazias para todos os alunos
    const presencas = await Promise.all(
      chamada.classe.alunos.map((aluno) =>
        prisma.presenca.create({
          data: {
            alunoId: aluno.id,
            chamadaId: chamada.id,
            presente: false,
            trouxeBiblia: false,
            trouxeRevista: false,
          },
          include: {
            aluno: true,
          },
        })
      )
    )

    return reply.status(201).send({
      ...chamada,
      presencas,
    })
  })

  // Buscar chamada do dia
  app.get('/hoje/:classeId', {
    onRequest: [app.authenticate],
  }, async (request, reply) => {
    const paramsSchema = z.object({
      classeId: z.string(),
    })

    const { classeId } = paramsSchema.parse(request.params)
    const igrejaId = (request.user as any).igrejaId

    const dataInicio = new Date()
    dataInicio.setHours(0, 0, 0, 0)
    
    const dataFim = new Date()
    dataFim.setHours(23, 59, 59, 999)

    const chamada = await prisma.chamada.findFirst({
      where: {
        classeId,
        igrejaId,
        data: {
          gte: dataInicio,
          lte: dataFim,
        },
      },
      include: {
        presencas: {
          include: {
            aluno: true,
          },
          orderBy: {
            aluno: {
              nome: 'asc',
            },
          },
        },
        visitantes: true,
        classe: true,
      },
    })

    if (!chamada) {
      return reply.status(404).send({ error: 'Nenhuma chamada encontrada para hoje' })
    }

    return chamada
  })

  // Atualizar presença individual
  app.patch('/presenca/:presencaId', {
    onRequest: [app.authenticate],
  }, async (request, reply) => {
    const paramsSchema = z.object({
      presencaId: z.string(),
    })

    const bodySchema = z.object({
      presente: z.boolean().optional(),
      trouxeBiblia: z.boolean().optional(),
      trouxeRevista: z.boolean().optional(),
      observacao: z.string().optional(),
    })

    const { presencaId } = paramsSchema.parse(request.params)
    const data = bodySchema.parse(request.body)

    const presenca = await prisma.presenca.update({
      where: { id: presencaId },
      data,
      include: {
        aluno: true,
      },
    })

    return presenca
  })

  // Adicionar visitante
  app.post('/:chamadaId/visitantes', {
    onRequest: [app.authenticate],
  }, async (request, reply) => {
    const paramsSchema = z.object({
      chamadaId: z.string(),
    })

    const bodySchema = z.object({
      nome: z.string().min(3),
      telefone: z.string().optional(),
      endereco: z.string().optional(),
      idade: z.number().optional(),
      primeiraVisita: z.boolean().default(true),
    })

    const { chamadaId } = paramsSchema.parse(request.params)
    const data = bodySchema.parse(request.body)
    const igrejaId = (request.user as any).igrejaId

    const visitante = await prisma.visitante.create({
      data: {
        ...data,
        chamadaId,
        igrejaId,
      },
    })

    return reply.status(201).send(visitante)
  })

  // Finalizar chamada
  app.patch('/:chamadaId/finalizar', {
    onRequest: [app.authenticate],
  }, async (request, reply) => {
    const paramsSchema = z.object({
      chamadaId: z.string(),
    })

    const { chamadaId } = paramsSchema.parse(request.params)

    const chamada = await prisma.chamada.update({
      where: { id: chamadaId },
      data: { finalizada: true },
      include: {
        presencas: {
          include: {
            aluno: true,
          },
        },
        visitantes: true,
      },
    })

    // Calcular resumo
    const totalAlunos = chamada.presencas.length
    const presentes = chamada.presencas.filter(p => p.presente).length
    const biblias = chamada.presencas.filter(p => p.trouxeBiblia).length
    const revistas = chamada.presencas.filter(p => p.trouxeRevista).length

    return {
      ...chamada,
      resumo: {
        totalAlunos,
        presentes,
        ausentes: totalAlunos - presentes,
        percentualPresenca: Math.round((presentes / totalAlunos) * 100),
        biblias,
        percentualBiblia: Math.round((biblias / presentes) * 100),
        revistas,
        percentualRevista: Math.round((revistas / presentes) * 100),
        visitantes: chamada.visitantes.length,
      },
    }
  })

  // Histórico de chamadas
  app.get('/historico/:classeId', {
    onRequest: [app.authenticate],
  }, async (request, reply) => {
    const paramsSchema = z.object({
      classeId: z.string(),
    })

    const querySchema = z.object({
      limit: z.string().optional().default('10'),
      offset: z.string().optional().default('0'),
    })

    const { classeId } = paramsSchema.parse(request.params)
    const { limit, offset } = querySchema.parse(request.query)

    const chamadas = await prisma.chamada.findMany({
      where: {
        classeId,
        finalizada: true,
      },
      include: {
        presencas: {
          select: {
            presente: true,
            trouxeBiblia: true,
            trouxeRevista: true,
          },
        },
        visitantes: {
          select: {
            id: true,
          },
        },
        professor: {
          select: {
            nome: true,
          },
        },
      },
      orderBy: {
        data: 'desc',
      },
      take: parseInt(limit),
      skip: parseInt(offset),
    })

    // Adicionar resumos
    const chamadasComResumo = chamadas.map(chamada => {
      const totalAlunos = chamada.presencas.length
      const presentes = chamada.presencas.filter(p => p.presente).length
      const biblias = chamada.presencas.filter(p => p.trouxeBiblia).length
      const revistas = chamada.presencas.filter(p => p.trouxeRevista).length

      return {
        id: chamada.id,
        data: chamada.data,
        observacoes: chamada.observacoes,
        professor: chamada.professor,
        resumo: {
          totalAlunos,
          presentes,
          percentualPresenca: totalAlunos > 0 ? Math.round((presentes / totalAlunos) * 100) : 0,
          biblias,
          percentualBiblia: presentes > 0 ? Math.round((biblias / presentes) * 100) : 0,
          revistas,
          percentualRevista: presentes > 0 ? Math.round((revistas / presentes) * 100) : 0,
          visitantes: chamada.visitantes.length,
        },
      }
    })

    return chamadasComResumo
  })
}
