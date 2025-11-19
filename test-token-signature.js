// Test script to verify token-signature authentication
const fetch = require('node-fetch');

async function testTokenSignature() {
    const token = 'nahybptvaa25vyybq0fyoj8bqyahrlw52acotbquc8du1z033ezsvfn5nx0egxqz';
    const url = 'https://argus.app.br/apiargus/pausasdetalhadas';
    const body = {
        ultimosMinutos: 60,
        'token-signature': token
    };

    console.log('Testing token-signature authentication...\n');
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
        
        console.log(`Status: ${response.status}`);
        const responseText = await response.text();
        console.log(`Full Response: ${responseText}`);
        
        if (response.status === 200) {
            try {
                const data = JSON.parse(responseText);
                console.log(`\nSuccess! Found ${data.pausasDetalhadas ? data.pausasDetalhadas.length : 0} records`);
            } catch (parseError) {
                console.log(`Parse error: ${parseError.message}`);
            }
        }
        
    } catch (error) {
        console.log(`Error: ${error.message}`);
    }
}

testTokenSignature().catch(console.error);