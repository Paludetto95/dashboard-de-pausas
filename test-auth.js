// Test script to debug Argus API authentication
const fetch = require('node-fetch');

async function testAuthSchemes() {
    const token = 'nahybptvaa25vyybq0fyoj8bqyahrlw52acotbquc8du1z033ezsvfn5nx0egxqz';
    const url = 'https://argus.app.br/apiargus/pausasdetalhadas';
    const body = {
        ultimosMinutos: 60
    };

    console.log('Testing different authentication schemes...\n');

    // Test 1: Bearer Token (current implementation)
    console.log('Test 1: Bearer Token');
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(body)
        });
        console.log(`Status: ${response.status}`);
        const text = await response.text();
        console.log(`Response: ${text.substring(0, 200)}...`);
    } catch (error) {
        console.log(`Error: ${error.message}`);
    }

    // Test 2: X-API-Key
    console.log('\nTest 2: X-API-Key');
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': token
            },
            body: JSON.stringify(body)
        });
        console.log(`Status: ${response.status}`);
        const text = await response.text();
        console.log(`Response: ${text.substring(0, 200)}...`);
    } catch (error) {
        console.log(`Error: ${error.message}`);
    }

    // Test 3: api_key query parameter
    console.log('\nTest 3: api_key query parameter');
    try {
        const response = await fetch(`${url}?api_key=${token}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
        console.log(`Status: ${response.status}`);
        const text = await response.text();
        console.log(`Response: ${text.substring(0, 200)}...`);
    } catch (error) {
        console.log(`Error: ${error.message}`);
    }

    // Test 4: token query parameter
    console.log('\nTest 4: token query parameter');
    try {
        const response = await fetch(`${url}?token=${token}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
        console.log(`Status: ${response.status}`);
        const text = await response.text();
        console.log(`Response: ${text.substring(0, 200)}...`);
    } catch (error) {
        console.log(`Error: ${error.message}`);
    }

    // Test 5: Basic Authentication
    console.log('\nTest 5: Basic Authentication');
    try {
        const credentials = Buffer.from(`:${token}`).toString('base64');
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${credentials}`
            },
            body: JSON.stringify(body)
        });
        console.log(`Status: ${response.status}`);
        const text = await response.text();
        console.log(`Response: ${text.substring(0, 200)}...`);
    } catch (error) {
        console.log(`Error: ${error.message}`);
    }
}

testAuthSchemes().catch(console.error);