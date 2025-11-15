// /* eslint-disable @typescript-eslint/no-explicit-any */
// import { useEffect, useRef } from "react";

// // face-api loaded globally from index.html
// declare const faceapi: any;

// interface FaceScannerProps {
//   onCapture: (descriptor: number[]) => void;
// }

// export default function FaceScanner({ onCapture }: FaceScannerProps) {
//   const videoRef = useRef<HTMLVideoElement | null>(null);

//   useEffect(() => {
//     startCamera();
//     loadModels();
//   }, []);

//   const startCamera = async () => {
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({ video: true });
//       if (videoRef.current) {
//         videoRef.current.srcObject = stream;
//       }
//     } catch (err) {
//       alert("Camera permission denied");
//     }
//   };

// const MODEL_URL = "https://justadudewhohacks.github.io/face-api.js/models";

// const loadModels = async () => {
//   await Promise.all([
//     faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
//     faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
//     faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
//   ]);
//   console.log("Models loaded from CDN");
// };



//   const captureFace = async () => {
//     if (!videoRef.current) return;

//     const detection = await faceapi
//       .detectSingleFace(
//         videoRef.current,
//         new faceapi.TinyFaceDetectorOptions()
//       )
//       .withFaceLandmarks()
//       .withFaceDescriptor();

//     if (!detection) {
//       alert("❌ No face detected, try again");
//       return;
//     }

//     const descriptor: number[] = Array.from(detection.descriptor);

//     // stop camera
//     if (videoRef.current.srcObject) {
//       const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
//       tracks.forEach((track) => track.stop());
//     }

//     onCapture(descriptor);
//   };

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
//       <div className="p-4 bg-white rounded-xl shadow-xl text-center">
//         <h2 className="text-xl font-bold mb-3">Scan Your Face</h2>

//         <video
//           ref={videoRef}
//           autoPlay
//           muted
//           width={350}
//           height={250}
//           className="rounded-lg border"
//         />

//         <button
//           onClick={captureFace}
//           className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
//         >
//           Capture Face
//         </button>
//       </div>
//     </div>
//   );
// }
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef } from "react";

// face-api.js is loaded from CDN in index.html
declare const faceapi: any;

interface FaceScannerProps {
  onCapture: (descriptor: number[]) => void;
}

export default function FaceScanner({ onCapture }: FaceScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const MODEL_URL =
    "https://justadudewhohacks.github.io/face-api.js/models";

  useEffect(() => {
    startCamera();
    loadModels();
  }, []);

  // Start webcam
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      alert("Camera permission denied!");
    }
  };

  // Load FaceAPI models from CDN
  const loadModels = async () => {
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]);

    console.log("✔ FaceAPI Models Loaded From CDN");
  };

  // Capture face, compute descriptor, return to parent
  const captureFace = async () => {
    if (!videoRef.current) return;

    const detection = await faceapi
      .detectSingleFace(
        videoRef.current,
        new faceapi.TinyFaceDetectorOptions()
      )
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      alert("❌ No face detected. Try again.");
      return;
    }

    const descriptor: number[] = Array.from(detection.descriptor);

    // Stop camera after capture
    if (videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((t) => t.stop());
    }

    onCapture(descriptor);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-white p-5 rounded-xl shadow-xl text-center">
        <h2 className="text-xl font-semibold mb-3">Scan Your Face</h2>

        <video
          ref={videoRef}
          autoPlay
          muted
          width={360}
          height={260}
          className="rounded-lg border"
        />

        <button
          onClick={captureFace}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Capture Face
        </button>
      </div>
    </div>
  );
}


