// Test script to try different endpoints
const fetch = require('node-fetch');

async function testEndpoints() {
    const token = 'nahybptvaa25vyybq0fyoj8bqyahrlw52acotbquc8du1z033ezsvfn5nx0egxqz';
    const baseUrl = 'https://argus.app.br/apiargus';
    
    const endpoints = [
        'pausasdetalhadas',
        'pausas',
        'detalhadas',
        'pausas/detalhadas',
        'api/pausasdetalhadas',
        'api/pausas'
    ];

    for (const endpoint of endpoints) {
        console.log(`\nTesting endpoint: ${endpoint}`);
        const url = `${baseUrl}/${endpoint}`;
        console.log(`URL: ${url}`);
        
        try {
            // Test with token-signature header
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'token-signature': token
                },
                body: JSON.stringify({ ultimosMinutos: 60 })
            });
            
            console.log(`Status: ${response.status}`);
            const responseText = await response.text();
            console.log(`Response: ${responseText}`);
            
            if (response.status === 200) {
                console.log('*** SUCCESS! ***');
                break;
            }
            
        } catch (error) {
            console.log(`Error: ${error.message}`);
        }
    }
}

testEndpoints().catch(console.error);