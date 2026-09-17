import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheckIcon, UserIcon, LockIcon, ScanFaceIcon } from "lucide-react";
import { motion } from "framer-motion";
import FaceScanner from "../../components/FaceScanner";
import { apiFetch } from "../../api";

interface LoginFormData {
  name: string;
  password: string;
  faceRecognition: boolean;
  faceDescriptor: number[] | null;
}

export function Login() {
  const navigate = useNavigate();
  const [showScanner, setShowScanner] = useState<boolean>(false);

  const [role, setRole] = useState<"admin" | "volunteer" | "attendee">("admin");

  const [formData, setFormData] = useState<LoginFormData>({
    name: "",
    password: "",
    faceRecognition: false,
    faceDescriptor: null,
  });

  const [requestingLocation, setRequestingLocation] = useState<boolean>(false);

  // Face descriptor is only captured here; the backend compares it during login
  const handleFaceCapture = (descriptor: number[]) => {
    setShowScanner(false);
    setFormData((prev) => ({ ...prev, faceRecognition: true, faceDescriptor: descriptor }));
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (role === "volunteer" && !formData.faceDescriptor) {
      alert("Please scan your face before logging in.");
      return;
    }

    // ---- Location for volunteers
    let locationData: Record<string, any> = {};

    if (role === "volunteer") {
      setRequestingLocation(true);
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
          })
        );

        locationData = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        };
      } catch {
        alert("Please allow location access to login as volunteer.");
        setRequestingLocation(false);
        return;
      }
      setRequestingLocation(false);
    }

    // ---------- NORMAL LOGIN CALL ----------
    const response = await apiFetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.name,
        password: formData.password,
        role,
        descriptor: role === "volunteer" ? formData.faceDescriptor : undefined,
        ...locationData,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem("userRole", data.role);
      localStorage.setItem("userId", data.userId);
      localStorage.setItem("token", data.token);

      if (data.role === "admin") navigate("/admin/dashboard");
      else if (data.role === "volunteer") navigate("/volunteer/dashboard");
      else navigate("/attendee/issues");
    } else {
      alert(data.msg || "Login failed.");
    }
  };

  // ----------------------------------------------------------------
  // UI (same as your original)
  // ----------------------------------------------------------------

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center p-6">
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "url(https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1920&h=1080&fit=crop&q=80)",
          zIndex: -1,
        }}
      />
      <div className="fixed inset-0 bg-slate-950/90" style={{ zIndex: -1 }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-slate-900/80 backdrop-blur-2xl border border-slate-700 rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center justify-center gap-2 mb-8">
            <ShieldCheckIcon className="w-10 h-10 text-blue-400" />
            <span className="text-2xl font-bold text-white">EventGuard AI</span>
          </div>

          <h2 className="text-3xl font-bold text-white text-center mb-8">Login</h2>

          <div className="flex gap-2 mb-6">
            {["admin", "volunteer", "attendee"].map((r) => (
              <button
                key={r}
                onClick={() => setRole(r as "admin" | "volunteer" | "attendee")}
                className={`flex-1 py-2 rounded-lg transition-all ${
                  role === r
                    ? "bg-blue-600 text-white"
                    : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                }`}
              >
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Name */}
            <div>
              <label className="text-slate-300 mb-2 block">Name</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full bg-slate-900/50 border border-slate-600 rounded-lg pl-10 pr-4 py-3 text-white"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-slate-300 mb-2 block">Password</label>
              <div className="relative">
                <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full bg-slate-900/50 border border-slate-600 rounded-lg pl-10 pr-4 py-3 text-white"
                  required
                />
              </div>
            </div>

            {/* Face Scan */}
            {role === "volunteer" && (
              <div className="bg-slate-900/50 border border-slate-600 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <ScanFaceIcon className="w-6 h-6 text-blue-400" />
                  <span className="text-white font-medium">
                    Facial Recognition Required
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setShowScanner(true)}
                  className={`w-full py-2 rounded-lg ${
                    formData.faceRecognition
                      ? "bg-green-600"
                      : "bg-blue-600 hover:bg-blue-700"
                  } text-white`}
                >
                  {formData.faceRecognition ? "Face Captured ✓" : "Scan Face"}
                </button>

                {requestingLocation && (
                  <p className="text-blue-400 text-sm mt-3 text-center">
                    Requesting your location...
                  </p>
                )}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all"
            >
              Login
            </button>
          </form>
        </div>
      </motion.div>

      {showScanner && (
        <FaceScanner onCapture={handleFaceCapture} onClose={() => setShowScanner(false)} />
      )}
    </div>
  );
}
