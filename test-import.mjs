// Test import of dados-argus.mjs
async function testImport() {
    try {
        console.log('Testing import of dados-argus.mjs...');
        const mod = await import('./api/dados-argus.mjs');
        console.log('Import successful:', typeof mod.default);
        console.log('Function type:', typeof mod.default === 'function');
    } catch (error) {
        console.error('Import failed:', error.message);
        console.error('Stack:', error.stack);
    }
}

testImport();