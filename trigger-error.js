// Simple test to trigger the API and see detailed error
const fetch = require('node-fetch');

async function triggerError() {
    console.log('Triggering API error to see detailed logs...\n');
    
    try {
        const response = await fetch('http://localhost:3000/api/dados-argus?ultimosMinutos=60');
        console.log(`Status: ${response.status}`);
        const text = await response.text();
        console.log(`Response: ${text}`);
        
        // Also check server logs in real time
        console.log('\nCheck server console for detailed error logs...');
        
    } catch (error) {
        console.log(`Fetch error: ${error.message}`);
    }
}

triggerError().catch(console.error);