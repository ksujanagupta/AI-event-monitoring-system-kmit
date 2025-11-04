const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Issue = require('../models/Issue');

// Route for volunteers to get their assigned issues
router.get('/volunteer/assigned-issues', async (req, res) => {
  try {
    const { volunteerId } = req.query;

    const volunteer = await User.findById(volunteerId);
    if (!volunteer || volunteer.role !== 'volunteer' || !volunteer.isApproved) {
      return res.status(403).json({ msg: 'Forbidden: Not an approved volunteer.' });
    }

    const assignedIssues = await Issue.find({ assignedTo: { $in: [volunteerId] }, status: { $ne: 'resolved' } })
      .populate('reportedBy', 'name').populate('assignedTo', 'name');

    res.json(assignedIssues);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Route for volunteers to accept an assigned issue
router.put('/volunteer/issues/:issueId/accept', async (req, res) => {
  try {
    const { issueId } = req.params;
    const { volunteerId, needBackup } = req.body;

    const volunteer = await User.findById(volunteerId);
    if (!volunteer || volunteer.role !== 'volunteer' || !volunteer.isApproved) {
      return res.status(403).json({ msg: 'Forbidden: Not an approved volunteer.' });
    }

    const issue = await Issue.findByIdAndUpdate(
      issueId,
      { $set: { status: 'in-progress', acceptedAt: new Date(), needBackup: needBackup }, $addToSet: { assignedTo: volunteerId } },
      { new: true }
    ).populate('reportedBy', 'name').populate('assignedTo', 'name');

    if (!issue) {
      return res.status(404).json({ msg: 'Issue not found' });
    }

    await User.findByIdAndUpdate(volunteerId, { status: 'busy' });

    req.app.get('io').emit('issueUpdated', { issue });

    res.json({ msg: 'Issue accepted successfully', issue });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Route for volunteers to mark an issue as resolved
router.put('/volunteer/issues/:issueId/resolve', async (req, res) => {
  try {
    const { issueId } = req.params;
    const { volunteerId } = req.body;

    const volunteer = await User.findById(volunteerId);
    if (!volunteer || volunteer.role !== 'volunteer' || !volunteer.isApproved) {
      return res.status(403).json({ msg: 'Forbidden: Not an approved volunteer.' });
    }

    const issue = await Issue.findByIdAndUpdate(
      issueId,
      { $set: { status: 'resolved', resolvedAt: new Date() } },
      { new: true }
    ).populate('reportedBy', 'name').populate('assignedTo', 'name');

    if (!issue) {
      return res.status(404).json({ msg: 'Issue not found' });
    }

    if (issue.assignedTo && issue.assignedTo.length > 0) {
      for (const assignedVolunteer of issue.assignedTo) {
        const volunteerId = assignedVolunteer._id;

        const activeIssuesCount = await Issue.countDocuments({
          assignedTo: volunteerId,
          status: { $in: ['reported', 'in-progress'] },
          _id: { $ne: issue._id }
        });

        if (activeIssuesCount === 0) {
          await User.findByIdAndUpdate(volunteerId, { status: 'available' });
        }
      }
    }

    req.app.get('io').emit('issueUpdated', { issue });

    res.json({ msg: 'Issue resolved successfully', issue });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Route for volunteers to ask for backup
router.put('/volunteer/issues/:issueId/ask-for-backup', async (req, res) => {
  try {
    const { issueId } = req.params;
    const { volunteerId } = req.body;

    const volunteer = await User.findById(volunteerId);
    if (!volunteer || volunteer.role !== 'volunteer' || !volunteer.isApproved) {
      return res.status(403).json({ msg: 'Forbidden: Not an approved volunteer.' });
    }

    const issue = await Issue.findByIdAndUpdate(
      issueId,
      { $set: { needBackup: true } },
      { new: true }
    ).populate('reportedBy', 'name').populate('assignedTo', 'name');

    if (!issue) {
      return res.status(404).json({ msg: 'Issue not found' });
    }

    req.app.get('io').emit('issueUpdated', { issue });

    res.json({ msg: 'Backup request sent successfully', issue });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Route for volunteers to take over a backup request (accept an issue)
router.put('/volunteer/issues/:issueId/take-backup', async (req, res) => {
  try {
    const { issueId } = req.params;
    const { newVolunteerId } = req.body;

    const newVolunteer = await User.findById(newVolunteerId);
    if (!newVolunteer || newVolunteer.role !== 'volunteer' || !newVolunteer.isApproved) {
      return res.status(403).json({ msg: 'Forbidden: Not an approved volunteer.' });
    }

    const originalIssue = await Issue.findById(issueId);
    if (!originalIssue) {
      return res.status(404).json({ msg: 'Issue not found' });
    }

    if (!originalIssue.needBackup) {
      return res.status(400).json({ msg: 'Backup not requested for this issue.' });
    }

    const issue = await Issue.findByIdAndUpdate(
      issueId,
      { $set: { needBackup: false, status: 'in-progress', acceptedAt: new Date() }, $addToSet: { assignedTo: newVolunteerId } },
      { new: true }
    ).populate('reportedBy', 'name').populate('assignedTo', 'name');

    if (!issue) {
      return res.status(404).json({ msg: 'Issue not found after update' });
    }

    await User.findByIdAndUpdate(newVolunteerId, { status: 'busy' });

    req.app.get('io').emit('issueUpdated', { issue });

    res.json({ msg: 'Issue reassigned successfully to backup volunteer', issue });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;

