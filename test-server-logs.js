// Test the server directly by making a request and capturing server output
const { spawn } = require('child_process');
const fetch = require('node-fetch');

async function testServerWithLogs() {
    console.log('Starting server and testing API...\n');
    
    // Start the server
    const server = spawn('node', ['server.js'], {
        stdio: 'pipe',
        cwd: process.cwd()
    });
    
    let serverOutput = '';
    
    server.stdout.on('data', (data) => {
        const output = data.toString();
        serverOutput += output;
        console.log('[SERVER]', output.trim());
    });
    
    server.stderr.on('data', (data) => {
        const output = data.toString();
        serverOutput += output;
        console.error('[SERVER ERROR]', output.trim());
    });
    
    server.on('error', (error) => {
        console.error('Failed to start server:', error);
    });
    
    // Wait a bit for server to start
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test the API
    console.log('\nTesting API...');
    try {
        const response = await fetch('http://localhost:3000/api/dados-argus?ultimosMinutos=60');
        console.log(`Response status: ${response.status}`);
        const text = await response.text();
        console.log(`Response body: ${text}`);
    } catch (error) {
        console.error('API test error:', error.message);
    }
    
    // Wait a bit to capture any additional logs
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Kill the server
    server.kill();
    
    console.log('\nFull server output:');
    console.log(serverOutput);
}

testServerWithLogs().catch(console.error);