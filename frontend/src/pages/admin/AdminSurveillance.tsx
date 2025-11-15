import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { VideoIcon, MaximizeIcon, AlertTriangleIcon, XIcon, ArrowLeftIcon } from 'lucide-react';
export function AdminSurveillance() {
  const navigate = useNavigate();
  const [selectedCameras, setSelectedCameras] = useState<number[]>([]);
  const cameras = [{
    id: 0,
    name: 'Fire & Smoke Detection',
    type: 'AI Monitor',
    alert: false,
    videoSrc: '/fire.mp4',
    imageId: 1492684223066
  }, {
    id: 1,
    name: 'Violence Detection',
    type: 'AI Monitor',
    alert: false,
    videoSrc: '/video_upload.mp4',
    imageId: 1492684223067
  }, {
    id: 2,
    name: 'Crowd Surge Detection',
    type: 'AI Monitor',
    alert: false,
    videoSrc: '/crowd.mp4',
    imageId: 1492684223068
  }, {
    id: 3,
    name: 'main stage',
    type: 'Standard',
    alert: false,
    imageId: 1492684223069
  }, {
    id: 4,
    name: 'North Entrance',
    type: 'Standard',
    alert: false,
    imageId: 1492684223070
  }, {
    id: 5,
    name: 'Parking Area',
    type: 'Standard',
    alert: false,
    imageId: 1492684223071
  }];
  const handleCameraClick = (cameraId: number) => {
    if (selectedCameras.includes(cameraId)) {
      setSelectedCameras(selectedCameras.filter(id => id !== cameraId));
    } else if (selectedCameras.length < 2) {
      setSelectedCameras([...selectedCameras, cameraId]);
    } else {
      setSelectedCameras([selectedCameras[1], cameraId]);
    }
  };
  return <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">
          Surveillance Center
        </h1>
        <p className="text-slate-400">
          Real-time camera feeds with AI detection
        </p>
      </div>
      {/* Camera Grid Layout */}
      <div className="grid grid-cols-3 gap-4">
        {cameras.map((camera, index) => <button key={camera.id} onClick={() => handleCameraClick(camera.id)} className={`relative bg-slate-900 border rounded-xl overflow-hidden transition-all w-full ${selectedCameras.includes(camera.id) ? 'border-blue-500 ring-2 ring-blue-500' : 'border-slate-800 hover:border-blue-500'}`}>
            <div className="aspect-video bg-slate-950 relative">
              {camera.videoSrc ? (<video src={camera.videoSrc} autoPlay loop muted playsInline className="w-full h-full object-cover" />) : (<img src={`https://images.unsplash.com/photo-${camera.imageId}?w=600&h=338&fit=crop`} alt={camera.name} className="w-full h-full object-cover" />)}
              {camera.alert && <div className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full animate-pulse" />}
              <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-medium">
                Cam {index + 1}
              </div>
              {selectedCameras.includes(camera.id) && <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                  <div className="bg-blue-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">
                    {selectedCameras.indexOf(camera.id) + 1}
                  </div>
                </div>}
            </div>
            <div className="p-3 bg-slate-900/90 backdrop-blur-sm">
              <p className="text-white font-medium text-sm truncate">
                {camera.name}
              </p>
              <p className="text-slate-400 text-xs">{camera.type}</p>
            </div>
          </button>)}
      </div>
      {/* Fullscreen Popup */}
      {selectedCameras.length > 0 && <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-3xl">
            <div className="mb-3 flex justify-end">
              <button onClick={() => setSelectedCameras([])} className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-all">
                <XIcon className="w-5 h-5" />
              </button>
            </div>
            <div className={`grid gap-3 ${selectedCameras.length === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {selectedCameras.map(cameraId => {
            const camera = cameras.find(c => c.id === cameraId);
            if (!camera) return null;
            return <div key={cameraId} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                    <div className="aspect-video bg-slate-950 relative">
                      {camera.videoSrc ? (<video src={camera.videoSrc} autoPlay loop muted playsInline className="w-full h-full object-cover" />) : (<img src={`https://images.unsplash.com/photo-${camera.imageId}?w=800&h=450&fit=crop`} alt={camera.name} className="w-full h-full object-cover" />)}
                      {camera.alert && <div className="absolute top-3 left-3 bg-red-600 text-white px-2.5 py-1 rounded-lg flex items-center gap-2 animate-pulse text-xs">
                          <AlertTriangleIcon className="w-3.5 h-3.5" />
                          <span className="font-medium">Alert</span>
                        </div>}
                      <div className="absolute top-3 right-3 bg-black/70 text-white px-2.5 py-1 rounded text-xs font-medium">
                        Cam {cameraId + 1}
                      </div>
                    </div>
                    <div className="p-3 bg-slate-900/90 backdrop-blur-sm">
                      <h3 className="text-base font-bold text-white mb-0.5">
                        {camera.name}
                      </h3>
                      <p className="text-slate-400 text-xs">{camera.type}</p>
                    </div>
                  </div>;
          })}
            </div>
          </div>
        </div>}
    </div>;
}