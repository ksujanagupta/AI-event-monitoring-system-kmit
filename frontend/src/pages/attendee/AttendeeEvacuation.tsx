import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { MapIcon, NavigationIcon, AlertTriangleIcon, InfoIcon } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
export function AttendeeEvacuation() {
  const [selectedExit, setSelectedExit] = useState<number | null>(null);
  const currentLocation = {
    lat: 40.7128,
    lng: -74.006
  };
  const exits = [{
    id: 1,
    name: 'North Exit',
    lat: 40.7148,
    lng: -74.006,
    distance: '200m',
    capacity: 'High'
  }, {
    id: 2,
    name: 'South Exit',
    lat: 40.7108,
    lng: -74.006,
    distance: '250m',
    capacity: 'Medium'
  }, {
    id: 3,
    name: 'East Exit',
    lat: 40.7128,
    lng: -74.004,
    distance: '180m',
    capacity: 'High'
  }, {
    id: 4,
    name: 'West Exit',
    lat: 40.7128,
    lng: -74.008,
    distance: '220m',
    capacity: 'Low'
  }];
  const assemblyPoints = [{
    id: 1,
    name: 'Assembly Point A',
    lat: 40.7158,
    lng: -74.006,
    description: 'Main parking lot'
  }, {
    id: 2,
    name: 'Assembly Point B',
    lat: 40.7098,
    lng: -74.006,
    description: 'South field'
  }];
  const getPathToExit = (exitId: number) => {
    const exit = exits.find(e => e.id === exitId);
    if (!exit) return [];
    return [[currentLocation.lat, currentLocation.lng], [exit.lat, exit.lng]];
  };
  return <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Evacuation Plan</h1>
        <p className="text-slate-400">
          Know your emergency exits and assembly points
        </p>
      </div>
      {/* Emergency Alert */}
      <div className="bg-blue-900/20 border border-blue-800 rounded-xl p-4 flex items-center gap-3">
        <InfoIcon className="w-6 h-6 text-blue-400" />
        <div>
          <p className="text-white font-medium">Emergency Procedures</p>
          <p className="text-slate-400 text-sm">
            In case of emergency, remain calm and follow staff instructions
          </p>
        </div>
      </div>
      {/* Map */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden" style={{
      height: '500px'
    }}>
        <MapContainer center={[currentLocation.lat, currentLocation.lng]} zoom={15} style={{
        height: '100%',
        width: '100%'
      }} className="z-0">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' />
          {/* Current Location */}
          <Marker position={[currentLocation.lat, currentLocation.lng]}>
            <Popup>
              <div className="p-2">
                <p className="font-bold">You Are Here</p>
              </div>
            </Popup>
          </Marker>
          {/* Exit Markers */}
          {exits.map(exit => <Marker key={exit.id} position={[exit.lat, exit.lng]}>
              <Popup>
                <div className="p-2">
                  <p className="font-bold">{exit.name}</p>
                  <p className="text-sm">{exit.distance} away</p>
                  <p className="text-sm">Capacity: {exit.capacity}</p>
                </div>
              </Popup>
            </Marker>)}
          {/* Assembly Points */}
          {assemblyPoints.map(point => <Marker key={point.id} position={[point.lat, point.lng]}>
              <Popup>
                <div className="p-2">
                  <p className="font-bold">{point.name}</p>
                  <p className="text-sm">{point.description}</p>
                </div>
              </Popup>
            </Marker>)}
          {/* Path to selected exit */}
          {selectedExit && <Polyline positions={getPathToExit(selectedExit) as any} pathOptions={{
          color: 'blue',
          weight: 4,
          dashArray: '10, 10'
        }} />}
        </MapContainer>
      </div>
      {/* Exit Cards */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">
          Nearest Emergency Exits
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {exits.map(exit => <button key={exit.id} onClick={() => setSelectedExit(exit.id)} className={`bg-slate-800 border rounded-xl p-4 text-left transition-all ${selectedExit === exit.id ? 'border-blue-500 ring-2 ring-blue-500/50' : 'border-slate-700 hover:border-slate-600'}`}>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-white font-semibold">{exit.name}</h4>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${exit.capacity === 'High' ? 'bg-green-600/20 text-green-400' : exit.capacity === 'Medium' ? 'bg-yellow-600/20 text-yellow-400' : 'bg-red-600/20 text-red-400'}`}>
                  {exit.capacity} Capacity
                </span>
              </div>
              <p className="text-slate-400 text-sm mb-3">
                Distance: {exit.distance}
              </p>
              <div className="flex items-center gap-2 text-blue-400 text-sm font-medium">
                <NavigationIcon className="w-4 h-4" />
                Show Route
              </div>
            </button>)}
        </div>
      </div>
      {/* Assembly Points */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">Assembly Points</h3>
        <div className="space-y-3">
          {assemblyPoints.map(point => <div key={point.id} className="bg-slate-800 border border-slate-700 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-green-600/20 flex items-center justify-center">
                  <MapIcon className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h4 className="text-white font-semibold">{point.name}</h4>
                  <p className="text-slate-400 text-sm">{point.description}</p>
                </div>
              </div>
            </div>)}
        </div>
      </div>
      {/* Emergency Instructions */}
      <div className="bg-red-900/20 border border-red-800 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangleIcon className="w-6 h-6 text-red-400" />
          <h3 className="text-xl font-bold text-white">
            Emergency Instructions
          </h3>
        </div>
        <ul className="space-y-2 text-slate-300">
          <li>1. Stay calm and do not panic</li>
          <li>2. Follow staff instructions immediately</li>
          <li>3. Proceed to the nearest exit in an orderly manner</li>
          <li>4. Do not run or push others</li>
          <li>5. Once outside, move to the designated assembly point</li>
          <li>6. Do not re-enter the venue until cleared by authorities</li>
        </ul>
      </div>
    </div>;
}