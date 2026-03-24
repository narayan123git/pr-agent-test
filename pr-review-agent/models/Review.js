const mongoose = require('mongoose');

// Define the blueprint for our data
const reviewSchema = new mongoose.Schema({
    repoName: { 
        type: String, 
        required: true 
    },
    prNumber: { 
        type: Number, 
        required: true 
    },
    reviewText: { 
        type: String, 
        required: true 
    },
    createdAt: { 
        type: Date, 
        default: Date.now // Automatically stamps the exact time it was saved
    }
});

// Export the blueprint so we can use it in index.js
module.exports = mongoose.model('Review', reviewSchema);