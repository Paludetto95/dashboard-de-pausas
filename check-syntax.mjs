// Check for syntax issues in dados-argus.mjs
import fs from 'fs';

try {
    const content = fs.readFileSync('./api/dados-argus.mjs', 'utf8');
    
    // Look for the specific line with the handler function
    const lines = content.split('\n');
    
    // Find the handler function line
    const handlerLineIndex = lines.findIndex(line => line.includes('export default async function handler'));
    console.log('Handler function found at line:', handlerLineIndex + 1);
    
    if (handlerLineIndex !== -1) {
        // Show context around the handler function
        const startLine = Math.max(0, handlerLineIndex - 2);
        const endLine = Math.min(lines.length, handlerLineIndex + 3);
        
        console.log('\nContext around handler function:');
        for (let i = startLine; i < endLine; i++) {
            console.log(`${i + 1}: ${lines[i]}`);
        }
        
        // Check for any non-standard characters
        const handlerLine = lines[handlerLineIndex];
        console.log('\nHandler line characters:');
        for (let i = 0; i < handlerLine.length; i++) {
            const char = handlerLine[i];
            const code = handlerLine.charCodeAt(i);
            if (code > 127) {
                console.log(`Non-ASCII character at position ${i}: "${char}" (code: ${code})`);
            }
        }
    }
    
} catch (error) {
    console.error('Error:', error.message);
}