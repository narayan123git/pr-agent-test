const Account = require('../models/Account');
const Review = require('../models/Review');

async function saveSettings(req, res) {
    try {
        const clientSecret = req.headers['x-saas-secret'];
        if (clientSecret !== process.env.FRONTEND_SECRET) return res.status(401).json({ error: "Unauthorized" });

        const { githubUsername, installationId, geminiKey, customPrompt } = req.body; 
        
        await Account.findOneAndUpdate(
            { githubUsername },
            { installationId, geminiKey, customPrompt },
            { upsert: true, returnDocument: 'after' }
        );
        res.status(200).json({ message: "Saved" });
    } catch (err) {
        console.error("Settings POST Error:", err);
        res.status(500).json({ error: "DB Error" });
    }
}

async function getSettings(req, res) {
    try {
        const clientSecret = req.headers['x-saas-secret'];
        if (clientSecret !== process.env.FRONTEND_SECRET) return res.status(401).json({ error: "Unauthorized" });

        const account = await Account.findOne({ githubUsername: String(req.params.username) });
        if (account) return res.status(200).json(account);
        res.status(404).json({ error: "Not found" });
    } catch (err) {
        console.error("Settings GET Error:", err);
        res.status(500).json({ error: "Server Error" });
    }
}

async function getReviews(req, res) {
    try {
        // 1. Security Check
        const clientSecret = req.headers['x-saas-secret'];
        if (clientSecret !== process.env.FRONTEND_SECRET) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        // 2. Find the user to get their Installation ID
        const account = await Account.findOne({ githubUsername: String(req.params.username) });
        
        // If user doesn't exist or hasn't installed the app yet, return empty array
        if (!account || !account.installationId) {
            return res.status(200).json([]); 
        }

        // 3. Fetch all reviews matching that Installation ID
        const reviews = await Review.find({ installationId: account.installationId })
                                    .sort({ createdAt: -1 }) // Show newest first
                                    .limit(20)
                                    .lean();
        
        res.status(200).json(reviews);
    } catch (err) {
        console.error("❌ Error fetching reviews:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

module.exports = {
    saveSettings,
    getSettings,
    getReviews
};