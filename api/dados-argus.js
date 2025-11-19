const fetch = require('node-fetch');

// Environment variables will be loaded from Vercel environment
const ARGUS_API_URL = process.env.ARGUS_API_URL || 'https://argus.app.br/apiargus';
const ARGUS_API_TOKEN_GLOBAL = process.env.ARGUS_API_TOKEN_GLOBAL;
const ARGUS_CAMPAIGN_TOKENS = process.env.ARGUS_CAMPAIGN_TOKENS;

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    console.log('[Vercel] Request received:', req.method, req.url);
    
    // Get parameters from query or body
    const params = req.method === 'GET' ? req.query : req.body;
    console.log('[Vercel] Parameters:', params);

    // Validate required parameters
    if (!params || (!params.ultimosMinutos && !params.periodoInicial)) {
      return res.status(400).json({ 
        message: 'Parâmetros inválidos. Forneça ultimosMinutos ou periodoInicial/periodoFinal.' 
      });
    }

    // Determine token to use
    let tokenToUse = ARGUS_API_TOKEN_GLOBAL;
    
    // Check if campaign-specific token should be used
    if (params.idCampanha && ARGUS_CAMPAIGN_TOKENS) {
      try {
        const campaignTokens = JSON.parse(ARGUS_CAMPAIGN_TOKENS);
        if (campaignTokens[params.idCampanha]) {
          tokenToUse = campaignTokens[params.idCampanha];
          console.log('[Vercel] Using campaign-specific token for campaign', params.idCampanha);
        }
      } catch (e) {
        console.log('[Vercel] Failed to parse campaign tokens, using global token');
      }
    }

    if (!tokenToUse) {
      return res.status(500).json({ 
        message: 'Token de API não configurado. Configure ARGUS_API_TOKEN_GLOBAL ou ARGUS_CAMPAIGN_TOKENS.' 
      });
    }

    // Build request body for Argus API
    const argusBody = {};
    if (params.ultimosMinutos) {
      argusBody.ultimosMinutos = parseInt(params.ultimosMinutos, 10);
    }
    if (params.periodoInicial) {
      argusBody.periodoInicial = params.periodoInicial;
    }
    if (params.periodoFinal) {
      argusBody.periodoFinal = params.periodoFinal;
    }
    if (params.idCampanha) {
      argusBody.idCampanha = parseInt(params.idCampanha, 10);
    }

    // Call Argus API
    const url = `${ARGUS_API_URL}/report/pausasdetalhadas`;
    console.log('[Vercel] Calling Argus API:', url);
    console.log('[Vercel] Request body:', argusBody);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Token-Signature': tokenToUse
      },
      body: JSON.stringify(argusBody)
    });

    const responseText = await response.text();
    console.log('[Vercel] Argus API response status:', response.status);
    
    if (!response.ok) {
      console.error('[Vercel] Argus API error:', responseText);
      return res.status(response.status).json({ 
        message: `Erro na API Argus: ${responseText}` 
      });
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('[Vercel] Failed to parse Argus response:', responseText);
      return res.status(500).json({ 
        message: 'Resposta inválida da API Argus' 
      });
    }

    // Return data in expected format
    return res.status(200).json({
      pausasDetalhadas: data.pausasDetalhadas || []
    });

  } catch (error) {
    console.error('[Vercel] Server error:', error);
    return res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
};