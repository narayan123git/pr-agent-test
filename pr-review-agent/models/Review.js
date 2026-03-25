const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  installationId: { type: String, required: true, index: true },
  
  // PR Details
  repoName: { type: String, required: true },
  prNumber: { type: Number, required: true },
  prTitle: { type: String, required: true },
  prAuthor: { type: String },
  prUrl: { type: String },

  // AI Analytics
  aiFeedback: { type: String, required: true }, // The full markdown comment
  metrics: {
    vulnerabilityCount: { type: Number, default: 0 }, // e.g., tracking XSS, injections, etc.
    bugsFound: { type: Number, default: 0 },
    performanceIssues: { type: Number, default: 0 },
  },
  
  // High-level tags for the frontend UI
  securityStatus: { 
    type: String, 
    enum: ['Clean', 'Warning', 'Critical'], 
    default: 'Clean' 
  },
  
  createdAt: { type: Date, default: Date.now, expires: '30d' }
});

module.exports = mongoose.model('Review', ReviewSchema);