
export default async function handler(req, res) {
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
    
    // 4. Construct the request body for the Argus API
    const argusBody = {
        idCampanha,
        periodoInicial,
        periodoFinal,
        ultimosMinutos
    };
    // Remove undefined keys
    Object.keys(argusBody).forEach(key => argusBody[key] === undefined && delete argusBody[key]);


    // 5. Call the Argus API
    try {
        const response = await fetch('https://argus.app.br/apiargus/report/pausasdetalhadas', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Assuming Bearer token authentication
                'Authorization': `Bearer ${apiToken}`
            },
            body: JSON.stringify(argusBody)
        });

        // 6. Handle the response from Argus
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Argus API Error:', errorText);
            return res.status(response.status).json({ message: `Erro ao contatar a API da Argus: ${response.statusText}` });
        }

        const data = await response.json();
        
        // 7. Send the data back to the frontend
        return res.status(200).json(data);

    } catch (error) {
        console.error('Proxy Error:', error);
        return res.status(500).json({ message: 'Erro interno no servidor proxy.' });
    }
}
