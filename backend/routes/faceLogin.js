// backend/routes/faceLogin.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');

// cosine similarity
function cosineSimilarity(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

router.post('/volunteer/face-login', async (req, res) => {
  try {
    const { name, descriptor } = req.body;
    
    console.log('Face login attempt for:', name);
    console.log('Descriptor received:', descriptor ? `Array of length ${descriptor.length}` : 'null');
    
    if (!name || !descriptor || !Array.isArray(descriptor)) {
      console.log('Validation failed: Missing/invalid data');
      return res.status(400).json({ msg: 'Missing/invalid data' });
    }

    if (descriptor.length !== 128) {
      console.log(`Validation failed: Invalid descriptor length ${descriptor.length}, expected 128`);
      return res.status(400).json({ msg: 'Invalid descriptor length' });
    }

    const user = await User.findOne({ name, role: 'volunteer' });
    
    if (!user) {
      console.log(`User not found: ${name} with role volunteer`);
      return res.status(404).json({ msg: 'Volunteer not found' });
    }
    
    if (!user.faceDescriptor) {
      console.log(`User found but no face descriptor registered for: ${name}`);
      return res.status(404).json({ msg: 'No face registered for this volunteer. Please register your face first.' });
    }

    if (!Array.isArray(user.faceDescriptor) || user.faceDescriptor.length !== 128) {
      console.log(`Invalid face descriptor in database for user: ${name}`);
      return res.status(500).json({ msg: 'Invalid face data in database' });
    }

    const sim = cosineSimilarity(descriptor, user.faceDescriptor);
    console.log(`Cosine similarity for ${name}: ${sim.toFixed(4)}`);

    // threshold: choose >= 0.50-0.65 depending on tuning (0.6 is a good start)
    // Lowered slightly to 0.55 for better matching tolerance
    const THRESHOLD = 0.55;
    
    if (sim >= THRESHOLD) {
      console.log(`✅ Face verified for ${name} (similarity: ${sim.toFixed(4)})`);
      return res.json({ success: true, msg: 'Face verified', similarity: sim });
    }
    
    console.log(`❌ Face does not match for ${name} (similarity: ${sim.toFixed(4)}, threshold: ${THRESHOLD})`);
    return res.status(401).json({ 
      success: false, 
      msg: `Face does not match. Similarity: ${sim.toFixed(4)} (required: ${THRESHOLD})` 
    });
  } catch (err) {
    console.error('Error in face-login:', err);
    return res.status(500).json({ msg: 'Server error: ' + err.message });
  }
});

module.exports = router;
