// Test script to test the updated API handler
const fetch = require('node-fetch');

async function testUpdatedApi() {
    console.log('Testing updated API handler...\n');
    
    // Test 1: GET request with ultimosMinutos
    console.log('Test 1: GET request with ultimosMinutos');
    try {
        const response = await fetch('http://localhost:3000/api/dados-argus?ultimosMinutos=60');
        console.log(`Status: ${response.status}`);
        const text = await response.text();
        console.log(`Response: ${text.substring(0, 200)}...`);
        
        if (response.status === 200) {
            const data = JSON.parse(text);
            console.log(`Success! Found ${data.length} records`);
        }
    } catch (error) {
        console.log(`Error: ${error.message}`);
    }
    
    // Test 2: GET request with token-signature in query
    console.log('\nTest 2: GET request with token-signature in query');
    try {
        const response = await fetch('http://localhost:3000/api/dados-argus?ultimosMinutos=60&token-signature=nahybptvaa25vyybq0fyoj8bqyahrlw52acotbquc8du1z033ezsvfn5nx0egxqz');
        console.log(`Status: ${response.status}`);
        const text = await response.text();
        console.log(`Response: ${text.substring(0, 200)}...`);
        
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
        console.log(`Response: ${text.substring(0, 200)}...`);
        
        if (response.status === 200) {
            const data = JSON.parse(text);
            console.log(`Success! Found ${data.length} records`);
        }
    } catch (error) {
        console.log(`Error: ${error.message}`);
    }
}

testUpdatedApi().catch(console.error);