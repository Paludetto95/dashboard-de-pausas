// Test import of simple handler
async function testImport() {
    try {
        console.log('Testing import of test-handler.mjs...');
        const mod = await import('./api/test-handler.mjs');
        console.log('Import successful:', typeof mod.default);
        
        // Test calling the function
        const mockReq = { method: 'GET' };
        const mockRes = {
            json: (data) => console.log('Response:', data),
            setHeader: () => {},
            status: () => ({ end: () => {}, json: () => {} })
        };
        
        await mod.default(mockReq, mockRes);
        
    } catch (error) {
        console.error('Import failed:', error.message);
        console.error('Stack:', error.stack);
    }
}

testImport();