// models/Account.js
const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
    // We use the GitHub Username as the primary identifier
    githubUsername: { 
        type: String, 
        required: true, 
        unique: true 
    },
    // The ID provided by the GitHub App installation
    installationId: { 
        type: String, 
        required: true 
    },
    // The user's personal AI key
    geminiKey: { 
        type: String, 
        required: true 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = mongoose.model('Account', accountSchema);