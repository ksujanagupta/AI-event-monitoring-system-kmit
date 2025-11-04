import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UsersIcon, AlertTriangleIcon, CheckCircleIcon, ActivityIcon, TrendingUpIcon, ClockIcon, ArrowLeftIcon } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface IssueData {
  _id: string;
  reportedBy: { _id: string; name: string };
  description: string;
  location: { latitude: number; longitude: number };
  timestamp: string;
  status: 'reported' | 'in-progress' | 'resolved';
  assignedTo?: { _id: string; name: string }[];
}

interface UserData {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'volunteer' | 'attendee';
  isApproved: boolean;
}

interface ActivityData {
  time: string;
  alerts: number;
  resolved: number;
}

interface TopVolunteerData {
  name: string;
  tasks: number;
}

export function AdminDashboardHome() {
  const navigate = useNavigate();
  const [totalVolunteers, setTotalVolunteers] = useState(0);
  const [activeAlerts, setActiveAlerts] = useState(0);
  const [resolvedIssues, setResolvedIssues] = useState(0);
  const [totalAttendees, setTotalAttendees] = useState(0);
  const [recentAlerts, setRecentAlerts] = useState<IssueData[]>([]);
  const [activityData, setActivityData] = useState<ActivityData[]>([]); // New state for activity chart data
  const [topVolunteersData, setTopVolunteersData] = useState<TopVolunteerData[]>([]); // New state for top volunteers chart data
  const adminName = "sujana"; // Replace with actual admin name from context or local storage

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch Total Volunteers (using dedicated endpoint)
        const volunteersResponse = await fetch(`http://localhost:5000/api/admin/volunteers?adminName=${adminName}`);
        const volunteersData: UserData[] = await volunteersResponse.json();
        setTotalVolunteers(volunteersData.length); // The endpoint already returns only approved volunteers

        // Fetch Total Attendees
        const attendeesResponse = await fetch(`http://localhost:5000/api/admin/users?adminName=${adminName}&role=attendee`);
        const attendeesData: UserData[] = await attendeesResponse.json();
        setTotalAttendees(attendeesData.length);

        // Fetch Issues for Active Alerts and Resolved Issues
        const issuesResponse = await fetch(`http://localhost:5000/api/admin/issues?adminName=${adminName}`);
        const issuesData: IssueData[] = await issuesResponse.json();
        setActiveAlerts(issuesData.filter(issue => issue.status === 'reported' || issue.status === 'in-progress').length);
        setResolvedIssues(issuesData.filter(issue => issue.status === 'resolved').length);

        // Set Recent Alerts (e.g., top 5 most recent active issues)
        setRecentAlerts(issuesData.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5));

        // Fetch 24-Hour Activity Data
        const activityResponse = await fetch(`http://localhost:5000/api/admin/activity-summary?adminName=${adminName}`);
        const activitySummaryData: ActivityData[] = await activityResponse.json();
        setActivityData(activitySummaryData);

        // Fetch Top Volunteers Data
        const topVolunteersResponse = await fetch(`http://localhost:5000/api/admin/top-volunteers?adminName=${adminName}`);
        const topVolunteersData: TopVolunteerData[] = await topVolunteersResponse.json();
        setTopVolunteersData(topVolunteersData);

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    fetchDashboardData();
  }, [adminName]);

  const stats = [
    {
      label: 'Active Volunteers',
      value: totalVolunteers.toString(),
      icon: UsersIcon,
      color: 'green',
    },
    {
      label: 'Active Alerts',
      value: activeAlerts.toString(),
      icon: AlertTriangleIcon,
      color: 'red',
    },
    {
      label: 'Resolved Issues',
      value: resolvedIssues.toString(),
      icon: CheckCircleIcon,
      color: 'blue',
    },
    {
      label: 'Total Attendees',
      value: totalAttendees.toString(),
      icon: ActivityIcon,
      color: 'purple',
    }
  ];

  return <div className="p-6 space-y-6">
      {/* Back Button */}
      <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
        <ArrowLeftIcon className="w-4 h-4" />
        <span>Back to Home</span>
      </button>
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
        <p className="text-slate-400">
          Real-time event monitoring and analytics
        </p>
      </div>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => <div key={index} className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-lg bg-${stat.color}-600/20 flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 text-${stat.color}-400`} />
              </div>
            </div>
            <h3 className="text-slate-400 text-sm mb-1">{stat.label}</h3>
            <p className="text-3xl font-bold text-white">{stat.value}</p>
          </div>)}
      </div>
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4">
            24-Hour Activity
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={activityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="time" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px'
            }} labelStyle={{
              color: '#94a3b8'
            }} />
              <Line type="monotone" dataKey="alerts" stroke="#ef4444" strokeWidth={2} />
              <Line type="monotone" dataKey="resolved" stroke="#22c55e" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        {/* Volunteer Performance */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4">Top Volunteers</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={topVolunteersData}> {/* Use real data here */}
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px'
            }} labelStyle={{
              color: '#94a3b8'
            }} />
              <Bar dataKey="tasks" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      {/* Recent Alerts Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">Recent Alerts</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left text-slate-400 font-medium py-3 px-4">
                  Type
                </th>
                <th className="text-left text-slate-400 font-medium py-3 px-4">
                  Location
                </th>
                <th className="text-left text-slate-400 font-medium py-3 px-4">
                  Status
                </th>
                <th className="text-left text-slate-400 font-medium py-3 px-4">
                  Assigned To
                </th>
                <th className="text-left text-slate-400 font-medium py-3 px-4">
                  Time
                </th>
              </tr>
            </thead>
            <tbody>
              {recentAlerts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-4 text-slate-400">
                    No recent alerts.
                  </td>
                </tr>
              ) : (
                recentAlerts.map((alert) => (
                  <tr key={alert._id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4 text-white">{alert.description.split('.')[0]}</td>
                    <td className="py-3 px-4 text-slate-300">Lat: {alert.location.latitude.toFixed(4)}, Lng: {alert.location.longitude.toFixed(4)}</td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        alert.status === 'reported' ? 'bg-red-600/20 text-red-400' :
                        alert.status === 'in-progress' ? 'bg-yellow-600/20 text-yellow-400' :
                        'bg-green-600/20 text-green-400'
                      }`}>
                        {alert.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {alert.assignedTo?.map(a => a.name).join(', ') || 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-sm">
                      {new Date(alert.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>;
}