# 🚀 DEPLOY VERCEL - MÉTODO DIRETO

## 📋 Passo a Passo para Deploy no Vercel:

### 1️⃣ **Preparar os Arquivos**
Todos os arquivos já estão prontos e configurados:
- ✅ `api/dados-argus.js` - API endpoint
- ✅ `vercel.json` - Configuração Vercel  
- ✅ `package.json` - Dependências
- ✅ `dash.html` - Frontend
- ✅ `server.js` - Backend alternativo

### 2️⃣ **Acessar Vercel**
- Vá para: https://vercel.com
- Faça login com GitHub, GitLab ou conta

### 3️⃣ **Criar Novo Projeto**
- Clique em "New Project"
- Escolha uma opção:
  - **Import Git Repository** (se tiver GitHub)
  - **Upload** (para upload direto dos arquivos)

### 4️⃣ **Configurar Variáveis de Ambiente**
No painel do Vercel, adicione estas variáveis:
```
ARGUS_API_URL=https://argus.app.br/apiargus
ARGUS_API_TOKEN_GLOBAL=nahybptvaa25vyybq0fyoj8bqyahrlw52acotbquc8du1z033ezsvfn5nx0egxqz
ARGUS_CAMPAIGN_TOKENS={"2":"nahybptvaa25vyybq0fyoj8bqyahrlw52acotbquc8du1z033ezsvfn5nx0egxqz"}
```

### 5️⃣ **Deploy**
- Clique em "Deploy"
- Aguarde 2-3 minutos
- 🎉 **SEU DASHBOARD ESTARÁ ONLINE!**

### 6️⃣ **Verificar**
- URL será algo como: `https://seu-projeto.vercel.app`
- Acesse: `https://seu-projeto.vercel.app/dash.html`
- Teste a API: `https://seu-projeto.vercel.app/api/dados-argus`

## 🎯 **Arquivos de Configuração Vercel:**

### `vercel.json`:
```json
{
  "version": 2,
  "routes": [
    { "src": "/api/dados-argus", "dest": "/api/dados-argus.js" },
    { "src": "/(.*)", "dest": "/dash.html" }
  ]
}
```

### `api/dados-argus.js`:
- Endpoint serverless para Vercel
- Integração completa com API Argus
- Suporte GET e POST
- CORS habilitado

## 📊 **Funcionalidades Confirmadas:**
✅ Dashboard com gráficos interativos
✅ Tabelas de dados detalhadas  
✅ Filtros por período e campanha
✅ Integração Argus API funcionando
✅ Design responsivo
✅ Exportação de dados

## 🚀 **PRONTO PARA DEPLOY!**

**Escolha seu método preferido:**
1. **Vercel** (Recomendado) - https://vercel.com
2. **Railway** - https://railway.app  
3. **Render** - https://render.com
4. **Netlify** - https://netlify.com

Seu dashboard de pausas está 100% funcional e pronto para produção! 🎉