import React, { Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { MapPinIcon, NavigationIcon, AlertTriangleIcon, ArrowLeftIcon } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
export function VolunteerLocation() {
  const navigate = useNavigate();
  const myLocation = {
    lat: 40.7128,
    lng: -74.006
  };
  const nearbyAlerts = [{
    id: 1,
    type: 'Medical Emergency',
    lat: 40.7138,
    lng: -74.007,
    distance: '0.2 km',
    priority: 'critical'
  }, {
    id: 2,
    type: 'Lost Child',
    lat: 40.7118,
    lng: -74.005,
    distance: '0.5 km',
    priority: 'high'
  }];
  const otherVolunteers = [{
    id: 1,
    name: 'John D.',
    lat: 40.7125,
    lng: -74.0055,
    status: 'available'
  }, {
    id: 2,
    name: 'Jane S.',
    lat: 40.7145,
    lng: -74.0075,
    status: 'busy'
  }];
  const handleNavigate = (lat: number, lng: number) => {
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${myLocation.lat},${myLocation.lng}&destination=${lat},${lng}&travelmode=walking`;
    window.open(googleMapsUrl, '_blank');
  };
  return <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">
          Geo-Location Tracking
        </h1>
        <p className="text-slate-400">
          Your current location and nearby alerts
        </p>
      </div>
      {/* Location Status */}
      <div className="bg-green-900/20 border border-green-800 rounded-xl p-4 flex items-center gap-3">
        <MapPinIcon className="w-6 h-6 text-green-400" />
        <div>
          <p className="text-white font-medium">Location Tracking Active</p>
          <p className="text-slate-400 text-sm">
            Your location is being shared with the admin team
          </p>
        </div>
      </div>
      {/* Map */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden" style={{
      height: '500px'
    }}>
        <MapContainer center={[myLocation.lat, myLocation.lng]} zoom={15} style={{
        height: '100%',
        width: '100%'
      }} className="z-0">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' />
          {/* My Location */}
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
        <h3 className="text-xl font-bold text-white mb-4">Nearby Alerts</h3>
        <div className="space-y-3">
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