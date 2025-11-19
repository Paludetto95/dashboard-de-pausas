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
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // Lida com requisições preflight (OPTIONS)
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Permite requisições GET e POST
    if (req.method !== 'GET' && req.method !== 'POST') {
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    // 2. Coleta de Configurações de Token
    const ARGUS_API_URL = process.env.ARGUS_API_URL || 'https://argus.app.br/apiargus';
    const GLOBAL_TOKEN = String(
        (process.env.ARGUS_API_TOKEN_GLOBAL || process.env.ARGUS_API_TOKEN || '')
    ).trim();
    let CAMPAIGN_TOKENS = {};
    try {
        if (process.env.ARGUS_CAMPAIGN_TOKENS) {
            CAMPAIGN_TOKENS = JSON.parse(process.env.ARGUS_CAMPAIGN_TOKENS);
        }
    } catch (e) {
        console.warn('[Argus] ARGUS_CAMPAIGN_TOKENS inválido ou não definido. Usando objeto vazio.');
    }

    // 3. Coleta de Parâmetros de Filtro
    const params = req.method === 'GET' ? (req.query || {}) : (req.body || {});
    
    const { periodoInicial, periodoFinal, idCampanha, ultimosMinutos } = params;
    
    // Converte para tipos esperados
    const numUltimosMinutos = ultimosMinutos ? parseInt(String(ultimosMinutos), 10) : 0;
    const numIdCampanha = idCampanha ? parseInt(String(idCampanha), 10) : 0;

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
    
    // Validação de datas
    if (piFormatted && pfFormatted) {
        const startDate = new Date(piFormatted.replace(' ', 'T'));
        const endDate = new Date(pfFormatted.replace(' ', 'T'));
        if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime()) && endDate >= startDate) {
            const diffInMs = endDate - startDate;
            const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
            if (diffInDays <= MAX_DAYS) {
                isDateRangeValid = true;
                argusBody.periodoInicial = piFormatted;
                argusBody.periodoFinal = pfFormatted;
            } else {
                return res.status(400).json({
                    message: `Período muito longo. Máximo permitido: ${MAX_DAYS} dias.`,
                });
            }
        }
    }
    
    // Se não houver datas válidas, usa ultimosMinutos
    if (!isDateRangeValid) {
        const minutes = numUltimosMinutos > 0 ? numUltimosMinutos : DEFAULT_MINUTES;
        if (minutes > MAX_MINUTES) {
            return res.status(400).json({
                message: `Período muito longo. Máximo permitido: ${MAX_MINUTES} minutos (${MAX_DAYS} dias).`,
            });
        }
        argusBody.ultimosMinutos = minutes;
    }
    
    // Adiciona idCampanha se fornecido
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

    // 6. Chama a API Argus (É um POST, mesmo que o proxy receba um GET)
    try {
        const url = `${ARGUS_API_URL}/pausasdetalhadas`;
        console.log(`[Argus] Chamando: ${url}`);
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${tokenToUse}`
            },
            body: JSON.stringify(argusBody)
        });

        const responseText = await response.text();
        let data;
        
        try {
            data = JSON.parse(responseText);
        } catch (parseError) {
            console.error('[Argus] Erro ao fazer parse do JSON:', parseError);
            return res.status(response.status).json({
                message: `Erro de formato da API Argus: Resposta não é JSON ou está malformada. Status: ${response.status}`,
                details: responseText
            });
        }
        
        // A Argus usa codStatus = 1 para sucesso, mesmo que HTTP 200
        if (!response.ok || data.codStatus !== 1) {
            const statusToUse = response.status !== 200 ? response.status : 400; 
            return res.status(statusToUse).json({ 
                message: `Erro da API Argus: ${data.descStatus || `Status Code ${statusToUse}`}`,
                details: data
            });
        }
        
        // 7. Checa se o resultado está vazio
        if (!data.pausasDetalhadas || data.pausasDetalhadas.length === 0) {
            return res.status(404).json({ message: 'Nenhum registro de pausa encontrado para os filtros informados. Tente ajustar o período ou os filtros de busca.' });
        }

        // 8. Extrai e envia a lista de pausas detalhadas de volta para o frontend
        return res.status(200).json(data.pausasDetalhadas);

    } catch (error) {
        console.error('Proxy Error (Falha no Fetch):', error);
        return res.status(500).json({ message: 'Erro interno no servidor proxy. Falha na comunicação com a API Argus.' });
    }
}