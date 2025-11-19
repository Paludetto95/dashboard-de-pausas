#!/bin/bash
# Script de Deploy para Vercel - Dashboard de Pausas

echo "🚀 Iniciando deploy no Vercel..."

# Verificar se está na pasta correta
if [ ! -f "dash.html" ] || [ ! -f "api/dados-argus.js" ]; then
    echo "❌ Arquivos necessários não encontrados!"
    echo "📁 Certifique-se de estar na pasta dashboard-de-pausas"
    exit 1
fi

echo "✅ Arquivos verificados"

# Criar arquivo de ambiente se não existir
if [ ! -f ".env" ]; then
    echo "📝 Criando arquivo .env..."
    cat > .env << EOF
ARGUS_API_URL=https://argus.app.br/apiargus
ARGUS_API_TOKEN_GLOBAL=nahybptvaa25vyybq0fyoj8bqyahrlw52acotbquc8du1z033ezsvfn5nx0egxqz
ARGUS_CAMPAIGN_TOKENS={"2":"nahybptvaa25vyybq0fyoj8bqyahrlw52acotbquc8du1z033ezsvfn5nx0egxqz"}
EOF
    echo "✅ Arquivo .env criado"
fi

# Verificar dependências
echo "📦 Verificando dependências..."
if [ ! -d "node_modules" ]; then
    echo "Instalando dependências..."
    npm install
fi

echo "✅ Dependências verificadas"

# Criar vercel.json se não existir
if [ ! -f "vercel.json" ]; then
    echo "📝 Criando vercel.json..."
    cat > vercel.json << 'EOF'
{
  "version": 2,
  "routes": [
    { "src": "/api/dados-argus", "dest": "/api/dados-argus.js" },
    { "src": "/(.*)", "dest": "/dash.html" }
  ]
}
EOF
    echo "✅ vercel.json criado"
fi

echo ""
echo "🎉 PROJETO PRONTO PARA DEPLOY!"
echo ""
echo "📋 PRÓXIMOS PASSOS:"
echo "1. Acesse: https://vercel.com"
echo "2. Faça login"
echo "3. Clique em 'New Project'"
echo "4. Escolha 'Upload'"
echo "5. Selecione TODOS os arquivos desta pasta"
echo "6. Configure as variáveis de ambiente"
echo "7. Clique em 'Deploy'"
echo ""
echo "🔗 Link direto: https://vercel.com/new"
echo ""
echo "🚀 SEU DASHBOARD ESTÁ PRONTO PARA IR AO AR!"