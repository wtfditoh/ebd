import { PrismaClient, Role, FaixaEtaria, StatusAluno } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed...')

  // Limpar dados antigos
  await prisma.presenca.deleteMany()
  await prisma.chamada.deleteMany()
  await prisma.aluno.deleteMany()
  await prisma.classe.deleteMany()
  await prisma.usuario.deleteMany()
  await prisma.igrejaConfig.deleteMany()
  await prisma.igreja.deleteMany()

  // 🏛️ Criar igreja demo
  const igreja = await prisma.igreja.create({
    data: {
      nome: 'Assembleia de Deus Parque Verde',
      slug: 'ad-parque-verde',
      email: 'contato@adpv.org',
      telefone: '(11) 98765-4321',
      endereco: 'Rua das Igrejas, 123 - São Paulo/SP',
      config: {
        create: {
          metaPresenca: 80,
          metaBiblia: 70,
          metaRevista: 60,
          notificarFaltas: true,
          faltasParaAlerta: 3,
          horarioInicio: '09:00',
          horariFim: '10:30',
        },
      },
    },
  })

  console.log('✅ Igreja criada:', igreja.nome)

  // 👤 Criar usuários
  const senhaHash = await bcrypt.hash('senha123', 10)

  const admin = await prisma.usuario.create({
    data: {
      email: 'admin@adpv.org',
      senha: senhaHash,
      nome: 'Admin Sistema',
      role: Role.ADMIN_IGREJA,
      igrejaId: igreja.id,
    },
  })

  const secretaria = await prisma.usuario.create({
    data: {
      email: 'secretaria@adpv.org',
      senha: senhaHash,
      nome: 'Maria Secretária',
      role: Role.SECRETARIO,
      igrejaId: igreja.id,
    },
  })

  const profJovens = await prisma.usuario.create({
    data: {
      email: 'carlos@adpv.org',
      senha: senhaHash,
      nome: 'Carlos Silva',
      telefone: '(11) 99999-1111',
      role: Role.PROFESSOR,
      igrejaId: igreja.id,
    },
  })

  const profAdultos = await prisma.usuario.create({
    data: {
      email: 'ana@adpv.org',
      senha: senhaHash,
      nome: 'Ana Santos',
      role: Role.PROFESSOR,
      igrejaId: igreja.id,
    },
  })

  console.log('✅ Usuários criados')

  // 🏫 Criar classes
  const classeJovens = await prisma.classe.create({
    data: {
      nome: 'Jovens Unidos',
      descricao: 'Classe de jovens e adolescentes',
      faixaEtaria: FaixaEtaria.JOVENS,
      capacidade: 35,
      igrejaId: igreja.id,
      professorId: profJovens.id,
    },
  })

  const classeAdultos = await prisma.classe.create({
    data: {
      nome: 'Adultos em Cristo',
      descricao: 'Classe de adultos',
      faixaEtaria: FaixaEtaria.ADULTOS,
      capacidade: 40,
      igrejaId: igreja.id,
      professorId: profAdultos.id,
    },
  })

  console.log('✅ Classes criadas')

  // 👨‍🎓 Criar alunos da classe Jovens
  const alunosJovens = [
    'João Silva',
    'Maria Souza',
    'Carlos Lima',
    'Ana Paula',
    'Pedro Santos',
    'Julia Costa',
    'Lucas Almeida',
    'Beatriz Oliveira',
    'Gabriel Ferreira',
    'Larissa Rodrigues',
  ]

  for (const nome of alunosJovens) {
    await prisma.aluno.create({
      data: {
        nome,
        status: StatusAluno.ATIVO,
        igrejaId: igreja.id,
        classeId: classeJovens.id,
        dataNascimento: new Date(2000 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
      },
    })
  }

  // 👨‍🎓 Criar alunos da classe Adultos
  const alunosAdultos = [
    'Roberto Mendes',
    'Claudia Martins',
    'Fernando Souza',
    'Patricia Lima',
    'Ricardo Alves',
    'Juliana Rocha',
    'Marcos Paulo',
    'Renata Silva',
  ]

  for (const nome of alunosAdultos) {
    await prisma.aluno.create({
      data: {
        nome,
        status: StatusAluno.ATIVO,
        igrejaId: igreja.id,
        classeId: classeAdultos.id,
        dataNascimento: new Date(1970 + Math.floor(Math.random() * 25), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
      },
    })
  }

  console.log('✅ Alunos criados')

  // ✅ Criar chamada exemplo (domingo passado)
  const domingoPassado = new Date()
  domingoPassado.setDate(domingoPassado.getDate() - 7)
  domingoPassado.setHours(9, 0, 0, 0)

  const chamadaExemplo = await prisma.chamada.create({
    data: {
      data: domingoPassado,
      igrejaId: igreja.id,
      classeId: classeJovens.id,
      professorId: profJovens.id,
      finalizada: true,
      observacoes: 'Aula sobre Fé e Obras',
    },
  })

  // Criar presenças para essa chamada
  const todosAlunosJovens = await prisma.aluno.findMany({
    where: { classeId: classeJovens.id },
  })

  for (const aluno of todosAlunosJovens) {
    const presente = Math.random() > 0.2 // 80% de presença
    await prisma.presenca.create({
      data: {
        alunoId: aluno.id,
        chamadaId: chamadaExemplo.id,
        presente,
        trouxeBiblia: presente && Math.random() > 0.3,
        trouxeRevista: presente && Math.random() > 0.4,
      },
    })
  }

  console.log('✅ Chamada exemplo criada')

  console.log('\n🎉 Seed concluído!')
  console.log('\n📧 Login de teste:')
  console.log('   Email: admin@adpv.org')
  console.log('   Senha: senha123')
  console.log('\n   Email: secretaria@adpv.org')
  console.log('   Senha: senha123')
  console.log('\n   Email: carlos@adpv.org (Professor)')
  console.log('   Senha: senha123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
