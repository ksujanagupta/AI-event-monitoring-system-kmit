import React, { useState, useEffect } from 'react';
import { BellIcon, ClockIcon, MapPinIcon } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

interface IssueData {
  _id: string;
  reportedBy: { _id: string; name: string };
  description: string;
  location: { latitude: number; longitude: number };
  timestamp: string;
  status: 'reported' | 'in-progress' | 'resolved';
  isAdminCreated?: boolean; // To differentiate admin alerts
  audience?: 'volunteers' | 'attendees' | 'both'; // Added audience field
}

export function AttendeeAlerts() {
  const [alerts, setAlerts] = useState<IssueData[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      setUserId(storedUserId);
    }
  }, []);

  useEffect(() => {
    const socket: Socket = io('http://localhost:5000');

    socket.on('connect', () => {
      console.log('Connected to Socket.IO server for Attendee Alerts');
    });

    socket.on('newIssueAlert', (data: { issue: IssueData; reporterName: string }) => {
      console.log('New issue alert received for attendee via newIssueAlert:', data);
      // Ensure the reportedBy name is available on the issue object
      const newIssueWithReporterName = { ...data.issue, reportedBy: { _id: data.issue.reportedBy._id, name: data.reporterName } };
      setAlerts((prevAlerts) => [newIssueWithReporterName, ...prevAlerts]);
    });

    socket.on('issueUpdated', (data: { issue?: IssueData; issueId?: string; deleted?: boolean }) => {
      console.log('Issue updated via Socket.IO for attendee (direct update):', data);
      setAlerts((prevAlerts) => {
        // Handle deleted issues
        if (data.deleted && data.issueId) {
          return prevAlerts.filter(alert => alert._id !== data.issueId);
        }

        // Handle updated or newly visible issues
        if (data.issue) {
          const updatedIssue = data.issue;
          const isRelevantAndActive =
            (updatedIssue.audience === 'attendees' || updatedIssue.audience === 'both') &&
            updatedIssue.status !== 'resolved';

          const existingAlertIndex = prevAlerts.findIndex(alert => alert._id === updatedIssue._id);

          if (isRelevantAndActive) {
            if (existingAlertIndex > -1) {
              // Update existing alert
              return prevAlerts.map((alert, index) =>
                index === existingAlertIndex ? { ...alert, ...updatedIssue } : alert
              );
            } else {
              // Add new alert (it just became relevant/visible)
              return [updatedIssue, ...prevAlerts]; // Add to the top
            }
          } else {
            // Remove if no longer relevant or resolved
            return prevAlerts.filter(alert => alert._id !== updatedIssue._id);
          }
        }

        return prevAlerts; // No relevant data, return previous state
      });
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from Socket.IO server for Attendee Alerts');
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const fetchAttendeeAlerts = async () => {
    if (!userId) return; // Wait for userId to be available

    try {
      const response = await fetch(`http://localhost:5000/api/attendee/alerts?attendeeId=${userId}`);
      const data = await response.json();

      if (response.ok) {
        console.log('Fetched attendee alerts successfully:', data); // Added log
        setAlerts(data);
      } else {
        console.error('Error fetching attendee alerts:', data.msg); // Added log
        alert(data.msg || 'Failed to fetch alerts');
      }
    } catch (error) {
      console.error('Error during fetchAttendeeAlerts:', error); // Added log
      alert('Server error while fetching alerts');
    }
  };

  useEffect(() => {
    fetchAttendeeAlerts();
  }, [userId]); // Re-fetch when userId becomes available

  const getSeverityColor = (status: string) => {
    switch (status) {
      case 'reported':
        return 'red';
      case 'in-progress':
        return 'orange';
      case 'resolved':
        return 'green';
      default:
        return 'blue';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Event Alerts</h1>
        <p className="text-slate-400">Important updates and notifications</p>
      </div>
      <div className="space-y-4">
        {alerts.length === 0 ? (
          <p className="text-slate-400">No active alerts at the moment.</p>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert._id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full bg-${getSeverityColor(alert.status)}-500`}
                  />
                  <div>
                    <h4 className="text-white font-semibold">{alert.description.split(':')[0].trim()}</h4>
                    <p className="text-slate-400 text-sm">
                      {alert.isAdminCreated ? 'Admin Alert' : `Reported by: ${alert.reportedBy.name}`}
                    </p>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    alert.status === 'reported'
                      ? 'bg-red-600/20 text-red-400'
                      : alert.status === 'in-progress'
                        ? 'bg-orange-600/20 text-orange-400'
                        : 'bg-green-600/20 text-green-400'
                  }`}
                >
                  {alert.status}
                </span>
              </div>
              <p className="text-slate-300 text-sm mb-3">{alert.description.split(':').slice(1).join(':').trim()}</p>
              <div className="flex items-center gap-4 text-sm text-slate-400">
                <span className="flex items-center gap-1">
                  <ClockIcon className="w-4 h-4" />
                  {new Date(alert.timestamp).toLocaleString()}
                </span>
                <span className="flex items-center gap-1">
                  <MapPinIcon className="w-4 h-4" />
                  Lat: {alert.location.latitude.toFixed(4)}, Lng: {alert.location.longitude.toFixed(4)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}