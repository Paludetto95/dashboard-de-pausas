import fs from 'fs';
import path from 'path';

function toArgusDateTime(isoString) {
    if (!isoString) return undefined;
    const date = new Date(isoString);
    const pad = (num) => (num < 10 ? '0' + num : num);
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}


export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*'); // Allow any origin
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    // 1. Only allow POST requests
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    // 2. Configuração via variáveis de ambiente
    const ARGUS_API_URL = process.env.ARGUS_API_URL || 'https://argus.app.br/apiargus';
    // Prefer explicit global token, then generic ARGUS_API_TOKEN; if empty, fallback to .env file read
    let GLOBAL_TOKEN = String(
        (process.env.ARGUS_API_TOKEN_GLOBAL || process.env.ARGUS_API_TOKEN || '')
    ).trim();
    let CAMPAIGN_TOKENS = {};
    try {
        if (process.env.ARGUS_CAMPAIGN_TOKENS) {
            CAMPAIGN_TOKENS = JSON.parse(process.env.ARGUS_CAMPAIGN_TOKENS);
        }
    } catch (e) {
        console.warn('[Argus] ARGUS_CAMPAIGN_TOKENS inválido. Use JSON com ids como chaves.');
    }
    const hasCampaignTokensEnv = !!process.env.ARGUS_CAMPAIGN_TOKENS;

    // Fallback: tentar ler .env diretamente se variáveis de ambiente não foram injetadas
    if (!GLOBAL_TOKEN || GLOBAL_TOKEN.length === 0) {
        try {
            const envPath = path.join(process.cwd(), '.env');
            if (fs.existsSync(envPath)) {
                const envText = fs.readFileSync(envPath, 'utf8');
                const lines = envText.split(/\r?\n/);
                const kv = {};
                for (const line of lines) {
                    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
                    if (m) kv[m[1]] = m[2];
                }
                const fallbackGlobal = String((kv.ARGUS_API_TOKEN_GLOBAL || kv.ARGUS_API_TOKEN || '')).trim();
                if (fallbackGlobal) GLOBAL_TOKEN = fallbackGlobal;
                if (!hasCampaignTokensEnv && kv.ARGUS_CAMPAIGN_TOKENS) {
                    try { CAMPAIGN_TOKENS = JSON.parse(kv.ARGUS_CAMPAIGN_TOKENS); } catch {}
                }
                console.log('[Argus] Fallback .env aplicado:', { globalTokenLen: GLOBAL_TOKEN.length, campaignKeys: Object.keys(CAMPAIGN_TOKENS || {}) });
            }
        } catch (e) {
            console.warn('[Argus] Falha ao ler .env como fallback:', e?.message || e);
        }
    }

    const hasGlobalTokenEnv = GLOBAL_TOKEN.length > 0;
    console.log('[Argus] Env check:', { hasGlobalTokenEnv, hasCampaignTokensEnv, globalTokenLen: GLOBAL_TOKEN.length, campaignKeys: Object.keys(CAMPAIGN_TOKENS || {}) });

    // 3. Get parameters from the frontend request body
    const { periodoInicial, periodoFinal, idCampanha, ultimosMinutos } = req.body || {};
    console.log('[Argus] Request body received:', { periodoInicial, periodoFinal, idCampanha, ultimosMinutos });

    function parseAndFormatDateTime(dateTimeStr) {
        if (!dateTimeStr || typeof dateTimeStr !== 'string') return undefined;
        // Accept BR format: DD/MM/YYYY HH:mm:ss
        let m = dateTimeStr.match(/^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2})$/);
        if (m) {
            return `${m[3]}-${m[2]}-${m[1]} ${m[4]}:${m[5]}:${m[6]}`;
        }
        // Accept ISO with space: YYYY-MM-DD HH:mm:ss
        m = dateTimeStr.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/);
        if (m) {
            return `${m[1]}-${m[2]}-${m[3]} ${m[4]}:${m[5]}:${m[6]}`;
        }
        // Accept ISO with 'T': YYYY-MM-DDTHH:mm:ss
        m = dateTimeStr.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/);
        if (m) {
            return `${m[1]}-${m[2]}-${m[3]} ${m[4]}:${m[5]}:${m[6]}`;
        }
        return undefined;
    }

    // 4. Construct the request body for the Argus API
    const argusBody = {};

    const numUltimosMinutos = ultimosMinutos ? parseInt(ultimosMinutos, 10) : 0;
    const numIdCampanha = idCampanha ? parseInt(idCampanha, 10) : 0;

    if (numUltimosMinutos > 0) {
        // Clamp: 1 minuto até 90 dias
        const maxMinutes = 90 * 24 * 60; // 129600
        const clamped = Math.min(Math.max(numUltimosMinutos, 1), maxMinutes);
        argusBody.ultimosMinutos = clamped;
    } else if (periodoInicial && periodoFinal) {
        const pi = parseAndFormatDateTime(periodoInicial);
        const pf = parseAndFormatDateTime(periodoFinal);
        if (pi && pf) {
            argusBody.periodoInicial = pi;
            argusBody.periodoFinal = pf;

            // Clamp do período: máximo 90 dias
            try {
                const toIso = (s) => s.replace(' ', 'T') + 'Z';
                const start = new Date(toIso(argusBody.periodoInicial));
                const end = new Date(toIso(argusBody.periodoFinal));
                if (!isNaN(start) && !isNaN(end)) {
                    const msDiff = end - start;
                    const maxMs = 90 * 24 * 60 * 60 * 1000;
                    if (msDiff > maxMs) {
                        const newStart = new Date(end.getTime() - maxMs);
                        const pad = (n) => (n < 10 ? '0' + n : n);
                        const clampedPi = `${newStart.getFullYear()}-${pad(newStart.getMonth() + 1)}-${pad(newStart.getDate())} ${pad(newStart.getHours())}:${pad(newStart.getMinutes())}:${pad(newStart.getSeconds())}`;
                        argusBody.periodoInicial = clampedPi;
                        console.log('[Argus] Período >90d; reduzido:', { periodoInicial: argusBody.periodoInicial, periodoFinal: argusBody.periodoFinal });
                    }
                }
            } catch (e) {
                // Se falhar o clamp, mantém como está
            }
        } else {
            // Fallback se o formato não foi reconhecido
            argusBody.ultimosMinutos = 1440;
        }
    } else {
        // Fallback padrão quando período não informado
        argusBody.ultimosMinutos = 1440;
    }

    if (numIdCampanha > 0) {
        argusBody.idCampanha = numIdCampanha;
    }

    // Remove undefined keys e strings vazias
    Object.keys(argusBody).forEach((key) => {
        const v = argusBody[key];
        if (v === undefined || v === null || (typeof v === 'string' && v.trim() === '')) {
            delete argusBody[key];
        }
    });
    if (!argusBody.ultimosMinutos && (!argusBody.periodoInicial || !argusBody.periodoFinal)) {
        argusBody.ultimosMinutos = 1440;
    }


    // 5. Seleciona o token conforme a campanha (se fornecida)
    let tokenToUse = GLOBAL_TOKEN;
    const hasGlobal = GLOBAL_TOKEN.length > 0;
    const campaignToken = (numIdCampanha > 0 && CAMPAIGN_TOKENS) ? CAMPAIGN_TOKENS[numIdCampanha] : undefined;
    const hasCampaignForId = !!(campaignToken && String(campaignToken).trim());
    if (hasCampaignForId) tokenToUse = campaignToken;
    if (!tokenToUse || !String(tokenToUse).trim()) {
        return res.status(500).json({
            message: 'Token da API Argus não configurado. Defina ARGUS_API_TOKEN_GLOBAL ou ARGUS_CAMPAIGN_TOKENS.',
            details: {
                hasGlobalToken: hasGlobal,
                hasCampaignTokensEnv: !!process.env.ARGUS_CAMPAIGN_TOKENS,
                idCampanhaRecebido: numIdCampanha || null,
                hasTokenForIdCampanha: hasCampaignForId,
                globalTokenLen: GLOBAL_TOKEN.length || 0,
                campaignKeys: Object.keys(CAMPAIGN_TOKENS || {})
            }
        });
    }

    // 6. Chama a API Argus
    try {
        const response = await fetch(`${ARGUS_API_URL.replace(/\/$/, '')}/report/pausasdetalhadas`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Token-Signature': tokenToUse
            },
            body: JSON.stringify(argusBody)
        });

        // 7. Handle the response from Argus
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Argus API Error:', errorText);
            // Try to parse the error as JSON, but fall back to plain text if it fails.
            let errorJson = {};
            try {
                errorJson = JSON.parse(errorText);
            } catch (e) {
                // Not a JSON error, send the raw text.
                return res.status(response.status).json({ message: `Erro da API Argus: ${errorText}` });
            }
            // If it is JSON, send the message from it, or the whole object.
            return res.status(response.status).json({ message: `Erro da API Argus: ${errorJson.message || errorText}` });
        }

        const data = await response.json();
        
        // 8. Check if data is empty
        if (!data || (Array.isArray(data) && data.length === 0)) {
            return res.status(404).json({ message: 'Nenhum registro de pausa encontrado para os filtros informados. Tente ajustar o período ou os filtros de busca.' });
        }
        
        // 9. Send the data back to the frontend
        return res.status(200).json(data);

    } catch (error) {
        console.error('Proxy Error:', error);
        return res.status(500).json({ message: 'Erro interno no servidor proxy.' });
    }
}