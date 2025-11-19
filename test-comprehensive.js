// Comprehensive test to debug the server issue
require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Create a minimal test server
const app = express();
const PORT = 3001; // Use different port to avoid conflicts

app.use(cors());
app.use(express.json());

app.get('/test', (req, res) => {
    console.log('Test endpoint hit!');
    res.json({ message: 'Test server working' });
});

app.get('/api/dados-argus', async (req, res) => {
    console.log('API endpoint hit!');
    console.log('Query params:', req.query);
    
    try {
        // Test the environment variables
        console.log('Environment check:');
        console.log('ARGUS_API_TOKEN_GLOBAL exists:', !!process.env.ARGUS_API_TOKEN_GLOBAL);
        console.log('ARGUS_API_URL:', process.env.ARGUS_API_URL);
        
        // Test importing the handler
        console.log('Importing handler...');
        const { default: handler } = await import('./api/dados-argus.mjs');
        console.log('Handler imported successfully');
        
        // Call the handler
        console.log('Calling handler...');
        await handler(req, res);
        console.log('Handler completed');
        
    } catch (error) {
        console.error('Error in API endpoint:', error);
        res.status(500).json({ 
            message: 'Server error', 
            error: error.message,
            stack: error.stack 
        });
    }
});

app.listen(PORT, () => {
    console.log(`Test server running on http://localhost:${PORT}`);
    console.log('Testing environment variables...');
    console.log('ARGUS_API_TOKEN_GLOBAL exists:', !!process.env.ARGUS_API_TOKEN_GLOBAL);
    console.log('ARGUS_API_URL:', process.env.ARGUS_API_URL);
});

// Test the server after it starts
setTimeout(async () => {
    console.log('\nTesting the server...');
    try {
        const response = await fetch('http://localhost:3001/api/dados-argus?ultimosMinutos=60');
        console.log('Response status:', response.status);
        const data = await response.text();
        console.log('Response data:', data);
        
        process.exit(0);
    } catch (error) {
        console.error('Test failed:', error.message);
        process.exit(1);
    }
}, 2000);