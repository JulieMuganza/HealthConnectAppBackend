require('dotenv').config();
const app = require('./app');
const prisma = require('./prisma/client');

const PORT = 5001; // Updated to 5001 to apply latest fixesss stale process

async function start() {
    try {
        // Check DB connection
        await prisma.$connect();
        console.log('Connected to Database');

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log('Press Ctrl+C to stop the server.');
        });

        // Prevent process from exiting
        process.stdin.resume();

    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Handle termination signals
process.on('SIGINT', () => {
    console.log('Server shutting down...');
    process.exit(0);
});

start();
