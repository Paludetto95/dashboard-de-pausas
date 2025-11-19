// Test parsing the dados-argus.mjs file
import fs from 'fs';

try {
    const content = fs.readFileSync('./api/dados-argus.mjs', 'utf8');
    console.log('File size:', content.length, 'characters');
    
    // Check for common syntax issues
    const lines = content.split('\n');
    console.log('Total lines:', lines.length);
    
    // Look for the handler function
    const handlerLine = lines.findIndex(line => line.includes('export default async function handler'));
    console.log('Handler function at line:', handlerLine + 1);
    
    // Check for balanced braces
    let braceCount = 0;
    let inFunction = false;
    let functionStart = -1;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes('export default async function handler')) {
            inFunction = true;
            functionStart = i;
        }
        
        if (inFunction) {
            for (const char of line) {
                if (char === '{') braceCount++;
                if (char === '}') braceCount--;
            }
            
            // Check if we've reached the end of the function
            if (braceCount === 0 && i > functionStart && functionStart !== -1) {
                console.log('Function ends at line:', i + 1);
                break;
            }
        }
    }
    
    console.log('Final brace count:', braceCount);
    
} catch (error) {
    console.error('Error reading file:', error.message);
}