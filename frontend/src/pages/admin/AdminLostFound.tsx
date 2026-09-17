import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../api";
import {
  PackageSearchIcon,
  PlusIcon,
  UserIcon,
  ClockIcon,
  MapPinIcon,
  ImageIcon,
  XIcon,
  UploadIcon,
  VideoIcon,
  BellIcon,
  CheckCircleIcon,
  SearchIcon,
} from "lucide-react";

// -------------------------------------------------------------
// Interfaces
// -------------------------------------------------------------
interface LostItem {
  id: number;
  item: string;
  location: string;
  reportedBy: string;
  time: string;
  status: "pending" | "found";
  description: string;
  image?: string;
  cctv?: {
    camera: string;
    timestamp: string;
    frame: string; // base64 frame from backend
  };
}

interface LostChild {
  id: number;
  name: string;
  age: number;
  lastSeen: string;
  time: string;
  status: "searching" | "found";
  description: string;
  guardian: string;
  image?: string;
  cctv?: {
    camera: string;
    timestamp: string;
    frame: string;
  };
}

// -------------------------------------------------------------
// Main Component
// -------------------------------------------------------------
export function AdminLostFound() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"items" | "children">("items");

  // Modal and report
  const [showNewReportModal, setShowNewReportModal] = useState(false);
  const [reportType, setReportType] = useState<"item" | "child">("item");

  // AI states
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [matchFound, setMatchFound] = useState(false);
  const [backendResult, setBackendResult] = useState<any>(null);

  // Form fields
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    item: "",
    description: "",
    location: "",
    reportedBy: "",
    guardian: "",
  });

  // Uploads
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedVideo, setUploadedVideo] = useState<File | null>(null);

  // Dummy database
  const [lostItems, setLostItems] = useState<LostItem[]>([]);
  const [lostChildren, setLostChildren] = useState<LostChild[]>([]);

  // ---------------- FACE SEARCH STATES (for missing children) ----------------
  const [showFaceSearchModal, setShowFaceSearchModal] = useState(false);
  const [faceQueryFile, setFaceQueryFile] = useState<File | null>(null);
  const [selectedFaceVideos, setSelectedFaceVideos] = useState<string[]>([]);
  const [loadingFaceSearch, setLoadingFaceSearch] = useState(false);
  const [faceSearchResults, setFaceSearchResults] = useState<any[]>([]);
  const [faceProcessingStatus, setFaceProcessingStatus] = useState<Record<string, string>>({});

  // ---------------- OBJECT SEARCH STATES (for lost items) ----------------
  const [showObjectSearchModal, setShowObjectSearchModal] = useState(false);
  const [objectQueryFile, setObjectQueryFile] = useState<File | null>(null);
  const [selectedObjectVideos, setSelectedObjectVideos] = useState<string[]>([]);
  const [loadingObjectSearch, setLoadingObjectSearch] = useState(false);
  const [objectSearchResults, setObjectSearchResults] = useState<any[]>([]);
  const [objectProcessingStatus, setObjectProcessingStatus] = useState<Record<string, string>>({});

  // Available videos from public folder
  const availableVideos = ["fire.mp4", "violence.mp4", "video_upload.mp4", "c2.mp4" , "gun.mp4"];

  // -------------------------------------------------------------
  // Upload Handlers
  // -------------------------------------------------------------
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => setUploadedImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setUploadedVideo(file);
  };

  // -------------------------------------------------------------
  // Backend AI Call (Python)
  // -------------------------------------------------------------
  const handleAIAnalysis = async () => {
  if (!uploadedImage || !uploadedVideo) {
    alert("Please upload both query image AND video.");
    return;
  }

  setAnalyzing(true);
  setAnalysisComplete(false);
  setMatchFound(false);

  try {
    console.log("Starting AI Analysis...");
    console.log("Image type:", typeof uploadedImage);
    console.log("Video file:", uploadedVideo.name, uploadedVideo.size, "bytes");

    // Convert data URL to blob if needed
    let imgBlob: Blob;
    if (typeof uploadedImage === 'string' && uploadedImage.startsWith('data:')) {
      // It's a data URL, convert to blob
      const response = await fetch(uploadedImage);
      imgBlob = await response.blob();
      console.log("Converted data URL to blob:", imgBlob.size, "bytes");
    } else {
      // It's already a file/blob
      imgBlob = uploadedImage as any;
    }

    const form = new FormData();
    form.append("query", imgBlob, "query.jpg");
    form.append("video", uploadedVideo);

    console.log("Sending request to backend...");
    console.log("FormData entries:", {
      query: form.has("query"),
      video: form.has("video")
    });

    const res = await apiFetch("/api/search-object", {
      method: "POST",
      body: form,
    });

    console.log("Response status:", res.status, res.statusText);

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
      console.error("Backend error:", errorData);
      alert(`Error: ${errorData.error || res.statusText}`);
      setMatchFound(false);
      setAnalyzing(false);
      setAnalysisComplete(true);
      return;
    }

    const data = await res.json();
    console.log("AI Response Data:", data);
    console.log("Matches found:", data.matches?.length || 0);

    setBackendResult(data);
    setMatchFound(data.matches && data.matches.length > 0);
  } catch (err: any) {
    console.error("Error in AI Analysis:", err);
    console.error("Error details:", err.message, err.stack);
    alert(`Error: ${err.message || "Failed to analyze. Make sure the FastAPI server is running on port 8000."}`);
    setMatchFound(false);
  } finally {
    setAnalyzing(false);
    setAnalysisComplete(true);
  }
};


  // -------------------------------------------------------------
  // Submit Report → Add into lists
  // -------------------------------------------------------------
  const handleSubmitReport = () => {
    const now = new Date();
    const timeString = now.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });

    if (reportType === "item") {
      const newItem: LostItem = {
        id: lostItems.length + 1,
        item: formData.item,
        location: formData.location,
        reportedBy: formData.reportedBy,
        time: timeString,
        status: matchFound ? "found" : "pending",
        description: formData.description,
        image: uploadedImage || undefined,
        cctv: matchFound
          ? {
              camera: backendResult.camera,
              timestamp: backendResult.timestamp,
              frame: backendResult.frame,
            }
          : undefined,
      };
      setLostItems([newItem, ...lostItems]);
    } else {
      const newChild: LostChild = {
        id: lostChildren.length + 1,
        name: formData.name,
        age: parseInt(formData.age),
        lastSeen: formData.location,
        time: timeString,
        status: matchFound ? "found" : "searching",
        description: formData.description,
        guardian: formData.guardian,
        image: uploadedImage || undefined,
        cctv: matchFound
          ? {
              camera: backendResult.camera,
              timestamp: backendResult.timestamp,
              frame: backendResult.frame,
            }
          : undefined,
      };
      setLostChildren([newChild, ...lostChildren]);
    }

    resetForm();
  };

  const resetForm = () => {
    setShowNewReportModal(false);
    setUploadedImage(null);
    setUploadedVideo(null);
    setBackendResult(null);
    setAnalyzing(false);
    setAnalysisComplete(false);
    setMatchFound(false);
    setFormData({
      name: "",
      age: "",
      item: "",
      description: "",
      location: "",
      reportedBy: "",
      guardian: "",
    });
  };

  const markAsFound = (id: number, type: "item" | "child") => {
    if (type === "item") {
      setLostItems(
        lostItems.map((i) =>
          i.id === id ? { ...i, status: "found" } : i
        )
      );
    } else {
      setLostChildren(
        lostChildren.map((c) =>
          c.id === id ? { ...c, status: "found" } : c
        )
      );
    }
  };

  // -------------- FACE SEARCH HANDLERS --------------
  const handleFaceQueryImage = (e: any) => {
    setFaceQueryFile(e.target.files[0]);
  };

  const handleFaceVideoSelection = (videoName: string) => {
    setSelectedFaceVideos((prev) => {
      if (prev.includes(videoName)) {
        return prev.filter((v) => v !== videoName);
      } else {
        return [...prev, videoName];
      }
    });
  };

  const runFaceSearch = async () => {
    if (!faceQueryFile) {
      alert("Please upload the query image.");
      return;
    }

    if (selectedFaceVideos.length === 0) {
      alert("Please select at least one video to search.");
      return;
    }

    setLoadingFaceSearch(true);
    setFaceSearchResults([]);
    setFaceProcessingStatus({});

    const fd = new FormData();
    fd.append("query", faceQueryFile);
    fd.append("video_files", selectedFaceVideos.join(","));

    try {
      selectedFaceVideos.forEach((video) => {
        setFaceProcessingStatus((prev) => ({ ...prev, [video]: "Processing..." }));
      });

      const res = await apiFetch("/api/search-face-multiple", {
        method: "POST",
        body: fd,
      });

      const data = await res.json();
      console.log("Face Search Response:", data);

      if (data.error) {
        alert(`Face Search Failed: ${data.error}`);
        setLoadingFaceSearch(false);
        return;
      }

      if (data.results && Array.isArray(data.results)) {
        const allMatches: any[] = [];
        
        data.results.forEach((result: any) => {
          if (result.error) {
            setFaceProcessingStatus((prev) => ({
              ...prev,
              [result.video]: `Error: ${result.error}`,
            }));
          } else {
            setFaceProcessingStatus((prev) => ({
              ...prev,
              [result.video]: `Completed: ${result.total_matches || 0} matches found`,
            }));
            
            if (result.matches && Array.isArray(result.matches)) {
              result.matches.forEach((match: any) => {
                allMatches.push({
                  ...match,
                  video: result.video,
                });
              });
            }
          }
        });

        setFaceSearchResults(allMatches);
      }

      setLoadingFaceSearch(false);
    } catch (err) {
      console.error(err);
      alert("Face Search Failed");
      setLoadingFaceSearch(false);
      setFaceProcessingStatus({});
    }
  };

  // -------------- OBJECT SEARCH HANDLERS --------------
  const handleObjectQueryImage = (e: any) => {
    setObjectQueryFile(e.target.files[0]);
  };

  const handleObjectVideoSelection = (videoName: string) => {
    setSelectedObjectVideos((prev) => {
      if (prev.includes(videoName)) {
        return prev.filter((v) => v !== videoName);
      } else {
        return [...prev, videoName];
      }
    });
  };

  const runObjectSearch = async () => {
    if (!objectQueryFile) {
      alert("Please upload the query image.");
      return;
    }

    if (selectedObjectVideos.length === 0) {
      alert("Please select at least one video to search.");
      return;
    }

    setLoadingObjectSearch(true);
    setObjectSearchResults([]);
    setObjectProcessingStatus({});

    const fd = new FormData();
    fd.append("query", objectQueryFile);
    fd.append("video_files", selectedObjectVideos.join(","));

    try {
      selectedObjectVideos.forEach((video) => {
        setObjectProcessingStatus((prev) => ({ ...prev, [video]: "Processing..." }));
      });

      const res = await apiFetch("/api/search-object-multiple", {
        method: "POST",
        body: fd,
      });

      const data = await res.json();
      console.log("Object Search Response:", data);

      if (data.error) {
        alert(`Object Search Failed: ${data.error}`);
        setLoadingObjectSearch(false);
        return;
      }

      if (data.results && Array.isArray(data.results)) {
        const allMatches: any[] = [];
        
        data.results.forEach((result: any) => {
          if (result.error) {
            setObjectProcessingStatus((prev) => ({
              ...prev,
              [result.video]: `Error: ${result.error}`,
            }));
          } else {
            setObjectProcessingStatus((prev) => ({
              ...prev,
              [result.video]: `Completed: ${result.saved || 0} matches found`,
            }));
            
            if (result.matches && Array.isArray(result.matches)) {
              result.matches.forEach((match: any) => {
                allMatches.push({
                  ...match,
                  video: result.video,
                });
              });
            }
          }
        });

        setObjectSearchResults(allMatches);
      }

      setLoadingObjectSearch(false);
    } catch (err) {
      console.error(err);
      alert("Object Search Failed");
      setLoadingObjectSearch(false);
      setObjectProcessingStatus({});
    }
  };

  // -------------------------------------------------------------
  // UI
  // -------------------------------------------------------------
  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Lost & Found</h1>
          <p className="text-slate-400">Manage reports and AI matches</p>
        </div>

        <button
          onClick={() => setShowNewReportModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex gap-2"
        >
          <PlusIcon className="w-5 h-5" /> New Report
        </button>
      </div>

      {/* TABS */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab("items")}
          className={`px-6 py-3 rounded-lg ${
            activeTab === "items"
              ? "bg-blue-600 text-white"
              : "bg-slate-800 text-slate-400"
          }`}
        >
          Lost Items
        </button>
        <button
          onClick={() => setActiveTab("children")}
          className={`px-6 py-3 rounded-lg ${
            activeTab === "children"
              ? "bg-blue-600 text-white"
              : "bg-slate-800 text-slate-400"
          }`}
        >
          Missing Children
        </button>
      </div>

      {/* LISTS */}
      {activeTab === "items" ? (
        <ItemsList 
          items={lostItems} 
          markAsFound={markAsFound}
          onSearchClick={() => setShowObjectSearchModal(true)}
        />
      ) : (
        <ChildrenList 
          children={lostChildren} 
          markAsFound={markAsFound}
          onSearchClick={() => setShowFaceSearchModal(true)}
        />
      )}

      {/* MODAL */}
      {showNewReportModal && (
        <NewReportModal
          reportType={reportType}
          setReportType={setReportType}
          formData={formData}
          setFormData={setFormData}
          uploadedImage={uploadedImage}
          uploadedVideo={uploadedVideo}
          handleImageUpload={handleImageUpload}
          handleVideoUpload={handleVideoUpload}
          analyzing={analyzing}
          analysisComplete={analysisComplete}
          matchFound={matchFound}
          backendResult={backendResult}
          handleAIAnalysis={handleAIAnalysis}
          handleSubmitReport={handleSubmitReport}
          resetForm={resetForm}
        />
      )}

      {/* FACE SEARCH MODAL */}
      {showFaceSearchModal && (
        <FaceSearchModal
          faceQueryFile={faceQueryFile}
          handleFaceQueryImage={handleFaceQueryImage}
          availableVideos={availableVideos}
          selectedFaceVideos={selectedFaceVideos}
          handleFaceVideoSelection={handleFaceVideoSelection}
          loadingFaceSearch={loadingFaceSearch}
          faceSearchResults={faceSearchResults}
          faceProcessingStatus={faceProcessingStatus}
          runFaceSearch={runFaceSearch}
          onClose={() => {
            setShowFaceSearchModal(false);
            setFaceQueryFile(null);
            setSelectedFaceVideos([]);
            setFaceSearchResults([]);
            setFaceProcessingStatus({});
          }}
        />
      )}

      {/* OBJECT SEARCH MODAL */}
      {showObjectSearchModal && (
        <ObjectSearchModal
          objectQueryFile={objectQueryFile}
          handleObjectQueryImage={handleObjectQueryImage}
          availableVideos={availableVideos}
          selectedObjectVideos={selectedObjectVideos}
          handleObjectVideoSelection={handleObjectVideoSelection}
          loadingObjectSearch={loadingObjectSearch}
          objectSearchResults={objectSearchResults}
          objectProcessingStatus={objectProcessingStatus}
          runObjectSearch={runObjectSearch}
          onClose={() => {
            setShowObjectSearchModal(false);
            setObjectQueryFile(null);
            setSelectedObjectVideos([]);
            setObjectSearchResults([]);
            setObjectProcessingStatus({});
          }}
        />
      )}
    </div>
  );
}

// ==================================================================================
// ITEMS LIST COMPONENT
// ==================================================================================
function ItemsList({
  items,
  markAsFound,
  onSearchClick,
}: {
  items: LostItem[];
  markAsFound: (id: number, type: "item") => void;
  onSearchClick: () => void;
}) {
  return (
    <div className="space-y-4">
      {/* Object Search Button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={onSearchClick}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2"
        >
          <PackageSearchIcon className="w-5 h-5" />
          Search Object in Videos
        </button>
      </div>
      {items.map((item) => (
        <div
          key={item.id}
          className="bg-slate-900 border border-slate-800 rounded-xl p-6"
        >
          <div className="flex justify-between">
            <div className="flex gap-4">
              <div className="w-16 h-16 rounded-lg bg-slate-800 overflow-hidden">
                {item.image ? (
                  <img src={item.image} className="object-cover w-full h-full" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-slate-600 m-auto" />
                )}
              </div>

              <div>
                <h3 className="text-xl text-white font-bold">{item.item}</h3>
                <p className="text-slate-400 text-sm">{item.description}</p>

                <p className="text-slate-400 text-xs mt-2 flex items-center gap-1">
                  <MapPinIcon className="w-4 h-4" /> {item.location}
                </p>

                {item.cctv && (
                  <div className="mt-3 p-3 rounded-lg bg-green-900/20 border border-green-700">
                    <p className="text-green-400 text-sm flex items-center gap-2">
                      <VideoIcon className="w-4 h-4" /> AI Match Found
                    </p>
                    <p className="text-xs text-slate-300 mt-1">
                      {item.cctv.camera} — {item.cctv.timestamp}
                    </p>
                    <img
                      src={item.cctv.frame}
                      className="w-full mt-2 rounded-lg"
                    />
                  </div>
                )}
              </div>
            </div>

            <div>
              <span
                className={`px-3 py-1 rounded-full text-sm ${
                  item.status === "found"
                    ? "text-green-400 bg-green-700/20"
                    : "text-yellow-400 bg-yellow-700/20"
                }`}
              >
                {item.status}
              </span>

              {item.status === "pending" && (
                <button
                  onClick={() => markAsFound(item.id, "item")}
                  className="mt-3 w-full px-3 py-1 bg-green-600 text-white rounded-lg text-sm"
                >
                  Mark As Found
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ==================================================================================
// CHILDREN LIST COMPONENT
// ==================================================================================
function ChildrenList({
  children,
  markAsFound,
  onSearchClick,
}: {
  children: LostChild[];
  markAsFound: (id: number, type: "child") => void;
  onSearchClick: () => void;
}) {
  return (
    <div className="space-y-4">
      {/* Face Search Button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={onSearchClick}
          className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg flex items-center gap-2"
        >
          <UserIcon className="w-5 h-5" />
          Search Face in Videos
        </button>
      </div>
      {children.map((child) => (
        <div
          key={child.id}
          className="bg-slate-900 border border-slate-800 rounded-xl p-6"
        >
          <div className="flex justify-between">
            <div className="flex gap-4">
              <div className="w-16 h-16 rounded-lg bg-slate-800 overflow-hidden">
                {child.image ? (
                  <img src={child.image} className="object-cover w-full h-full" />
                ) : (
                  <UserIcon className="w-8 h-8 text-slate-600 m-auto" />
                )}
              </div>

              <div>
                <h3 className="text-xl text-white font-bold">
                  {child.name}, {child.age} yrs
                </h3>
                <p className="text-slate-400 text-sm">{child.description}</p>

                <p className="text-xs mt-2 text-slate-300 flex gap-1">
                  <MapPinIcon className="w-4 h-4" /> Last Seen:{" "}
                  {child.lastSeen}
                </p>

                {child.cctv && (
                  <div className="mt-3 p-3 rounded-lg bg-green-900/20 border border-green-700">
                    <p className="text-green-400 text-sm flex items-center gap-2">
                      <VideoIcon className="w-4 h-4" /> AI Match Found
                    </p>
                    <p className="text-xs text-slate-300 mt-1">
                      {child.cctv.camera} — {child.cctv.timestamp}
                    </p>
                    <img
                      src={child.cctv.frame}
                      className="w-full mt-2 rounded-lg"
                    />
                  </div>
                )}
              </div>
            </div>

            <div>
              <span
                className={`px-3 py-1 rounded-full text-sm ${
                  child.status === "found"
                    ? "text-green-400 bg-green-700/20"
                    : "text-orange-400 bg-orange-700/20"
                }`}
              >
                {child.status}
              </span>

              {child.status === "searching" && (
                <button
                  onClick={() => markAsFound(child.id, "child")}
                  className="mt-3 w-full px-3 py-1 bg-green-600 text-white rounded-lg text-sm"
                >
                  Mark As Found
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ==================================================================================
// NEW REPORT MODAL COMPONENT
// ==================================================================================
function NewReportModal({
  reportType,
  setReportType,
  formData,
  setFormData,
  uploadedImage,
  uploadedVideo,
  handleImageUpload,
  handleVideoUpload,
  analyzing,
  analysisComplete,
  matchFound,
  backendResult,
  handleAIAnalysis,
  handleSubmitReport,
  resetForm,
}: any) {
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex justify-center items-center p-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* HEADER */}
        <div className="p-6 border-b border-slate-800 flex justify-between">
          <h2 className="text-2xl font-bold text-white">New Report</h2>
          <button onClick={resetForm}>
            <XIcon className="text-slate-400 w-6 h-6" />
          </button>
        </div>

        {/* BODY */}
        <div className="p-6 overflow-y-auto space-y-4">

          {/* Report Type */}
          <div>
            <p className="text-slate-300 mb-2 font-medium">Report Type</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setReportType("item")}
                className={`p-3 rounded-lg border ${
                  reportType === "item"
                    ? "border-blue-500 bg-blue-500/20"
                    : "border-slate-700"
                }`}
              >
                <PackageSearchIcon className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                <p className="text-white text-sm text-center">Lost Item</p>
              </button>

              <button
                onClick={() => setReportType("child")}
                className={`p-3 rounded-lg border ${
                  reportType === "child"
                    ? "border-orange-500 bg-orange-500/20"
                    : "border-slate-700"
                }`}
              >
                <UserIcon className="w-6 h-6 text-orange-400 mx-auto mb-2" />
                <p className="text-white text-sm text-center">Missing Child</p>
              </button>
            </div>
          </div>

          {/* Fields */}
          {reportType === "child" ? (
            <>
              <TextField
                label="Child's Name"
                value={formData.name}
                onChange={(v: string) =>
                  setFormData({ ...formData, name: v })
                }
              />
              <TextField
                label="Age"
                type="number"
                value={formData.age}
                onChange={(v: string) =>
                  setFormData({ ...formData, age: v })
                }
              />
              <TextField
                label="Guardian Name"
                value={formData.guardian}
                onChange={(v: string) =>
                  setFormData({ ...formData, guardian: v })
                }
              />
            </>
          ) : (
            <TextField
              label="Item Name"
              value={formData.item}
              onChange={(v: string) => setFormData({ ...formData, item: v })}
            />
          )}

          <TextField
            label="Location / Last Seen"
            value={formData.location}
            onChange={(v: string) =>
              setFormData({ ...formData, location: v })
            }
          />

          <TextArea
            label="Description"
            value={formData.description}
            onChange={(v: string) =>
              setFormData({ ...formData, description: v })
            }
          />

          <TextField
            label="Reported By"
            value={formData.reportedBy}
            onChange={(v: string) =>
              setFormData({ ...formData, reportedBy: v })
            }
          />

          {/* IMAGE UPLOAD */}
          <UploadSection
            label="Upload Query Image"
            filePreview={uploadedImage}
            accept="image/*"
            onUpload={handleImageUpload}
          />

          {/* VIDEO UPLOAD */}
          <UploadSection
            label="Upload CCTV Video"
            filePreview={uploadedVideo ? uploadedVideo.name : null}
            accept="video/*"
            onUpload={handleVideoUpload}
          />

          {/* AI Analysis */}
          {uploadedImage && uploadedVideo && (
            <AIAnalysisBox
              analyzing={analyzing}
              analysisComplete={analysisComplete}
              matchFound={matchFound}
              backendResult={backendResult}
              handleAIAnalysis={handleAIAnalysis}
            />
          )}
        </div>

        {/* FOOTER */}
        <div className="p-6 border-t border-slate-800">
          <button
            onClick={handleSubmitReport}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold"
          >
            Submit Report
          </button>
        </div>
      </div>
    </div>
  );
}

// ==================================================================================
// Small Reusable Components
// ==================================================================================

// TEXT FIELD
function TextField({ label, type = "text", value, onChange }: any) {
  return (
    <div>
      <p className="text-slate-300 mb-1">{label}</p>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white"
      />
    </div>
  );
}

// TEXT AREA
function TextArea({ label, value, onChange }: any) {
  return (
    <div>
      <p className="text-slate-300 mb-1">{label}</p>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 h-24 text-white"
      />
    </div>
  );
}

// UPLOAD SECTION
function UploadSection({ label, filePreview, accept, onUpload }: any) {
  return (
    <div>
      <p className="text-slate-300 mb-1">{label}</p>

      {filePreview ? (
        <div className="bg-slate-800 p-3 rounded-lg text-white text-sm">
          {typeof filePreview === "string" && filePreview.startsWith("data") ? (
            <img
              src={filePreview}
              className="w-full rounded-lg mb-2"
              alt="preview"
            />
          ) : (
            <p>{filePreview}</p>
          )}
        </div>
      ) : (
        <label className="cursor-pointer block">
          <div className="bg-slate-800 border border-slate-700 p-4 rounded-lg text-center">
            <UploadIcon className="w-6 h-6 text-slate-400 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">Click to upload</p>
          </div>
          <input
            type="file"
            accept={accept}
            onChange={onUpload}
            className="hidden"
          />
        </label>
      )}
    </div>
  );
}

// AI Analysis Box
function AIAnalysisBox({
  analyzing,
  analysisComplete,
  matchFound,
  backendResult,
  handleAIAnalysis,
}: any) {
  return (
    <div className="border border-slate-700 bg-slate-800 p-4 rounded-lg mt-4">
      <h3 className="text-white font-bold mb-3 flex gap-2 items-center">
        <SearchIcon className="w-5 h-5 text-blue-400" /> AI Analysis
      </h3>

      {!analysisComplete && !analyzing && (
        <button
          onClick={handleAIAnalysis}
          className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
        >
          Analyze CCTV
        </button>
      )}

      {analyzing && (
        <p className="text-blue-300">Analyzing video... Please wait.</p>
      )}

      {analysisComplete && (
        <div
          className={`p-3 rounded-lg ${
            matchFound
              ? "bg-green-900/20 border border-green-700"
              : "bg-red-900/20 border border-red-700"
          }`}
        >
          {matchFound ? (
            <>
              <p className="text-green-400 font-bold flex gap-2 items-center mb-3">
                <CheckCircleIcon className="w-5 h-5" /> Matches Found!
              </p>

              {/* SHOW ALL MATCHED FRAMES */}
              <div className="grid grid-cols-1 gap-4">
                {backendResult.matches.map((m: any) => (
                  <div
                    key={m.frame}
                    className="rounded-lg border border-slate-700 p-3 bg-slate-900"
                  >
                    <p className="text-slate-300 text-xs mb-2">
                      <b>Frame:</b> {m.frame} &nbsp; | &nbsp;
                      <b>Reason:</b> {m.reason} &nbsp; | &nbsp;
                      <b>Inliers:</b> {m.inliers}
                    </p>

                    <img
                      src={m.output_url}
                      className="w-full rounded-lg"
                      alt="match"
                    />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-red-400">No match found.</p>
          )}
        </div>
      )}
    </div>
  );
}

// ==================================================================================
// FACE SEARCH MODAL COMPONENT
// ==================================================================================
function FaceSearchModal({
  faceQueryFile,
  handleFaceQueryImage,
  availableVideos,
  selectedFaceVideos,
  handleFaceVideoSelection,
  loadingFaceSearch,
  faceSearchResults,
  faceProcessingStatus,
  runFaceSearch,
  onClose,
}: any) {
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-slate-800">
          <h3 className="text-2xl font-bold text-white">Face Search in Videos</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg">
            <XIcon className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          {/* Upload Query */}
          <div>
            <label className="block text-slate-300 mb-2">
              Upload Query Image (Child's Face)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFaceQueryImage}
              className="text-white"
            />
            {faceQueryFile && (
              <p className="text-sm text-green-400 mt-1">
                Selected: {faceQueryFile.name}
              </p>
            )}
          </div>

          {/* Select Videos */}
          <div>
            <label className="block text-slate-300 mb-2">
              Select Videos to Search
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {availableVideos.map((video) => (
                <label
                  key={video}
                  className="flex items-center gap-2 p-2 bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-700"
                >
                  <input
                    type="checkbox"
                    checked={selectedFaceVideos.includes(video)}
                    onChange={() => handleFaceVideoSelection(video)}
                    className="w-4 h-4"
                  />
                  <span className="text-white">{video}</span>
                  {faceProcessingStatus[video] && (
                    <span className="text-xs text-pink-400 ml-auto">
                      {faceProcessingStatus[video]}
                    </span>
                  )}
                </label>
              ))}
            </div>
            {selectedFaceVideos.length > 0 && (
              <p className="text-sm text-slate-400 mt-2">
                {selectedFaceVideos.length} video(s) selected
              </p>
            )}
          </div>

          <button
            onClick={runFaceSearch}
            disabled={loadingFaceSearch || selectedFaceVideos.length === 0 || !faceQueryFile}
            className={`w-full py-3 rounded-lg text-white font-bold ${
              loadingFaceSearch || selectedFaceVideos.length === 0 || !faceQueryFile
                ? "bg-slate-600 cursor-not-allowed"
                : "bg-pink-600 hover:bg-pink-700"
            }`}
          >
            {loadingFaceSearch
              ? `Searching in ${selectedFaceVideos.length} video(s)...`
              : "Start Face Search"}
          </button>

          {/* RESULTS */}
          {faceSearchResults.length > 0 && (
            <div>
              <h3 className="text-white font-bold mb-4">
                Matches Found ({faceSearchResults.length})
              </h3>

              {faceSearchResults.map((m, i) => (
                <div
                  key={i}
                  className="rounded-lg bg-slate-800 p-3 mb-4 text-white"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-slate-300">
                      Frame {m.frame || "N/A"}
                    </p>
                    {m.video && (
                      <span className="text-xs bg-pink-600 px-2 py-1 rounded">
                        {m.video}
                      </span>
                    )}
                  </div>
                  {m.output_url && (
                    <img
                      src={m.output_url}
                      alt="face match"
                      className="rounded-lg border border-slate-700 w-full"
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Processing Status */}
          {loadingFaceSearch && Object.keys(faceProcessingStatus).length > 0 && (
            <div className="mt-4 p-3 bg-slate-800 rounded-lg">
              <h4 className="text-white font-semibold mb-2">Processing Status:</h4>
              {Object.entries(faceProcessingStatus).map(([video, status]) => (
                <div key={video} className="text-sm text-slate-300 mb-1">
                  <span className="font-medium">{video}:</span>{" "}
                  <span className={status.includes("Error") ? "text-red-400" : "text-pink-400"}>
                    {status as string}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ==================================================================================
// OBJECT SEARCH MODAL COMPONENT
// ==================================================================================
function ObjectSearchModal({
  objectQueryFile,
  handleObjectQueryImage,
  availableVideos,
  selectedObjectVideos,
  handleObjectVideoSelection,
  loadingObjectSearch,
  objectSearchResults,
  objectProcessingStatus,
  runObjectSearch,
  onClose,
}: any) {
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-slate-800">
          <h3 className="text-2xl font-bold text-white">Object Search in Videos</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg">
            <XIcon className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          {/* Upload Query */}
          <div>
            <label className="block text-slate-300 mb-2">
              Upload Query Image (Object)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleObjectQueryImage}
              className="text-white"
            />
            {objectQueryFile && (
              <p className="text-sm text-green-400 mt-1">
                Selected: {objectQueryFile.name}
              </p>
            )}
          </div>

          {/* Select Videos */}
          <div>
            <label className="block text-slate-300 mb-2">
              Select Videos to Search
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {availableVideos.map((video) => (
                <label
                  key={video}
                  className="flex items-center gap-2 p-2 bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-700"
                >
                  <input
                    type="checkbox"
                    checked={selectedObjectVideos.includes(video)}
                    onChange={() => handleObjectVideoSelection(video)}
                    className="w-4 h-4"
                  />
                  <span className="text-white">{video}</span>
                  {objectProcessingStatus[video] && (
                    <span className="text-xs text-purple-400 ml-auto">
                      {objectProcessingStatus[video]}
                    </span>
                  )}
                </label>
              ))}
            </div>
            {selectedObjectVideos.length > 0 && (
              <p className="text-sm text-slate-400 mt-2">
                {selectedObjectVideos.length} video(s) selected
              </p>
            )}
          </div>

          <button
            onClick={runObjectSearch}
            disabled={loadingObjectSearch || selectedObjectVideos.length === 0 || !objectQueryFile}
            className={`w-full py-3 rounded-lg text-white font-bold ${
              loadingObjectSearch || selectedObjectVideos.length === 0 || !objectQueryFile
                ? "bg-slate-600 cursor-not-allowed"
                : "bg-purple-600 hover:bg-purple-700"
            }`}
          >
            {loadingObjectSearch
              ? `Searching in ${selectedObjectVideos.length} video(s)...`
              : "Start Object Search"}
          </button>

          {/* RESULTS */}
          {objectSearchResults.length > 0 && (
            <div>
              <h3 className="text-white font-bold mb-4">
                Matches Found ({objectSearchResults.length})
              </h3>

              {objectSearchResults.map((m, i) => (
                <div
                  key={i}
                  className="rounded-lg bg-slate-800 p-3 mb-4 text-white"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-slate-300">
                      Frame {m.frame} • {m.reason}
                    </p>
                    {m.video && (
                      <span className="text-xs bg-purple-600 px-2 py-1 rounded">
                        {m.video}
                      </span>
                    )}
                  </div>
                  {m.output_url && (
                    <img
                      src={m.output_url}
                      alt="match"
                      className="rounded-lg border border-slate-700 w-full"
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Processing Status */}
          {loadingObjectSearch && Object.keys(objectProcessingStatus).length > 0 && (
            <div className="mt-4 p-3 bg-slate-800 rounded-lg">
              <h4 className="text-white font-semibold mb-2">Processing Status:</h4>
              {Object.entries(objectProcessingStatus).map(([video, status]) => (
                <div key={video} className="text-sm text-slate-300 mb-1">
                  <span className="font-medium">{video}:</span>{" "}
                  <span className={status.includes("Error") ? "text-red-400" : "text-purple-400"}>
                    {status as string}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



