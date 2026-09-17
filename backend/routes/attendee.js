const express = require('express');
const router = express.Router();
const Issue = require('../models/Issue');
const { requireRole } = require('../middleware/auth');

// Route for attendees to report issues
router.post('/issues/report', requireRole('attendee'), async (req, res) => {
  const { description, location } = req.body;

  try {
    const newIssue = new Issue({
      reportedBy: req.user.id,
      description,
      location,
    });

    await newIssue.save();

    // Emit a Socket.IO event to all connected admin clients
    req.app.get('io').emit('newIssueAlert', { issue: newIssue, reporterName: req.user.name });

    res.status(201).json({ msg: 'Issue reported successfully', issue: newIssue });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Route for attendees to get their alerts
router.get('/attendee/alerts', requireRole('attendee'), async (req, res) => {
  try {
    const alerts = await Issue.find({
      $or: [
        { reportedBy: req.user.id },
        { isAdminCreated: true, audience: { $in: ['attendees', 'both'] } },
      ],
      status: { $ne: 'resolved' },
    })
      .populate('reportedBy', 'name')
      .sort({ timestamp: -1 });

    res.json(alerts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
