import React, { useState, useEffect, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle, CircleMarker } from 'react-leaflet';
import { BellIcon, CheckIcon, XIcon, UserIcon, ClockIcon, MapPinIcon, EyeIcon, PlusIcon, SendIcon, ArrowLeftIcon } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet'; // Import Leaflet library
import { io, Socket } from 'socket.io-client';

// Fix for default marker icon not appearing (common issue with react-leaflet)
// This ensures Leaflet can find its default marker images
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Removed custom volunteerIcon definition

interface IssueData {
  _id: string;
  reportedBy: { _id: string; name: string };
  description: string;
  location: { latitude: number; longitude: number };
  timestamp: string;
  status: 'reported' | 'in-progress' | 'resolved';
  assignedTo?: { _id: string; name: string }[]; // Changed to array
  audience?: 'volunteers' | 'attendees' | 'both'; // Added audience field
}

interface VolunteerData {
  _id: string;
  name: string;
  email: string;
  status?: 'available' | 'busy'; // Assuming a status field exists or can be derived
  lastKnownLocation?: { latitude: number; longitude: number; accuracy?: number }; // Added accuracy
}

export function AdminAlerts() {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<IssueData[]>([]);
  const [adminVolunteers, setAdminVolunteers] = useState<VolunteerData[]>([]); // Renamed to avoid conflict
  const [selectedAlert, setSelectedAlert] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showVisibilityModal, setShowVisibilityModal] = useState(false); // This might be removed if issue visibility is not needed
  const [showCreateAlertModal, setShowCreateAlertModal] = useState(false);
  const [alertToAssign, setAlertToAssign] = useState<string | null>(null);
  const [alertToChangeVisibility, setAlertToChangeVisibility] = useState<string | null>(null); // This might be removed
  const [selectedVolunteers, setSelectedVolunteers] = useState<string[]>([]); // Stores volunteer _ids
  const [newAlertForm, setNewAlertForm] = useState({
    title: '',
    message: '',
    severity: 'medium',
    location: '',
    audience: 'both' as 'volunteers' | 'attendees' | 'both'
  });
  const adminName = "sujana"; // Replace with actual admin name from context

  // Socket.IO connection
  useEffect(() => {
    const socket: Socket = io('http://localhost:5000'); // Connect to your backend Socket.IO server

    socket.on('connect', () => {
      console.log('Connected to Socket.IO server');
    });

    socket.on('newIssueAlert', (data: { issue: IssueData; reporterName: string }) => {
      console.log('New issue alert received:', data);
      // Ensure the reportedBy name is available on the issue object
      const newIssueWithReporterName = { ...data.issue, reportedBy: { _id: data.issue.reportedBy._id, name: data.reporterName } };
      setAlerts((prevAlerts) => [newIssueWithReporterName, ...prevAlerts]);
    });

    socket.on('issueUpdated', (data: { issue?: IssueData; issueId?: string; deleted?: boolean }) => {
      console.log('Issue updated via Socket.IO:', data);
      if (data.deleted && data.issueId) {
        setAlerts(prevAlerts => prevAlerts.filter(alert => alert._id !== data.issueId));
      } else if (data.issue) {
        setAlerts((prevAlerts) =>
          prevAlerts.map((alert) =>
            alert._id === data.issue!._id ? { ...alert, ...data.issue } : alert
          )
        );
      }
      // If the updated issue is for a volunteer who is now assigned, update their location if available
      // This requires fetching all volunteer locations again or selectively updating
      // For now, re-fetch all volunteer locations for simplicity on issue updates
      fetchVolunteerLocations();
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from Socket.IO server');
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Fetch existing issues on component mount
  useEffect(() => {
    const fetchIssues = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/admin/issues?adminName=${adminName}`);
        const data = await response.json();
        if (response.ok) {
          console.log('Fetched issues:', data); // Add this log
          setAlerts(data);
        } else {
          alert(data.msg || 'Failed to fetch issues');
        }
      } catch (error) {
        console.error('Error fetching issues:', error);
        alert('Server error while fetching issues');
      }
    };
    fetchIssues();
  }, [adminName]);

  // Function to fetch volunteer locations
  const fetchVolunteerLocations = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/admin/volunteer-locations?adminName=${adminName}`);
      if (response.ok) {
        const data: VolunteerData[] = await response.json();
        console.log('Fetched volunteer locations:', data); // Add this log
        setAdminVolunteers(data);
      } else {
        const errorData = await response.json(); // Parse error response
        alert(errorData.msg || 'Failed to fetch volunteer locations');
      }
    } catch (error) {
      console.error('Error fetching volunteer locations:', error);
      alert('Server error while fetching volunteer locations');
    }
  };

  // Helper function to offset coordinates for overlapping markers
  const getOffsetPosition = (latitude: number, longitude: number, index: number, totalAtLocation: number) => {
    const offsetFactor = 0.0002; // Adjust this value for desired spread
    const angle = (2 * Math.PI / totalAtLocation) * index; // Distribute markers in a circle
    const offsetX = offsetFactor * Math.cos(angle);
    const offsetY = offsetFactor * Math.sin(angle);
    return { latitude: latitude + offsetX, longitude: longitude + offsetY };
  };

  // Fetch volunteers on component mount and on issue updates
  useEffect(() => {
    fetchVolunteerLocations();
    // The dependency array should include adminName if it can change
  }, [adminName]);

  console.log('Current alerts state:', alerts); // Add this log
  console.log('Current adminVolunteers state:', adminVolunteers); // Add this log

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

  const handleAssignVolunteers = async () => {
    if (!alertToAssign || selectedVolunteers.length === 0) {
      alert('Please select an alert and at least one volunteer.');
      return;
    }

    // No longer restricting to a single volunteer
    // The backend now expects an array of volunteerIds
    const volunteerIds = selectedVolunteers; 

    try {
      const response = await fetch(`http://localhost:5000/api/admin/issues/${alertToAssign}/assign`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ volunteerIds, adminName }),
      });
      const data = await response.json();

      if (response.ok) {
        alert('Volunteer(s) assigned successfully!');
        // The issueUpdated socket event will handle updating the state
      setShowAssignModal(false);
      setAlertToAssign(null);
      setSelectedVolunteers([]);
      } else {
        alert(data.msg || 'Failed to assign volunteer(s)');
      }
    } catch (error) {
      console.error('Error assigning volunteer(s):', error);
      alert('Server error while assigning volunteer(s)');
    }
  };

  const handleRejectAlert = async (alertId: string) => {
    if (!window.confirm('Are you sure you want to reject this alert? This will delete it.')) {
      return;
    }
    try {
      // For rejection, we'll delete the issue for now.
      const response = await fetch(`http://localhost:5000/api/admin/issues/${alertId}?adminName=${adminName}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (response.ok) {
        alert('Alert rejected and deleted successfully!');
        setAlerts(prevAlerts => prevAlerts.filter(alert => alert._id !== alertId));
      } else {
        alert(data.msg || 'Failed to reject alert');
      }
    } catch (error) {
      console.error('Error rejecting alert:', error);
      alert('Server error while rejecting alert');
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    if (!window.confirm('Are you sure you want to mark this alert as resolved?')) {
      return;
    }
    try {
      const response = await fetch(`http://localhost:5000/api/admin/issues/${alertId}/resolve?adminName=${adminName}`, {
        method: 'PUT',
      });
      const data = await response.json();
      if (response.ok) {
        alert('Alert resolved successfully!');
        setAlerts(prevAlerts =>
          prevAlerts.map(alert =>
            alert._id === alertId ? { ...alert, status: 'resolved' } : alert
          )
        );
      } else {
        alert(data.msg || 'Failed to resolve alert');
      }
    } catch (error) {
      console.error('Error resolving alert:', error);
      alert('Server error while resolving alert');
    }
  };

  // This function is for creating alerts from the admin side, which is separate from attendee reports
  const handleCreateAlert = async () => {
    if (!newAlertForm.title || !newAlertForm.message) {
      alert('Title and Message are required.');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/admin/alerts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...newAlertForm, adminName }),
      });
      const data = await response.json();

      if (response.ok) {
        alert('Alert created and sent successfully!');
        // The newIssueAlert socket event will handle updating the state
        setShowCreateAlertModal(false);
        setNewAlertForm({
          title: '',
          message: '',
          severity: 'medium',
          location: '',
          audience: 'both'
        });
      } else {
        alert(data.msg || 'Failed to create alert');
      }
    } catch (error) {
      console.error('Error creating alert:', error);
      alert('Server error while creating alert');
    }
  };

  const toggleVolunteerSelection = (volunteerId: string) => {
    if (selectedVolunteers.includes(volunteerId)) {
      setSelectedVolunteers(selectedVolunteers.filter(id => id !== volunteerId));
    } else {
      setSelectedVolunteers([...selectedVolunteers, volunteerId]);
    }
  };

  // Filter alerts based on search query (not implemented yet)
  const filteredAlerts = alerts; // Placeholder

  return (
    <div className="h-screen w-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Alerts & Geo-Location
            </h1>
            <p className="text-slate-400">
              Real-time alert management and volunteer tracking
            </p>
          </div>
          <button onClick={() => setShowCreateAlertModal(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all flex items-center gap-2">
            <PlusIcon className="w-5 h-5" />
            Create Alert
          </button>
        </div>
      </div>
      {/* Split View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Map Section */}
        <div className="flex-1 relative">
          <MapContainer center={[17.3850, 78.4867]} zoom={13} style={{
          height: '100%',
          width: '100%'
        }} className="z-0">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' />
            {/* Active Alert Markers */}
            {alerts.filter(alert => alert.status !== 'resolved').map((alert, index) => {
              // Check if location exists and its latitude/longitude exist
              if (alert.location &&
                  typeof alert.location.latitude === 'number' &&
                  typeof alert.location.longitude === 'number') {
                
                const totalActiveIssuesAtLocation = alerts.filter(a => a.status !== 'resolved' &&
                    a.location.latitude === alert.location.latitude &&
                    a.location.longitude === alert.location.longitude).length;

                const offsetIssuePosition = getOffsetPosition(
                  alert.location.latitude,
                  alert.location.longitude,
                  index,
                  totalActiveIssuesAtLocation
                );

                return (
                  <CircleMarker
                    key={alert._id}
                    center={[offsetIssuePosition.latitude, offsetIssuePosition.longitude]}
                    radius={10} // Slightly larger dot for issues
                    pathOptions={{
                      color: getSeverityColor(alert.status),
                      fillColor: getSeverityColor(alert.status),
                      fillOpacity: 1,
                    }}
                  >
                    <Popup>
                      <div className="p-2">
                        <p className="font-bold">Issue: {alert.description}</p>
                        <p className="text-sm">Reported by: {alert.reportedBy.name}</p>
                        <p className="text-xs text-gray-600">Reported: {new Date(alert.timestamp).toLocaleString()}</p>
                        {alert.assignedTo && alert.assignedTo.length > 0 && (
                          <p className="text-xs text-gray-600">Assigned To: {alert.assignedTo.map(v => v.name).join(', ')}</p>
                        )}
                        <p className={`text-xs font-semibold text-${getSeverityColor(alert.status)}-500`}>Status: {alert.status}</p>
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              }
              return null; // Don't render if location data is incomplete
            })}
            {/* Volunteer Markers */}
            {adminVolunteers.map((volunteer, index) => {
              // Check if lastKnownLocation and its latitude/longitude exist
              if (volunteer.lastKnownLocation &&
                  typeof volunteer.lastKnownLocation.latitude === 'number' &&
                  typeof volunteer.lastKnownLocation.longitude === 'number') {
                
                console.log('Rendering volunteer marker for:', volunteer.name, volunteer.lastKnownLocation); // Log individual volunteer location
                const totalAtLocation = adminVolunteers.filter(v =>
                  v.lastKnownLocation &&
                  typeof v.lastKnownLocation.latitude === 'number' &&
                  typeof v.lastKnownLocation.longitude === 'number' &&
                  v.lastKnownLocation.latitude === volunteer.lastKnownLocation!.latitude && // Use non-null assertion
                  v.lastKnownLocation.longitude === volunteer.lastKnownLocation!.longitude // Use non-null assertion
                ).length;

                const offsetPosition = getOffsetPosition(
                  volunteer.lastKnownLocation.latitude,
                  volunteer.lastKnownLocation.longitude,
                  index,
                  totalAtLocation
                );

                return (
                  <CircleMarker
                    key={volunteer._id}
                    center={[offsetPosition.latitude, offsetPosition.longitude]}
                    radius={8} // Small blue dot
                    pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 1 }}
                  >
                    <Popup>
                      <div className="p-2">
                        <p className="font-bold">Volunteer: {volunteer.name}</p>
                        <p className="text-sm">Email: {volunteer.email}</p>
                        <p className="text-xs text-gray-600">Status: {volunteer.status || 'Available'}</p>
                        {volunteer.lastKnownLocation?.accuracy !== undefined && (
                          <p className="text-xs text-gray-600">Accuracy: {volunteer.lastKnownLocation.accuracy}m</p>
                        )}
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              }
              return null; // Don't render if location data is incomplete
            })}
          </MapContainer>
        </div>
        {/* Alerts List Section */}
        <div className="w-[500px] border-l border-slate-800 flex flex-col bg-slate-950">
          <div className="p-4 border-b border-slate-800">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <BellIcon className="w-5 h-5" />
              Active Alerts ({alerts.filter(a => a.status === 'reported' || a.status === 'in-progress').length})
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-20">
            {alerts.map((alert) => (
              <div
                key={alert._id}
                className={`bg-slate-900 border rounded-xl p-4 transition-all cursor-pointer ${selectedAlert === alert._id
                  ? 'border-blue-500 ring-2 ring-blue-500/50'
                  : 'border-slate-800 hover:border-slate-700'
                  }`}
                onClick={() => setSelectedAlert(alert._id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full bg-${getSeverityColor(alert.status)}-500`}
                    />
                    <div>
                      <h4 className="text-white font-semibold">{alert.description.split('.')[0]}</h4>
                      <p className="text-slate-400 text-sm">Reported by: {alert.reportedBy.name}</p>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${alert.status === 'reported'
                      ? 'bg-red-600/20 text-red-400'
                      : alert.status === 'in-progress'
                        ? 'bg-orange-600/20 text-orange-400'
                        : 'bg-green-600/20 text-green-400'
                      }`}
                  >
                    {alert.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-400 mb-3">
                  <span className="flex items-center gap-1">
                    <ClockIcon className="w-4 h-4" />
                    {new Date(alert.timestamp).toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPinIcon className="w-4 h-4" />
                    Lat: {alert.location.latitude.toFixed(4)}, Lng: {alert.location.longitude.toFixed(4)}
                  </span>
                </div>
                {alert.assignedTo && <div className="flex items-center gap-4 text-sm text-slate-400 mb-3">
                      <span className="flex items-center gap-1">
                        <UserIcon className="w-4 h-4" />
                        Assigned To: {alert.assignedTo.map(a => a.name).join(', ')}
                    </span>
                    </div>}
                {alert.status === 'reported' && (
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                e.stopPropagation();
                        setAlertToAssign(alert._id);
                setShowAssignModal(true);
                      }}
                      className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
                    >
                      <CheckIcon className="w-4 h-4" />
                      Assign Volunteer
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRejectAlert(alert._id);
                      }}
                      className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-all"
                    >
                      <XIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // This button is for broadcasting to attendees
                        // Assuming a backend endpoint exists for this
                        if (window.confirm('Are you sure you want to broadcast this alert to all attendees?')) {
                          fetch(`http://localhost:5000/api/admin/issues/${alert._id}/broadcast-to-attendees`, {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ adminName }), // Send adminName in the body
                          })
                          .then(async response => { // Mark this as async to await json()
                            console.log('Broadcast response status:', response.status); // Log response status

                            if (response.ok) {
                              const data = await response.json(); // Parse data only if response is OK
                              console.log('Broadcast response data (OK):', data); // Log full response data
                              alert('Alert broadcast to attendees successfully!');
                              // No need to re-fetch alerts, socket.io will handle updates
                            } else {
                              const errorData = await response.json(); // Parse error data
                              console.error('Broadcast error data:', errorData); // Log error data
                              alert(errorData.msg || 'Failed to broadcast alert to attendees');
                            }
                          })
                          .catch(error => {
                            console.error('Error broadcasting alert to attendees:', error);
                            alert('Server error while broadcasting alert to attendees');
                          });
                        }
                      }}
                      className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
                    >
                      <EyeIcon className="w-4 h-4" />
                      Broadcast to Attendees
                    </button>
                  </div>
                )}
                {alert.status === 'in-progress' && (
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleResolveAlert(alert._id);
                      }}
                      className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
                    >
                      <CheckIcon className="w-4 h-4" />
                      Mark as Resolved
                    </button>
                    <button
                      onClick={(e) => {
                e.stopPropagation();
                        handleRejectAlert(alert._id);
                      }}
                      className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-all"
                    >
                      <XIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // This button is for broadcasting to attendees
                        // Assuming a backend endpoint exists for this
                        if (window.confirm('Are you sure you want to broadcast this alert to all attendees?')) {
                          fetch(`http://localhost:5000/api/admin/issues/${alert._id}/broadcast-to-attendees`, {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ adminName }), // Send adminName in the body
                          })
                          .then(async response => { // Mark this as async to await json()
                            console.log('Broadcast response status:', response.status); // Log response status

                            if (response.ok) {
                              const data = await response.json(); // Parse data only if response is OK
                              console.log('Broadcast response data (OK):', data); // Log full response data
                              alert('Alert broadcast to attendees successfully!');
                              // No need to re-fetch alerts, socket.io will handle updates
                            } else {
                              const errorData = await response.json(); // Parse error data
                              console.error('Broadcast error data:', errorData); // Log error data
                              alert(errorData.msg || 'Failed to broadcast alert to attendees');
                            }
                          })
                          .catch(error => {
                            console.error('Error broadcasting alert to attendees:', error);
                            alert('Server error while broadcasting alert to attendees');
                          });
                        }
                      }}
                      className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
                    >
                      <EyeIcon className="w-4 h-4" />
                      Broadcast to Attendees
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Create Alert Modal */}
      {showCreateAlertModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => {
            setShowCreateAlertModal(false);
            setNewAlertForm({
              title: '',
              message: '',
              severity: 'medium',
              location: '',
                    audience: 'both',
            });
                }}
                className="p-2 hover:bg-slate-800 rounded-lg transition-all flex items-center gap-2 text-slate-400 hover:text-white"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                <span className="text-sm">Back</span>
              </button>
              <button
                onClick={() => {
            setShowCreateAlertModal(false);
            setNewAlertForm({
              title: '',
              message: '',
              severity: 'medium',
              location: '',
                    audience: 'both',
            });
                }}
                className="p-2 hover:bg-slate-800 rounded-lg transition-all"
              >
                <XIcon className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <h3 className="text-xl font-bold text-white mb-4">Create Alert</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-slate-300 mb-1.5 text-sm font-medium">
                  Title
                </label>
                <input
                  type="text"
                  value={newAlertForm.title}
                  onChange={(e) =>
                    setNewAlertForm({ ...newAlertForm, title: e.target.value })
                  }
                  placeholder="e.g., Weather Warning"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1.5 text-sm font-medium">
                  Message
                </label>
                <textarea
                  value={newAlertForm.message}
                  onChange={(e) =>
                    setNewAlertForm({ ...newAlertForm, message: e.target.value })
                  }
                  placeholder="Enter alert message..."
                  rows={3}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 resize-none"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1.5 text-sm font-medium">
                  Severity
                </label>
                <select
                  value={newAlertForm.severity}
                  onChange={(e) =>
                    setNewAlertForm({ ...newAlertForm, severity: e.target.value })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-300 mb-1.5 text-sm font-medium">
                  Location (Optional)
                </label>
                <input
                  type="text"
                  value={newAlertForm.location}
                  onChange={(e) =>
                    setNewAlertForm({ ...newAlertForm, location: e.target.value })
                  }
                  placeholder="e.g., Main Stage"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1.5 text-sm font-medium">
                  Send To
                </label>
                <select
                  value={newAlertForm.audience}
                  onChange={(e) =>
                    setNewAlertForm({
              ...newAlertForm,
                      audience: e.target.value as
                        | 'volunteers'
                        | 'attendees'
                        | 'both',
                    })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="both">Volunteers & Attendees</option>
                  <option value="volunteers">Volunteers Only</option>
                  <option value="attendees">Attendees Only</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button
                onClick={handleCreateAlert}
                disabled={!newAlertForm.title || !newAlertForm.message}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2 text-sm"
              >
                <SendIcon className="w-4 h-4" />
                Send Alert
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Assign Volunteer Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">
              Assign Volunteers
            </h3>
            <p className="text-slate-400 text-sm mb-4">
              Select one or more volunteers to assign to this alert
            </p>
            <div className="space-y-2 mb-6 max-h-64 overflow-y-auto">
              {adminVolunteers.map((volunteer) => (
                <label
                  key={volunteer._id}
                  className="flex items-center gap-3 p-3 bg-slate-800 hover:bg-slate-750 rounded-lg cursor-pointer transition-all"
                >
                  <input
                    type="checkbox"
                    checked={selectedVolunteers.includes(volunteer._id)}
                    onChange={() => toggleVolunteerSelection(volunteer._id)}
                    className="w-5 h-5"
                  />
                    <div className="flex-1">
                      <p className="text-white font-medium">{volunteer.name}</p>
                      <p className="text-slate-400 text-xs capitalize">
                      {volunteer.status || 'available'}
                      </p>
                    </div>
                </label>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAssignVolunteers}
                disabled={selectedVolunteers.length === 0}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2 text-sm"
              >
                Assign ({selectedVolunteers.length})
              </button>
              <button
                onClick={() => {
            setShowAssignModal(false);
            setAlertToAssign(null);
            setSelectedVolunteers([]);
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
                </div>
      )}
      {/* Visibility Modal (removed as per backend schema; can be re-added if needed) */}
      {/* {showVisibilityModal && ( */}
      {/*   <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-6"> */}
      {/*     <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-md"> */}
      {/*       <h3 className="text-xl font-bold text-white mb-4">Alert Visibility</h3> */}
      {/*       <p className="text-slate-400 text-sm mb-4">Choose who can see this alert</p> */}
      {/*       <div className="space-y-2 mb-6"> */}
      {/*         <button onClick={() => handleChangeVisibility('admin-only')} className="w-full flex items-center gap-3 p-4 bg-slate-800 hover:bg-slate-750 rounded-lg transition-all text-left"> */}
      {/*           <div className="flex-1"> */}
      {/*             <p className="text-white font-medium">Admin Only</p> */}
      {/*             <p className="text-slate-400 text-sm">Only visible to administrators</p> */}
      {/*           </div> */}
      {/*         </button> */}
      {/*         <button onClick={() => handleChangeVisibility('volunteers')} className="w-full flex items-center gap-3 p-4 bg-slate-800 hover:bg-slate-750 rounded-lg transition-all text-left"> */}
      {/*           <div className="flex-1"> */}
      {/*             <p className="text-white font-medium">Volunteers</p> */}
      {/*             <p className="text-slate-400 text-sm">Visible to volunteers only</p> */}
      {/*           </div> */}
      {/*         </button> */}
      {/*         <button onClick={() => handleChangeVisibility('attendees')} className="w-full flex items-center gap-3 p-4 bg-slate-800 hover:bg-slate-750 rounded-lg transition-all text-left"> */}
      {/*           <div className="flex-1"> */}
      {/*             <p className="text-white font-medium">Attendees</p> */}
      {/*             <p className="text-slate-400 text-sm">Visible to attendees only</p> */}
      {/*           </div> */}
      {/*         </button> */}
      {/*         <button onClick={() => handleChangeVisibility('both')} className="w-full flex items-center gap-3 p-4 bg-slate-800 hover:bg-slate-750 rounded-lg transition-all text-left"> */}
      {/*           <div className="flex-1"> */}
      {/*             <p className="text-white font-medium">Volunteers & Attendees</p> */}
      {/*             <p className="text-slate-400 text-sm">Visible to both volunteers and attendees</p> */}
      {/*           </div> */}
      {/*         </button> */}
      {/*       </div> */}
      {/*       <button onClick={() => { */}
      {/*         setShowVisibilityModal(false); */}
      {/*         setAlertToChangeVisibility(null); */}
      {/*       }} className="w-full px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-all"> */}
      {/*         Cancel */}
      {/*       </button> */}
      {/*     </div> */}
      {/*   </div> */}
      {/* )} */}
                </div>
  );
}