// Test script to test the API with the correct endpoint
const fetch = require('node-fetch');

async function testCorrectEndpoint() {
    console.log('Testing with correct endpoint: /report/pausasdetalhadas\n');
    
    // Test 1: GET request (frontend style)
    console.log('Test 1: GET request with ultimosMinutos');
    try {
        const response = await fetch('http://localhost:3000/api/dados-argus?ultimosMinutos=60');
        console.log(`Status: ${response.status}`);
        const text = await response.text();
        console.log(`Response: ${text.substring(0, 300)}...`);
        
        if (response.status === 200) {
            const data = JSON.parse(text);
            console.log(`Success! Found ${data.length} records`);
        }
    } catch (error) {
        console.log(`Error: ${error.message}`);
    }
    
    // Test 2: GET request with period
    console.log('\nTest 2: GET request with period');
    try {
        const response = await fetch('http://localhost:3000/api/dados-argus?periodoInicial=2024-11-01T00:00:00&periodoFinal=2024-11-01T23:59:59');
        console.log(`Status: ${response.status}`);
        const text = await response.text();
        console.log(`Response: ${text.substring(0, 300)}...`);
        
        if (response.status === 200) {
            const data = JSON.parse(text);
            console.log(`Success! Found ${data.length} records`);
        }
    } catch (error) {
        console.log(`Error: ${error.message}`);
    }
    
    // Test 3: POST request (should still work)
    console.log('\nTest 3: POST request');
    try {
        const response = await fetch('http://localhost:3000/api/dados-argus', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ ultimosMinutos: 60 })
        });
        console.log(`Status: ${response.status}`);
        const text = await response.text();
        console.log(`Response: ${text.substring(0, 300)}...`);
        
        if (response.status === 200) {
            const data = JSON.parse(text);
            console.log(`Success! Found ${data.length} records`);
        }
    } catch (error) {
        console.log(`Error: ${error.message}`);
    }
}

testCorrectEndpoint().catch(console.error);