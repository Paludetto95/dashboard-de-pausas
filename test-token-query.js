// Test script to verify token-signature as query parameter
const fetch = require('node-fetch');

async function testTokenSignatureQuery() {
    const token = 'nahybptvaa25vyybq0fyoj8bqyahrlw52acotbquc8du1z033ezsvfn5nx0egxqz';
    const baseUrl = 'https://argus.app.br/apiargus/pausasdetalhadas';
    const body = {
        ultimosMinutos: 60
    };

    console.log('Testing token-signature as query parameter...\n');
    
    try {
        const url = `${baseUrl}?token-signature=${token}`;
        console.log(`URL: ${url}`);
        
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

testTokenSignatureQuery().catch(console.error);