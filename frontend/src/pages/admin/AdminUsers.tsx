import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchIcon, CheckIcon, XIcon, UserIcon, MailIcon, PhoneIcon, FilterIcon, ArrowLeftIcon, Trash2Icon } from 'lucide-react';
interface UserData {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'volunteer' | 'attendee';
  isApproved: boolean;
  imagePath?: string;
}

export function AdminUsers() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'volunteers' | 'attendees'>('volunteers');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [users, setUsers] = useState<UserData[]>([]);
  const adminName = "sujana"; // This should ideally come from authenticated user context

  const fetchUsers = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/admin/users?adminName=${adminName}`);
      const data = await response.json();
      if (response.ok) {
        setUsers(data);
      } else {
        alert(data.msg || 'Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      alert('Server error while fetching users');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleApproveUser = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/admin/approve-user/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ adminName }),
      });
      const data = await response.json();
      if (response.ok) {
        alert('User approved successfully!');
        fetchUsers(); // Refresh the user list
      } else {
        alert(data.msg || 'Failed to approve user');
      }
    } catch (error) {
      console.error('Error approving user:', error);
      alert('Server error while approving user');
    }
  };

  const handleRejectUser = async (id: string) => {
    if (!window.confirm('Are you sure you want to reject this user?')) {
      return;
    }
    try {
      // For rejection, we might want to delete the user or set a 'rejected' status.
      // For now, I'll implement a delete.
      const response = await fetch(`http://localhost:5000/api/admin/users/${id}?adminName=${adminName}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (response.ok) {
        alert('User rejected and deleted successfully!');
        fetchUsers();
      } else {
        alert(data.msg || 'Failed to reject user');
      }
    } catch (error) {
      console.error('Error rejecting user:', error);
      alert('Server error while rejecting user');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }
    try {
      const response = await fetch(`http://localhost:5000/api/admin/users/${id}?adminName=${adminName}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (response.ok) {
        alert('User deleted successfully!');
        fetchUsers(); // Refresh the user list
      } else {
        alert(data.msg || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Server error while deleting user');
    }
  };

  const handleViewDetails = (user: UserData) => {
    setSelectedUser(user);
    setShowDetailsModal(true);
  };

  const filteredVolunteers = users.filter(
    (user) =>
      user.role === 'volunteer' &&
      user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAttendees = users.filter(
    (user) =>
      user.role === 'attendee' &&
      user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingVolunteers = filteredVolunteers.filter(v => !v.isApproved);
  const approvedVolunteers = filteredVolunteers.filter(v => v.isApproved);
  const pendingAttendees = filteredAttendees.filter(a => !a.isApproved);
  const approvedAttendees = filteredAttendees.filter(a => a.isApproved);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">User Management</h1>
        <p className="text-slate-400">Approve volunteers and manage attendees</p>
      </div>
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-slate-400 text-sm mb-1">Pending Approvals</p>
          <p className="text-3xl font-bold text-yellow-400">
            {pendingVolunteers.length + pendingAttendees.length}
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-slate-400 text-sm mb-1">Active Volunteers</p>
          <p className="text-3xl font-bold text-green-400">
            {approvedVolunteers.length}
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-slate-400 text-sm mb-1">Total Attendees</p>
          <p className="text-3xl font-bold text-blue-400">{approvedAttendees.length + pendingAttendees.length}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-slate-400 text-sm mb-1">Checked In</p>
          <p className="text-3xl font-bold text-purple-400">
            {/* This would require a 'checkedIn' status in the user schema */}
            0
          </p>
        </div>
      </div>
      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('volunteers')}
          className={`px-6 py-3 rounded-lg font-medium transition-all ${activeTab === 'volunteers'
            ? 'bg-blue-600 text-white'
            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
        >
          Volunteers
        </button>
        <button
          onClick={() => setActiveTab('attendees')}
          className={`px-6 py-3 rounded-lg font-medium transition-all ${activeTab === 'attendees'
            ? 'bg-blue-600 text-white'
            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
        >
          Attendees
        </button>
      </div>
      {/* Search Bar */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${activeTab}...`}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-blue-500"
          />
        </div>
        <button className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-all flex items-center gap-2">
          <FilterIcon className="w-5 h-5" />
          Filter
        </button>
      </div>
      {/* Content */}
      {activeTab === 'volunteers' ? (
        <div className="space-y-6">
          {/* Pending Approvals */}
          {pendingVolunteers.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">
                Pending Approvals
              </h3>
              <div className="space-y-3">
                {pendingVolunteers.map((user) => (
                  <div key={user._id} className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {user.imagePath ? (
                          <img
                            src={`http://localhost:5000${user.imagePath}`}
                            alt={user.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center">
                            <UserIcon className="w-6 h-6 text-slate-400" />
                          </div>
                        )}
                        <div>
                          <h4 className="text-white font-semibold">{user.name}</h4>
                          <div className="flex items-center gap-4 text-sm text-slate-400 mt-1">
                            <span className="flex items-center gap-1">
                              <MailIcon className="w-4 h-4" />
                              {user.email}
                            </span>
                            {/* <span className="flex items-center gap-1">
                              <PhoneIcon className="w-4 h-4" />
                              {user.phone}
                            </span>
                            <span>Experience: {user.experience}</span> */}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApproveUser(user._id)}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all flex items-center gap-2"
                        >
                          <CheckIcon className="w-4 h-4" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectUser(user._id)}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all flex items-center gap-2"
                        >
                          <XIcon className="w-4 h-4" />
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Approved Volunteers */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">
              Active Volunteers
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left text-slate-400 font-medium py-3 px-4">
                      Name
                    </th>
                    <th className="text-left text-slate-400 font-medium py-3 px-4">
                      Email
                    </th>
                    {/* <th className="text-left text-slate-400 font-medium py-3 px-4">
                      Phone
                    </th>
                    <th className="text-left text-slate-400 font-medium py-3 px-4">
                      Experience
                    </th>
                    <th className="text-left text-slate-400 font-medium py-3 px-4">
                      Tasks Completed
                    </th> */}
                    <th className="text-left text-slate-400 font-medium py-3 px-4">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {approvedVolunteers.map((user) => (
                    <tr
                      key={user._id}
                      className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {user.imagePath ? (
                            <img
                              src={`http://localhost:5000${user.imagePath}`}
                              alt={user.name}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                              <UserIcon className="w-4 h-4 text-slate-400" />
                            </div>
                          )}
                          <span className="text-white">{user.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-300">{user.email}</td>
                      {/* <td className="py-3 px-4 text-slate-300">
                        {user.phone}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {user.experience}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {user.tasksCompleted}
                      </td> */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewDetails(user)}
                            className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                          >
                            View Details
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user._id)}
                            className="p-1 text-red-400 hover:text-red-300 transition-colors"
                            title="Delete volunteer"
                          >
                            <Trash2Icon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Pending Approvals */}
          {pendingAttendees.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">
                Pending Approvals
              </h3>
              <div className="space-y-3">
                {pendingAttendees.map((user) => (
                  <div key={user._id} className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center">
                          <UserIcon className="w-6 h-6 text-slate-400" />
                        </div>
                        <div>
                          <h4 className="text-white font-semibold">{user.name}</h4>
                          <div className="flex items-center gap-4 text-sm text-slate-400 mt-1">
                            <span className="flex items-center gap-1">
                              <MailIcon className="w-4 h-4" />
                              {user.email}
                            </span>
                            {/* {user.phone && (
                              <span className="flex items-center gap-1">
                                <PhoneIcon className="w-4 h-4" />
                                {user.phone}
                              </span>
                            )} */}
                            {/* <span>Ticket: {user.ticketId}</span> */}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApproveUser(user._id)}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all flex items-center gap-2"
                        >
                          <CheckIcon className="w-4 h-4" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectUser(user._id)}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all flex items-center gap-2"
                        >
                          <XIcon className="w-4 h-4" />
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Registered Attendees */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">
              Registered Attendees
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left text-slate-400 font-medium py-3 px-4">
                      Name
                    </th>
                    <th className="text-left text-slate-400 font-medium py-3 px-4">
                      Email
                    </th>
                    {/* <th className="text-left text-slate-400 font-medium py-3 px-4">
                      Ticket ID
                    </th>
                    <th className="text-left text-slate-400 font-medium py-3 px-4">
                      Check-In Time
                    </th> */}
                    <th className="text-left text-slate-400 font-medium py-3 px-4">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {approvedAttendees.map((user) => (
                    <tr
                      key={user._id}
                      className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-3 px-4 text-white">{user.name}</td>
                      <td className="py-3 px-4 text-slate-300">{user.email}</td>
                      {/* <td className="py-3 px-4 text-slate-300">
                        {user.ticketId}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {user.checkIn}
                      </td> */}
                      <td className="py-3 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${user.isApproved
                            ? 'bg-green-600/20 text-green-400'
                            : 'bg-yellow-600/20 text-yellow-400'
                          }`}
                        >
                          {user.isApproved ? 'Approved' : 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      {/* View Details Modal */}
      {showDetailsModal && selectedUser && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">User Details</h3>
            <div className="space-y-4">
              {/* Profile Image */}
              <div className="flex justify-center">
                {selectedUser.imagePath ? (
                  <img
                    src={`http://localhost:5000${selectedUser.imagePath}`}
                    alt={selectedUser.name}
                    className="w-32 h-32 rounded-full object-cover border-4 border-slate-700"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-slate-700 flex items-center justify-center border-4 border-slate-600">
                    <UserIcon className="w-16 h-16 text-slate-400" />
                  </div>
                )}
              </div>
              {/* User Information */}
              <div className="space-y-3">
                <div>
                  <p className="text-slate-400 text-sm">Name</p>
                  <p className="text-white font-medium">{selectedUser.name}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Email</p>
                  <p className="text-white font-medium">{selectedUser.email}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Role</p>
                  <p className="text-white font-medium">{selectedUser.role}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Status</p>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-1 ${selectedUser.isApproved
                      ? 'bg-green-600/20 text-green-400'
                      : 'bg-yellow-600/20 text-yellow-400'
                      }`}
                  >
                    {selectedUser.isApproved ? 'Approved' : 'Pending'}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                setShowDetailsModal(false);
                setSelectedUser(null);
              }}
              className="w-full mt-6 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}