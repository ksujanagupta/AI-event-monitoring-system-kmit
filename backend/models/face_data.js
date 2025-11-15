const mongoose = require('mongoose');

const volunteerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  imagePath: { type: String, required: true }, // Path to uploaded face image
});

module.exports = mongoose.model("Volunteer", volunteerSchema);
