// Direct test of the API handler without server
import('./api/dados-argus.mjs').then(async (module) => {
    const handler = module.default;
    
    // Mock request and response objects
    const mockReq = {
        method: 'GET',
        query: { ultimosMinutos: '60' },
        body: {}
    };
    
    const mockRes = {
        statusCode: 200,
        headers: {},
        status: function(code) {
            this.statusCode = code;
            return this;
        },
        setHeader: function(name, value) {
            this.headers[name] = value;
            return this;
        },
        json: function(data) {
            console.log('Response:', {
                status: this.statusCode,
                headers: this.headers,
                data: data
            });
            return this;
        },
        end: function() {
            console.log('Response ended');
            return this;
        }
    };
    
    console.log('Testing API handler directly...\n');
    
    try {
        await handler(mockReq, mockRes);
    } catch (error) {
        console.error('Handler error:', error);
    }
}).catch(error => {
    console.error('Failed to load module:', error);
});