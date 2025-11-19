// Test if the module loads correctly
import('./api/dados-argus.mjs').then(module => {
    console.log('Module loaded successfully');
    console.log('Default export:', typeof module.default);
}).catch(error => {
    console.error('Failed to load module:', error);
});