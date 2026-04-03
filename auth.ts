import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '@ebd-pro/database'

export async function authRoutes(app: FastifyInstance) {
  // Login
  app.post('/login', async (request, reply) => {
    const loginSchema = z.object({
      email: z.string().email(),
      senha: z.string().min(6),
    })

    const { email, senha } = loginSchema.parse(request.body)

    const usuario = await prisma.usuario.findUnique({
      where: { email },
      include: {
        igreja: {
          select: {
            id: true,
            nome: true,
            slug: true,
          },
        },
      },
    })

    if (!usuario || !usuario.ativo) {
      return reply.status(401).send({ error: 'Credenciais inválidas' })
    }

    const senhaCorreta = await bcrypt.compare(senha, usuario.senha)

    if (!senhaCorreta) {
      return reply.status(401).send({ error: 'Credenciais inválidas' })
    }

    const token = await reply.jwtSign(
      {
        id: usuario.id,
        email: usuario.email,
        role: usuario.role,
        igrejaId: usuario.igrejaId,
      },
      {
        sign: {
          sub: usuario.id,
        },
      }
    )

    return reply.send({
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        role: usuario.role,
        foto: usuario.foto,
        igreja: usuario.igreja,
      },
    })
  })

  // Registro de nova igreja
  app.post('/register', async (request, reply) => {
    const registerSchema = z.object({
      // Dados da igreja
      nomeIgreja: z.string().min(3),
      emailIgreja: z.string().email(),
      telefoneIgreja: z.string().optional(),
      
      // Dados do admin
      nomeAdmin: z.string().min(3),
      emailAdmin: z.string().email(),
      senha: z.string().min(6),
    })

    const data = registerSchema.parse(request.body)

    // Verificar se igreja já existe
    const igrejaExiste = await prisma.igreja.findFirst({
      where: {
        OR: [
          { email: data.emailIgreja },
          { slug: data.nomeIgreja.toLowerCase().replace(/\s+/g, '-') },
        ],
      },
    })

    if (igrejaExiste) {
      return reply.status(400).send({ error: 'Igreja já cadastrada' })
    }

    // Verificar se usuário já existe
    const usuarioExiste = await prisma.usuario.findUnique({
      where: { email: data.emailAdmin },
    })

    if (usuarioExiste) {
      return reply.status(400).send({ error: 'Email já cadastrado' })
    }

    // Criar igreja e admin em transação
    const senhaHash = await bcrypt.hash(data.senha, 10)

    const igreja = await prisma.igreja.create({
      data: {
        nome: data.nomeIgreja,
        slug: data.nomeIgreja.toLowerCase().replace(/\s+/g, '-'),
        email: data.emailIgreja,
        telefone: data.telefoneIgreja,
        config: {
          create: {
            metaPresenca: 80,
            metaBiblia: 70,
            metaRevista: 60,
            notificarFaltas: true,
            faltasParaAlerta: 3,
          },
        },
        usuarios: {
          create: {
            nome: data.nomeAdmin,
            email: data.emailAdmin,
            senha: senhaHash,
            role: 'ADMIN_IGREJA',
          },
        },
      },
      include: {
        usuarios: {
          select: {
            id: true,
            nome: true,
            email: true,
            role: true,
          },
        },
      },
    })

    const admin = igreja.usuarios[0]

    const token = await reply.jwtSign(
      {
        id: admin.id,
        email: admin.email,
        role: admin.role,
        igrejaId: igreja.id,
      },
      {
        sign: {
          sub: admin.id,
        },
      }
    )

    return reply.status(201).send({
      token,
      usuario: admin,
      igreja: {
        id: igreja.id,
        nome: igreja.nome,
        slug: igreja.slug,
      },
    })
  })

  // Verificar token
  app.get('/me', {
    onRequest: [app.authenticate],
  }, async (request, reply) => {
    const userId = (request.user as any).id

    const usuario = await prisma.usuario.findUnique({
      where: { id: userId },
      include: {
        igreja: {
          select: {
            id: true,
            nome: true,
            slug: true,
          },
        },
      },
    })

    if (!usuario) {
      return reply.status(404).send({ error: 'Usuário não encontrado' })
    }

    return {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      role: usuario.role,
      foto: usuario.foto,
      igreja: usuario.igreja,
    }
  })
}
