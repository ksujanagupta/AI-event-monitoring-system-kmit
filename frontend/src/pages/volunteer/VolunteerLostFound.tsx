import React, { useState, Children } from 'react';
import { useNavigate } from 'react-router-dom';
import { PackageSearchIcon, PlusIcon, CheckIcon, MapPinIcon, ClockIcon, ArrowLeftIcon, XIcon, UploadIcon, UserIcon } from 'lucide-react';
interface LostItem {
  id: number;
  item: string;
  location: string;
  time: string;
  status: 'searching' | 'found';
}
interface LostChild {
  id: number;
  name: string;
  age: number;
  lastSeen: string;
  description: string;
  time: string;
  status: 'searching' | 'found';
}
export function VolunteerLostFound() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'items' | 'children'>('items');
  const [showNewReportModal, setShowNewReportModal] = useState(false);
  const [reportType, setReportType] = useState<'item' | 'child'>('item');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    item: '',
    description: '',
    location: '',
    reportedBy: ''
  });
  const [lostItems, setLostItems] = useState<LostItem[]>([{
    id: 1,
    item: 'Black Backpack',
    location: 'Main Stage',
    time: '15 min ago',
    status: 'searching'
  }, {
    id: 2,
    item: 'iPhone 13 Pro',
    location: 'Food Court',
    time: '32 min ago',
    status: 'searching'
  }]);
  const [lostChildren, setLostChildren] = useState<LostChild[]>([{
    id: 1,
    name: 'Lucas Brown',
    age: 5,
    lastSeen: 'Play Area',
    description: 'Green hoodie, black pants',
    time: '5 min ago',
    status: 'searching'
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
  const handleFoundItem = (id: number) => {
    setLostItems(lostItems.map(item => item.id === id ? {
      ...item,
      status: 'found'
    } : item));
    alert('Item marked as found! Admin has been notified.');
  };
  const handleFoundChild = (id: number) => {
    setLostChildren(lostChildren.map(child => child.id === id ? {
      ...child,
      status: 'found'
    } : child));
    alert('Child marked as found! Admin and guardian have been notified immediately.');
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
        time: timeString,
        status: 'found'
      };
      setLostItems([newItem, ...lostItems]);
      alert('Found item reported successfully!');
    } else {
      const newChild: LostChild = {
        id: lostChildren.length + 1,
        name: formData.name,
        age: parseInt(formData.age),
        lastSeen: formData.location,
        description: formData.description,
        time: timeString,
        status: 'found'
      };
      setLostChildren([newChild, ...lostChildren]);
      alert('Found child reported successfully! Admin and guardian have been notified.');
    }
    setShowNewReportModal(false);
    setFormData({
      name: '',
      age: '',
      item: '',
      description: '',
      location: '',
      reportedBy: ''
    });
    setUploadedImage(null);
  };
  return <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Lost & Found</h1>
          <p className="text-slate-400">Help locate lost items and children</p>
        </div>
        <button onClick={() => setShowNewReportModal(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all flex items-center gap-2">
          <PlusIcon className="w-5 h-5" />
          Report Found Item
        </button>
      </div>
      {/* Tabs */}
      <div className="flex gap-2">
        <button onClick={() => setActiveTab('items')} className={`px-6 py-3 rounded-lg font-medium transition-all ${activeTab === 'items' ? 'bg-green-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
          Lost Items
        </button>
        <button onClick={() => setActiveTab('children')} className={`px-6 py-3 rounded-lg font-medium transition-all ${activeTab === 'children' ? 'bg-green-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
          Missing Children
        </button>
      </div>
      {/* Content */}
      {activeTab === 'items' ? <div className="space-y-4">
          {lostItems.map(item => <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    {item.item}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-slate-400">
                    <span className="flex items-center gap-1">
                      <MapPinIcon className="w-4 h-4" />
                      Last seen: {item.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <ClockIcon className="w-4 h-4" />
                      {item.time}
                    </span>
                  </div>
                </div>
                <span className={`px-4 py-2 rounded-full text-sm font-medium ${item.status === 'found' ? 'bg-green-600/20 text-green-400' : 'bg-yellow-600/20 text-yellow-400'}`}>
                  {item.status === 'found' ? 'Found' : 'Searching'}
                </span>
              </div>
              {item.status === 'searching' && <button onClick={() => handleFoundItem(item.id)} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-all flex items-center gap-2">
                  <CheckIcon className="w-4 h-4" />I Found This Item
                </button>}
            </div>)}
        </div> : <div className="space-y-4">
          {lostChildren.map(child => <div key={child.id} className={`bg-slate-900 rounded-xl p-6 ${child.status === 'searching' ? 'border border-orange-500' : 'border border-slate-800'}`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    {child.name}, {child.age} years old
                  </h3>
                  <p className="text-slate-400 text-sm mb-3">
                    {child.description}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-slate-400">
                    <span className="flex items-center gap-1">
                      <MapPinIcon className="w-4 h-4" />
                      Last seen: {child.lastSeen}
                    </span>
                    <span className="flex items-center gap-1">
                      <ClockIcon className="w-4 h-4" />
                      {child.time}
                    </span>
                  </div>
                </div>
                <span className={`px-4 py-2 rounded-full text-sm font-medium ${child.status === 'found' ? 'bg-green-600/20 text-green-400' : 'bg-orange-600/20 text-orange-400'}`}>
                  {child.status === 'found' ? 'Reunited' : 'URGENT'}
                </span>
              </div>
              {child.status === 'searching' && <button onClick={() => handleFoundChild(child.id)} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-all flex items-center gap-2">
                  <CheckIcon className="w-4 h-4" />I Found This Child
                </button>}
            </div>)}
        </div>}
      {/* New Report Modal */}
      {showNewReportModal && <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <h3 className="text-2xl font-bold text-white">
                Report Found Item/Child
              </h3>
              <button onClick={() => {
            setShowNewReportModal(false);
            setFormData({
              name: '',
              age: '',
              item: '',
              description: '',
              location: '',
              reportedBy: ''
            });
            setUploadedImage(null);
          }} className="p-2 hover:bg-slate-800 rounded-lg transition-all">
                <XIcon className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="mb-6">
                <label className="block text-slate-300 mb-3 font-medium">
                  What did you find?
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => setReportType('item')} className={`p-4 rounded-lg border-2 transition-all ${reportType === 'item' ? 'border-blue-500 bg-blue-600/20' : 'border-slate-700 bg-slate-800 hover:border-slate-600'}`}>
                    <PackageSearchIcon className="w-8 h-8 text-blue-400 mb-2 mx-auto" />
                    <div className="text-white font-medium">Found Item</div>
                  </button>
                  <button type="button" onClick={() => setReportType('child')} className={`p-4 rounded-lg border-2 transition-all ${reportType === 'child' ? 'border-orange-500 bg-orange-600/20' : 'border-slate-700 bg-slate-800 hover:border-slate-600'}`}>
                    <UserIcon className="w-8 h-8 text-orange-400 mb-2 mx-auto" />
                    <div className="text-white font-medium">Found Child</div>
                  </button>
                </div>
              </div>
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
                        Description
                      </label>
                      <textarea value={formData.description} onChange={e => setFormData({
                  ...formData,
                  description: e.target.value
                })} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 min-h-20 resize-none" placeholder="Describe clothing, appearance, etc." required />
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
                    Location Found
                  </label>
                  <input type="text" value={formData.location} onChange={e => setFormData({
                ...formData,
                location: e.target.value
              })} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500" placeholder="e.g., Main Stage, Food Court" required />
                </div>
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
                      </div>
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>}
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-800">
              <div className="flex gap-2">
                <button onClick={handleSubmitReport} disabled={reportType === 'child' && (!formData.name || !formData.age || !formData.description || !formData.location) || reportType === 'item' && (!formData.item || !formData.location)} className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg font-bold transition-all">
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
                reportedBy: ''
              });
              setUploadedImage(null);
            }} className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-all">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>}
    </div>;
}