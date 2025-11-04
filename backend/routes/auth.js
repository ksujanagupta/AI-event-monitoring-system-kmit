const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists (can be moved to a config file later)
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR);
}

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage });

// Route for user signup
router.post('/signup', upload.single('image'), async (req, res) => {
  const { name, email, password, role } = req.body;
  const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({
      name,
      email,
      password: hashedPassword,
      role,
      imagePath,
      isApproved: role === 'admin' ? true : false
    });

    await user.save();
    res.status(201).json({ msg: 'User registered successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Route for user login
router.post('/login', async (req, res) => {
  const { name, password, role, latitude, longitude, accuracy } = req.body;
  console.log('Login attempt for:', { name, role, latitude, longitude, accuracy });
  try {
    let user = await User.findOne({ name });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    if (user.role !== role) {
      return res.status(403).json({ msg: `Access denied. You are a ${user.role}.` });
    }

    if (user.role !== 'admin' && !user.isApproved) {
      return res.status(403).json({ msg: 'Your account is pending admin approval.' });
    }

    if (user.role === 'volunteer' && latitude !== undefined && longitude !== undefined) {
      user.lastKnownLocation = { latitude, longitude, accuracy };
      await user.save();
      console.log('Volunteer lastKnownLocation updated to:', user.lastKnownLocation);
    }

    res.json({ msg: 'Logged in successfully', role: user.role, userId: user._id });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;

