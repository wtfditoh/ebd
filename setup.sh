#!/bin/bash

echo "🚀 EBD Pro - Setup Automatizado"
echo "================================"
echo ""

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não está instalado. Instale primeiro: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command -v docker compose &> /dev/null; then
    echo "❌ Docker Compose não está instalado."
    exit 1
fi

echo "✅ Docker encontrado"
echo ""

# Criar .env se não existir
if [ ! -f .env ]; then
    echo "📝 Criando arquivo .env..."
    cp .env.example .env
    echo "✅ .env criado (edite se necessário)"
else
    echo "ℹ️  .env já existe"
fi

echo ""
echo "🐳 Subindo containers Docker..."
docker compose up -d

echo ""
echo "⏳ Aguardando banco de dados..."
sleep 10

echo ""
echo "📊 Criando schema do banco..."
docker exec -it ebd-pro-api sh -c "cd /app/packages/database && pnpm db:push"

echo ""
echo "🌱 Populando dados de exemplo..."
docker exec -it ebd-pro-api sh -c "cd /app/packages/database && pnpm db:seed"

echo ""
echo "✅ Setup concluído!"
echo ""
echo "🌐 Acessos:"
echo "   Frontend: http://localhost:3000"
echo "   API: http://localhost:3333"
echo "   API Health: http://localhost:3333/health"
echo ""
echo "🔐 Logins de teste:"
echo "   Secretária: secretaria@adpv.org / senha123"
echo "   Professor: carlos@adpv.org / senha123"
echo "   Admin: admin@adpv.org / senha123"
echo ""
echo "📚 Comandos úteis:"
echo "   docker compose logs -f        # Ver logs"
echo "   docker compose down           # Parar tudo"
echo "   docker compose restart        # Reiniciar"
echo ""
echo "🎉 Bom uso!"
