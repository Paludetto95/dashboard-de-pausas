require('dotenv').config();
const express = require('express');
const cors = require('cors');
const handler = require('./api/dados-argus.mjs').default;

const app = express();
const PORT = 3000; // A porta em que nosso proxy vai rodar

// Middleware para permitir que o painel (rodando em outra porta/origem) se comunique com este proxy
app.use(cors());
// Middleware para entender o corpo das requisições como JSON
app.use(express.json());

app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/dash.html');
});

// O endpoint que o seu painel vai chamar
app.post('/api/dados-argus', async (req, res) => {
    console.log('[Proxy] Requisição recebida para /api/dados-argus');
    try {
        await handler(req, res);
    } catch (error) {
        console.error('[Proxy] Erro ao processar requisição da API Argus:', error);
        res.status(500).json({ message: 'Erro interno no servidor proxy ao processar a requisição da API Argus.' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor Proxy rodando em http://localhost:${PORT}`);
    console.log('Seu painel HTML agora deve fazer requisições para este endereço.');
    console.log(`Servindo arquivos estáticos de: ${__dirname}`);
});