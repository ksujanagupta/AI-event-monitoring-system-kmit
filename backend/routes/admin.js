const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Issue = require('../models/Issue');
const path = require('path');
const fs = require('fs');
const { requireRole } = require('../middleware/auth');

const adminOnly = requireRole('admin');

// Admin route to approve a user
router.put('/admin/approve-user/:id', adminOnly, async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndUpdate(id, { isApproved: true }, { new: true });

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.json({ msg: 'User approved successfully', user });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Admin route to get all users
router.get('/admin/users', adminOnly, async (req, res) => {
  try {
    const { role } = req.query;

    let query = {};
    if (role) {
      query.role = role;
    }

    const users = await User.find(query).select('-password');
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Admin route to delete a user
router.delete('/admin/users/:id', adminOnly, async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    if (user.imagePath) {
      const imageFullPath = path.join(__dirname, '..', user.imagePath);
      fs.unlink(imageFullPath, (err) => {
        if (err) {
          console.error('Error deleting image file:', err);
        }
      });
    }

    res.json({ msg: 'User deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Admin route to delete an issue
router.delete('/admin/issues/:id', adminOnly, async (req, res) => {
  try {
    const { id } = req.params;

    const issue = await Issue.findByIdAndDelete(id);

    if (!issue) {
      return res.status(404).json({ msg: 'Issue not found' });
    }

    req.app.get('io').emit('issueUpdated', { issueId: id, deleted: true });

    res.json({ msg: 'Issue deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Admin route to get all issues
router.get('/admin/issues', adminOnly, async (req, res) => {
  try {
    const issues = await Issue.find().populate('reportedBy', 'name').populate('assignedTo', 'name');
    res.json(issues);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Admin route to mark an issue as resolved
router.put('/admin/issues/:id/resolve', adminOnly, async (req, res) => {
  try {
    const { id } = req.params;

    const issue = await Issue.findByIdAndUpdate(id, { status: 'resolved' }, { new: true });

    if (!issue) {
      return res.status(404).json({ msg: 'Issue not found' });
    }

    res.json({ msg: 'Issue resolved successfully', issue });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Admin route to create a new alert
router.post('/admin/alerts', adminOnly, async (req, res) => {
  try {
    const { title, message, severity, audience } = req.body;

    const defaultLocation = { latitude: 17.3850, longitude: 78.4867 };

    const newAlert = new Issue({
      reportedBy: req.user.id,
      description: `${title}: ${message}`,
      location: defaultLocation,
      status: 'reported',
      isAdminCreated: true,
      severity: severity,
      audience: audience || 'both'
    });

    await newAlert.save();

    req.app.get('io').emit('newIssueAlert', { issue: newAlert, reporterName: req.user.name });

    res.status(201).json({ msg: 'Alert created successfully', alert: newAlert });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Admin route to get all approved volunteers
router.get('/admin/volunteers', adminOnly, async (req, res) => {
  try {
    const volunteers = await User.find({ role: 'volunteer', isApproved: true }).select('-password');
    res.json(volunteers);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Admin route to assign a volunteer to an issue
router.put('/admin/issues/:issueId/assign', adminOnly, async (req, res) => {
  try {
    const { issueId } = req.params;
    const { volunteerIds } = req.body;

    if (!Array.isArray(volunteerIds) || volunteerIds.length === 0) {
      return res.status(400).json({ msg: 'volunteerIds must be a non-empty array.' });
    }

    const volunteers = await User.find({ _id: { $in: volunteerIds }, role: 'volunteer', isApproved: true });
    if (volunteers.length !== volunteerIds.length) {
      return res.status(404).json({ msg: 'One or more volunteers not found or not approved.' });
    }

    const issue = await Issue.findByIdAndUpdate(
      issueId,
      { $set: { status: 'in-progress', assignedTo: volunteerIds } },
      { new: true }
    ).populate('reportedBy', 'name').populate('assignedTo', 'name');

    if (!issue) {
      return res.status(404).json({ msg: 'Issue not found' });
    }

    await User.updateMany({ _id: { $in: volunteerIds } }, { status: 'busy' });

    req.app.get('io').emit('issueUpdated', { issue });

    res.json({ msg: 'Volunteer(s) assigned successfully', issue });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Admin route for 24-Hour Activity Summary (alerts reported vs. resolved)
router.get('/admin/activity-summary', adminOnly, async (req, res) => {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const activity = await Issue.aggregate([
      { $match: { timestamp: { $gte: twentyFourHoursAgo } } },
      { $project: {
        hour: { $hour: { date: "$timestamp", timezone: "+05:30" } },
        status: 1,
      }},
      { $group: {
        _id: "$hour",
        alerts: { $sum: { $cond: [{ $in: ["$status", ["reported", "in-progress"]] }, 1, 0] } },
        resolved: { $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] } },
      }},
      { $sort: { _id: 1 } }
    ]);

    const formattedActivity = Array.from({ length: 24 }, (_, i) => ({
      time: `${i < 10 ? '0' : ''}${i}:00`,
      alerts: 0,
      resolved: 0,
    }));

    activity.forEach(hourData => {
      const hourIndex = hourData._id;
      if (hourIndex >= 0 && hourIndex < 24) {
        formattedActivity[hourIndex].alerts = hourData.alerts;
        formattedActivity[hourIndex].resolved = hourData.resolved;
      }
    });

    res.json(formattedActivity);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Admin route for Top Volunteers (by resolved issues)
router.get('/admin/top-volunteers', adminOnly, async (req, res) => {
  try {
    const topVolunteers = await User.aggregate([
      { $match: { role: 'volunteer', isApproved: true } },
      { $lookup: {
        from: 'issues',
        let: { volunteerId: '$_id' },
        pipeline: [
          { $addFields: {
            assignedToArray: { $cond: [
              { $isArray: "$assignedTo" },
              "$assignedTo",
              { $cond: [
                { $ne: ["$assignedTo", null] },
                ["$assignedTo"],
                []
              ]}
            ]}
          }},
          { $match: {
            $expr: {
              $and: [
                { $in: ['$$volunteerId', '$assignedToArray'] },
                { $eq: ['$status', 'resolved'] }
              ]
            }
          }}
        ],
        as: 'resolvedIssues'
      }},
      { $project: {
        _id: 0,
        name: '$name',
        tasks: { $size: '$resolvedIssues' }
      }},
      { $sort: { tasks: -1 } }
    ]);

    res.json(topVolunteers);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Approved volunteer locations (admin map + volunteer geo-location page)
router.get('/admin/volunteer-locations', requireRole('admin', 'volunteer'), async (req, res) => {
  try {
    const volunteerLocations = await User.find({ role: 'volunteer', isApproved: true, 'lastKnownLocation.latitude': { $exists: true } })
      .select('name lastKnownLocation status');

    res.json(volunteerLocations);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Admin route to broadcast an existing alert to attendees
router.post('/admin/issues/:issueId/broadcast-to-attendees', adminOnly, async (req, res) => {
  try {
    const { issueId } = req.params;

    const issue = await Issue.findById(issueId).populate('reportedBy', 'name');
    if (!issue) {
      return res.status(404).json({ msg: 'Issue not found' });
    }

    if (issue.audience !== 'both') {
      issue.audience = 'both';
      await issue.save();
    }

    req.app.get('io').emit('issueUpdated', { issue: issue });

    res.json({ msg: 'Alert broadcasted to attendees successfully!', issue });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
