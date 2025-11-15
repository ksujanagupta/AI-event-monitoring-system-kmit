import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheckIcon, UserIcon, LockIcon, MailIcon, UploadIcon } from 'lucide-react';
import { motion } from 'framer-motion';
declare const faceapi: any;

export function SignUp() {
  const navigate = useNavigate();
  const [role, setRole] = useState<'admin' | 'volunteer' | 'attendee'>('attendee');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    image: null as File | null
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({
        ...formData,
        image: file
      });
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  const handleSignUp = async (e: React.FormEvent) => {
  e.preventDefault();

  if (formData.password !== formData.confirmPassword) {
    alert("Passwords do not match");
    return;
  }

  let descriptor: number[] | null = null;

  if (role === "volunteer") {
    if (!formData.image) {
      alert("Please upload a profile photo.");
      return;
    }

    descriptor = await generateDescriptor(formData.image);

    if (!descriptor) {
      alert("Face not detected in image. Upload a clear face photo.");
      return;
    }
  }

  const formDataToSend = new FormData();
  formDataToSend.append("name", formData.name);
  formDataToSend.append("email", formData.email);
  formDataToSend.append("password", formData.password);
  formDataToSend.append("role", role);
  formDataToSend.append("descriptor", JSON.stringify(descriptor));

  if (formData.image) {
    formDataToSend.append("image", formData.image);
  }

  const response = await fetch("http://localhost:5000/api/signup", {
    method: "POST",
    body: formDataToSend,
  });

  const data = await response.json();

  if (response.ok) {
    alert("Account created successfully! Please log in.");
    navigate("/login");
  } else {
    alert(data.msg || "Sign up failed");
  }
};

  const generateDescriptor = async (imageFile: File) => {
  await faceapi.nets.ssdMobilenetv1.loadFromUri("/public/models");
  await faceapi.nets.faceLandmark68Net.loadFromUri("/public/models");
  await faceapi.nets.faceRecognitionNet.loadFromUri("/public/models");

  const img = await faceapi.bufferToImage(imageFile);
  const detection = await faceapi
    .detectSingleFace(img)
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!detection) return null;
  return Array.from(detection.descriptor);
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
    }} className="w-full max-w-md relative z-10 my-12">
        <div className="bg-slate-900/80 backdrop-blur-2xl border border-slate-700 rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center justify-center gap-2 mb-8">
            <ShieldCheckIcon className="w-10 h-10 text-blue-400" />
            <span className="text-2xl font-bold text-white">EventGuard AI</span>
          </div>
          <h2 className="text-3xl font-bold text-white text-center mb-8">
            Sign Up
          </h2>
          <div className="flex gap-2 mb-6">
            <button onClick={() => setRole('volunteer')} className={`flex-1 py-2 rounded-lg transition-all ${role === 'volunteer' ? 'bg-green-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
              Volunteer
            </button>
            <button onClick={() => setRole('attendee')} className={`flex-1 py-2 rounded-lg transition-all ${role === 'attendee' ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
              Attendee
            </button>
          </div>
          <form onSubmit={handleSignUp} className="space-y-4">
            {role === 'volunteer' && <div>
                <label className="block text-slate-300 mb-2">
                  Profile Photo <span className="text-red-400">*</span>
                </label>
                <div className="flex items-center gap-4">
                  {imagePreview ? <img src={imagePreview} alt="Preview" className="w-20 h-20 rounded-full object-cover border-2 border-green-500" /> : <div className="w-20 h-20 rounded-full bg-slate-700 flex items-center justify-center border-2 border-slate-600">
                      <UserIcon className="w-8 h-8 text-slate-500" />
                    </div>}
                  <label className="flex-1 cursor-pointer">
                    <div className="bg-slate-900/50 border border-slate-600 rounded-lg p-3 hover:border-blue-500 transition-all flex items-center justify-center gap-2">
                      <UploadIcon className="w-5 h-5 text-slate-400" />
                      <span className="text-slate-300 text-sm">
                        {imagePreview ? 'Change Photo' : 'Upload Photo'}
                      </span>
                    </div>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" required />
                  </label>
                </div>
                <p className="text-slate-400 text-xs mt-2">
                  Required for face recognition login
                </p>
              </div>}
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
              <label className="block text-slate-300 mb-2">Email</label>
              <div className="relative">
                <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input type="email" value={formData.email} onChange={e => setFormData({
                ...formData,
                email: e.target.value
              })} className="w-full bg-slate-900/50 border border-slate-600 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-blue-500" placeholder="Enter your email" required />
              </div>
            </div>
            <div>
              <label className="block text-slate-300 mb-2">Password</label>
              <div className="relative">
                <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input type="password" value={formData.password} onChange={e => setFormData({
                ...formData,
                password: e.target.value
              })} className="w-full bg-slate-900/50 border border-slate-600 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-blue-500" placeholder="Create a password" required />
              </div>
            </div>
            <div>
              <label className="block text-slate-300 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input type="password" value={formData.confirmPassword} onChange={e => setFormData({
                ...formData,
                confirmPassword: e.target.value
              })} className="w-full bg-slate-900/50 border border-slate-600 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-blue-500" placeholder="Confirm your password" required />
              </div>
            </div>
            <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all">
              Create Account
            </button>
          </form>
          <div className="mt-6 text-center">
            <span className="text-slate-400">Already have an account? </span>
            <button onClick={() => navigate('/login')} className="text-blue-400 hover:text-blue-300 font-medium">
              Login
            </button>
          </div>
          <button onClick={() => navigate('/')} className="w-full mt-4 py-2 text-slate-400 hover:text-white transition-colors">
            ← Back to Home
          </button>
        </div>
      </motion.div>
    </div>;
}