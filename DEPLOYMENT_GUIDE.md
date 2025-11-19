# 🚀 Guia de Deploy - Dashboard de Pausas

## 📋 Status do Projeto
✅ **PRONTO PARA DEPLOY** - Todos os sistemas funcionando!

## 🎯 Opções de Deploy Recomendadas:

### 1️⃣ **Railway** (Mais Fácil - Recomendado)
```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Fazer login
railway login

# Criar novo projeto
railway init --name dashboard-pausas

# Adicionar variáveis de ambiente
railway variables set ARGUS_API_URL=https://argus.app.br/apiargus
railway variables set ARGUS_API_TOKEN_GLOBAL=nahybptvaa25vyybq0fyoj8bqyahrlw52acotbquc8du1z033ezsvfn5nx0egxqz
railway variables set ARGUS_CAMPAIGN_TOKENS='{"2":"nahybptvaa25vyybq0fyoj8bqyahrlw52acotbquc8du1z033ezsvfn5nx0egxqz"}'

# Fazer deploy
railway up
```

### 2️⃣ **Render** (Alternativa Fácil)
1. Acesse: https://render.com
2. Clique em "New Web Service"
3. Conecte seu GitHub ou faça upload do zip
4. Configure:
   - **Name**: dashboard-pausas
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Environment Variables**:
     ```
     ARGUS_API_URL=https://argus.app.br/apiargus
     ARGUS_API_TOKEN_GLOBAL=nahybptvaa25vyybq0fyoj8bqyahrlw52acotbquc8du1z033ezsvfn5nx0egxqz
     ARGUS_CAMPAIGN_TOKENS={"2":"nahybptvaa25vyybq0fyoj8bqyahrlw52acotbquc8du1z033ezsvfn5nx0egxqz"}
     ```

### 3️⃣ **Cyclic** (Gratuito e Simples)
1. Acesse: https://cyclic.sh
2. Faça upload do código ou conecte GitHub
3. Configure as variáveis de ambiente
4. Deploy automático

### 4️⃣ **Vercel** (Se preferir)
1. Acesse: https://vercel.com
2. Importe o repositório
3. Configure as variáveis de ambiente no painel
4. Deploy

## 📁 Arquivos do Projeto
```
dashboard-de-pausas/
├── server.js              # Servidor principal
├── dash.html              # Dashboard frontend
├── api/dados-argus.js     # API endpoint (Vercel)
├── netlify/functions/     # Funções Netlify
├── package.json           # Dependências
├── .env                   # Variáveis de ambiente
├── vercel.json           # Config Vercel
├── netlify.toml          # Config Netlify
└── railway.json          # Config Railway
```

## 🧪 Testar Localmente
```bash
npm install
npm start
# Acesse: http://localhost:3000/dash.html
```

## 🔧 Variáveis de Ambiente Necessárias:
```env
ARGUS_API_URL=https://argus.app.br/apiargus
ARGUS_API_TOKEN_GLOBAL=nahybptvaa25vyybq0fyoj8bqyahrlw52acotbquc8du1z033ezsvfn5nx0egxqz
ARGUS_CAMPAIGN_TOKENS={"2":"nahybptvaa25vyybq0fyoj8bqyahrlw52acotbquc8du1z033ezsvfn5nx0egxqz"}
```

## 📊 Funcionalidades do Dashboard:
✅ Visualização de pausas em tempo real
✅ Gráficos interativos com Chart.js
✅ Tabelas detalhadas com Tabulator
✅ Filtros por período e campanha
✅ Exportação de dados
✅ Design responsivo

## 🚀 Pronto para Produção!
Escolha uma das plataformas acima e seu dashboard estará online em minutos!