const fs = require('fs');
const jwt = require('jsonwebtoken');

// Ensure process.env.GITHUB_PRIVATE_KEY handles newline characters correctly 
// when pulled from platforms like Render/Vercel/Heroku.
let privateKey;
if (process.env.GITHUB_PRIVATE_KEY) {
    privateKey = process.env.GITHUB_PRIVATE_KEY.replace(/\\n/g, '\n');
} else {
    try {
        privateKey = fs.readFileSync('./private-key.pem', 'utf8');
    } catch(err) {
        console.error("Warning: private-key.pem not found and GITHUB_PRIVATE_KEY not set.");
    }
}

function generateAppJWT() {
    const payload = {
        iat: Math.floor(Date.now() / 1000) - 60,
        exp: Math.floor(Date.now() / 1000) + (10 * 60),
        iss: process.env.GITHUB_APP_ID
    };
    return jwt.sign(payload, privateKey, { algorithm: 'RS256' });
}

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

async function fetchPRDiff(repoFullName, prNumber, dynamicToken) {
    const diffResponse = await fetch(`https://api.github.com/repos/${repoFullName}/pulls/${prNumber}`, {
        headers: {
            'Accept': 'application/vnd.github.v3.diff',
            'Authorization': `Bearer ${dynamicToken}`
        }
    });

    return await diffResponse.text();
}

async function postPRComment(repoFullName, prNumber, dynamicToken, commentBody) {
    const commentResponse = await fetch(`https://api.github.com/repos/${repoFullName}/issues/${prNumber}/comments`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${dynamicToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ body: commentBody })
    });

    if (commentResponse.ok) {
        console.log("🎉 SUCCESS! Comment posted to GitHub.");
    } else {
        console.error("❌ Failed to post comment:", await commentResponse.text());
    }
}

module.exports = {
    generateAppJWT,
    getInstallationToken,
    fetchPRDiff,
    postPRComment
};