'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Aluno {
  id: string
  nome: string
  presenca: {
    id: string
    presente: boolean
    trouxeBiblia: boolean
    trouxeRevista: boolean
  }
  historico: boolean[] // últimas 5 semanas
}

export default function ProfessorChamada() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [classeNome, setClasseNome] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/')
      return
    }

    // Simular dados (integrar com API depois)
    setTimeout(() => {
      setClasseNome('Jovens Unidos')
      setAlunos([
        {
          id: '1',
          nome: 'João Silva',
          presenca: {
            id: 'p1',
            presente: true,
            trouxeBiblia: true,
            trouxeRevista: true,
          },
          historico: [true, true, true, true, false],
        },
        {
          id: '2',
          nome: 'Maria Souza',
          presenca: {
            id: 'p2',
            presente: false,
            trouxeBiblia: false,
            trouxeRevista: false,
          },
          historico: [true, true, false, true, true],
        },
        {
          id: '3',
          nome: 'Carlos Lima',
          presenca: {
            id: 'p3',
            presente: true,
            trouxeBiblia: true,
            trouxeRevista: false,
          },
          historico: [true, true, true, false, true],
        },
      ])
      setLoading(false)
    }, 1000)
  }, [router])

  const togglePresenca = (alunoId: string) => {
    setAlunos(prev =>
      prev.map(a =>
        a.id === alunoId
          ? { ...a, presenca: { ...a.presenca, presente: !a.presenca.presente } }
          : a
      )
    )
  }

  const toggleBiblia = (alunoId: string) => {
    setAlunos(prev =>
      prev.map(a =>
        a.id === alunoId
          ? { ...a, presenca: { ...a.presenca, trouxeBiblia: !a.presenca.trouxeBiblia } }
          : a
      )
    )
  }

  const toggleRevista = (alunoId: string) => {
    setAlunos(prev =>
      prev.map(a =>
        a.id === alunoId
          ? { ...a, presenca: { ...a.presenca, trouxeRevista: !a.presenca.trouxeRevista } }
          : a
      )
    )
  }

  const presentes = alunos.filter(a => a.presenca.presente).length
  const biblias = alunos.filter(a => a.presenca.trouxeBiblia).length
  const revistas = alunos.filter(a => a.presenca.trouxeRevista).length

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando chamada...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <button
            onClick={() => router.back()}
            className="text-purple-600 mb-2 flex items-center gap-2"
          >
            ← Voltar
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{classeNome}</h1>
              <p className="text-sm text-gray-500">
                {new Date().toLocaleDateString('pt-BR', { 
                  weekday: 'short', 
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric'
                })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">{presentes}/{alunos.length}</p>
              <p className="text-xs text-gray-500">presentes</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-3">
        {alunos.map((aluno) => (
          <div
            key={aluno.id}
            className={`bg-white rounded-xl border-2 ${
              aluno.presenca.presente ? 'border-green-200' : 'border-gray-200'
            } overflow-hidden transition`}
          >
            {/* Nome e checkbox principal */}
            <div className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <button
                  onClick={() => togglePresenca(aluno.id)}
                  className={`w-6 h-6 rounded border-2 flex items-center justify-center transition ${
                    aluno.presenca.presente
                      ? 'bg-green-500 border-green-500'
                      : 'bg-white border-gray-300'
                  }`}
                >
                  {aluno.presenca.presente && (
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{aluno.nome}</p>
                  <p className={`text-sm ${aluno.presenca.presente ? 'text-green-600' : 'text-gray-500'}`}>
                    {aluno.presenca.presente ? '✓ Presente' : '✗ Ausente'}
                  </p>
                </div>
              </div>

              {/* Bíblia e Revista */}
              {aluno.presenca.presente && (
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleBiblia(aluno.id)}
                    className={`flex-1 py-2 px-3 rounded-lg border-2 transition flex items-center justify-center gap-2 ${
                      aluno.presenca.trouxeBiblia
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'bg-white border-gray-300 text-gray-600'
                    }`}
                  >
                    <span>📖</span>
                    <span className="text-sm font-medium">Bíblia</span>
                  </button>

                  <button
                    onClick={() => toggleRevista(aluno.id)}
                    className={`flex-1 py-2 px-3 rounded-lg border-2 transition flex items-center justify-center gap-2 ${
                      aluno.presenca.trouxeRevista
                        ? 'bg-purple-50 border-purple-500 text-purple-700'
                        : 'bg-white border-gray-300 text-gray-600'
                    }`}
                  >
                    <span>📘</span>
                    <span className="text-sm font-medium">Revista</span>
                  </button>
                </div>
              )}

              {/* Histórico */}
              <div className="mt-3 flex items-center gap-1">
                <span className="text-xs text-gray-500 mr-2">Últimas:</span>
                {aluno.historico.map((presente, idx) => (
                  <div
                    key={idx}
                    className={`w-6 h-6 rounded ${
                      presente ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        ))}
      </main>

      {/* Footer fixo */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="grid grid-cols-3 gap-2 mb-3 text-center text-sm">
            <div>
              <p className="text-2xl font-bold text-gray-900">{presentes}</p>
              <p className="text-xs text-gray-500">Presentes</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{biblias}</p>
              <p className="text-xs text-gray-500">Bíblias</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">{revistas}</p>
              <p className="text-xs text-gray-500">Revistas</p>
            </div>
          </div>

          <button className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-lg font-medium shadow-lg">
            💾 Salvar Chamada
          </button>

          <p className="text-center text-xs text-gray-500 mt-2">
            ☁️ Sincronizado há 1min
          </p>
        </div>
      </div>
    </div>
  )
}
