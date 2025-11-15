import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { VideoIcon, MaximizeIcon, AlertTriangleIcon, XIcon, ArrowLeftIcon } from 'lucide-react';
type Camera = {
  id: number;
  name: string;
  type: string;
  alert: boolean;
  alertLabel?: string;
  videoSrc?: string;
  streamSrc?: string;
  imageId?: number;
};
type AlertType = 'fire' | 'violence';
type AlertEvent = {
  id: string;
  type: AlertType;
  timestamp: number;
};
const STREAM_ENDPOINT =
  import.meta.env.VITE_STREAM_ENDPOINT || 'http://localhost:5001/stream';
const ALERTS_ENDPOINT =
  import.meta.env.VITE_STREAM_ALERTS_ENDPOINT || 'http://localhost:5001/alerts';
export function AdminSurveillance() {
  const navigate = useNavigate();
  const [selectedCameras, setSelectedCameras] = useState<number[]>([]);
  const [cam6State, setCam6State] = useState({
    fire_active: false,
    violence_active: false,
    fire_confidence: 0,
    violence_confidence: 0,
  });
  const [alertEvents, setAlertEvents] = useState<AlertEvent[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const prevDetectionRef = useRef({
    fire_active: false,
    violence_active: false
  });

  const playAlertTone = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContextClass();
      }
      const ctx = audioCtxRef.current;
      const beepCount = 5;
      const beepLength = 0.35;
      for (let i = 0; i < beepCount; i++) {
        const startTime = ctx.currentTime + i * 0.3;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(900, startTime);
        osc.connect(gain);
        gain.connect(ctx.destination);
        gain.gain.setValueAtTime(0.0001, startTime);
        gain.gain.exponentialRampToValueAtTime(0.3, startTime + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + beepLength);
        osc.start(startTime);
        osc.stop(startTime + beepLength);
      }
    } catch (err) {
      console.warn('Alert tone blocked:', err);
    }
  };

  const dismissAlert = (id: string) => {
    setAlertEvents(prev => prev.filter(alert => alert.id !== id));
  };

  const pushAlertEvent = (type: AlertType) => {
    const id = `${Date.now()}-${type}-${Math.random().toString(36).slice(2, 7)}`;
    setAlertEvents(prev => [...prev, { id, type, timestamp: Date.now() }]);
    playAlertTone();
    window.setTimeout(() => {
      dismissAlert(id);
    }, 8000);
  };

  useEffect(() => {
    let cancelled = false;

    const pollAlerts = async () => {
      try {
        const res = await fetch(ALERTS_ENDPOINT, { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to fetch alerts');
        const data = await res.json();
        if (!cancelled) {
          setCam6State({
            fire_active: Boolean(data.fire_active),
            violence_active: Boolean(data.violence_active),
            fire_confidence: Number(data.fire_confidence || 0),
            violence_confidence: Number(data.violence_confidence || 0),
          });
        }
      } catch (err) {
        if (!cancelled) {
          setCam6State(prev => ({
            ...prev,
            fire_active: false,
            violence_active: false,
          }));
        }
      }
    };

    pollAlerts();
    const interval = setInterval(pollAlerts, 3000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const prev = prevDetectionRef.current;
    if (!prev.fire_active && cam6State.fire_active) {
      pushAlertEvent('fire');
    }
    if (!prev.violence_active && cam6State.violence_active) {
      pushAlertEvent('violence');
    }
    prevDetectionRef.current = {
      fire_active: cam6State.fire_active,
      violence_active: cam6State.violence_active
    };
  }, [cam6State]);

  const cam6AlertLabel = useMemo(() => {
    if (cam6State.fire_active && cam6State.violence_active) return 'Fire & Violence';
    if (cam6State.fire_active) return 'Fire Detected';
    if (cam6State.violence_active) return 'Violence Detected';
    return null;
  }, [cam6State]);

  const cameras: Camera[] = useMemo(() => [{
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
      videoSrc: '/violence.mp4',
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
      name: 'Canteen',
      type: 'AI Detection',
      videoSrc: '/c2.mp4',
      alert: false,
      imageId: 1492684223069
    }, {
      id: 4,
      name: 'Entrance',
      type: 'AI Detection',
      videoSrc: '/gun.mp4',
      alert: false,
      imageId: 1492684223070
    }, {
      id: 5,
      name: 'Admin Live Feed (Cam 6)',
      type: 'Live Stream',
      alert: Boolean(cam6AlertLabel),
      alertLabel: cam6AlertLabel || undefined,
      streamSrc: STREAM_ENDPOINT
    }], [cam6AlertLabel]);
  const cam6Camera = useMemo(
    () => cameras.find(camera => camera.id === 5),
    [cameras]
  );
  const otherCameras = useMemo(
    () => cameras.filter(camera => camera.id !== 5),
    [cameras]
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
      {alertEvents.length > 0 && <div className="fixed bottom-6 right-6 z-50 space-y-3 w-72">
          {alertEvents.map(alert => {
        const isFire = alert.type === 'fire';
        return <div key={alert.id} className={`rounded-xl p-4 shadow-xl border flex items-start gap-3 ${isFire ? 'bg-red-600/95 border-red-400' : 'bg-blue-600/95 border-blue-400'}`}>
                <AlertTriangleIcon className="w-6 h-6 text-white shrink-0" />
                <div className="flex-1 text-white">
                  <p className="text-sm font-semibold uppercase tracking-wide">
                    {isFire ? 'Fire Detected' : 'Violence Detected'}
                  </p>
                  <p className="text-xs text-white/80">
                    Cam 6 • {new Date(alert.timestamp).toLocaleTimeString()}
                  </p>
                </div>
                <button onClick={() => dismissAlert(alert.id)} className="text-white/70 hover:text-white transition">
                  <XIcon className="w-4 h-4" />
                </button>
              </div>;
      })}
        </div>}
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
        {cam6Camera && <div className={`relative bg-slate-900 border rounded-xl overflow-hidden transition-all w-full ${selectedCameras.includes(cam6Camera.id) ? 'border-blue-500 ring-2 ring-blue-500' : 'border-slate-800 hover:border-blue-500'}`}>
            <div className="aspect-video bg-slate-950 relative">
              {cam6Camera.streamSrc ? (<img src={cam6Camera.streamSrc} alt={cam6Camera.name} className="w-full h-full object-cover" />) : cam6Camera.videoSrc ? (<video src={cam6Camera.videoSrc} autoPlay loop muted playsInline className="w-full h-full object-cover" />) : (<div className="w-full h-full flex items-center justify-center text-slate-500 text-sm">
                    Stream unavailable
                  </div>)}
              {cam6Camera.alert && <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded-full flex items-center gap-1 text-xs font-semibold animate-pulse">
                  <AlertTriangleIcon className="w-3 h-3" />
                  {cam6Camera.alertLabel || 'Alert'}
                </div>}
              <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-medium">
                Cam 6
              </div>
              <button onClick={() => handleCameraClick(cam6Camera.id)} className="absolute bottom-3 right-3 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition">
                View
              </button>
            </div>
            <div className="p-3 bg-slate-900/90 backdrop-blur-sm">
              <p className="text-white font-medium text-sm truncate">
                {cam6Camera.name}
              </p>
              <p className="text-slate-400 text-xs">{cam6Camera.type}</p>
            </div>
          </div>}
        {otherCameras.map((camera, index) => <button key={camera.id} onClick={() => handleCameraClick(camera.id)} className={`relative bg-slate-900 border rounded-xl overflow-hidden transition-all w-full ${selectedCameras.includes(camera.id) ? 'border-blue-500 ring-2 ring-blue-500' : 'border-slate-800 hover:border-blue-500'}`}>
            <div className="aspect-video bg-slate-950 relative">
              {camera.videoSrc ? (<video src={camera.videoSrc} autoPlay loop muted playsInline className="w-full h-full object-cover" />) : camera.streamSrc ? (<img src={camera.streamSrc} alt={camera.name} className="w-full h-full object-cover" />) : (<img src={`https://images.unsplash.com/photo-${camera.imageId}?w=600&h=338&fit=crop`} alt={camera.name} className="w-full h-full object-cover" />)}
              {camera.alert && <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded-full flex items-center gap-1 text-xs font-semibold animate-pulse">
                  <AlertTriangleIcon className="w-3 h-3" />
                  {camera.alertLabel || 'Alert'}
                </div>}
              <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-medium">
                Cam {camera.id + 1}
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
                      {camera.videoSrc ? (<video src={camera.videoSrc} autoPlay loop muted playsInline className="w-full h-full object-cover" />) : camera.streamSrc ? (<img src={camera.streamSrc} alt={camera.name} className="w-full h-full object-cover" />) : (<img src={`https://images.unsplash.com/photo-${camera.imageId}?w=800&h=450&fit=crop`} alt={camera.name} className="w-full h-full object-cover" />)}
                      {camera.alert && <div className="absolute top-3 left-3 bg-red-600 text-white px-2.5 py-1 rounded-lg flex items-center gap-2 animate-pulse text-xs">
                          <AlertTriangleIcon className="w-3.5 h-3.5" />
                          <span className="font-medium">{camera.alertLabel || 'Alert'}</span>
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