require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Review = require('./models/Review');
const crypto = require('crypto');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const Account = require('./models/Account');
const cors = require('cors');

// --- NEW SAAS IMPORTS ---
const fs = require('fs');
const jwt = require('jsonwebtoken');

// Read your private key from the file we just renamed
const privateKey = fs.readFileSync('./private-key.pem', 'utf8');

const app = express();
const PORT = process.env.PORT || 3000;
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.set('trust proxy', 1);

app.use(cors({
    origin: 'http://localhost:3000' // Your Next.js URL
}));

// --- SAAS TOKEN LOGIC ---
// This function proves to GitHub that WE are the owners of the App
function generateAppJWT() {
    const payload = {
        iat: Math.floor(Date.now() / 1000) - 60,
        exp: Math.floor(Date.now() / 1000) + (10 * 60),
        iss: process.env.GITHUB_APP_ID
    };
    return jwt.sign(payload, privateKey, { algorithm: 'RS256' });
}

// This function gets a temporary "password" for a specific user's installation
async function getInstallationToken(installationId) {
    const appToken = generateAppJWT();
    const response = await fetch(`https://api.github.com/app/installations/${installationId}/access_tokens`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${appToken}`,
            'Accept': 'application/vnd.github.v3+json'
        }
    });
    const data = await response.json();
    return data.token;
}

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
    max: 15, // Limit each IP to 5 requests
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

app.post('/webhook', async (req, res) => {
    // --- The Cryptographic Lock ---
    const signature = req.headers['x-hub-signature-256'];
    const secret = process.env.GITHUB_WEBHOOK_SECRET;

    if (!signature) {
        console.error("❌ SECURITY ALERT: Request missing signature. Blocked!");
        return res.status(401).send('Unauthorized');
    }

    if (!req.rawBody) {
        console.error("❌ CRITICAL: req.rawBody is empty! Check GitHub Content-Type.");
        return res.status(400).send('Bad Request');
    }

    try {
        const expectedSignature = `sha256=${crypto.createHmac('sha256', secret).update(req.rawBody).digest('hex')}`;
        if (signature !== expectedSignature) {
            console.error("❌ SECURITY: Signature mismatch. Blocked!");
            return res.status(401).send('Unauthorized');
        }
    } catch (err) {
        console.error("❌ Crypto Error:", err.message);
        return res.status(500).send('Internal Server Error');
    }
    // -------------------------------------

    const eventType = req.headers['x-github-event'];
    const action = req.body && req.body.action;

    console.log(`\n--- Received Event: ${eventType} | Action: ${action || 'none'} ---`);

    // ✅ We answer GitHub immediately so it doesn't time out.
    res.status(200).send('Webhook received and processing in background');

    // --- EVENT A: INSTALLATION ---
    if (eventType === 'installation' && action === 'created') {
        const installationId = req.body.installation.id;
        const githubUsername = req.body.installation.account.login;

        console.log(`📥 App installed by ${githubUsername}. ID: ${installationId}`);

        try {
            await Account.findOneAndUpdate(
                { githubUsername: githubUsername },
                { installationId: installationId.toString() },
                { upsert: true, returnDocument: 'after' }
            );
            console.log("✅ Installation saved to database.");
            return; 
        } catch (err) {
            console.error("❌ DB Error during installation:", err);
            return; 
        }
    }

    // --- EVENT B: PULL REQUEST ---
    if (eventType === 'pull_request' && (action === 'opened' || action === 'reopened')) {
        const prNumber = req.body.pull_request.number;
        const repoFullName = req.body.repository.full_name;
        const installationId = req.body.installation.id;

        console.log(`🔍 PR #${prNumber} in ${repoFullName}. Fetching code changes...`);

        try {
            const userAccount = await Account.findOne({ installationId: installationId.toString() });

            if (!userAccount || !userAccount.geminiKey) {
                console.log(`⚠️ No Gemini Key found in database for this repo. Skipping review.`);
                return; 
            }

            const dynamicToken = await getInstallationToken(installationId);

            const diffResponse = await fetch(`https://api.github.com/repos/${repoFullName}/pulls/${prNumber}`, {
                headers: {
                    'Accept': 'application/vnd.github.v3.diff',
                    'Authorization': `Bearer ${dynamicToken}`
                }
            });

            const diffText = await diffResponse.text();

            console.log(`🧠 Sending diff to AI for dynamic analytics...`);

            const userGenAI = new GoogleGenerativeAI(userAccount.geminiKey);
            
            // 🎯 PRO TIP: Force Gemini to output JSON using responseMimeType
            const model = userGenAI.getGenerativeModel({ 
                model: "gemini-2.5-flash",
                generationConfig: { responseMimeType: "application/json" }
            });

            // 🎯 We tell Gemini exactly how to format the data for our MongoDB Schema
            // 🧠 1. Get the custom rules from the database
            const customRules = userAccount.customPrompt 
                ? `\nCRITICAL USER INSTRUCTIONS (You MUST follow these):\n"""${userAccount.customPrompt}"""\n` 
                : "";

            // 🧠 2. Extract PR Context
            const prTitle = req.body.pull_request.title;
            const prBody = req.body.pull_request.body || "No description provided.";

            // 🧠 3. The Upgraded Smart Prompt
            const prompt = `
            You are a Senior Security & Software Engineer reviewing a GitHub Pull Request.
            
            PR TITLE: ${prTitle}
            PR DESCRIPTION: ${prBody}
            
            Analyze the following code diff. Consider the PR title and description to understand the context of these changes.
            ${customRules}
            
            You MUST return your response as a valid JSON object matching this exact structure:
            {
                "aiFeedback": "Your detailed code review in Markdown format. Mention bugs, optimizations, or LGTM.",
                "metrics": {
                    "vulnerabilityCount": <number of security vulnerabilities found>,
                    "bugsFound": <number of logical bugs found>,
                    "performanceIssues": <number of performance bottlenecks found>
                },
                "securityStatus": "<Must be exactly 'Clean', 'Warning', or 'Critical'>"
            }

            Here is the code diff:
            ${diffText}
            `;

            const aiResponse = await model.generateContent(prompt);
            
            // Parse the JSON string returned by Gemini
            const reviewData = JSON.parse(aiResponse.response.text());
            console.log("✅ AI Review & Analytics generated.");

            // 1. Post Comment Back to GitHub (Using the markdown part of the JSON)
            console.log(`📝 Posting comment to GitHub PR #${prNumber}...`);
            const commentResponse = await fetch(`https://api.github.com/repos/${repoFullName}/issues/${prNumber}/comments`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${dynamicToken}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ body: `### 🤖 AI Code Review\n\n${reviewData.aiFeedback}` })
            });

            if (commentResponse.ok) {
                console.log("🎉 SUCCESS! Comment posted to GitHub.");
            } else {
                console.error("❌ Failed to post comment:", await commentResponse.text());
            }

            // 2. Save Full Analytics to MongoDB (Using req.body correctly)
            console.log(`💾 Saving review & analytics to database...`);
            const newReview = new Review({
                installationId: req.body.installation.id.toString(),
                repoName: repoFullName,
                prNumber: prNumber,
                prTitle: req.body.pull_request.title,
                prAuthor: req.body.pull_request.user.login,
                prUrl: req.body.pull_request.html_url,
                aiFeedback: reviewData.aiFeedback,
                metrics: reviewData.metrics,
                securityStatus: reviewData.securityStatus
            });

            await newReview.save();
            console.log("✅ Database record saved perfectly.");

        } catch (error) {
            console.error("❌ Error processing PR:", error);
        }
    }
});


// Endpoint to save or update user settings
// 1. Save Settings (POST)
// 1. Save Settings (POST)
app.post('/api/settings', async (req, res) => {
    const clientSecret = req.headers['x-saas-secret'];
    if (clientSecret !== process.env.FRONTEND_SECRET) return res.status(401).json({ error: "Unauthorized" });

    // ✅ Added customPrompt
    const { githubUsername, installationId, geminiKey, customPrompt } = req.body; 
    try {
        await Account.findOneAndUpdate(
            { githubUsername },
            { installationId, geminiKey, customPrompt }, // ✅ Save it
            { upsert: true, returnDocument: 'after' }
        );
        res.status(200).json({ message: "Saved" });
    } catch (err) {
        res.status(500).json({ error: "DB Error" });
    }
});

// 2. Fetch Settings (GET)
app.get('/api/settings/:username', async (req, res) => {
    const clientSecret = req.headers['x-saas-secret'];
    if (clientSecret !== process.env.FRONTEND_SECRET) return res.status(401).json({ error: "Unauthorized" });

    try {
        const account = await Account.findOne({ githubUsername: req.params.username });
        if (account) return res.status(200).json(account); // ✅ Will now include customPrompt
        res.status(404).json({ error: "Not found" });
    } catch (err) {
        res.status(500).json({ error: "Server Error" });
    }
});


// ✅ ADD THIS: Fetch all AI reviews for a specific user's dashboard

app.get('/api/reviews/:username', async (req, res) => {
    // 1. Security Check
    const clientSecret = req.headers['x-saas-secret'];
    if (clientSecret !== process.env.FRONTEND_SECRET) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        // 2. Find the user to get their Installation ID
        const account = await Account.findOne({ githubUsername: req.params.username });
        
        // If user doesn't exist or hasn't installed the app yet, return empty array
        if (!account || !account.installationId) {
            return res.status(200).json([]); 
        }

        // 3. Fetch all reviews matching that Installation ID
        const reviews = await Review.find({ installationId: account.installationId })
                                    .sort({ createdAt: -1 }); // Show newest first
        
        res.status(200).json(reviews);
    } catch (err) {
        console.error("❌ Error fetching reviews:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 PR Review Agent server is running on port ${PORT}`);
});