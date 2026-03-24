require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Review = require('./models/Review');
const crypto = require('crypto');
// --- NEW SECURITY IMPORTS ---
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.set('trust proxy', 1);

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
    max: 5, // Limit each IP to 5 requests
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

// Parse JSON bodies AND capture the raw buffer for crypto
app.use(express.json({
    verify: (req, res, buf) => {
        req.rawBody = buf; 
    }
}));

app.post('/webhook', async (req, res) => {
    // --- NEW: The Cryptographic Lock ---
    const signature = req.headers['x-hub-signature-256'];
    const secret = process.env.GITHUB_WEBHOOK_SECRET;

    // 1. Check if the signature exists at all
    if (!signature) {
        console.error("❌ SECURITY ALERT: Request missing signature. Blocked!");
        return res.status(401).send('Unauthorized');
    }

    // 2. SAFETY CHECK: Did the rawBody actually get captured?
    if (!req.rawBody) {
        console.error("❌ CRITICAL: req.rawBody is empty! Check GitHub Content-Type.");
        return res.status(400).send('Bad Request');
    }

    // 3. The Math (Now it won't crash because we know rawBody exists!)
    try {
        const expectedSignature = `sha256=${crypto.createHmac('sha256', secret).update(req.rawBody).digest('hex')}`;
        if (signature !== expectedSignature) {
            console.error("❌ SECURITY: Signature mismatch. Spoofing attempt blocked!");
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
    res.status(200).send('Webhook received and processing in background');
    
    // Now the server will do all this heavy lifting in the background without making GitHub wait.
    if (eventType === 'pull_request' && (action === 'opened' || action === 'reopened')) {
        const prNumber = req.body.pull_request.number;
        const repoFullName = req.body.repository.full_name; 
        
        console.log(`🔍 PR #${prNumber} ${action} in ${repoFullName}. Fetching code changes...`);

        try {
            // 1. Fetch Diff
            const diffResponse = await fetch(`https://api.github.com/repos/${repoFullName}/pulls/${prNumber}`, {
                headers: { 'Accept': 'application/vnd.github.v3.diff' }
            });
            const diffText = await diffResponse.text();

            console.log(`🧠 Sending diff to AI for review...`);

            // 2. Get AI Review
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
            const prompt = `
            You are a Senior Software Engineer reviewing a GitHub Pull Request.
            Analyze the following code diff and provide a concise, constructive code review.
            Point out any bugs, edge cases, or optimizations.
            If the code is perfectly fine and simple, just say "LGTM!" (Looks Good To Me).
            
            Here is the exact code diff:
            ${diffText}
            `;

            const aiResponse = await model.generateContent(prompt);
            const reviewText = aiResponse.response.text();
            console.log("✅ AI Review generated.");

            // 3. Save to Database
            console.log(`💾 Saving review to database...`);
            const newReview = new Review({
                repoName: repoFullName,
                prNumber: prNumber,
                reviewText: reviewText
            });
            await newReview.save();
            console.log("✅ Saved to MongoDB!");

            // 4. Post Comment Back to GitHub
            console.log(`📝 Posting comment to GitHub PR #${prNumber}...`);
            const commentResponse = await fetch(`https://api.github.com/repos/${repoFullName}/issues/${prNumber}/comments`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    body: `### 🤖 Autonomous AI Code Review\n\n${reviewText}` 
                })
            });

            if (commentResponse.ok) {
                console.log("🎉 SUCCESS! Comment posted to GitHub.");
            } else {
                console.error("❌ Failed to post comment:", await commentResponse.text());
            }

        } catch (error) {
            console.error("❌ Error:", error);
        }
    }
});

app.listen(PORT, () => {
    console.log(`🚀 PR Review Agent server is running on port ${PORT}`);
});