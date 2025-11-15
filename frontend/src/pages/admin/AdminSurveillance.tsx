import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangleIcon, XIcon } from 'lucide-react';

type CameraConfig = {
  id: number;
  name: string;
  type: string;
  alert: boolean;
  videoUrl?: string;
  liveStream?: boolean;
  streamUrl?: string;
};

const STREAM_ENDPOINT =
  import.meta.env.VITE_LIVE_STREAM_URL || 'http://127.0.0.1:5001/stream';

export function AdminSurveillance() {
  const navigate = useNavigate();
  const [selectedCameras, setSelectedCameras] = useState<number[]>([]);
  
  console.warn('⚠️ ADMIN SURVEILLANCE COMPONENT MOUNTED');
  
  const cameras: CameraConfig[] = [{
      id: 0,
      name: 'Main Stage',
      type: 'Primary',
      alert: false,
      videoUrl: '/videos/sujana_fire.mp4'
    }, {
      id: 1,
      name: 'AI Fire Detection',
      type: 'Live Stream',
      alert: false,
      liveStream: true,
      streamUrl: STREAM_ENDPOINT
    }, {
      id: 2,
      name: 'AI Violence Detection',
      type: 'Live Stream',
      alert: false,
      liveStream: true,
      streamUrl: STREAM_ENDPOINT
    }, {
      id: 3,
      name: 'Crowd Surge',
      type: 'AI Monitor',
      alert: true,
      videoUrl: '/videos/sujana_fire.mp4'
    }, {
      id: 4,
      name: 'North Entrance',
      type: 'Standard',
      alert: false,
      videoUrl: '/videos/sujana_fire.mp4'
    }, {
      id: 5,
      name: 'Parking Area',
      type: 'Standard',
      alert: false,
      videoUrl: '/videos/sujana_fire.mp4'
    }];

  const renderLiveStream = (camera: CameraConfig, className?: string) => (
    <img
      src={`${camera.streamUrl}?cacheBust=${Date.now()}`}
      alt={`${camera.name} live feed`}
      className={`w-full h-full object-cover ${className ?? ''}`}
      onError={(e) => {
        console.error('❌ Stream error:', camera.streamUrl);
        const target = e.currentTarget;
        target.style.opacity = '0.3';
      }}
    />
  );

  const renderRecordedVideo = (camera: CameraConfig, className?: string) => (
    <video 
      className={`w-full h-full object-cover ${className ?? ''}`}
      autoPlay 
      loop 
      muted 
      playsInline 
      controls
      onError={(e: any) => {
        console.error('❌ Video error:', camera.videoUrl, e.target.error);
      }}
      onLoadedData={() => {
        console.warn('✅ Video loaded:', camera.videoUrl);
      }}
      onCanPlay={() => {
        console.warn('▶️ Video can play:', camera.videoUrl);
      }}
    >
      <source src={`${camera.videoUrl}`} type="video/mp4" />
      Your browser does not support the video tag.
    </video>
  );
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
        {cameras.map((camera, index) => {
          console.warn(`📹 Rendering camera ${index}:`, camera.videoUrl);
          return <button key={camera.id} onClick={() => handleCameraClick(camera.id)} className={`relative bg-slate-900 border rounded-xl overflow-hidden transition-all w-full ${selectedCameras.includes(camera.id) ? 'border-blue-500 ring-2 ring-blue-500' : 'border-slate-800 hover:border-blue-500'}`}>
            <div className="aspect-video bg-slate-950 relative overflow-hidden">
              
              {camera.liveStream ? renderLiveStream(camera) : renderRecordedVideo(camera)}
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
          </button>;
        })}
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
            console.log('Fullscreen video URL:', camera.videoUrl);
            return <div key={cameraId} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                    <div className="aspect-video bg-slate-950 relative">
                      {camera.liveStream ? (
                        renderLiveStream(camera, 'object-contain bg-black')
                      ) : (
                        <video 
                          autoPlay 
                          loop 
                          muted 
                          controls
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.error('Fullscreen video error for', camera.videoUrl, e);
                          }}
                          onLoadedData={() => {
                            console.log('Fullscreen video loaded:', camera.videoUrl);
                          }}
                        >
                          <source src={`${camera.videoUrl}?t=${Date.now()}`} type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                      )}
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