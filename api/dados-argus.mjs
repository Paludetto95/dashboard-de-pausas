import fs from 'fs'; 
import path from 'path';

/**
 * Converte um DateTime ISO-like ou BR para o formato Argus (YYYY-MM-DD HH:mm:ss).
 *
 * @param {string} dateTimeStr - String de data/hora no formato ISO, ISO-T ou DD/MM/YYYY HH:mm:ss.
 * @returns {string|undefined} Data/hora formatada ou undefined.
 */
function parseAndFormatDateTime(dateTimeStr) {
    if (!dateTimeStr || typeof dateTimeStr !== 'string') return undefined;

    const formats = [
        // Formato BR: DD/MM/YYYY HH:mm:ss
        /^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2})$/,
        // Formato ISO-like: YYYY-MM-DD HH:mm:ss
        /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/,
        // Formato ISO-T: YYYY-MM-DDTHH:mm:ss (ignora 'Z' ou offset)
        /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(Z|\.\d+Z?|[\+\-]\d{2}:\d{2})?$/
    ];

    for (const regex of formats) {
        const m = dateTimeStr.match(regex);
        if (m) {
            // Ajusta índices com base nos grupos de captura para o formato 'YYYY-MM-DD HH:mm:ss'
            const isBR = m[0].includes('/');
            const [year, month, day, hours, minutes, seconds] = isBR
                ? [m[3], m[2], m[1], m[4], m[5], m[6]] // DD/MM/YYYY
                : [m[1], m[2], m[3], m[4], m[5], m[6]]; // YYYY-MM-DD

            // Retorna no formato Argus: YYYY-MM-DD HH:mm:ss
            return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        }
    }
    return undefined;
}


export default async function handler(req, res) {
    // 1. Configurações de CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*'); 
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // Lida com requisições preflight (OPTIONS)
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Apenas permite requisições GET ou POST
    if (req.method !== 'POST' && req.method !== 'GET') {
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    // 2. Coleta de Configurações de Token (mantendo a lógica simplificada)
    const ARGUS_API_URL = process.env.ARGUS_API_URL || 'https://argus.app.br/apiargus';
    const GLOBAL_TOKEN = String(
        (process.env.ARGUS_API_TOKEN_GLOBAL || process.env.ARGUS_API_TOKEN || '')
    ).trim();
    let CAMPAIGN_TOKENS = {};
    try {
        if (process.env.ARGUS_CAMPAIGN_TOKENS) {
            // Assume que o valor da variável de ambiente é um JSON string
            CAMPAIGN_TOKENS = JSON.parse(process.env.ARGUS_CAMPAIGN_TOKENS);
        }
    } catch (e) {
        console.warn('[Argus] ARGUS_CAMPAIGN_TOKENS inválido ou não definido. Usando objeto vazio.');
    }

    // 3. Coleta de Parâmetros de Filtro (Priorizando Query Params para GET/POST)
    // Coleta a partir de req.query (GET) ou req.body (POST)
    const params = (req.method === 'GET') ? req.query : req.body;
    
    const { periodoInicial, periodoFinal, idCampanha, ultimosMinutos } = params || {};
    
    // Converte para tipos esperados
    const numUltimosMinutos = ultimosMinutos ? parseInt(ultimosMinutos, 10) : 0;
    const numIdCampanha = idCampanha ? parseInt(idCampanha, 10) : 0;

    // 4. Construção do Corpo da Requisição para a API Argus
    const argusBody = {};
    const MAX_DAYS = 90;
    const DEFAULT_MINUTES = 1440; // 24 horas
    const MAX_MINUTES = MAX_DAYS * 24 * 60; 
    
    let isDateRangeValid = false;
    let piFormatted = undefined;
    let pfFormatted = undefined;
    
    // Tenta usar periodoInicial e periodoFinal
    if (periodoInicial && periodoFinal) {
        piFormatted = parseAndFormatDateTime(String(periodoInicial).trim());
        pfFormatted = parseAndFormatDateTime(String(periodoFinal).trim());
    }

    if (numUltimosMinutos > 0) {
        // Opção 1: Usar ultimosMinutos
        argusBody.ultimosMinutos = Math.min(Math.max(numUltimosMinutos, 1), MAX_MINUTES);
    } else if (piFormatted && pfFormatted) {
        // Opção 2: Usar periodoInicial e periodoFinal com validação
        argusBody.periodoInicial = piFormatted;
        argusBody.periodoFinal = pfFormatted;

        try {
            const toDateStr = (s) => s.replace(' ', 'T') + 'Z';
            const start = new Date(toDateStr(argusBody.periodoInicial));
            const end = new Date(toDateStr(argusBody.periodoFinal));

            if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && start.getTime() < end.getTime()) {
                const msDiff = end.getTime() - start.getTime();
                const maxMs = MAX_MINUTES * 60 * 1000;

                if (msDiff > maxMs) {
                    // Limita o período a 90 dias
                    const newStart = new Date(end.getTime() - maxMs);
                    const pad = (n) => (n < 10 ? '0' + n : n);
                    argusBody.periodoInicial = `${newStart.getFullYear()}-${pad(newStart.getMonth() + 1)}-${pad(newStart.getDate())} ${pad(newStart.getHours())}:${pad(newStart.getMinutes())}:${pad(newStart.getSeconds())}`;
                    console.log(`[Argus] Período >${MAX_DAYS}d; reduzido para:`, { periodoInicial: argusBody.periodoInicial, periodoFinal: argusBody.periodoFinal });
                }
                isDateRangeValid = true;
            }
        } catch (e) {
            console.error('[Argus] Erro de validação de data, reverter para padrão.', e);
        }
    }
    
    // Opção 3: Se nenhuma das opções acima funcionar, usa o padrão de 24 horas.
    if (!argusBody.ultimosMinutos && !isDateRangeValid) {
        argusBody.ultimosMinutos = DEFAULT_MINUTES;
    }
    
    // Adiciona o idCampanha se for válido
    if (numIdCampanha > 0) {
        argusBody.idCampanha = numIdCampanha;
    }

    console.log('[Argus] Corpo final para pausasdetalhadas:', argusBody);
    
    // 5. Seleciona o token e valida
    let tokenToUse = GLOBAL_TOKEN;
    const hasGlobal = GLOBAL_TOKEN.length > 0;
    const campaignToken = (numIdCampanha > 0 && CAMPAIGN_TOKENS) ? CAMPAIGN_TOKENS[numIdCampanha] : undefined;
    const hasTokenForIdCampanha = !!(campaignToken && String(campaignToken).trim());
    if (hasTokenForIdCampanha) {
        tokenToUse = String(campaignToken).trim();
    }

    if (!tokenToUse) {
        return res.status(500).json({
            message: 'Token da API Argus não configurado. Defina ARGUS_API_TOKEN_GLOBAL ou ARGUS_CAMPAIGN_TOKENS no seu ambiente.',
        });
    }

    // 6. Chama a API Argus
    try {
        // A API Argus sempre espera um POST, mesmo que os parâmetros venham via GET/Query String no proxy
        const response = await fetch(`${ARGUS_API_URL.replace(/\/$/, '')}/report/pausasdetalhadas`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Token-Signature': tokenToUse
            },
            body: JSON.stringify(argusBody)
        });

        // 7. Processa a resposta da Argus
        const responseText = await response.text();
        let data = null;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            // Se a API não retornar JSON, tratamos como erro
            return res.status(response.status).json({
                message: `Erro de formato da API Argus: Resposta não é JSON ou está malformada. Status: ${response.status}`,
                details: responseText // Retorna o texto bruto para depuração
            });
        }
        
        if (!response.ok || data.codStatus !== 1) {
             // Tratamento de erro específico se o status HTTP for 200, mas codStatus for falha
            const statusToUse = response.status !== 200 ? response.status : 400; // Use 400 se for erro interno reportado no JSON com 200
            return res.status(statusToUse).json({ 
                message: `Erro da API Argus: ${data.descStatus || `Status Code ${statusToUse}`}`,
                details: data
            });
        }
        
        // 8. Checa se o resultado está vazio
        if (!data.pausasDetalhadas || data.pausasDetalhadas.length === 0) {
            return res.status(404).json({ message: 'Nenhum registro de pausa encontrado para os filtros informados. Tente ajustar o período ou os filtros de busca.' });
        }

        // 9. Extrai e envia a lista de pausas detalhadas de volta para o frontend
        // O frontend espera apenas a lista de dados brutos
        return res.status(200).json(data.pausasDetalhadas);

    } catch (error) {
        console.error('Proxy Error (Falha no Fetch):', error);
        return res.status(500).json({ message: 'Erro interno no servidor proxy. Falha na comunicação com a API Argus.' });
    }
}
```

### Contextualização e Resumo das Alterações:

A principal mudança está no passo 3 da função `handler` em `api/dados-argus.mjs`:

**Lógica de Coleta de Parâmetros:**
O código agora suporta o método `GET` (parâmetros na URL, via `req.query`) e `POST` (parâmetros no corpo JSON, via `req.body`). Ele coleta todos os filtros ( `idCampanha`, `periodoInicial`, `periodoFinal`, `ultimosMinutos`) e os consolida na variável `params`.

**Lógica de Negócios (Filtros):**
1.  **Prioridade:** Se `ultimosMinutos` for fornecido e for um número positivo, ele será usado.
2.  **Alternativa:** Se não for fornecido, ele tentará usar o par `periodoInicial` e `periodoFinal`.
3.  **Validação de Data:** A data será formatada para o padrão `YYYY-MM-DD HH:mm:ss` (exigido pela Argus). O limite de 90 dias é aplicado, ajustando automaticamente o `periodoInicial` se o intervalo for muito grande, para evitar erros na API de destino.
4.  **Padrão:** Se nenhum filtro válido for encontrado, o `ultimosMinutos` será definido como 1440 (24 horas) para garantir que alguma pausa seja retornada (se houver).

**Formato de Saída:**
O novo código garante que, em caso de sucesso, ele extraia apenas o array `pausasDetalhadas` (`data.pausasDetalhadas`) e o retorne com `res.status(200).json(...)`. Isso simplifica o consumo no seu frontend, que antes precisava iterar sobre a resposta completa.

Você pode agora usar tanto requisições `POST` com JSON no corpo quanto requisições `GET` com parâmetros de consulta para o seu endpoint `/api/dados-argus`. Por exemplo:

**Via GET (Exemplo):**
```
GET /api/dados-argus?idCampanha=1&ultimosMinutos=60
```
ou
```
GET /api/dados-argus?periodoInicial=01/01/2025%2010:00:00&periodoFinal=01/01/2025%2012:00:00
```

**Via POST (Exemplo):**
```json
{
  "idCampanha": 1,
  "ultimosMinutos": 60
}