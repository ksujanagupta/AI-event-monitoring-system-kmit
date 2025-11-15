import React, { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import { useNavigate } from 'react-router-dom';

// Declare face-api.js as global (loaded from CDN in index.html)
declare const faceapi: any;

export function FaceLogin() {
  const webcamRef = useRef<Webcam>(null);
  const [message, setMessage] = useState('');
  const [name, setName] = useState('');
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();

  const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';

  // Load face-api models on component mount
  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
      setModelsLoaded(true);
      console.log('✔ FaceAPI Models Loaded');
    } catch (error) {
      console.error('Error loading face-api models:', error);
      setMessage('Error loading face recognition models. Please refresh the page.');
    }
  };

  const handleFaceLogin = async () => {
    if (!webcamRef.current) {
      setMessage('Camera not available');
      return;
    }

    if (!name.trim()) {
      setMessage('Please enter your name');
      return;
    }

    if (!modelsLoaded) {
      setMessage('Face recognition models are still loading. Please wait...');
      return;
    }

    setIsProcessing(true);
    setMessage('Processing face...');

    try {
      // Capture image from webcam
      const capturedImage = webcamRef.current.getScreenshot();
      if (!capturedImage) {
        setMessage('Failed to capture image. Please try again.');
        setIsProcessing(false);
        return;
      }

      // Create an image element to process with face-api
      const img = new Image();
      img.src = capturedImage;

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      // Detect face and extract descriptor
      const detection = await faceapi
        .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        setMessage('❌ No face detected. Please ensure your face is clearly visible and try again.');
        setIsProcessing(false);
        return;
      }

      // Extract descriptor (128-dimensional array)
      const descriptor: number[] = Array.from(detection.descriptor);

      if (!descriptor || descriptor.length !== 128) {
        setMessage('❌ Could not extract face features. Please try again.');
        setIsProcessing(false);
        return;
      }

      // Send name and descriptor to backend
      const response = await fetch('http://localhost:5000/api/volunteer/face-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          descriptor: descriptor,
        }),
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setMessage('✅ Face verified! Login successful!');
        // Navigate after a short delay
        setTimeout(() => {
          navigate('/volunteer/dashboard');
        }, 1500);
      } else {
        setMessage(data.msg || '❌ Face not recognized. Please try again.');
      }
    } catch (error) {
      console.error('Face login error:', error);
      setMessage('❌ Server error. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-slate-950">
      <h2 className="text-white text-2xl font-bold mb-4">Volunteer Face Login</h2>
      
      {/* Name Input */}
      <div className="w-full max-w-md">
        <input
          type="text"
          placeholder="Enter your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-2 rounded-lg border border-slate-600 bg-slate-800 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isProcessing}
        />
      </div>

      {/* Webcam */}
      <div className="relative">
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          width={400}
          height={300}
          className="rounded-lg border-2 border-slate-600"
        />
        {!modelsLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
            <p className="text-white">Loading face recognition models...</p>
          </div>
        )}
      </div>

      {/* Capture Button */}
      <button
        onClick={handleFaceLogin}
        disabled={isProcessing || !modelsLoaded || !name.trim()}
        className={`px-6 py-3 rounded-lg font-medium transition-all ${
          isProcessing || !modelsLoaded || !name.trim()
            ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        {isProcessing ? 'Processing...' : 'Start Capture & Login'}
      </button>

      {/* Message Display */}
      {message && (
        <p className={`text-center max-w-md px-4 py-2 rounded-lg ${
          message.includes('✅') || message.includes('successful')
            ? 'bg-green-900/50 text-green-300'
            : message.includes('❌')
            ? 'bg-red-900/50 text-red-300'
            : 'bg-blue-900/50 text-blue-300'
        }`}>
          {message}
        </p>
      )}
    </div>
  );
}
