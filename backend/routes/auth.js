const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const fs = require('fs');
const User = require('../models/User');
const upload = require('../config/upload');
const { signToken, isDescriptor, faceMatches } = require('../middleware/auth');

// Route for user signup (admins are created with scripts/createAdmin.js)
router.post('/signup', upload.single('image'), async (req, res) => {
  const reject = (status, msg) => {
    if (req.file) fs.unlink(req.file.path, () => {});
    return res.status(status).json({ msg });
  };

  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim();
  const { password, role } = req.body;

  if (!name || !email || !password) {
    return reject(400, 'Name, email and password are required.');
  }
  if (!['volunteer', 'attendee'].includes(role)) {
    return reject(400, 'You can only sign up as a volunteer or attendee.');
  }

  let faceDescriptor = null;
  if (role === 'volunteer') {
    try { faceDescriptor = JSON.parse(req.body.descriptor); } catch { /* checked below */ }
    if (!isDescriptor(faceDescriptor)) {
      return reject(400, 'Volunteers need a clear face photo.');
    }
  }

  try {
    if (await User.findOne({ $or: [{ name }, { email }] })) {
      return reject(400, 'That name or email is already registered.');
    }

    await User.create({
      name,
      email,
      password: await bcrypt.hash(String(password), 10),
      role,
      imagePath: req.file ? `/uploads/${req.file.filename}` : undefined,
      faceDescriptor,
      isApproved: false,
    });

    res.status(201).json({ msg: 'Account created. Wait for admin approval, then log in.' });
  } catch (err) {
    console.error(err.message);
    reject(500, 'Server error');
  }
});

// Route for user login (volunteers must also send a face descriptor)
router.post('/login', async (req, res) => {
  const { password, role, latitude, longitude, accuracy, descriptor } = req.body;
  const name = String(req.body.name || '');
  try {
    const user = await User.findOne({ name });
    if (!user || !(await bcrypt.compare(String(password || ''), user.password))) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    if (user.role !== role) {
      return res.status(403).json({ msg: `Access denied. You are a ${user.role}.` });
    }

    if (user.role !== 'admin' && !user.isApproved) {
      return res.status(403).json({ msg: 'Your account is pending admin approval.' });
    }

    if (user.role === 'volunteer') {
      if (!isDescriptor(user.faceDescriptor)) {
        return res.status(400).json({ msg: 'No face registered for this volunteer. Please sign up again with a face photo.' });
      }
      if (!faceMatches(descriptor, user.faceDescriptor)) {
        return res.status(400).json({ msg: 'Face does not match. Try scanning again.' });
      }
      if (latitude !== undefined && longitude !== undefined) {
        user.lastKnownLocation = { latitude, longitude, accuracy };
        await user.save();
      }
    }

    res.json({ msg: 'Logged in successfully', role: user.role, userId: user._id, token: signToken(user) });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
