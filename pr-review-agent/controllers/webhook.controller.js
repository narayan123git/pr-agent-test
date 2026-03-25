const Account = require('../models/Account');
const Review = require('../models/Review');
const crypto = require('crypto');
const { getInstallationToken, fetchPRDiff, postPRComment } = require('../services/github.service');
const { generateAIReview } = require('../services/ai.service');

async function handleWebhook(req, res) {
    try {
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

        const expectedHash = crypto.createHmac('sha256', secret).update(req.rawBody).digest('hex');
        const expectedSignature = `sha256=${expectedHash}`;

        const signatureBuffer = Buffer.from(signature);
        const expectedBuffer = Buffer.from(expectedSignature);

        if (signatureBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
            console.error("❌ SECURITY: Signature mismatch. Blocked!");
            return res.status(401).send('Unauthorized');
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
            } catch (err) {
                console.error("❌ DB Error during installation:", err);
            }
            return;
        }

        if (action === 'deleted') {
            console.log(`🗑️ App Uninstalled by @${sender.login}`);
            await Account.findOneAndUpdate(
                { githubUsername: sender.login },
                { installationId: "" }
            );
            return res.status(200).send("Installation ID removed");
        }

        // --- EVENT B: PULL REQUEST ---
        if (eventType === 'pull_request' && (action === 'opened' || action === 'reopened')) {
            const prNumber = req.body.pull_request.number;
            const repoFullName = req.body.repository.full_name;
            const installationId = req.body.installation.id;

            console.log(`🔍 PR #${prNumber} in ${repoFullName}. Fetching code changes...`);

            try {
                // Idempotency: Check if we have already reviewed this PR
                const existing = await Review.findOne({ prNumber: prNumber, repoName: repoFullName });
                if (existing) {
                    console.log(`⚠️ Review already exists for PR #${prNumber} in ${repoFullName}. Skipping.`);
                    return;
                }

                const userAccount = await Account.findOne({ installationId: installationId.toString() });

                if (!userAccount || !userAccount.geminiKey) {
                    console.log(`⚠️ No Gemini Key found in database for this repo. Skipping review.`);
                    return; 
                }

                const dynamicToken = await getInstallationToken(installationId);
                const diffText = await fetchPRDiff(repoFullName, prNumber, dynamicToken);

                if (diffText.length > 50000) {
                    console.log("⚠️ Diff too large, skipping AI review to prevent API crash/limit exhaustion.");
                    return;
                }

                console.log(`🧠 Sending diff to AI for dynamic analytics...`);

                const customRules = userAccount.customPrompt 
                    ? `\nCRITICAL USER INSTRUCTIONS (You MUST follow these):\n"""${userAccount.customPrompt}"""\n` 
                    : "";
                const prTitle = req.body.pull_request.title;
                const prBody = req.body.pull_request.body || "No description provided.";

                let reviewData;
                try {
                    reviewData = await generateAIReview(userAccount.geminiKey, customRules, prTitle, prBody, diffText);
                } catch (aiErr) {
                    console.error("AI Generation Error", aiErr);
                    return;
                }

                console.log("✅ AI Review & Analytics generated.");

                // 1. Post Comment Back to GitHub (Using the markdown part of the JSON)
                console.log(`📝 Posting comment to GitHub PR #${prNumber}...`);
                const commentBody = `### 🤖 AI Code Review\n\n${reviewData.aiFeedback}`;
                await postPRComment(repoFullName, prNumber, dynamicToken, commentBody);

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
    } catch(err) {
        console.error("❌ Fatal Webhook Error:", err.message);
        if (!res.headersSent) {
            res.status(500).send('Internal Server Error');
        }
    }
}

module.exports = {
    handleWebhook
};