const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.post('/volunteer/register', async (req, res) => {
  try {
    const { name, password, faceDescriptor } = req.body;
    if (!name || !password || !faceDescriptor) return res.status(400).json({ msg: 'Missing data' });

    const existing = await User.findOne({ name });
    if (existing) return res.status(400).json({ msg: 'User exists' });

    const user = new User({ name, password, role: 'volunteer', isApproved: true, faceDescriptor });
    await user.save();
    return res.json({ msg: 'Registered' });
  } catch (err) { console.error(err); return res.status(500).json({ msg: 'Server error' }); }
});

module.exports = router;
