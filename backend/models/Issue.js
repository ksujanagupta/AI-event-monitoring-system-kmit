const mongoose = require('mongoose');

const IssueSchema = new mongoose.Schema({
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  description: { type: String, required: true },
  location: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
  },
  timestamp: { type: Date, default: Date.now },
  status: { type: String, enum: ['reported', 'in-progress', 'resolved'], default: 'reported' },
  assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  acceptedAt: { type: Date },
  needBackup: { type: Boolean, default: false },
  resolvedAt: { type: Date },
  isAdminCreated: { type: Boolean, default: false },
  audience: { type: String, enum: ['volunteers', 'attendees', 'both'], default: 'both' },
});

module.exports = mongoose.model('Issue', IssueSchema);

