import React, { useState, useEffect } from 'react';
import { AlertTriangleIcon, CheckCircleIcon, MapPinIcon, CameraIcon, SendIcon } from 'lucide-react';

export function AttendeeReportIssues() {
  const [issueType, setIssueType] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [userId, setUserId] = useState<string | null>(null); // Initialize as null

  // Effect to get user ID from local storage
  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      setUserId(storedUserId);
    }
  }, []);

  // Effect to get user's current location
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          setLocationError(error.message);
          console.error("Error getting geolocation:", error);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      setLocationError("Geolocation is not supported by your browser.");
    }
  }, []);

  const issueTypes = [
    {
      id: 'medical',
      label: 'Medical Emergency',
      icon: '🚑',
      color: 'red'
    },
    {
      id: 'safety',
      label: 'Safety Concern',
      icon: '⚠️',
      color: 'orange'
    },
    {
      id: 'lost',
      label: 'Lost Item/Person',
      icon: '🔍',
      color: 'yellow'
    },
    {
      id: 'facility',
      label: 'Facility Issue',
      icon: '🏢',
      color: 'blue'
    },
    {
      id: 'crowd',
      label: 'Crowd Problem',
      icon: '👥',
      color: 'purple'
    },
    {
      id: 'other',
      label: 'Other',
      icon: '📝',
      color: 'gray'
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId) {
      alert("User not logged in.");
      return;
    }

    if (!location) {
      alert("Please enable location services to report an issue.");
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/issues/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportedBy: userId,
          description: `Issue Type: ${issueTypes.find(type => type.id === issueType)?.label || issueType}. Details: ${description}`,
          location: {
            latitude: location.latitude,
            longitude: location.longitude,
          },
        }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('Issue reported successfully:', data);
        setSubmitted(true);
        setTimeout(() => {
          setSubmitted(false);
          setIssueType('');
          setDescription('');
          // Do not clear location as it's auto-detected
        }, 3000);
      } else {
        alert(data.msg || 'Failed to report issue');
      }
    } catch (error) {
      console.error('Error reporting issue:', error);
      alert('Server error while reporting issue');
    }
  };

  return <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Report an Issue</h1>
        <p className="text-slate-400">
          Help us maintain a safe and enjoyable event
        </p>
      </div>
      {/* Success Message */}
      {submitted && <div className="bg-green-900/20 border border-green-800 rounded-xl p-4 flex items-center gap-3">
          <CheckCircleIcon className="w-6 h-6 text-green-400" />
          <div>
            <p className="text-white font-medium">
              Report Submitted Successfully!
            </p>
            <p className="text-slate-400 text-sm">
              Our team has been notified and will respond shortly.
            </p>
          </div>
        </div>}
      {/* Report Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">New Report</h3>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Issue Type Selection */}
          <div>
            <label className="block text-white font-medium mb-3">
              What type of issue are you reporting?
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {issueTypes.map(type => <button key={type.id} type="button" onClick={() => setIssueType(type.id)} className={`p-4 rounded-xl border-2 transition-all ${issueType === type.id ? 'border-purple-500 bg-purple-600/20' : 'border-slate-700 bg-slate-800 hover:border-slate-600'}`}>
                  <div className="text-3xl mb-2">{type.icon}</div>
                  <p className="text-white text-sm font-medium">{type.label}</p>
                </button>)}
            </div>
          </div>
          {/* Location */}
          <div>
            <label className="block text-white font-medium mb-2">Location</label>
            <div className="relative">
              <MapPinIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={locationError ? locationError : location ? `Lat: ${location.latitude.toFixed(4)}, Lng: ${location.longitude.toFixed(4)}` : 'Fetching location...'}
                placeholder="Fetching location..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-purple-500"
                readOnly
                required
              />
            </div>
            {locationError && <p className="text-red-400 text-sm mt-2">{locationError}</p>}
          </div>
          {/* Description */}
          <div>
            <label className="block text-white font-medium mb-2">
              Description
            </label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Please provide details about the issue..." rows={4} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 resize-none" required />
          </div>
          {/* Photo Upload */}
          <div>
            <label className="block text-white font-medium mb-2">
              Add Photo (Optional)
            </label>
            <button type="button" className="w-full border-2 border-dashed border-slate-700 rounded-lg p-6 hover:border-purple-500 transition-all">
              <CameraIcon className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">Click to upload a photo</p>
            </button>
          </div>
          {/* Submit Button */}
          <button type="submit" disabled={!issueType || !location || !description} className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2">
            <SendIcon className="w-5 h-5" />
            Submit Report
          </button>
        </form>
      </div>
      {/* Recent Reports */}
      {/* This section will be updated to fetch real reports later */}
    </div>;
}