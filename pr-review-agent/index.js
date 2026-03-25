require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');

// Startup Environment Validation
const requiredEnvVars = [
    'MONGODB_URI',
    'FRONTEND_SECRET',
    'GITHUB_WEBHOOK_SECRET',
    'GITHUB_APP_ID'
];

for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        throw new Error(`CRITICAL: Missing environment variable: ${envVar}`);
    }
}

const webhookController = require('./controllers/webhook.controller');
const settingsController = require('./controllers/settings.controller');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', 1);

app.use(cors({
    origin: 'https://learnloop-frontend.vercel.app' // Strict CORS logic
}));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('📦 Successfully connected to MongoDB!'))
    .catch((err) => console.error('❌ MongoDB connection error:', err));

// --- APPLY SECURITY MIDDLEWARE ---
// 1. Helmet secures HTTP headers against common vulnerabilities
app.use(helmet());

// 2. Rate Limiter: Max 5 requests per 10 minutes per IP
const limiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 10, // Limit each IP to 5 requests
    message: 'Too many requests created from this IP, please try again after 10 minutes',
    standardHeaders: true,
    legacyHeaders: false,
    // --- NEW: Tell the limiter to log to our terminal when it blocks someone ---
    handler: (req, res, next, options) => {
        console.log(`\n🛑 SHIELD ACTIVATED: Rate Limit Exceeded for IP: ${req.ip}`);
        res.status(options.statusCode).send(options.message);
    }
});

// Apply the limiter SPECIFICALLY to our webhook route
app.use('/webhook', limiter);
app.use('/api/settings', limiter);
app.use('/api/reviews', limiter);

// Parse JSON bodies AND capture the raw buffer for crypto
app.use(express.json({
    verify: (req, res, buf) => {
        req.rawBody = buf;
    }
}));

app.post('/webhook', webhookController.handleWebhook);

// Endpoint to save or update user settings
// 1. Save Settings (POST)
app.post('/api/settings', settingsController.saveSettings);

// 2. Fetch Settings (GET)
app.get('/api/settings/:username', settingsController.getSettings);

// ✅ ADD THIS: Fetch all AI reviews for a specific user's dashboard
app.get('/api/reviews/:username', settingsController.getReviews);

app.listen(PORT, () => {
    console.log(`🚀 PR Review Agent server is running on port ${PORT}`);
});