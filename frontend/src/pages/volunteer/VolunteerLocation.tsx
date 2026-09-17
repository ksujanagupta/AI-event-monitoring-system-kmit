import { Fragment, useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { MapPinIcon, NavigationIcon, AlertTriangleIcon } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { apiFetch } from '../../api';
import { VENUE_CENTER, formatDistance } from '../../config';
type Issue = {
  _id: string;
  description: string;
  severity?: string;
  location: { latitude: number; longitude: number };
};
type Volunteer = {
  _id: string;
  name: string;
  status: string;
  lastKnownLocation: { latitude: number; longitude: number };
};
const LOCATION_SEND_INTERVAL_MS = 15000; // don't hit the API on every GPS update
export function VolunteerLocation() {
  const [myLocation, setMyLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [assignedIssues, setAssignedIssues] = useState<Issue[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  // Share this volunteer's position with the admin map while the page is open
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }
    let lastSent = 0;
    const watchId = navigator.geolocation.watchPosition(pos => {
      const { latitude, longitude, accuracy } = pos.coords;
      setMyLocation({ lat: latitude, lng: longitude });
      setLocationError(null);
      if (Date.now() - lastSent > LOCATION_SEND_INTERVAL_MS) {
        lastSent = Date.now();
        apiFetch('/api/volunteer/location', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ latitude, longitude, accuracy })
        }).catch(console.error);
      }
    }, err => setLocationError(err.message), { enableHighAccuracy: true });
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);
  useEffect(() => {
    const load = async (path: string) => {
      const res = await apiFetch(path);
      return res.ok ? res.json() : [];
    };
    load('/api/volunteer/assigned-issues').then(setAssignedIssues).catch(console.error);
    load('/api/admin/volunteer-locations').then(setVolunteers).catch(console.error);
  }, []);
  const myId = localStorage.getItem('userId');
  const otherVolunteers = volunteers.filter(v => v._id !== myId).map(v => ({
    id: v._id,
    name: v.name,
    status: v.status,
    lat: v.lastKnownLocation.latitude,
    lng: v.lastKnownLocation.longitude
  }));
  const nearbyAlerts = assignedIssues.map(issue => ({
    id: issue._id,
    type: issue.description,
    lat: issue.location.latitude,
    lng: issue.location.longitude,
    distance: myLocation ? formatDistance(L.latLng(myLocation.lat, myLocation.lng).distanceTo([issue.location.latitude, issue.location.longitude])) : 'Unknown distance',
    priority: issue.severity || 'medium'
  }));
  const handleNavigate = (lat: number, lng: number) => {
    const origin = myLocation ? `&origin=${myLocation.lat},${myLocation.lng}` : '';
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1${origin}&destination=${lat},${lng}&travelmode=walking`;
    window.open(googleMapsUrl, '_blank');
  };
  return <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">
          Geo-Location Tracking
        </h1>
        <p className="text-slate-400">
          Your current location and assigned alerts
        </p>
      </div>
      {/* Location Status */}
      <div className={`rounded-xl p-4 flex items-center gap-3 border ${myLocation ? 'bg-green-900/20 border-green-800' : 'bg-yellow-900/20 border-yellow-800'}`}>
        <MapPinIcon className={`w-6 h-6 ${myLocation ? 'text-green-400' : 'text-yellow-400'}`} />
        <div>
          <p className="text-white font-medium">
            {myLocation ? 'Location Tracking Active' : 'Waiting for your location'}
          </p>
          <p className="text-slate-400 text-sm">
            {myLocation ? 'Your location is being shared with the admin team' : locationError || 'Allow location access in your browser'}
          </p>
        </div>
      </div>
      {/* Map */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden" style={{
      height: '500px'
    }}>
        <MapContainer center={VENUE_CENTER} zoom={15} style={{
        height: '100%',
        width: '100%'
      }} className="z-0">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' />
          {/* My Location */}
          {myLocation && <Fragment>
              <Marker position={[myLocation.lat, myLocation.lng]}>
                <Popup>
                  <div className="p-2">
                    <p className="font-bold">Your Location</p>
                    <p className="text-sm">Currently Active</p>
                  </div>
                </Popup>
              </Marker>
              <Circle center={[myLocation.lat, myLocation.lng]} radius={50} pathOptions={{
            color: 'green',
            fillColor: 'green',
            fillOpacity: 0.2
          }} />
            </Fragment>}
          {/* Nearby Alerts */}
          {nearbyAlerts.map(alert => <Fragment key={alert.id}>
              <Marker position={[alert.lat, alert.lng]}>
                <Popup>
                  <div className="p-2">
                    <p className="font-bold">{alert.type}</p>
                    <p className="text-sm">{alert.distance} away</p>
                  </div>
                </Popup>
              </Marker>
              <Circle center={[alert.lat, alert.lng]} radius={100} pathOptions={{
            color: 'red',
            fillColor: 'red',
            fillOpacity: 0.2
          }} />
            </Fragment>)}
          {/* Other Volunteers */}
          {otherVolunteers.map(volunteer => <Marker key={volunteer.id} position={[volunteer.lat, volunteer.lng]}>
              <Popup>
                <div className="p-2">
                  <p className="font-bold">{volunteer.name}</p>
                  <p className="text-sm capitalize">{volunteer.status}</p>
                </div>
              </Popup>
            </Marker>)}
        </MapContainer>
      </div>
      {/* Nearby Alerts List */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">Your Assigned Alerts</h3>
        <div className="space-y-3">
          {nearbyAlerts.length === 0 && <p className="text-slate-400">No alerts assigned to you right now.</p>}
          {nearbyAlerts.map(alert => <div key={alert.id} className="bg-slate-800 border border-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <AlertTriangleIcon className="w-5 h-5 text-red-400" />
                  <div>
                    <h4 className="text-white font-semibold">{alert.type}</h4>
                    <p className="text-slate-400 text-sm">
                      {alert.distance} from your location
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${alert.priority === 'critical' ? 'bg-red-600/20 text-red-400' : 'bg-orange-600/20 text-orange-400'}`}>
                  {alert.priority}
                </span>
              </div>
              <button onClick={() => handleNavigate(alert.lat, alert.lng)} className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all flex items-center justify-center gap-2">
                <NavigationIcon className="w-4 h-4" />
                Navigate to Location
              </button>
            </div>)}
        </div>
      </div>
    </div>;
}