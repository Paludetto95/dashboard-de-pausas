// Test script to analyze token format and try different approaches
const fetch = require('node-fetch');

async function analyzeToken() {
    const token = 'nahybptvaa25vyybq0fyoj8bqyahrlw52acotbquc8du1z033ezsvfn5nx0egxqz';
    console.log('Token analysis:');
    console.log(`Length: ${token.length}`);
    console.log(`First 10 chars: ${token.substring(0, 10)}`);
    console.log(`Last 10 chars: ${token.substring(token.length - 10)}`);
    
    const baseUrl = 'https://argus.app.br/apiargus/pausasdetalhadas';
    
    // Try different token parameter names based on common patterns
    const tokenVariations = [
        { name: 'token-signature', value: token },
        { name: 'token_signature', value: token },
        { name: 'tokenSignature', value: token },
        { name: 'signature', value: token },
        { name: 'api_token', value: token },
        { name: 'apiToken', value: token },
        { name: 'access_token', value: token },
        { name: 'accessToken', value: token }
    ];

    for (const variation of tokenVariations) {
        console.log(`\nTesting with parameter: ${variation.name}`);
        
        try {
            const body = {
                ultimosMinutos: 60,
                [variation.name]: variation.value
            };
            
            console.log(`Body: ${JSON.stringify(body)}`);
            
            const response = await fetch(baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });
            
            console.log(`Status: ${response.status}`);
            const responseText = await response.text();
            console.log(`Response: ${responseText}`);
            
            // If we get a different response than "token-signature não informado", it might be working
            if (!responseText.includes('token-signature não informado')) {
                console.log('*** Different response received - might be progress! ***');
            }
            
        } catch (error) {
            console.log(`Error: ${error.message}`);
        }
    }
}

analyzeToken().catch(console.error);