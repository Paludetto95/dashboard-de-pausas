
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

    // 2. Get token from environment variables
    const apiToken = process.env.ARGUS_API_TOKEN;
    if (!apiToken) {
        return res.status(500).json({ message: 'Token da API Argus (ARGUS_API_TOKEN) não configurado no servidor.' });
    }

    // 3. Get parameters from the frontend request body
    const { periodoInicial, periodoFinal, idCampanha, ultimosMinutos } = req.body;

    // Basic validation
    if (!ultimosMinutos && (!periodoInicial || !periodoFinal)) {
        return res.status(400).json({ message: 'Parâmetros insuficientes. Forneça ultimosMinutos ou periodoInicial/periodoFinal.' });
    }
    
    // 4. Construct the request body for the Argus API, respecting the exact keys from documentation
    const argusBody = {
        "idCampanha": idCampanha,
        "periodoInicial": periodoInicial,
        "periodoFinal": periodoFinal,
        "ultimosMinutos": ultimosMinutos
    };
    // Remove undefined keys
    Object.keys(argusBody).forEach(key => argusBody[key] === undefined && delete argusBody[key]);


    // 5. Call the Argus API
    try {
        const response = await fetch('https://argus.app.br/apiargus/report/pausasdetalhadas', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Token-Signature': apiToken
            },
            body: JSON.stringify(argusBody)
        });

        // 6. Handle the response from Argus
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
        
        // 7. Send the data back to the frontend
        return res.status(200).json(data);

    } catch (error) {
        console.error('Proxy Error:', error);
        return res.status(500).json({ message: 'Erro interno no servidor proxy.' });
    }
}
