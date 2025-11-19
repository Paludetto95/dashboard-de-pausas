// Test script to try different token formats and endpoints
const fetch = require('node-fetch');

async function testDifferentFormats() {
    const token = 'nahybptvaa25vyybq0fyoj8bqyahrlw52acotbquc8du1z033ezsvfn5nx0egxqz';
    const baseUrl = 'https://argus.app.br/apiargus';
    
    const tests = [
        {
            name: 'pausasdetalhadas with token-signature in body',
            url: `${baseUrl}/pausasdetalhadas`,
            body: { ultimosMinutos: 60, 'token-signature': token }
        },
        {
            name: 'pausasdetalhadas with token in body',
            url: `${baseUrl}/pausasdetalhadas`,
            body: { ultimosMinutos: 60, token: token }
        },
        {
            name: 'pausas with token-signature in body',
            url: `${baseUrl}/pausas`,
            body: { ultimosMinutos: 60, 'token-signature': token }
        },
        {
            name: 'pausas with token in body',
            url: `${baseUrl}/pausas`,
            body: { ultimosMinutos: 60, token: token }
        }
    ];

    for (const test of tests) {
        console.log(`\nTesting: ${test.name}`);
        console.log(`URL: ${test.url}`);
        console.log(`Body: ${JSON.stringify(test.body)}`);
        
        try {
            const response = await fetch(test.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(test.body)
            });
            
            console.log(`Status: ${response.status}`);
            const responseText = await response.text();
            console.log(`Response: ${responseText}`);
            
        } catch (error) {
            console.log(`Error: ${error.message}`);
        }
    }
}

testDifferentFormats().catch(console.error);