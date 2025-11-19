// Test script to verify base URL and try GET requests
const fetch = require('node-fetch');

async function testBaseUrl() {
    const token = 'nahybptvaa25vyybq0fyoj8bqyahrlw52acotbquc8du1z033ezsvfn5nx0egxqz';
    
    const baseUrls = [
        'https://argus.app.br/apiargus',
        'https://argus.app.br/api',
        'https://argus.app.br'
    ];
    
    const endpoints = [
        'pausasdetalhadas',
        'pausas',
        'detalhadas'
    ];

    for (const baseUrl of baseUrls) {
        for (const endpoint of endpoints) {
            const url = `${baseUrl}/${endpoint}`;
            console.log(`\nTesting: ${url}`);
            
            try {
                // Try GET request first
                const getResponse = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'token-signature': token
                    }
                });
                
                console.log(`GET Status: ${getResponse.status}`);
                const getText = await getResponse.text();
                console.log(`GET Response: ${getText.substring(0, 100)}...`);
                
                // Try POST request
                const postResponse = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'token-signature': token
                    },
                    body: JSON.stringify({ ultimosMinutos: 60 })
                });
                
                console.log(`POST Status: ${postResponse.status}`);
                const postText = await postResponse.text();
                console.log(`POST Response: ${postText.substring(0, 100)}...`);
                
            } catch (error) {
                console.log(`Error: ${error.message}`);
            }
        }
    }
}

testBaseUrl().catch(console.error);