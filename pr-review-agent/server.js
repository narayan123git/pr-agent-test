require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');

// ==========================================
// ⚙️ ENVIRONMENT VALIDATION
// ==========================================
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

// ==========================================
// 📦 CONTROLLERS
// ==========================================
const webhookController = require('./controllers/webhook.controller');
const settingsController = require('./controllers/settings.controller');

// ==========================================
// 🚀 APP INITIALIZATION
// ==========================================
const app = express();
const PORT = process.env.PORT || 3000;

// Required for Render/Vercel to properly identify client IPs for rate limiting
app.set('trust proxy', 1);

// Allow requests ONLY from your production Next.js frontend
app.use(cors({
    origin: 'https://pr-agent-test.vercel.app' 
}));

// ==========================================
// 🗄️ DATABASE CONNECTION
// ==========================================
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('📦 Successfully connected to MongoDB!'))
    .catch((err) => console.error('❌ MongoDB connection error:', err));


// ==========================================
// 🛡️ THE PERFECT MIDDLEWARE PIPELINE
// ==========================================

// 1. PARSE: Read the incoming data first (Limit to 500kb to prevent buffer overflows)
app.use(express.json({
    limit: '500kb', 
    verify: (req, res, buf) => {
        req.rawBody = buf; // Crucial for your HMAC Webhook validation later!
    }
}));
app.use(express.urlencoded({ extended: true, limit: '500kb' }));

// 2. CLEAN: Now that req.body exists, scrub it for malicious code
app.use(mongoSanitize()); // Strips out {"$gt": ""} NoSQL injections
app.use(hpp());           // Cleans up polluted query strings (e.g., ?sort=id&sort=price)

// 3. SECURE: Set strict HTTP headers
app.use(helmet({
    crossOriginEmbedderPolicy: false,
}));

// 4. LIMIT: Now rate limit the requests so we don't get DDoS'd
const globalLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 20, 
    message: 'Too many requests from this IP, please try again after a minute.',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(globalLimiter);

const strictLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minute window
    max: 10, 
    message: 'Too many requests created from this IP, please try again.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next, options) => {
        console.warn(`\n🛑 SHIELD ACTIVATED: Rate Limit Exceeded for IP: ${req.ip} on ${req.originalUrl}`);
        res.status(options.statusCode).send(options.message);
    }
});

// Apply strict limits ONLY to API and Webhook routes
app.use('/webhook', strictLimiter);
app.use('/api/', strictLimiter);


// ==========================================
// 🚦 ROUTES
// ==========================================

// Webhook Endpoint (Receives payloads from GitHub)
app.post('/webhook', webhookController.handleWebhook);

// Settings Endpoints (Dashboard Preferences)
app.post('/api/settings', settingsController.saveSettings);
app.get('/api/settings/:username', settingsController.getSettings);

// Dashboard Reviews Endpoint (Fetch past AI reviews)
app.get('/api/reviews/:username', settingsController.getReviews);


// ==========================================
// 🎧 START SERVER
// ==========================================
app.listen(PORT, () => {
    console.log(`🚀 PR Review Agent server is running on port ${PORT}`);
});
