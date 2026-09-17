const express = require('express');
const router = express.Router();
const fs = require('fs');
const LostReport = require('../models/LostReport');
const upload = require('../config/upload');
const { requireRole } = require('../middleware/auth');

const staff = requireRole('admin', 'volunteer');

router.get('/lost-reports', staff, async (req, res) => {
  try {
    res.json(await LostReport.find().sort({ createdAt: -1 }));
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// multipart: report fields, optional "image" file, optional "match" JSON ({ video, frame, output_url })
router.post('/lost-reports', staff, upload.single('image'), async (req, res) => {
  const { type, name, age, item, description, location, reportedBy, guardian } = req.body;
  let match;
  try { match = req.body.match ? JSON.parse(req.body.match) : undefined; } catch { match = undefined; }

  try {
    const report = await LostReport.create({
      type, name, item, description, location, reportedBy, guardian,
      age: age ? Number(age) : undefined,
      imagePath: req.file ? `/uploads/${req.file.filename}` : undefined,
      status: match ? 'found' : 'open',
      match,
    });
    res.status(201).json(report);
  } catch (err) {
    if (req.file) fs.unlink(req.file.path, () => {});
    const invalid = err.name === 'ValidationError' || err.name === 'CastError';
    res.status(invalid ? 400 : 500).json({ msg: invalid ? err.message : 'Server error' });
  }
});

router.patch('/lost-reports/:id/found', staff, async (req, res) => {
  try {
    const report = await LostReport.findByIdAndUpdate(req.params.id, { status: 'found' }, { new: true });
    if (!report) return res.status(404).json({ msg: 'Report not found' });
    res.json(report);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
