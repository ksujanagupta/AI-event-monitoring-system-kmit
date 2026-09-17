const mongoose = require('mongoose');

// A lost item or missing child reported in Lost & Found
const LostReportSchema = new mongoose.Schema({
  type: { type: String, enum: ['item', 'child'], required: true },
  name: { type: String },
  age: { type: Number },
  item: { type: String },
  description: { type: String },
  location: { type: String },
  reportedBy: { type: String },
  guardian: { type: String },
  imagePath: { type: String },
  status: { type: String, enum: ['open', 'found'], default: 'open' },
  match: {
    video: { type: String },
    frame: { type: Number },
    output_url: { type: String },
  },
}, { timestamps: true });

module.exports = mongoose.model('LostReport', LostReportSchema);
