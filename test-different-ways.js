// Test script to try different ways of sending token-signature
const fetch = require('node-fetch');

async function testDifferentWays() {
    const token = 'nahybptvaa25vyybq0fyoj8bqyahrlw52acotbquc8du1z033ezsvfn5nx0egxqz';
    const url = 'https://argus.app.br/apiargus/pausasdetalhadas';
    
    const tests = [
        {
            name: 'Header: token-signature',
            headers: {
                'Content-Type': 'application/json',
                'token-signature': token
            },
            body: { ultimosMinutos: 60 }
        },
        {
            name: 'Header: X-token-signature',
            headers: {
                'Content-Type': 'application/json',
                'X-token-signature': token
            },
            body: { ultimosMinutos: 60 }
        },
        {
            name: 'Header: Authorization with Bearer',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: { ultimosMinutos: 60 }
        },
        {
            name: 'URL parameter: token-signature',
            url: `${url}?token-signature=${token}`,
            headers: {
                'Content-Type': 'application/json'
            },
            body: { ultimosMinutos: 60 }
        },
        {
            name: 'Form data style',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `ultimosMinutos=60&token-signature=${token}`
        }
    ];

    for (const test of tests) {
        console.log(`\nTesting: ${test.name}`);
        console.log(`URL: ${test.url || url}`);
        console.log(`Headers: ${JSON.stringify(test.headers)}`);
        console.log(`Body: ${test.body}`);
        
        try {
            const response = await fetch(test.url || url, {
                method: 'POST',
                headers: test.headers,
                body: typeof test.body === 'object' ? JSON.stringify(test.body) : test.body
            });
            
            console.log(`Status: ${response.status}`);
            const responseText = await response.text();
            console.log(`Response: ${responseText}`);
            
            if (response.status === 200) {
                console.log('*** SUCCESS! ***');
            }
            
        } catch (error) {
            console.log(`Error: ${error.message}`);
        }
    }
}

testDifferentWays().catch(console.error);