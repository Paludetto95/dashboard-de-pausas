const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
const PORT = 3000; // A porta em que nosso proxy vai rodar

// Middleware para permitir que o painel (rodando em outra porta/origem) se comunique com este proxy
app.use(cors());
// Middleware para entender o corpo das requisições como JSON
app.use(express.json());

// O endpoint que o seu painel vai chamar
app.post('/api/dados-argus', async (req, res) => {
    const API_TOKEN = "woQzLP54uk5Y5HQ6TvFgNb4oNhLkso7CRPURLdICggKs160rnZMcm09JCGjp5Ae3"; // Seu token fica seguro aqui no backend
    const BASE_URL = "https://argus.app.br/apiargus/report/pausasdetalhadas";

    try {
        // Pega os parâmetros que o frontend enviou no corpo (body) da requisição
        const { idCampanha, periodoInicial, periodoFinal, ultimosMinutos } = req.body;
        
        const params = new URLSearchParams();

        if (idCampanha) params.append("idCampanha", idCampanha);
        
        if (ultimosMinutos) {
            params.append("ultimosMinutos", ultimosMinutos);
        } else if (periodoInicial && periodoFinal) {
            params.append("periodoInicial", periodoInicial);
            params.append("periodoFinal", periodoFinal);
        } else {
            // Se nenhum parâmetro de tempo for enviado, retorna um erro
            return res.status(400).json({ error: "É necessário fornecer 'ultimosMinutos' ou 'periodoInicial' e 'periodoFinal'." });
        }

        const fullUrl = `${BASE_URL}?${params.toString()}`;
        console.log(`[Proxy] Recebeu requisição. Chamando API da Argus: ${fullUrl}`);

        const apiResponse = await fetch(fullUrl, {
            method: 'GET',
            headers: {
                'Token-Signature': API_TOKEN,
                'Accept': 'application/json'
            }
        });
        
        // Pega a resposta da API da Argus (em formato JSON)
        const data = await apiResponse.json();

        // Se a resposta da Argus não foi 'OK' (ex: erro 403, 500), repassa o erro
        if (!apiResponse.ok) {
            console.error('[Proxy] Erro da API Argus:', data);
            return res.status(apiResponse.status).json(data);
        }

        // Se tudo deu certo, envia os dados de volta para o seu painel
        res.status(200).json(data);

    } catch (error) {
        console.error('[Proxy] Erro interno no servidor proxy:', error);
        res.status(500).json({ error: 'Falha ao se comunicar com a API da Argus.' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor Proxy rodando em http://localhost:${PORT}`);
    console.log('Seu painel HTML agora deve fazer requisições para este endereço.');
});