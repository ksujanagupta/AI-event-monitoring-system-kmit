import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheckIcon, UserIcon, LockIcon, ScanFaceIcon } from 'lucide-react';
import { motion } from 'framer-motion';
export function Login() {
  const navigate = useNavigate();
  const [role, setRole] = useState<'admin' | 'volunteer' | 'attendee'>('admin');
  const [formData, setFormData] = useState({
    name: '',
    password: '',
    faceRecognition: false
  });
  const [requestingLocation, setRequestingLocation] = useState(false); // New state

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let locationData = {};
      if (role === 'volunteer') {
        setRequestingLocation(true); // Start requesting location
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }); // Increased timeout to 10 seconds
          });
          locationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy, // Log accuracy
          };
        } catch (geoError) {
          console.warn('Geolocation not available or denied:', geoError);
          alert('Geolocation is required for volunteers. Please enable it.');
          setRequestingLocation(false); // Stop requesting location on error
          return; // Prevent login if geolocation is not obtained for volunteer
        } finally {
          setRequestingLocation(false); // Ensure state is reset
        }
        console.log('Sending volunteer location with login:', locationData); // Added log
      }

      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: formData.name, password: formData.password, role, ...locationData }),
      });
      const data = await response.json();
      if (response.ok) {
        console.log('Login successful:', data);
        // Store role and redirect based on role
        localStorage.setItem('userRole', data.role);
        localStorage.setItem('userId', data.userId);
        if (data.role === 'admin') {
          navigate('/admin/dashboard');
        } else if (data.role === 'volunteer') {
          navigate('/volunteer/dashboard');
        } else {
          navigate('/attendee/issues');
        }
      } else {
        alert(data.msg || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Server error during login');
    }
  };
  return <div className="min-h-screen w-full relative flex items-center justify-center p-6">
      {/* Fixed Background */}
      <div className="fixed inset-0 bg-cover bg-center bg-no-repeat" style={{
      backgroundImage: 'url(https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1920&h=1080&fit=crop&q=80)',
      zIndex: -1
    }} />
      <div className="fixed inset-0 bg-slate-950/90" style={{
      zIndex: -1
    }} />
      <motion.div initial={{
      opacity: 0,
      y: 20
    }} animate={{
      opacity: 1,
      y: 0
    }} className="w-full max-w-md relative z-10">
        <div className="bg-slate-900/80 backdrop-blur-2xl border border-slate-700 rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center justify-center gap-2 mb-8">
            <ShieldCheckIcon className="w-10 h-10 text-blue-400" />
            <span className="text-2xl font-bold text-white">EventGuard AI</span>
          </div>
          <h2 className="text-3xl font-bold text-white text-center mb-8">
            Login
          </h2>
          <div className="flex gap-2 mb-6">
            <button onClick={() => setRole('admin')} className={`flex-1 py-2 rounded-lg transition-all ${role === 'admin' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
              Admin
            </button>
            <button onClick={() => setRole('volunteer')} className={`flex-1 py-2 rounded-lg transition-all ${role === 'volunteer' ? 'bg-green-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
              Volunteer
            </button>
            <button onClick={() => setRole('attendee')} className={`flex-1 py-2 rounded-lg transition-all ${role === 'attendee' ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
              Attendee
            </button>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-slate-300 mb-2">Name</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input type="text" value={formData.name} onChange={e => setFormData({
                ...formData,
                name: e.target.value
              })} className="w-full bg-slate-900/50 border border-slate-600 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-blue-500" placeholder="Enter your name" required />
              </div>
            </div>
            <div>
              <label className="block text-slate-300 mb-2">Password</label>
              <div className="relative">
                <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input type="password" value={formData.password} onChange={e => setFormData({
                ...formData,
                password: e.target.value
              })} className="w-full bg-slate-900/50 border border-slate-600 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-blue-500" placeholder="Enter your password" required />
              </div>
            </div>
            {role === 'volunteer' && <div className="bg-slate-900/50 border border-slate-600 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <ScanFaceIcon className="w-6 h-6 text-blue-400" />
                  <span className="text-white font-medium">
                    Facial Recognition Required
                  </span>
                </div>
                <button type="button" onClick={() => setFormData({
              ...formData,
              faceRecognition: true
            })} className={`w-full py-2 rounded-lg transition-all ${formData.faceRecognition ? 'bg-green-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
                  {formData.faceRecognition ? 'Face Verified ✓' : 'Scan Face'}
                </button>
                {requestingLocation && (
                  <p className="text-blue-400 text-sm mt-3 text-center">
                    Requesting your location... Please allow access.
                  </p>
                )}
              </div>}
            <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all">
              Login
            </button>
          </form>
          <div className="mt-6 text-center">
            <span className="text-slate-400">Don't have an account? </span>
            <button onClick={() => navigate('/signup')} className="text-blue-400 hover:text-blue-300 font-medium">
              Sign Up
            </button>
          </div>
          <button onClick={() => navigate('/')} className="w-full mt-4 py-2 text-slate-400 hover:text-white transition-colors">
            ← Back to Home
          </button>
        </div>
      </motion.div>
    </div>;
}