import React, { useState, Children } from 'react';
import { useNavigate } from 'react-router-dom';
import { PackageSearchIcon, PlusIcon, UserIcon, ClockIcon, MapPinIcon, ImageIcon, ArrowLeftIcon, XIcon, UploadIcon, VideoIcon, BellIcon, CheckCircleIcon, SearchIcon } from 'lucide-react';
interface LostItem {
  id: number;
  item: string;
  location: string;
  reportedBy: string;
  time: string;
  status: 'pending' | 'found';
  description: string;
  image?: string;
  cctv?: {
    camera: string;
    timestamp: string;
    imageId: number;
  };
}
interface LostChild {
  id: number;
  name: string;
  age: number;
  lastSeen: string;
  time: string;
  status: 'searching' | 'found';
  description: string;
  guardian: string;
  image?: string;
  cctv?: {
    camera: string;
    timestamp: string;
    imageId: number;
  };
}
export function AdminLostFound() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'items' | 'children'>('items');
  const [showNewReportModal, setShowNewReportModal] = useState(false);
  const [reportType, setReportType] = useState<'item' | 'child'>('item');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [matchFound, setMatchFound] = useState(false);
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    item: '',
    description: '',
    location: '',
    reportedBy: '',
    guardian: ''
  });
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [lostItems, setLostItems] = useState<LostItem[]>([{
    id: 1,
    item: 'Black Backpack',
    location: 'Main Stage',
    reportedBy: 'John Doe',
    time: '2:30 PM',
    status: 'pending',
    description: 'Black Nike backpack with red straps'
  }, {
    id: 2,
    item: 'iPhone 13 Pro',
    location: 'Food Court',
    reportedBy: 'Jane Smith',
    time: '3:15 PM',
    status: 'found',
    description: 'Blue iPhone with cracked screen'
  }, {
    id: 3,
    item: 'Car Keys',
    location: 'Parking Lot B',
    reportedBy: 'Mike Johnson',
    time: '4:00 PM',
    status: 'pending',
    description: 'Toyota keys with blue keychain'
  }]);
  const [lostChildren, setLostChildren] = useState<LostChild[]>([{
    id: 1,
    name: 'Emma Wilson',
    age: 7,
    lastSeen: 'North Gate',
    time: '1:45 PM',
    status: 'found',
    description: 'Red t-shirt, blue jeans',
    guardian: 'Sarah Wilson'
  }, {
    id: 2,
    name: 'Lucas Brown',
    age: 5,
    lastSeen: 'Play Area',
    time: '2:20 PM',
    status: 'searching',
    description: 'Green hoodie, black pants',
    guardian: 'Tom Brown'
  }]);
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  const handleAIAnalysis = () => {
    setAnalyzing(true);
    setAnalysisComplete(false);
    setMatchFound(false);
    // Simulate AI analysis
    setTimeout(() => {
      const foundMatch = Math.random() > 0.5;
      setMatchFound(foundMatch);
      setAnalysisComplete(true);
      setAnalyzing(false);
    }, 3000);
  };
  const handleSubmitReport = () => {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    });
    if (reportType === 'item') {
      const newItem: LostItem = {
        id: lostItems.length + 1,
        item: formData.item,
        location: formData.location,
        reportedBy: formData.reportedBy,
        time: timeString,
        status: matchFound ? 'found' : 'pending',
        description: formData.description,
        image: uploadedImage || undefined,
        cctv: matchFound ? {
          camera: 'Camera 3 - Food Court',
          timestamp: '3:45 PM',
          imageId: 1492684223068
        } : undefined
      };
      setLostItems([newItem, ...lostItems]);
    } else {
      const newChild: LostChild = {
        id: lostChildren.length + 1,
        name: formData.name,
        age: parseInt(formData.age),
        lastSeen: formData.location,
        time: timeString,
        status: matchFound ? 'found' : 'searching',
        description: formData.description,
        guardian: formData.guardian,
        image: uploadedImage || undefined,
        cctv: matchFound ? {
          camera: 'Camera 5 - North Entrance',
          timestamp: '4:10 PM',
          imageId: 1492684223070
        } : undefined
      };
      setLostChildren([newChild, ...lostChildren]);
    }
    // Reset form
    setShowNewReportModal(false);
    setFormData({
      name: '',
      age: '',
      item: '',
      description: '',
      location: '',
      reportedBy: '',
      guardian: ''
    });
    setUploadedImage(null);
    setAnalyzing(false);
    setAnalysisComplete(false);
    setMatchFound(false);
  };
  const handleMarkAsFound = (id: number, type: 'item' | 'child') => {
    if (type === 'item') {
      setLostItems(lostItems.map(item => item.id === id ? {
        ...item,
        status: 'found'
      } : item));
    } else {
      setLostChildren(lostChildren.map(child => child.id === id ? {
        ...child,
        status: 'found'
      } : child));
    }
  };
  const handleSendAlertToVolunteers = (childId: number) => {
    // Simulate sending alert
    alert('Alert sent to all volunteers! They will be notified about the missing child.');
  };
  return <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Lost & Found</h1>
          <p className="text-slate-400">
            Manage lost items and missing children reports
          </p>
        </div>
        <button onClick={() => setShowNewReportModal(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all flex items-center gap-2">
          <PlusIcon className="w-5 h-5" />
          New Report
        </button>
      </div>
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-slate-400 text-sm mb-1">Lost Items</p>
          <p className="text-3xl font-bold text-blue-400">{lostItems.length}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-slate-400 text-sm mb-1">Items Found</p>
          <p className="text-3xl font-bold text-green-400">
            {lostItems.filter(i => i.status === 'found').length}
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-slate-400 text-sm mb-1">Missing Children</p>
          <p className="text-3xl font-bold text-orange-400">
            {lostChildren.filter(c => c.status === 'searching').length}
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-slate-400 text-sm mb-1">Children Reunited</p>
          <p className="text-3xl font-bold text-green-400">
            {lostChildren.filter(c => c.status === 'found').length}
          </p>
        </div>
      </div>
      {/* Tabs */}
      <div className="flex gap-2">
        <button onClick={() => setActiveTab('items')} className={`px-6 py-3 rounded-lg font-medium transition-all ${activeTab === 'items' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
          Lost Items
        </button>
        <button onClick={() => setActiveTab('children')} className={`px-6 py-3 rounded-lg font-medium transition-all ${activeTab === 'children' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
          Missing Children
        </button>
      </div>
      {/* Content */}
      {activeTab === 'items' ? <div className="space-y-4">
          {lostItems.map(item => <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-16 h-16 rounded-lg bg-slate-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {item.image ? <img src={item.image} alt={item.item} className="w-full h-full object-cover" /> : <ImageIcon className="w-8 h-8 text-slate-600" />}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2">
                      {item.item}
                    </h3>
                    <p className="text-slate-400 text-sm mb-3">
                      {item.description}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-slate-400 mb-3">
                      <span className="flex items-center gap-1">
                        <MapPinIcon className="w-4 h-4" />
                        {item.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <UserIcon className="w-4 h-4" />
                        {item.reportedBy}
                      </span>
                      <span className="flex items-center gap-1">
                        <ClockIcon className="w-4 h-4" />
                        {item.time}
                      </span>
                    </div>
                    {item.cctv && <div className="bg-green-900/20 border border-green-800 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <VideoIcon className="w-4 h-4 text-green-400" />
                          <span className="text-green-400 font-medium text-sm">
                            Found via AI Analysis
                          </span>
                        </div>
                        <p className="text-slate-300 text-sm">
                          Detected on {item.cctv.camera} at{' '}
                          {item.cctv.timestamp}
                        </p>
                      </div>}
                  </div>
                </div>
                <span className={`px-4 py-2 rounded-full text-sm font-medium ${item.status === 'found' ? 'bg-green-600/20 text-green-400' : 'bg-yellow-600/20 text-yellow-400'}`}>
                  {item.status === 'found' ? 'Found' : 'Searching'}
                </span>
              </div>
              {item.status === 'pending' && <button onClick={() => handleMarkAsFound(item.id, 'item')} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-all flex items-center gap-2">
                  <CheckCircleIcon className="w-4 h-4" />
                  Mark as Found
                </button>}
            </div>)}
        </div> : <div className="space-y-4">
          {lostChildren.map(child => <div key={child.id} className={`bg-slate-900 border rounded-xl p-6 ${child.status === 'searching' ? 'border-orange-500' : 'border-slate-800'}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-16 h-16 rounded-lg bg-slate-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {child.image ? <img src={child.image} alt={child.name} className="w-full h-full object-cover" /> : <UserIcon className="w-8 h-8 text-slate-600" />}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2">
                      {child.name}, {child.age} years old
                    </h3>
                    <p className="text-slate-400 text-sm mb-3">
                      {child.description}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-slate-400 mb-3">
                      <span className="flex items-center gap-1">
                        <MapPinIcon className="w-4 h-4" />
                        Last seen: {child.lastSeen}
                      </span>
                      <span className="flex items-center gap-1">
                        <ClockIcon className="w-4 h-4" />
                        {child.time}
                      </span>
                      <span className="flex items-center gap-1">
                        <UserIcon className="w-4 h-4" />
                        Guardian: {child.guardian}
                      </span>
                    </div>
                    {child.cctv && <div className="bg-green-900/20 border border-green-800 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <VideoIcon className="w-4 h-4 text-green-400" />
                          <span className="text-green-400 font-medium text-sm">
                            Found via AI Analysis
                          </span>
                        </div>
                        <p className="text-slate-300 text-sm">
                          Detected on {child.cctv.camera} at{' '}
                          {child.cctv.timestamp}
                        </p>
                      </div>}
                  </div>
                </div>
                <span className={`px-4 py-2 rounded-full text-sm font-medium ${child.status === 'found' ? 'bg-green-600/20 text-green-400' : 'bg-orange-600/20 text-orange-400'}`}>
                  {child.status === 'found' ? 'Reunited' : 'Searching'}
                </span>
              </div>
              {child.status === 'searching' && <div className="flex gap-2">
                  <button onClick={() => handleMarkAsFound(child.id, 'child')} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-all flex items-center gap-2">
                    <CheckCircleIcon className="w-4 h-4" />
                    Mark as Found
                  </button>
                  <button onClick={() => handleSendAlertToVolunteers(child.id)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-all flex items-center gap-2">
                    <BellIcon className="w-4 h-4" />
                    Send Alert to All Volunteers
                  </button>
                </div>}
            </div>)}
        </div>}
      {/* New Report Modal */}
      {showNewReportModal && <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg flex flex-col max-h-[90vh]">
            {/* Fixed Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <h3 className="text-2xl font-bold text-white">New Report</h3>
              <button onClick={() => {
            setShowNewReportModal(false);
            setFormData({
              name: '',
              age: '',
              item: '',
              description: '',
              location: '',
              reportedBy: '',
              guardian: ''
            });
            setUploadedImage(null);
            setAnalyzing(false);
            setAnalysisComplete(false);
            setMatchFound(false);
          }} className="p-2 hover:bg-slate-800 rounded-lg transition-all">
                <XIcon className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Report Type Selection */}
              <div className="mb-6">
                <label className="block text-slate-300 mb-3 font-medium">
                  What are you reporting?
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => setReportType('item')} className={`p-4 rounded-lg border-2 transition-all ${reportType === 'item' ? 'border-blue-500 bg-blue-600/20' : 'border-slate-700 bg-slate-800 hover:border-slate-600'}`}>
                    <PackageSearchIcon className="w-8 h-8 text-blue-400 mb-2 mx-auto" />
                    <div className="text-white font-medium">Lost Item</div>
                  </button>
                  <button type="button" onClick={() => setReportType('child')} className={`p-4 rounded-lg border-2 transition-all ${reportType === 'child' ? 'border-orange-500 bg-orange-600/20' : 'border-slate-700 bg-slate-800 hover:border-slate-600'}`}>
                    <UserIcon className="w-8 h-8 text-orange-400 mb-2 mx-auto" />
                    <div className="text-white font-medium">Missing Child</div>
                  </button>
                </div>
              </div>
              {/* Form Fields */}
              <div className="space-y-4">
                {reportType === 'child' ? <>
                    <div>
                      <label className="block text-slate-300 mb-2 font-medium">
                        Child's Name
                      </label>
                      <input type="text" value={formData.name} onChange={e => setFormData({
                  ...formData,
                  name: e.target.value
                })} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500" placeholder="Enter child's name" required />
                    </div>
                    <div>
                      <label className="block text-slate-300 mb-2 font-medium">
                        Age
                      </label>
                      <input type="number" value={formData.age} onChange={e => setFormData({
                  ...formData,
                  age: e.target.value
                })} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500" placeholder="Enter age" required />
                    </div>
                    <div>
                      <label className="block text-slate-300 mb-2 font-medium">
                        Guardian's Name
                      </label>
                      <input type="text" value={formData.guardian} onChange={e => setFormData({
                  ...formData,
                  guardian: e.target.value
                })} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500" placeholder="Enter guardian's name" required />
                    </div>
                  </> : <div>
                    <label className="block text-slate-300 mb-2 font-medium">
                      Item Name
                    </label>
                    <input type="text" value={formData.item} onChange={e => setFormData({
                ...formData,
                item: e.target.value
              })} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500" placeholder="e.g., Black Backpack, iPhone" required />
                  </div>}
                <div>
                  <label className="block text-slate-300 mb-2 font-medium">
                    {reportType === 'child' ? 'Last Seen Location' : 'Location'}
                  </label>
                  <input type="text" value={formData.location} onChange={e => setFormData({
                ...formData,
                location: e.target.value
              })} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500" placeholder="e.g., Main Stage, Food Court" required />
                </div>
                <div>
                  <label className="block text-slate-300 mb-2 font-medium">
                    Description
                  </label>
                  <textarea value={formData.description} onChange={e => setFormData({
                ...formData,
                description: e.target.value
              })} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 min-h-20 resize-none" placeholder={reportType === 'child' ? 'Describe clothing, appearance, etc.' : 'Describe the item in detail'} required />
                </div>
                <div>
                  <label className="block text-slate-300 mb-2 font-medium">
                    Reported By
                  </label>
                  <input type="text" value={formData.reportedBy} onChange={e => setFormData({
                ...formData,
                reportedBy: e.target.value
              })} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500" placeholder="Your name" required />
                </div>
                {/* Image Upload */}
                <div>
                  <label className="block text-slate-300 mb-2 font-medium">
                    Upload Photo (Optional)
                  </label>
                  {uploadedImage ? <div className="relative">
                      <img src={uploadedImage} alt="Uploaded" className="w-full h-40 object-cover rounded-lg mb-2" />
                      <button type="button" onClick={() => setUploadedImage(null)} className="absolute top-2 right-2 p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-all">
                        <XIcon className="w-4 h-4 text-white" />
                      </button>
                    </div> : <label className="cursor-pointer">
                      <div className="bg-slate-800 border-2 border-dashed border-slate-700 rounded-lg p-6 hover:border-blue-500 transition-all flex flex-col items-center justify-center">
                        <UploadIcon className="w-6 h-6 text-slate-400 mb-2" />
                        <span className="text-slate-300 text-sm font-medium">
                          Click to upload
                        </span>
                        <span className="text-slate-500 text-xs">
                          PNG, JPG up to 5MB
                        </span>
                      </div>
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>}
                </div>
                {/* AI Analysis Section */}
                {uploadedImage && <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                    <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                      <SearchIcon className="w-5 h-5 text-blue-400" />
                      AI Analysis
                    </h4>
                    {!analysisComplete && !analyzing && <button type="button" onClick={handleAIAnalysis} className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all">
                        Analyze with AI
                      </button>}
                    {analyzing && <div className="text-center py-4">
                        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                        <p className="text-slate-300 text-sm">
                          Analyzing CCTV footage...
                        </p>
                      </div>}
                    {analysisComplete && <div className={`p-4 rounded-lg ${matchFound ? 'bg-green-900/20 border border-green-800' : 'bg-slate-700'}`}>
                        {matchFound ? <>
                            <div className="flex items-center gap-2 mb-2">
                              <CheckCircleIcon className="w-5 h-5 text-green-400" />
                              <span className="text-green-400 font-bold text-sm">
                                Match Found!
                              </span>
                            </div>
                            <p className="text-slate-300 text-xs mb-2">
                              {reportType === 'child' ? 'Child detected on Camera 5 - North Entrance at 4:10 PM' : 'Item detected on Camera 3 - Food Court at 3:45 PM'}
                            </p>
                            <img src={`https://images.unsplash.com/photo-${reportType === 'child' ? '1492684223070' : '1492684223068'}?w=400&h=225&fit=crop`} alt="CCTV Match" className="w-full h-28 object-cover rounded-lg" />
                          </> : <div className="text-center">
                            <p className="text-slate-300 text-sm">
                              No match found in CCTV footage. Report will be
                              added to the list.
                            </p>
                          </div>}
                      </div>}
                  </div>}
              </div>
            </div>
            {/* Fixed Footer */}
            <div className="p-6 border-t border-slate-800">
              <div className="flex gap-2">
                <button onClick={handleSubmitReport} disabled={reportType === 'child' && (!formData.name || !formData.age || !formData.guardian || !formData.location || !formData.description || !formData.reportedBy) || reportType === 'item' && (!formData.item || !formData.location || !formData.description || !formData.reportedBy)} className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg font-bold transition-all">
                  Submit Report
                </button>
                <button onClick={() => {
              setShowNewReportModal(false);
              setFormData({
                name: '',
                age: '',
                item: '',
                description: '',
                location: '',
                reportedBy: '',
                guardian: ''
              });
              setUploadedImage(null);
              setAnalyzing(false);
              setAnalysisComplete(false);
              setMatchFound(false);
            }} className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-all">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>}
    </div>;
}