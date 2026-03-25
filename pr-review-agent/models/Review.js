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
  aiFeedback: { type: String, required: true },
  metrics: {
    vulnerabilityCount: { type: Number, default: 0 },
    bugsFound: { type: Number, default: 0 },
    performanceIssues: { type: Number, default: 0 },
  },
  
  securityStatus: { 
    type: String, 
    enum: ['Clean', 'Warning', 'Critical'], 
    default: 'Clean' 
  },
  
  // 👇 FIXED: This tells MongoDB to expect a String, not a variable!
  commitSha: { type: String, required: true }, 
  
  createdAt: { type: Date, default: Date.now, expires: '30d' }
});

module.exports = mongoose.model('Review', ReviewSchema);