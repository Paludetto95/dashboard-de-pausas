const fetch = require('node-fetch');

// Environment variables will be loaded from Netlify environment
const ARGUS_API_URL = process.env.ARGUS_API_URL || 'https://argus.app.br/apiargus';
const ARGUS_API_TOKEN_GLOBAL = process.env.ARGUS_API_TOKEN_GLOBAL;
const ARGUS_CAMPAIGN_TOKENS = process.env.ARGUS_CAMPAIGN_TOKENS;

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  // Handle OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    console.log('[Netlify] Request received:', event.httpMethod, event.path);
    
    // Parse body for POST requests
    let params = {};
    if (event.httpMethod === 'POST' && event.body) {
      params = JSON.parse(event.body);
    } else if (event.httpMethod === 'GET' && event.queryStringParameters) {
      params = event.queryStringParameters;
    }
    
    console.log('[Netlify] Parameters:', params);

    // Validate required parameters
    if (!params || (!params.ultimosMinutos && !params.periodoInicial)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          message: 'Parâmetros inválidos. Forneça ultimosMinutos ou periodoInicial/periodoFinal.' 
        })
      };
    }

    // Determine token to use
    let tokenToUse = ARGUS_API_TOKEN_GLOBAL;
    
    // Check if campaign-specific token should be used
    if (params.idCampanha && ARGUS_CAMPAIGN_TOKENS) {
      try {
        const campaignTokens = JSON.parse(ARGUS_CAMPAIGN_TOKENS);
        if (campaignTokens[params.idCampanha]) {
          tokenToUse = campaignTokens[params.idCampanha];
          console.log('[Netlify] Using campaign-specific token for campaign', params.idCampanha);
        }
      } catch (e) {
        console.log('[Netlify] Failed to parse campaign tokens, using global token');
      }
    }

    if (!tokenToUse) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          message: 'Token de API não configurado. Configure ARGUS_API_TOKEN_GLOBAL ou ARGUS_CAMPAIGN_TOKENS.' 
        })
      };
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
    console.log('[Netlify] Calling Argus API:', url);
    console.log('[Netlify] Request body:', argusBody);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Token-Signature': tokenToUse
      },
      body: JSON.stringify(argusBody)
    });

    const responseText = await response.text();
    console.log('[Netlify] Argus API response status:', response.status);
    
    if (!response.ok) {
      console.error('[Netlify] Argus API error:', responseText);
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ 
          message: `Erro na API Argus: ${responseText}` 
        })
      };
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('[Netlify] Failed to parse Argus response:', responseText);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          message: 'Resposta inválida da API Argus' 
        })
      };
    }

    // Return data in expected format
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        pausasDetalhadas: data.pausasDetalhadas || []
      })
    };

  } catch (error) {
    console.error('[Netlify] Server error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        message: 'Erro interno do servidor',
        error: error.message 
      })
    };
  }
};