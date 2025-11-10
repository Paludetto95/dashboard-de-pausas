require('dotenv').config();
const express = require('express');
const cors = require('cors');
const handler = require('./api/dados-argus.mjs').default;
const geminiKeyHandler = require('./api/gemini-key.js');

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


app.post('/export-html', (req, res) => {
    const data = req.body;

    // Simple validation
    if (!Array.isArray(data)) {
        return res.status(400).send('Invalid data format. Expected an array.');
    }

    const tableHtml = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <title>Exportação de Dados de Pausa</title>
            <link href="https://unpkg.com/tabulator-tables@5.5.2/dist/css/tabulator_bootstrap5.min.css" rel="stylesheet">
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
            <style>
                body { font-family: sans-serif; margin: 20px; background-color: #f4f4f9; }
                h1 { color: #333; }
                #export-table { background-color: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            </style>
        </head>
        <body data-bs-theme="dark">
            <h1>Relatório de Pausas</h1>
            <p>Dados exportados em: ${new Date().toLocaleString('pt-BR')}</p>
            <div id="export-table"></div>

            <script type="text/javascript" src="https://unpkg.com/tabulator-tables@5.5.2/dist/js/tabulator.min.js"><\/script>
            <script>
                // Data embedded from server
                const tableData = ${JSON.stringify(data, null, 2)};

                // Functions needed for formatting, extracted from dash.html
                function formatDateTimeDisplay(dateStr) {
                    if (!dateStr) return '';
                    const date = new Date(dateStr);
                    return date.toLocaleString('pt-BR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
                }

                function formatMinutesToHHMMSS(totalMinutes) {
                    if (isNaN(totalMinutes) || totalMinutes < 0) return '00:00:00';
                    const hours = Math.floor(totalMinutes / 60);
                    const minutes = Math.floor(totalMinutes % 60);
                    const seconds = Math.round((totalMinutes - Math.floor(totalMinutes)) * 60);
                    return String(hours).padStart(2, '0') + ':' + String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');
                }

                // Initialize Tabulator
                new Tabulator("#export-table", {
                    data: tableData,
                    layout: "fitColumns",
                    placeholder: "Nenhum dado encontrado.",
                    columns: [
                        { title: "Consultor", field: "CONSULTOR" },
                        { title: "Tipo de Pausa", field: "TIPO" },
                        { title: "Data Início", field: "DATA_INICIO_OBJ", hozAlign: "center", formatter: (cell) => formatDateTimeDisplay(cell.getValue()) },
                        { title: "Duração (HH:MM:SS)", field: "DURACAO_MINUTES", hozAlign: "center", formatter: (cell) => formatMinutesToHHMMSS(cell.getValue()) },
                        { title: "Duração (Min)", field: "DURACAO_MINUTES", hozAlign: "right", formatter: (c) => c.getValue().toFixed(1) },
                    ],
                });
            <\/script>
        </body>
        </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', 'attachment; filename="relatorio_pausas.html"');
    res.send(tableHtml);
});

app.listen(PORT, () => {
    console.log(`Servidor Proxy rodando em http://localhost:${PORT}`);
    console.log('Seu painel HTML agora deve fazer requisições para este endereço.');
    console.log(`Servindo arquivos estáticos de: ${__dirname}`);
});

// Endpoint para obter a chave da API Gemini
app.options('/api/gemini-key', geminiKeyHandler);
app.get('/api/gemini-key', geminiKeyHandler);