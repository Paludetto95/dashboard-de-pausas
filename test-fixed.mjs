// Test the fixed version
async function testImport() {
    try {
        console.log('Testing import of dados-argus-fixed.mjs...');
        const mod = await import('./api/dados-argus-fixed.mjs');
        console.log('Import successful:', typeof mod.default);
        console.log('Function type:', typeof mod.default === 'function');
        
        // Test calling the function
        const mockReq = { method: 'POST', query: {}, body: {} };
        const mockRes = {
            json: (data) => console.log('Response:', data),
            setHeader: () => {},
            status: (code) => ({ 
                end: (msg) => console.log(`Status ${code}:`, msg),
                json: (data) => console.log(`Status ${code} JSON:`, data)
            })
        };
        
        await mod.default(mockReq, mockRes);
        
    } catch (error) {
        console.error('Import failed:', error.message);
        console.error('Stack:', error.stack);
    }
}

testImport();