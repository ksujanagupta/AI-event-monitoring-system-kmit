const express = require('express');
const router = express.Router();
const Issue = require('../models/Issue');
const User = require('../models/User');

// Route for attendees to report issues
router.post('/issues/report', async (req, res) => {
  const { reportedBy, description, location } = req.body;

  try {
    const reporter = await User.findById(reportedBy);
    if (!reporter || reporter.role !== 'attendee') {
      return res.status(403).json({ msg: 'Forbidden: Only attendees can report issues.' });
    }

    const newIssue = new Issue({
      reportedBy,
      description,
      location,
    });

    await newIssue.save();

    // Emit a Socket.IO event to all connected admin clients
    req.app.get('io').emit('newIssueAlert', { issue: newIssue, reporterName: reporter.name });

    res.status(201).json({ msg: 'Issue reported successfully', issue: newIssue });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Route for attendees to get their alerts
router.get('/attendee/alerts', async (req, res) => {
  try {
    const { attendeeId } = req.query;

    const attendeeUser = await User.findById(attendeeId);
    if (!attendeeUser || attendeeUser.role !== 'attendee' || !attendeeUser.isApproved) {
      return res.status(403).json({ msg: 'Forbidden: Not an approved attendee.' });
    }

    const alerts = await Issue.find({
      $or: [
        { reportedBy: attendeeId },
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

