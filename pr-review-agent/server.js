require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');

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
    origin: 'https://pr-agent-test.vercel.app' // Strict CORS logic
}));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('📦 Successfully connected to MongoDB!'))
    .catch((err) => console.error('❌ MongoDB connection error:', err));

// --- APPLY SECURITY MIDDLEWARE ---
// 1. Helmet secures HTTP headers against common vulnerabilities
app.use(helmet({
    // contentSecurityPolicy: process.env.NODE_ENV === "production" ? undefined : false,
    crossOriginEmbedderPolicy: false,
}));

// Apply Global Rate Limiting (Protects the entire server from being flooded)
const globalLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minute
    max: 20, // Limit each IP to 10 requests per `window` (here, per 10 minute)
    message: 'Too many requests from this IP, please try again after a minute.',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(globalLimiter);

// 2. Strict Rate Limiter for Sensitive Routes: Max 5 requests per 10 minutes per IP
const strictLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minute window
    max: 10, // Limit each IP to 10 requests per 10 minute
    message: 'Too many requests created from this IP, please try again.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next, options) => {
        console.warn(`\n🛑 SHIELD ACTIVATED: Rate Limit Exceeded for IP: ${req.ip} on ${req.originalUrl}`);
        res.status(options.statusCode).send(options.message);
    }
});

// Apply the limiter SPECIFICALLY to sensitive routes
app.use('/webhook', strictLimiter);
app.use('/api/', strictLimiter);

// 4. Data Sanitization against NoSQL query injection
// If someone passes {"email": {"$gt": ""}} to bypass auth, this prevents it.
app.use(mongoSanitize());

// 5. Prevent HTTP Parameter Pollution
// Cleans up query strings (e.g., ?sort=id&sort=price -> takes the last one)
app.use(hpp());

// 3. Payload Size Limitation (Prevents Large Payload DDOS / Buffer Overflows)
app.use(express.json({
    limit: '500kb', // Reject JSON payloads larger than 500kb
    verify: (req, res, buf) => {
        req.rawBody = buf;
    }
}));
app.use(express.urlencoded({ extended: true, limit: '500kb' }));

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