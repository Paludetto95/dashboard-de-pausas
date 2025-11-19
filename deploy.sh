#!/bin/bash
# Deployment script for Dashboard de Pausas

echo "🚀 Preparando deploy do Dashboard de Pausas..."

# Verificar se todos os arquivos necessários existem
required_files=("server.js" "dash.html" "package.json" ".env" "api/dados-argus.js")
for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Arquivo necessário não encontrado: $file"
        exit 1
    fi
done

echo "✅ Todos os arquivos necessários encontrados"

# Criar arquivo de ambiente para produção se não existir
if [ ! -f ".env.production" ]; then
    echo "📝 Criando arquivo de ambiente de produção..."
    cp .env .env.production
    echo "✅ Arquivo .env.production criado"
fi

echo "📦 Projeto pronto para deploy!"
echo ""
echo "🎯 Próximos passos:"
echo "1. Faça upload dos arquivos para sua plataforma de hospedagem"
echo "2. Configure as variáveis de ambiente:"
echo "   - ARGUS_API_URL=https://argus.app.br/apiargus"
echo "   - ARGUS_API_TOKEN_GLOBAL=nahybptvaa25vyybq0fyoj8bqyahrlw52acotbquc8du1z033ezsvfn5nx0egxqz"
echo "   - ARGUS_CAMPAIGN_TOKENS={\"2\":\"nahybptvaa25vyybq0fyoj8bqyahrlw52acotbquc8du1z033ezsvfn5nx0egxqz\"}"
echo "3. Execute: npm install && npm start"
echo ""
echo "🌐 Plataformas recomendadas:"
echo "   - Railway: https://railway.app"
echo "   - Render: https://render.com"
echo "   - Cyclic: https://cyclic.sh"
echo "   - Vercel: https://vercel.com"
echo "   - Netlify: https://netlify.com"