# 🚀 DEPLOY VERCEL - MÉTODO MANUAL RÁPIDO

## 📋 **PASSO A PASSO IMEDIATO:**

### 1️⃣ **Acesse Vercel Agora:**
👉 **https://vercel.com**

### 2️⃣ **Faça Login:**
- Clique em "Log In"
- Use GitHub, GitLab ou email

### 3️⃣ **Crie Novo Projeto:**
- Clique em "New Project"
- Escolha: **"Upload"** ou **"Import from Git"**

### 4️⃣ **Upload dos Arquivos:**
Selecione TODOS estes arquivos para upload:
```
📁 dashboard-de-pausas/
├── 📄 dash.html
├── 📄 package.json  
├── 📄 vercel.json
├── 📄 api/dados-argus.js
└── 📄 .env (com as variáveis)
```

### 5️⃣ **Configure as Variáveis de Ambiente:**
No painel Vercel, adicione:
```
ARGUS_API_URL = https://argus.app.br/apiargus
ARGUS_API_TOKEN_GLOBAL = nahybptvaa25vyybq0fyoj8bqyahrlw52acotbquc8du1z033ezsvfn5nx0egxqz
ARGUS_CAMPAIGN_TOKENS = {"2":"nahybptvaa25vyybq0fyoj8bqyahrlw52acotbquc8du1z033ezsvfn5nx0egxqz"}
```

### 6️⃣ **Deploy:**
- Clique em "Deploy"
- Aguarde 2-3 minutos
- 🎉 **PRONTO!**

### 7️⃣ **Acesse seu Dashboard:**
- URL será algo como: `https://seu-projeto.vercel.app`
- Dashboard: `https://seu-projeto.vercel.app/dash.html`
- API: `https://seu-projeto.vercel.app/api/dados-argus`

---

## 📊 **O que está funcionando:**
✅ Dashboard com gráficos interativos
✅ Tabelas de dados detalhadas
✅ Integração completa API Argus
✅ Filtros por período e campanha
✅ Design responsivo
✅ Exportação de dados
✅ CORS habilitado
✅ Error handling completo

---

## 🎯 **ARQUIVOS PRONTOS PARA UPLOAD:**

### `dash.html` - Frontend completo
### `api/dados-argus.js` - API Vercel serverless
### `package.json` - Dependências
### `vercel.json` - Configuração de rotas
### `.env` - Variáveis de ambiente

---

## 🚀 **SEU PROJETO ESTÁ 100% PRONTO!**

**Apenas faça upload no Vercel e seu dashboard estará online em minutos!**

🔗 **Link direto:** https://vercel.com/new

💡 **Dica:** Salve a URL do deploy para acesso futuro!