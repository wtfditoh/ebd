import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '@ebd-pro/database'

export async function dashboardRoutes(app: FastifyInstance) {
  // Dashboard geral da igreja (secretário)
  app.get('/secretaria', {
    onRequest: [app.authenticate],
  }, async (request, reply) => {
    const igrejaId = (request.user as any).igrejaId
    const role = (request.user as any).role

    if (!['ADMIN_IGREJA', 'SECRETARIO', 'SUPER_ADMIN'].includes(role)) {
      return reply.status(403).send({ error: 'Acesso negado' })
    }

    // Buscar chamadas de hoje
    const dataInicio = new Date()
    dataInicio.setHours(0, 0, 0, 0)
    
    const dataFim = new Date()
    dataFim.setHours(23, 59, 59, 999)

    const chamadasHoje = await prisma.chamada.findMany({
      where: {
        igrejaId,
        data: {
          gte: dataInicio,
          lte: dataFim,
        },
      },
      include: {
        classe: {
          select: {
            nome: true,
            faixaEtaria: true,
          },
        },
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
            nome: true,
            primeiraVisita: true,
          },
        },
      },
    })

    // Total de alunos da igreja
    const totalAlunos = await prisma.aluno.count({
      where: {
        igrejaId,
        status: 'ATIVO',
      },
    })

    // Calcular totais
    let totalPresentes = 0
    let totalBiblias = 0
    let totalRevistas = 0
    let totalVisitantes = 0

    const resumoPorClasse = chamadasHoje.map(chamada => {
      const presentes = chamada.presencas.filter(p => p.presente).length
      const biblias = chamada.presencas.filter(p => p.trouxeBiblia).length
      const revistas = chamada.presencas.filter(p => p.trouxeRevista).length
      const visitantes = chamada.visitantes.length

      totalPresentes += presentes
      totalBiblias += biblias
      totalRevistas += revistas
      totalVisitantes += visitantes

      return {
        classe: chamada.classe.nome,
        faixaEtaria: chamada.classe.faixaEtaria,
        totalAlunos: chamada.presencas.length,
        presentes,
        percentualPresenca: chamada.presencas.length > 0 
          ? Math.round((presentes / chamada.presencas.length) * 100) 
          : 0,
        biblias,
        percentualBiblia: presentes > 0 
          ? Math.round((biblias / presentes) * 100) 
          : 0,
        revistas,
        percentualRevista: presentes > 0 
          ? Math.round((revistas / presentes) * 100) 
          : 0,
        visitantes,
        visitantesNovos: chamada.visitantes.filter(v => v.primeiraVisita).length,
      }
    })

    // Buscar dados das últimas 12 semanas para gráfico
    const dataInicio12Semanas = new Date()
    dataInicio12Semanas.setDate(dataInicio12Semanas.getDate() - (12 * 7))

    const chamadasHistorico = await prisma.chamada.findMany({
      where: {
        igrejaId,
        data: {
          gte: dataInicio12Semanas,
        },
        finalizada: true,
      },
      include: {
        presencas: {
          select: {
            presente: true,
          },
        },
      },
      orderBy: {
        data: 'asc',
      },
    })

    // Agrupar por semana
    const presencaPorSemana = chamadasHistorico.reduce((acc: any, chamada) => {
      const semana = new Date(chamada.data)
      semana.setHours(0, 0, 0, 0)
      const chave = semana.toISOString().split('T')[0]

      if (!acc[chave]) {
        acc[chave] = {
          data: semana,
          presentes: 0,
          total: 0,
        }
      }

      const presentes = chamada.presencas.filter(p => p.presente).length
      acc[chave].presentes += presentes
      acc[chave].total += chamada.presencas.length

      return acc
    }, {})

    const graficoSemanas = Object.values(presencaPorSemana)
      .sort((a: any, b: any) => a.data.getTime() - b.data.getTime())
      .map((s: any) => ({
        data: s.data,
        presentes: s.presentes,
        percentual: s.total > 0 ? Math.round((s.presentes / s.total) * 100) : 0,
      }))

    // Calcular variação
    const presencaAtual = totalPresentes
    const presencaAnterior = graficoSemanas.length > 1 
      ? graficoSemanas[graficoSemanas.length - 2].presentes 
      : 0

    const variacaoPresenca = presencaAnterior > 0
      ? Math.round(((presencaAtual - presencaAnterior) / presencaAnterior) * 100)
      : 0

    // Buscar metas da igreja
    const config = await prisma.igrejaConfig.findUnique({
      where: { igrejaId },
    })

    return {
      hoje: {
        totalPresentes,
        percentualPresenca: totalAlunos > 0 
          ? Math.round((totalPresentes / totalAlunos) * 100) 
          : 0,
        totalBiblias,
        percentualBiblia: totalPresentes > 0 
          ? Math.round((totalBiblias / totalPresentes) * 100) 
          : 0,
        totalRevistas,
        percentualRevista: totalPresentes > 0 
          ? Math.round((totalRevistas / totalPresentes) * 100) 
          : 0,
        totalVisitantes,
        variacaoPresenca,
      },
      classes: resumoPorClasse,
      graficoSemanas,
      metas: config ? {
        presenca: config.metaPresenca,
        biblia: config.metaBiblia,
        revista: config.metaRevista,
      } : null,
    }
  })

  // Dashboard do professor (só sua classe)
  app.get('/professor', {
    onRequest: [app.authenticate],
  }, async (request, reply) => {
    const userId = (request.user as any).id

    // Buscar classes do professor
    const classes = await prisma.classe.findMany({
      where: {
        professorId: userId,
        ativa: true,
      },
      include: {
        alunos: {
          where: {
            status: 'ATIVO',
          },
        },
      },
    })

    if (classes.length === 0) {
      return reply.status(404).send({ error: 'Nenhuma classe atribuída' })
    }

    // Buscar última chamada de cada classe
    const ultimasChamadas = await Promise.all(
      classes.map(async (classe) => {
        const chamada = await prisma.chamada.findFirst({
          where: {
            classeId: classe.id,
            finalizada: true,
          },
          orderBy: {
            data: 'desc',
          },
          include: {
            presencas: {
              select: {
                presente: true,
                trouxeBiblia: true,
                trouxeRevista: true,
              },
            },
          },
        })

        if (!chamada) return null

        const presentes = chamada.presencas.filter(p => p.presente).length
        const biblias = chamada.presencas.filter(p => p.trouxeBiblia).length
        const revistas = chamada.presencas.filter(p => p.trouxeRevista).length

        return {
          classe: classe.nome,
          data: chamada.data,
          presentes,
          percentualPresenca: Math.round((presentes / chamada.presencas.length) * 100),
          biblias,
          percentualBiblia: presentes > 0 ? Math.round((biblias / presentes) * 100) : 0,
          revistas,
          percentualRevista: presentes > 0 ? Math.round((revistas / presentes) * 100) : 0,
        }
      })
    )

    return {
      classes: classes.map(c => ({
        id: c.id,
        nome: c.nome,
        totalAlunos: c.alunos.length,
      })),
      ultimasChamadas: ultimasChamadas.filter(Boolean),
    }
  })

  // Relatório trimestral
  app.get('/relatorio/trimestral', {
    onRequest: [app.authenticate],
  }, async (request, reply) => {
    const querySchema = z.object({
      trimestre: z.string().optional(), // "1", "2", "3", "4"
      ano: z.string().optional(),
    })

    const { trimestre, ano } = querySchema.parse(request.query)
    const igrejaId = (request.user as any).igrejaId

    const anoAtual = ano ? parseInt(ano) : new Date().getFullYear()
    const trimestreAtual = trimestre ? parseInt(trimestre) : Math.ceil((new Date().getMonth() + 1) / 3)

    // Calcular datas do trimestre
    const mesInicio = (trimestreAtual - 1) * 3
    const dataInicio = new Date(anoAtual, mesInicio, 1)
    const dataFim = new Date(anoAtual, mesInicio + 3, 0, 23, 59, 59)

    const chamadas = await prisma.chamada.findMany({
      where: {
        igrejaId,
        data: {
          gte: dataInicio,
          lte: dataFim,
        },
        finalizada: true,
      },
      include: {
        classe: {
          select: {
            nome: true,
          },
        },
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
            primeiraVisita: true,
          },
        },
      },
    })

    const totalDomingos = chamadas.length
    const totalPresencas = chamadas.reduce((acc, ch) => 
      acc + ch.presencas.filter(p => p.presente).length, 0
    )
    const mediaPresenca = totalDomingos > 0 
      ? Math.round(totalPresencas / totalDomingos) 
      : 0

    const totalVisitantes = chamadas.reduce((acc, ch) => 
      acc + ch.visitantes.length, 0
    )

    const visitantesNovos = chamadas.reduce((acc, ch) => 
      acc + ch.visitantes.filter(v => v.primeiraVisita).length, 0
    )

    // Agrupar por classe
    const porClasse = chamadas.reduce((acc: any, chamada) => {
      const className = chamada.classe.nome

      if (!acc[className]) {
        acc[className] = {
          nome: className,
          domingos: 0,
          presentes: 0,
          total: 0,
        }
      }

      acc[className].domingos += 1
      acc[className].presentes += chamada.presencas.filter(p => p.presente).length
      acc[className].total += chamada.presencas.length

      return acc
    }, {})

    const resumoPorClasse = Object.values(porClasse).map((c: any) => ({
      ...c,
      mediaPresenca: c.domingos > 0 
        ? Math.round(c.presentes / c.domingos) 
        : 0,
      percentualPresenca: c.total > 0 
        ? Math.round((c.presentes / c.total) * 100) 
        : 0,
    }))

    return {
      periodo: {
        trimestre: trimestreAtual,
        ano: anoAtual,
        dataInicio,
        dataFim,
      },
      totais: {
        domingos: totalDomingos,
        mediaPresenca,
        totalVisitantes,
        visitantesNovos,
        taxaRetorno: totalVisitantes > 0 
          ? Math.round(((totalVisitantes - visitantesNovos) / totalVisitantes) * 100) 
          : 0,
      },
      classes: resumoPorClasse,
    }
  })
}
