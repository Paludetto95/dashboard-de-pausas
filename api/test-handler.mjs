// Test simple ES module
export default async function handler(req, res) {
    console.log('Simple handler called');
    res.json({ message: 'Hello from simple handler' });
}