// import React, { useState, Children } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { PackageSearchIcon, PlusIcon, CheckIcon, MapPinIcon, ClockIcon, ArrowLeftIcon, XIcon, UploadIcon, UserIcon } from 'lucide-react';
// interface LostItem {
//   id: number;
//   item: string;
//   location: string;
//   time: string;
//   status: 'searching' | 'found';
// }
// interface LostChild {
//   id: number;
//   name: string;
//   age: number;
//   lastSeen: string;
//   description: string;
//   time: string;
//   status: 'searching' | 'found';
// }
// export function VolunteerLostFound() {
//   const navigate = useNavigate();
//   const [activeTab, setActiveTab] = useState<'items' | 'children'>('items');
//   const [showNewReportModal, setShowNewReportModal] = useState(false);
//   const [reportType, setReportType] = useState<'item' | 'child'>('item');
//   const [uploadedImage, setUploadedImage] = useState<string | null>(null);
//   const [formData, setFormData] = useState({
//     name: '',
//     age: '',
//     item: '',
//     description: '',
//     location: '',
//     reportedBy: ''
//   });
//   const [lostItems, setLostItems] = useState<LostItem[]>([{
//     id: 1,
//     item: 'Black Backpack',
//     location: 'Main Stage',
//     time: '15 min ago',
//     status: 'searching'
//   }, {
//     id: 2,
//     item: 'iPhone 13 Pro',
//     location: 'Food Court',
//     time: '32 min ago',
//     status: 'searching'
//   }]);
//   const [lostChildren, setLostChildren] = useState<LostChild[]>([{
//     id: 1,
//     name: 'Lucas Brown',
//     age: 5,
//     lastSeen: 'Play Area',
//     description: 'Green hoodie, black pants',
//     time: '5 min ago',
//     status: 'searching'
//   }]);
//   const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (file) {
//       const reader = new FileReader();
//       reader.onloadend = () => {
//         setUploadedImage(reader.result as string);
//       };
//       reader.readAsDataURL(file);
//     }
//   };
//   const handleFoundItem = (id: number) => {
//     setLostItems(lostItems.map(item => item.id === id ? {
//       ...item,
//       status: 'found'
//     } : item));
//     alert('Item marked as found! Admin has been notified.');
//   };
//   const handleFoundChild = (id: number) => {
//     setLostChildren(lostChildren.map(child => child.id === id ? {
//       ...child,
//       status: 'found'
//     } : child));
//     alert('Child marked as found! Admin and guardian have been notified immediately.');
//   };
//   const handleSubmitReport = () => {
//     const now = new Date();
//     const timeString = now.toLocaleTimeString('en-US', {
//       hour: 'numeric',
//       minute: '2-digit'
//     });
//     if (reportType === 'item') {
//       const newItem: LostItem = {
//         id: lostItems.length + 1,
//         item: formData.item,
//         location: formData.location,
//         time: timeString,
//         status: 'found'
//       };
//       setLostItems([newItem, ...lostItems]);
//       alert('Found item reported successfully!');
//     } else {
//       const newChild: LostChild = {
//         id: lostChildren.length + 1,
//         name: formData.name,
//         age: parseInt(formData.age),
//         lastSeen: formData.location,
//         description: formData.description,
//         time: timeString,
//         status: 'found'
//       };
//       setLostChildren([newChild, ...lostChildren]);
//       alert('Found child reported successfully! Admin and guardian have been notified.');
//     }
//     setShowNewReportModal(false);
//     setFormData({
//       name: '',
//       age: '',
//       item: '',
//       description: '',
//       location: '',
//       reportedBy: ''
//     });
//     setUploadedImage(null);
//   };
//   return <div className="p-6 space-y-6">
//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-3xl font-bold text-white mb-2">Lost & Found</h1>
//           <p className="text-slate-400">Help locate lost items and children</p>
//         </div>
//         <button onClick={() => setShowNewReportModal(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all flex items-center gap-2">
//           <PlusIcon className="w-5 h-5" />
//           Report Found Item
//         </button>
//       </div>
//       {/* Tabs */}
//       <div className="flex gap-2">
//         <button onClick={() => setActiveTab('items')} className={`px-6 py-3 rounded-lg font-medium transition-all ${activeTab === 'items' ? 'bg-green-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
//           Lost Items
//         </button>
//         <button onClick={() => setActiveTab('children')} className={`px-6 py-3 rounded-lg font-medium transition-all ${activeTab === 'children' ? 'bg-green-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
//           Missing Children
//         </button>
//       </div>
//       {/* Content */}
//       {activeTab === 'items' ? <div className="space-y-4">
//           {lostItems.map(item => <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-xl p-6">
//               <div className="flex items-start justify-between mb-4">
//                 <div>
//                   <h3 className="text-xl font-bold text-white mb-2">
//                     {item.item}
//                   </h3>
//                   <div className="flex items-center gap-4 text-sm text-slate-400">
//                     <span className="flex items-center gap-1">
//                       <MapPinIcon className="w-4 h-4" />
//                       Last seen: {item.location}
//                     </span>
//                     <span className="flex items-center gap-1">
//                       <ClockIcon className="w-4 h-4" />
//                       {item.time}
//                     </span>
//                   </div>
//                 </div>
//                 <span className={`px-4 py-2 rounded-full text-sm font-medium ${item.status === 'found' ? 'bg-green-600/20 text-green-400' : 'bg-yellow-600/20 text-yellow-400'}`}>
//                   {item.status === 'found' ? 'Found' : 'Searching'}
//                 </span>
//               </div>
//               {item.status === 'searching' && <button onClick={() => handleFoundItem(item.id)} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-all flex items-center gap-2">
//                   <CheckIcon className="w-4 h-4" />I Found This Item
//                 </button>}
//             </div>)}
//         </div> : <div className="space-y-4">
//           {lostChildren.map(child => <div key={child.id} className={`bg-slate-900 rounded-xl p-6 ${child.status === 'searching' ? 'border border-orange-500' : 'border border-slate-800'}`}>
//               <div className="flex items-start justify-between mb-4">
//                 <div>
//                   <h3 className="text-xl font-bold text-white mb-2">
//                     {child.name}, {child.age} years old
//                   </h3>
//                   <p className="text-slate-400 text-sm mb-3">
//                     {child.description}
//                   </p>
//                   <div className="flex items-center gap-4 text-sm text-slate-400">
//                     <span className="flex items-center gap-1">
//                       <MapPinIcon className="w-4 h-4" />
//                       Last seen: {child.lastSeen}
//                     </span>
//                     <span className="flex items-center gap-1">
//                       <ClockIcon className="w-4 h-4" />
//                       {child.time}
//                     </span>
//                   </div>
//                 </div>
//                 <span className={`px-4 py-2 rounded-full text-sm font-medium ${child.status === 'found' ? 'bg-green-600/20 text-green-400' : 'bg-orange-600/20 text-orange-400'}`}>
//                   {child.status === 'found' ? 'Reunited' : 'URGENT'}
//                 </span>
//               </div>
//               {child.status === 'searching' && <button onClick={() => handleFoundChild(child.id)} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-all flex items-center gap-2">
//                   <CheckIcon className="w-4 h-4" />I Found This Child
//                 </button>}
//             </div>)}
//         </div>}
//       {/* New Report Modal */}
//       {showNewReportModal && <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-6">
//           <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg flex flex-col max-h-[90vh]">
//             <div className="flex items-center justify-between p-6 border-b border-slate-800">
//               <h3 className="text-2xl font-bold text-white">
//                 Report Found Item/Child
//               </h3>
//               <button onClick={() => {
//             setShowNewReportModal(false);
//             setFormData({
//               name: '',
//               age: '',
//               item: '',
//               description: '',
//               location: '',
//               reportedBy: ''
//             });
//             setUploadedImage(null);
//           }} className="p-2 hover:bg-slate-800 rounded-lg transition-all">
//                 <XIcon className="w-5 h-5 text-slate-400" />
//               </button>
//             </div>
//             <div className="flex-1 overflow-y-auto p-6">
//               <div className="mb-6">
//                 <label className="block text-slate-300 mb-3 font-medium">
//                   What did you find?
//                 </label>
//                 <div className="grid grid-cols-2 gap-3">
//                   <button type="button" onClick={() => setReportType('item')} className={`p-4 rounded-lg border-2 transition-all ${reportType === 'item' ? 'border-blue-500 bg-blue-600/20' : 'border-slate-700 bg-slate-800 hover:border-slate-600'}`}>
//                     <PackageSearchIcon className="w-8 h-8 text-blue-400 mb-2 mx-auto" />
//                     <div className="text-white font-medium">Found Item</div>
//                   </button>
//                   <button type="button" onClick={() => setReportType('child')} className={`p-4 rounded-lg border-2 transition-all ${reportType === 'child' ? 'border-orange-500 bg-orange-600/20' : 'border-slate-700 bg-slate-800 hover:border-slate-600'}`}>
//                     <UserIcon className="w-8 h-8 text-orange-400 mb-2 mx-auto" />
//                     <div className="text-white font-medium">Found Child</div>
//                   </button>
//                 </div>
//               </div>
//               <div className="space-y-4">
//                 {reportType === 'child' ? <>
//                     <div>
//                       <label className="block text-slate-300 mb-2 font-medium">
//                         Child's Name
//                       </label>
//                       <input type="text" value={formData.name} onChange={e => setFormData({
//                   ...formData,
//                   name: e.target.value
//                 })} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500" placeholder="Enter child's name" required />
//                     </div>
//                     <div>
//                       <label className="block text-slate-300 mb-2 font-medium">
//                         Age
//                       </label>
//                       <input type="number" value={formData.age} onChange={e => setFormData({
//                   ...formData,
//                   age: e.target.value
//                 })} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500" placeholder="Enter age" required />
//                     </div>
//                     <div>
//                       <label className="block text-slate-300 mb-2 font-medium">
//                         Description
//                       </label>
//                       <textarea value={formData.description} onChange={e => setFormData({
//                   ...formData,
//                   description: e.target.value
//                 })} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 min-h-20 resize-none" placeholder="Describe clothing, appearance, etc." required />
//                     </div>
//                   </> : <div>
//                     <label className="block text-slate-300 mb-2 font-medium">
//                       Item Name
//                     </label>
//                     <input type="text" value={formData.item} onChange={e => setFormData({
//                 ...formData,
//                 item: e.target.value
//               })} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500" placeholder="e.g., Black Backpack, iPhone" required />
//                   </div>}
//                 <div>
//                   <label className="block text-slate-300 mb-2 font-medium">
//                     Location Found
//                   </label>
//                   <input type="text" value={formData.location} onChange={e => setFormData({
//                 ...formData,
//                 location: e.target.value
//               })} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500" placeholder="e.g., Main Stage, Food Court" required />
//                 </div>
//                 <div>
//                   <label className="block text-slate-300 mb-2 font-medium">
//                     Upload Photo (Optional)
//                   </label>
//                   {uploadedImage ? <div className="relative">
//                       <img src={uploadedImage} alt="Uploaded" className="w-full h-40 object-cover rounded-lg mb-2" />
//                       <button type="button" onClick={() => setUploadedImage(null)} className="absolute top-2 right-2 p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-all">
//                         <XIcon className="w-4 h-4 text-white" />
//                       </button>
//                     </div> : <label className="cursor-pointer">
//                       <div className="bg-slate-800 border-2 border-dashed border-slate-700 rounded-lg p-6 hover:border-blue-500 transition-all flex flex-col items-center justify-center">
//                         <UploadIcon className="w-6 h-6 text-slate-400 mb-2" />
//                         <span className="text-slate-300 text-sm font-medium">
//                           Click to upload
//                         </span>
//                       </div>
//                       <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
//                     </label>}
//                 </div>
//               </div>
//             </div>
//             <div className="p-6 border-t border-slate-800">
//               <div className="flex gap-2">
//                 <button onClick={handleSubmitReport} disabled={reportType === 'child' && (!formData.name || !formData.age || !formData.description || !formData.location) || reportType === 'item' && (!formData.item || !formData.location)} className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg font-bold transition-all">
//                   Submit Report
//                 </button>
//                 <button onClick={() => {
//               setShowNewReportModal(false);
//               setFormData({
//                 name: '',
//                 age: '',
//                 item: '',
//                 description: '',
//                 location: '',
//                 reportedBy: ''
//               });
//               setUploadedImage(null);
//             }} className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-all">
//                   Cancel
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>}
//     </div>;
// }
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  PackageSearchIcon,
  PlusIcon,
  CheckIcon,
  MapPinIcon,
  ClockIcon,
  XIcon,
  UploadIcon,
  UserIcon,
} from "lucide-react";

interface LostItem {
  id: number;
  item: string;
  location: string;
  time: string;
  status: "searching" | "found";
}

interface LostChild {
  id: number;
  name: string;
  age: number;
  lastSeen: string;
  description: string;
  time: string;
  status: "searching" | "found";
}

export function VolunteerLostFound() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<"items" | "children">("items");
  const [showNewReportModal, setShowNewReportModal] = useState(false);
  const [reportType, setReportType] = useState<"item" | "child">("item");

  // FOR NORMAL LOST & FOUND
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    item: "",
    description: "",
    location: "",
    reportedBy: "",
  });

  // DUMMY DATA
  const [lostItems, setLostItems] = useState<LostItem[]>([
    {
      id: 1,
      item: "Black Backpack",
      location: "Main Stage",
      time: "15 min ago",
      status: "searching",
    },
    {
      id: 2,
      item: "iPhone 13 Pro",
      location: "Food Court",
      time: "32 min ago",
      status: "searching",
    },
  ]);

  const [lostChildren, setLostChildren] = useState<LostChild[]>([
    {
      id: 1,
      name: "Lucas Brown",
      age: 5,
      lastSeen: "Play Area",
      description: "Green hoodie, black pants",
      time: "5 min ago",
      status: "searching",
    },
  ]);

  // ---------------- AI SEARCH STATES ----------------
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [queryFile, setQueryFile] = useState<File | null>(null);
  const [selectedVideos, setSelectedVideos] = useState<string[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [processingStatus, setProcessingStatus] = useState<Record<string, string>>({});

  // ---------------- FACE SEARCH STATES ----------------
  const [showFaceSearchModal, setShowFaceSearchModal] = useState(false);
  const [faceQueryFile, setFaceQueryFile] = useState<File | null>(null);
  const [selectedFaceVideos, setSelectedFaceVideos] = useState<string[]>([]);
  const [loadingFaceSearch, setLoadingFaceSearch] = useState(false);
  const [faceSearchResults, setFaceSearchResults] = useState<any[]>([]);
  const [faceProcessingStatus, setFaceProcessingStatus] = useState<Record<string, string>>({});

  // Available videos from public folder
  const availableVideos = ["fire.mp4", "violence.mp4","video_upload.mp4","c2.mp4"];

  const handleQueryImage = (e: any) => {
    setQueryFile(e.target.files[0]);
  };

  const handleVideoSelection = (videoName: string) => {
    setSelectedVideos((prev) => {
      if (prev.includes(videoName)) {
        return prev.filter((v) => v !== videoName);
      } else {
        return [...prev, videoName];
      }
    });
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

  const handleFaceQueryImage = (e: any) => {
    setFaceQueryFile(e.target.files[0]);
  };

  // -------------- CALL BACKEND AI MODEL --------------
  const runObjectSearch = async () => {
    if (!queryFile) {
      alert("Please upload the query image.");
      return;
    }

    if (selectedVideos.length === 0) {
      alert("Please select at least one video to search.");
      return;
    }

    setLoadingSearch(true);
    setSearchResults([]);
    setProcessingStatus({});

    const fd = new FormData();
    fd.append("query", queryFile);
    fd.append("video_files", selectedVideos.join(",")); // Comma-separated list

    try {
      // Update status for each video
      selectedVideos.forEach((video) => {
        setProcessingStatus((prev) => ({ ...prev, [video]: "Processing..." }));
      });

      const res = await fetch("http://localhost:5000/api/search-object-multiple", {
        method: "POST",
        body: fd,
      });

      const data = await res.json();
      console.log("AI Response:", data);

      if (data.error) {
        alert(`AI Search Failed: ${data.error}`);
        setLoadingSearch(false);
        return;
      }

      // Process results for each video
      if (data.results && Array.isArray(data.results)) {
        const allMatches: any[] = [];
        
        data.results.forEach((result: any) => {
          if (result.error) {
            setProcessingStatus((prev) => ({
              ...prev,
              [result.video]: `Error: ${result.error}`,
            }));
          } else {
            setProcessingStatus((prev) => ({
              ...prev,
              [result.video]: `Completed: ${result.saved || 0} matches found`,
            }));
            
            // Add video name to each match
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

        setSearchResults(allMatches);
      }

      setLoadingSearch(false);
    } catch (err) {
      console.error(err);
      alert("AI Search Failed");
      setLoadingSearch(false);
      setProcessingStatus({});
    }
  };

  // -------------- CALL BACKEND FACE SEARCH --------------
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
    fd.append("video_files", selectedFaceVideos.join(",")); // Comma-separated list

    try {
      // Update status for each video
      selectedFaceVideos.forEach((video) => {
        setFaceProcessingStatus((prev) => ({ ...prev, [video]: "Processing..." }));
      });

      const res = await fetch("http://localhost:5000/api/search-face-multiple", {
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

      // Process results for each video
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
            
            // Add video name to each match
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

  // -------------- LOST & FOUND FUNCTIONS --------------
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => setUploadedImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleFoundItem = (id: number) => {
    setLostItems(
      lostItems.map((item) =>
        item.id === id ? { ...item, status: "found" } : item
      )
    );
    alert("Item marked as found.");
  };

  const handleFoundChild = (id: number) => {
    setLostChildren(
      lostChildren.map((child) =>
        child.id === id ? { ...child, status: "found" } : child
      )
    );
    alert("Child marked as found!");
  };

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
        time: timeString,
        status: "found",
      };
      setLostItems([newItem, ...lostItems]);
    } else {
      const newChild: LostChild = {
        id: lostChildren.length + 1,
        name: formData.name,
        age: parseInt(formData.age),
        lastSeen: formData.location,
        description: formData.description,
        time: timeString,
        status: "found",
      };
      setLostChildren([newChild, ...lostChildren]);
    }

    setShowNewReportModal(false);
    setUploadedImage(null);
    setFormData({
      name: "",
      age: "",
      item: "",
      description: "",
      location: "",
      reportedBy: "",
    });
  };

  // --------------------------------------------------

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Lost & Found</h1>
          <p className="text-slate-400">
            Help locate lost items and missing children
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setShowNewReportModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            Report Found Item
          </button>

          {/* NEW AI SEARCH BUTTON */}
          <button
            onClick={() => setShowSearchModal(true)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2"
          >
            <PackageSearchIcon className="w-5 h-5" />
            AI Search
          </button>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab("items")}
          className={`px-6 py-3 rounded-lg ${
            activeTab === "items"
              ? "bg-green-600 text-white"
              : "bg-slate-800 text-slate-400"
          }`}
        >
          Lost Items
        </button>
        <button
          onClick={() => setActiveTab("children")}
          className={`px-6 py-3 rounded-lg ${
            activeTab === "children"
              ? "bg-green-600 text-white"
              : "bg-slate-800 text-slate-400"
          }`}
        >
          Missing Children
        </button>
      </div>

      {/* DATA LISTS */}
      {activeTab === "items" ? (
        <div className="space-y-4">
          {lostItems.map((item) => (
            <div
              key={item.id}
              className="bg-slate-900 p-6 border border-slate-800 rounded-xl"
            >
              <h3 className="text-xl text-white font-bold mb-2">{item.item}</h3>
              <p className="text-slate-400 text-sm">{item.location}</p>

              <span
                className={`block mt-2 px-3 py-1 rounded ${
                  item.status === "found"
                    ? "bg-green-700 text-green-300"
                    : "bg-yellow-700 text-yellow-300"
                }`}
              >
                {item.status}
              </span>

              {item.status === "searching" && (
                <button
                  onClick={() => handleFoundItem(item.id)}
                  className="mt-3 px-4 py-2 bg-green-600 text-white rounded-lg"
                >
                  Mark Found
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Face Search Button - Near Lost Children */}
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setShowFaceSearchModal(true)}
              className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg flex items-center gap-2"
            >
              <UserIcon className="w-5 h-5" />
              Search Face in Videos
            </button>
          </div>

          {lostChildren.map((child) => (
            <div
              key={child.id}
              className="bg-slate-900 p-6 border border-slate-800 rounded-xl"
            >
              <h3 className="text-xl text-white font-bold">
                {child.name}, {child.age}
              </h3>
              <p className="text-slate-400">{child.description}</p>

              <span
                className={`block mt-2 px-3 py-1 rounded ${
                  child.status === "found"
                    ? "bg-green-700 text-green-300"
                    : "bg-orange-700 text-orange-300"
                }`}
              >
                {child.status}
              </span>

              {child.status === "searching" && (
                <button
                  onClick={() => handleFoundChild(child.id)}
                  className="mt-3 px-4 py-2 bg-green-600 text-white rounded-lg"
                >
                  Mark Found
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* --------------------- AI SEARCH MODAL --------------------- */}
      {showSearchModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-slate-800">
              <h3 className="text-2xl font-bold text-white">AI Object Search</h3>
              <button
                onClick={() => setShowSearchModal(false)}
                className="p-2 hover:bg-slate-700 rounded-lg"
              >
                <XIcon className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              {/* Upload Query */}
              <div>
                <label className="block text-slate-300 mb-2">
                  Upload Query Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleQueryImage}
                  className="text-white"
                />
              </div>

              {/* Select Videos from Public Folder */}
              <div>
                <label className="block text-slate-300 mb-2">
                  Select Videos from Public Folder
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {availableVideos.map((video) => (
                    <label
                      key={video}
                      className="flex items-center gap-2 p-2 bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-700"
                    >
                      <input
                        type="checkbox"
                        checked={selectedVideos.includes(video)}
                        onChange={() => handleVideoSelection(video)}
                        className="w-4 h-4"
                      />
                      <span className="text-white">{video}</span>
                      {processingStatus[video] && (
                        <span className="text-xs text-blue-400 ml-auto">
                          {processingStatus[video]}
                        </span>
                      )}
                    </label>
                  ))}
                </div>
                {selectedVideos.length > 0 && (
                  <p className="text-sm text-slate-400 mt-2">
                    {selectedVideos.length} video(s) selected
                  </p>
                )}
              </div>

              <button
                onClick={runObjectSearch}
                disabled={loadingSearch || selectedVideos.length === 0}
                className={`w-full py-3 rounded-lg text-white font-bold ${
                  loadingSearch || selectedVideos.length === 0
                    ? "bg-slate-600 cursor-not-allowed"
                    : "bg-purple-600 hover:bg-purple-700"
                }`}
              >
                {loadingSearch
                  ? `Searching in ${selectedVideos.length} video(s)...`
                  : "Start AI Search"}
              </button>

              {/* RESULTS */}
              {searchResults.length > 0 && (
                <div>
                  <h3 className="text-white font-bold mb-4">
                    Matches Found ({searchResults.length})
                  </h3>

                  {searchResults.map((m, i) => (
                    <div
                      key={i}
                      className="rounded-lg bg-slate-800 p-3 mb-4 text-white"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-slate-300">
                          Frame {m.frame} • {m.reason}
                        </p>
                        {m.video && (
                          <span className="text-xs bg-blue-600 px-2 py-1 rounded">
                            {m.video}
                          </span>
                        )}
                      </div>
                      <img
                        src={m.output_url}
                        alt="match"
                        className="rounded-lg border border-slate-700 w-full"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Processing Status Summary */}
              {loadingSearch && Object.keys(processingStatus).length > 0 && (
                <div className="mt-4 p-3 bg-slate-800 rounded-lg">
                  <h4 className="text-white font-semibold mb-2">Processing Status:</h4>
                  {Object.entries(processingStatus).map(([video, status]) => (
                    <div key={video} className="text-sm text-slate-300 mb-1">
                      <span className="font-medium">{video}:</span>{" "}
                      <span className={status.includes("Error") ? "text-red-400" : "text-blue-400"}>
                        {status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --------------------- FACE SEARCH MODAL --------------------- */}
      {showFaceSearchModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-slate-800">
              <h3 className="text-2xl font-bold text-white">Face Search in Videos</h3>
              <button
                onClick={() => {
                  setShowFaceSearchModal(false);
                  setFaceQueryFile(null);
                  setSelectedFaceVideos([]);
                  setFaceSearchResults([]);
                  setFaceProcessingStatus({});
                }}
                className="p-2 hover:bg-slate-700 rounded-lg"
              >
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

              {/* Select Videos from Public Folder */}
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

              {/* Processing Status Summary */}
              {loadingFaceSearch && Object.keys(faceProcessingStatus).length > 0 && (
                <div className="mt-4 p-3 bg-slate-800 rounded-lg">
                  <h4 className="text-white font-semibold mb-2">Processing Status:</h4>
                  {Object.entries(faceProcessingStatus).map(([video, status]) => (
                    <div key={video} className="text-sm text-slate-300 mb-1">
                      <span className="font-medium">{video}:</span>{" "}
                      <span className={status.includes("Error") ? "text-red-400" : "text-pink-400"}>
                        {status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
