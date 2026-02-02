const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); // Allow all origins for hackathon
app.use(express.json());

// Request Logger (Great for Demos)
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Routes
const videoRoutes = require('./routes/videoRoutes');
app.use('/api/videos', videoRoutes);

// Health Check / Root Route
app.get('/', (req, res) => {
    res.json({
        status: 'online',
        message: 'UniScript Backend is running smoothly 🚀',
        version: '1.0.0',
        endpoints: {
            upload: 'POST /api/videos/upload',
            analytics: 'GET /api/videos/analytics'
        }
    });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('🔥 Server Error:', err.stack);
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message
    });
});

app.listen(PORT, () => {
    console.log(`\n🚀 UniScript Server ready at http://localhost:${PORT}`);
    console.log(`⭐️ Hackathon Mode: ON\n`);
});
