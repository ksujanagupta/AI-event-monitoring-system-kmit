import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircleIcon, ClockIcon, AlertTriangleIcon, TrendingUpIcon, ArrowLeftIcon, XIcon, UsersIcon } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

interface IssueData {
  _id: string;
  reportedBy: { _id: string; name: string };
  description: string;
  location: { latitude: number; longitude: number };
  timestamp: string;
  status: 'reported' | 'in-progress' | 'resolved';
  assignedTo?: { _id: string; name: string }[]; // Changed to array
  acceptedAt?: string;
  needBackup?: boolean;
  resolvedAt?: string;
}

export function VolunteerDashboardHome() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null); // Volunteer's ID from local storage
  const [assignedIssues, setAssignedIssues] = useState<IssueData[]>([]);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null); // Changed to string for _id
  const [recentActivity, setRecentActivity] = useState<IssueData[]>([]); // New state for recent activity
  const [backupRequests, setBackupRequests] = useState<IssueData[]>([]); // New state for backup requests

  // Fetch userId from local storage
  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      setUserId(storedUserId);
    }
  }, []);

  // Socket.IO connection for real-time updates
  useEffect(() => {
    const socket: Socket = io('http://localhost:5000');

    socket.on('connect', () => {
      console.log('Connected to Socket.IO server from volunteer dashboard');
    });

    socket.on('issueUpdated', (data: { issue: IssueData }) => {
      console.log('Issue updated received by volunteer:', data);

      setAssignedIssues((prevIssues) =>
        prevIssues.map((issue) =>
          issue._id === data.issue._id ? { ...issue, ...data.issue } : issue
        ).filter(issue => issue.assignedTo?.some(assigned => assigned._id === userId) && issue.status !== 'resolved') // Filter assigned issues for current volunteer
      );

      // If the updated issue is resolved, add it to recent activity
      if (data.issue.status === 'resolved') {
        setRecentActivity((prevActivity) => [
          data.issue,
          ...prevActivity.filter((activity) => activity._id !== data.issue._id),
        ]);
      }

      // Handle backup requests for other volunteers
      setBackupRequests((prevRequests) => {
        if (data.issue.needBackup && !data.issue.assignedTo?.some(assigned => assigned._id === userId) && data.issue.status !== 'resolved') {
          // Add if it's a new backup request for this volunteer and not assigned to them
          if (!prevRequests.some((req) => req._id === data.issue._id)) {
            return [data.issue, ...prevRequests];
          }
          // Update existing backup request
          return prevRequests.map((req) =>
            req._id === data.issue._id ? { ...req, ...data.issue } : req
          );
        } else {
          // Remove if backup is no longer needed or assigned to this volunteer or resolved
          return prevRequests.filter((req) => req._id !== data.issue._id);
        }
      });
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from Socket.IO server from volunteer dashboard');
    });

    return () => {
      socket.disconnect();
    };
  }, [userId]); // Include userId in dependency array to re-run effect if userId changes

  // Fetch assigned issues and resolved issues for initial recent activity
  useEffect(() => {
    const fetchAssignedAndResolvedIssues = async () => {
      if (!userId) return; // Don't fetch if userId is not available yet
      try {
        const response = await fetch(`http://localhost:5000/api/volunteer/assigned-issues?volunteerId=${userId}`);
        const data = await response.json();
        if (response.ok) {
          setAssignedIssues(data.filter(issue => issue.assignedTo?.some(assigned => assigned._id === userId) && issue.status !== 'resolved')); // Filter for issues assigned to current volunteer
          setRecentActivity(data.filter(issue => issue.status === 'resolved'));

          // Initialize backup requests with issues that need backup and are not assigned to current user
          setBackupRequests(data.filter(issue => issue.needBackup && !issue.assignedTo?.some(assigned => assigned._id === userId) && issue.status !== 'resolved'));

        } else {
          alert(data.msg || 'Failed to fetch assigned issues');
        }
      } catch (error) {
        console.error('Error fetching assigned issues:', error);
        alert('Server error while fetching assigned issues');
      }
    };
    fetchAssignedAndResolvedIssues();
    // Re-fetch when userId changes (i.e., after it's loaded from local storage)
  }, [userId]);

  const stats = [
    {
      label: 'Tasks Completed Today',
      value: assignedIssues.filter(issue => issue.status === 'resolved').length.toString(), // Count resolved tasks for current volunteer
      icon: CheckCircleIcon,
      color: 'green'
    },
    {
      label: 'Active Assignments',
      value: assignedIssues.filter(issue => issue.status === 'in-progress').length.toString(),
      icon: ClockIcon,
      color: 'blue'
    },
    {
      label: 'Urgent Alerts',
      value: assignedIssues.filter(issue => issue.description.toLowerCase().includes('critical') || issue.description.toLowerCase().includes('emergency')).length.toString(),
      icon: AlertTriangleIcon,
      color: 'red'
    },
    {
      label: 'Backup Requests',
      value: backupRequests.length.toString(),
      icon: UsersIcon,
      color: 'yellow'
    },
  ];

  const handleAccept = async (issueId: string) => {
    if (!userId) {
      alert("Error: User not logged in.");
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/volunteer/issues/${issueId}/accept`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ volunteerId: userId, needBackup: false }), // When initially accepting, no backup is needed yet
      });
      const data = await response.json();
      if (response.ok) {
        alert('Assignment accepted!');
        // The issueUpdated socket event will handle updating the state
        // Also remove from backup requests if it was there and current user accepted it.
        setBackupRequests(prevRequests => prevRequests.filter(req => req._id !== issueId));
      } else {
        alert(data.msg || 'Failed to accept assignment');
      }
    } catch (error) {
      console.error('Error accepting assignment:', error);
      alert('Server error while accepting assignment');
    }
  };

  const handleConfirmAccept = async (needBackup: boolean) => {
    if (!selectedAssignmentId || !userId) {
      alert("Error: Missing assignment ID or user ID.");
      return;
    }
    try {
      const response = await fetch(`http://localhost:5000/api/volunteer/issues/${selectedAssignmentId}/accept`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ volunteerId: userId, needBackup }),
      });
      const data = await response.json();
      if (response.ok) {
        if (needBackup) {
          alert('Backup requested! Other volunteers have been notified.');
        }
        setShowBackupModal(false);
        setSelectedAssignmentId(null);
      } else {
        alert(data.msg || 'Failed to accept assignment');
      }
    } catch (error) {
      console.error('Error accepting assignment:', error);
      alert('Server error while accepting assignment');
    }
  };

  const handleResolve = async (issueId: string) => {
    if (!window.confirm('Are you sure you want to mark this assignment as resolved?')) {
      return;
    }
    if (!userId) {
      alert("Error: User not logged in.");
      return;
    }
    try {
      const response = await fetch(`http://localhost:5000/api/volunteer/issues/${issueId}/resolve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ volunteerId: userId }),
      });
      const data = await response.json();
      if (response.ok) {
        alert('Assignment resolved successfully!');
        setAssignedIssues(prevIssues => prevIssues.filter(issue => issue._id !== issueId));
      } else {
        alert(data.msg || 'Failed to resolve assignment');
      }
    } catch (error) {
      console.error('Error resolving assignment:', error);
      alert('Server error while resolving assignment');
    }
  };

  const handleAskForBackup = async (issueId: string) => {
    if (!userId) {
      alert("Error: User not logged in.");
      return;
    }
    try {
      const response = await fetch(`http://localhost:5000/api/volunteer/issues/${issueId}/ask-for-backup`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ volunteerId: userId }),
      });
      const data = await response.json();
      if (response.ok) {
        alert('Backup requested successfully!');
        // The issueUpdated socket event will handle updating the state, including adding to backupRequests for others
      } else {
        alert(data.msg || 'Failed to request backup');
      }
    } catch (error) {
      console.error('Error requesting backup:', error);
      alert('Server error while requesting backup');
    }
  };

  const handleAcceptBackup = async (issueId: string) => {
    if (!userId) {
      alert("Error: User not logged in.");
      return;
    }
    try {
      const response = await fetch(`http://localhost:5000/api/volunteer/issues/${issueId}/take-backup`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newVolunteerId: userId }),
      });
      const data = await response.json();
      if (response.ok) {
        alert('You have accepted the backup request!');
        // The issueUpdated socket event will handle updating states for all volunteers
      } else {
        alert(data.msg || 'Failed to accept backup request');
      }
    } catch (error) {
      console.error('Error accepting backup request:', error);
      alert('Server error while accepting backup request');
    }
  };

  const handleRejectBackup = (issueId: string) => {
    // Locally remove the backup request from this volunteer's view
    setBackupRequests((prevRequests) =>
      prevRequests.filter((request) => request._id !== issueId)
    );
    alert('Backup request rejected.');
  };

  const activeAssignments = assignedIssues.filter(issue => issue.status === 'reported');
  const acceptedAssignments = assignedIssues.filter(issue => issue.status === 'in-progress');

  return (
    <div className="p-6 space-y-6">
      {/* Back Button */}
      <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
        <ArrowLeftIcon className="w-4 h-4" />
        <span>Back to Home</span>
      </button>
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">
          Welcome Back, Volunteer!
        </h1>
        <p className="text-slate-400">
          Here is your current status and assignments
        </p>
      </div>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className={`w-12 h-12 rounded-lg bg-${stat.color}-600/20 flex items-center justify-center mb-4`}>
              <stat.icon className={`w-6 h-6 text-${stat.color}-400`} />
            </div>
            <h3 className="text-slate-400 text-sm mb-1">{stat.label}</h3>
            <p className="text-3xl font-bold text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Backup Requests Section */}
      {backupRequests.length > 0 && (
        <div className="bg-slate-900 border border-yellow-800 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4">Backup Requests</h3>
          <div className="space-y-3">
            {backupRequests.map((request) => (
              <div key={request._id} className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-white font-semibold">Backup for: {request.description.split('.')[0]}</h4>
                    <p className="text-slate-400 text-sm">
                      Reported by: {request.reportedBy.name} • Assigned To: {request.assignedTo?.map(a => a.name).join(', ') || 'N/A'}
                    </p>
                    <p className="text-slate-400 text-sm">
                      Lat: {request.location.latitude.toFixed(4)}, Lng: {request.location.longitude.toFixed(4)}
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-600/20 text-yellow-400">
                    Backup Needed
                  </span>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleAcceptBackup(request._id)}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircleIcon className="w-4 h-4" />
                    Accept
                  </button>
                  <button
                    onClick={() => handleRejectBackup(request._id)}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-all flex items-center justify-center gap-2"
                  >
                    <XIcon className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Assignments */}
      {activeAssignments.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4">Active Assignments</h3>
          <div className="space-y-3">
            {activeAssignments.map((assignment) => (
              <div key={assignment._id} className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-white font-semibold">{assignment.description.split('.')[0]}</h4>
                    <p className="text-slate-400 text-sm">
                      Lat: {assignment.location.latitude.toFixed(4)}, Lng: {assignment.location.longitude.toFixed(4)}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${assignment.status === 'reported' ? 'bg-red-600/20 text-red-400' : 'bg-orange-600/20 text-orange-400'}`}>
                    {assignment.status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm">
                    Reported: {new Date(assignment.timestamp).toLocaleString()}
                  </span>
                  <button onClick={() => handleAccept(assignment._id)} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-all">
                    Accept
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Accepted Assignments (In Progress) */}
      {acceptedAssignments.length > 0 && (
        <div className="bg-slate-900 border border-blue-800 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4">In Progress</h3>
          <div className="space-y-3">
            {acceptedAssignments.map((assignment) => (
              <div key={assignment._id} className="bg-blue-900/30 border border-blue-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-white font-semibold">{assignment.description.split('.')[0]}</h4>
                    <p className="text-slate-400 text-sm">
                      Lat: {assignment.location.latitude.toFixed(4)}, Lng: {assignment.location.longitude.toFixed(4)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {assignment.needBackup && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-600/20 text-blue-400 flex items-center gap-1">
                        <UsersIcon className="w-3 h-3" />
                        Backup Requested
                      </span>
                    )}
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-600/20 text-blue-400">
                      In Progress
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm">
                    Assigned To: {assignment.assignedTo?.map(a => a.name).join(', ')}
                  </span>
                  <div className="flex gap-2">
                    {!assignment.needBackup && (
                      <button
                        onClick={() => handleAskForBackup(assignment._id)}
                        className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm transition-all flex items-center gap-2"
                      >
                        <UsersIcon className="w-4 h-4" />
                        Ask for Backup
                      </button>
                    )}
                    <button onClick={() => handleResolve(assignment._id)} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-all flex items-center gap-2">
                      <CheckCircleIcon className="w-4 h-4" />
                      Resolved
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Recent Activity */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {recentActivity.length === 0 ? (
            <p className="text-slate-400">No recent activity.</p>
          ) : (
            recentActivity.map((activity) => (
              <div key={activity._id} className="flex items-center justify-between py-3 border-b border-slate-800 last:border-0">
                <div>
                  <p className="text-white font-medium">Resolved: {activity.description.split('.')[0]}</p>
                  <p className="text-slate-400 text-sm">
                    Lat: {activity.location.latitude.toFixed(4)}, Lng: {activity.location.longitude.toFixed(4)} • {new Date(activity.resolvedAt || activity.timestamp).toLocaleString()}
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-600/20 text-green-400">
                  Resolved
                </span>
              </div>
            ))
          )}
        </div>
      </div>
      {/* Backup Request Modal */}
      {showBackupModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Accept Assignment</h3>
              <button
                onClick={() => {
                  setShowBackupModal(false);
                  setSelectedAssignmentId(null);
                }}
                className="p-2 hover:bg-slate-800 rounded-lg transition-all"
              >
                <XIcon className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <p className="text-slate-300 mb-6">Do you need backup for this assignment?</p>
            <div className="flex gap-3">
              <button
                onClick={() => handleConfirmAccept(false)}
                className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-all"
              >
                Accept Alone
              </button>
              <button
                onClick={() => handleConfirmAccept(true)}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2"
              >
                <UsersIcon className="w-4 h-4" />
                Request Backup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}