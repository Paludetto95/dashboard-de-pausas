// Test to check environment variables and token loading
console.log('Environment variables check:');
console.log('ARGUS_API_TOKEN_GLOBAL:', process.env.ARGUS_API_TOKEN_GLOBAL ? 'Present' : 'Missing');
console.log('ARGUS_CAMPAIGN_TOKENS:', process.env.ARGUS_CAMPAIGN_TOKENS ? 'Present' : 'Missing');
console.log('ARGUS_API_URL:', process.env.ARGUS_API_URL);

// Test the token loading logic
const GLOBAL_TOKEN = String(
    (process.env.ARGUS_API_TOKEN_GLOBAL || process.env.ARGUS_API_TOKEN || '')
).trim();

console.log('Global token length:', GLOBAL_TOKEN.length);
console.log('Global token (first 10 chars):', GLOBAL_TOKEN.substring(0, 10));

let CAMPAIGN_TOKENS = {};
try {
    if (process.env.ARGUS_CAMPAIGN_TOKENS) {
        CAMPAIGN_TOKENS = JSON.parse(process.env.ARGUS_CAMPAIGN_TOKENS);
    }
} catch (e) {
    console.warn('Invalid ARGUS_CAMPAIGN_TOKENS:', e.message);
}

console.log('Campaign tokens:', Object.keys(CAMPAIGN_TOKENS));