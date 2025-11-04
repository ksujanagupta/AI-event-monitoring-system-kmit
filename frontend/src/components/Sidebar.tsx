import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboardIcon, VideoIcon, BellIcon, UsersIcon, BrainIcon, PackageSearchIcon, MapPinIcon, AlertTriangleIcon, MapIcon, LogOutIcon, MenuIcon, XIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
interface SidebarProps {
  role: 'admin' | 'volunteer' | 'attendee';
  onCollapsedChange?: (collapsed: boolean) => void;
}
export function Sidebar({
  role,
  onCollapsedChange
}: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const handleToggleCollapse = () => {
    const newCollapsed = !collapsed;
    setCollapsed(newCollapsed);
    if (onCollapsedChange) {
      onCollapsedChange(newCollapsed);
    }
  };
  const adminLinks = [{
    path: '/admin/dashboard',
    icon: LayoutDashboardIcon,
    label: 'Dashboard'
  }, {
    path: '/admin/surveillance',
    icon: VideoIcon,
    label: 'Surveillance'
  }, {
    path: '/admin/alerts',
    icon: BellIcon,
    label: 'Alerts & Location'
  }, {
    path: '/admin/users',
    icon: UsersIcon,
    label: 'User Management'
  }, {
    path: '/admin/ai-summary',
    icon: BrainIcon,
    label: 'AI Summary'
  }, {
    path: '/admin/lost-found',
    icon: PackageSearchIcon,
    label: 'Lost & Found'
  }];
  const volunteerLinks = [{
    path: '/volunteer/dashboard',
    icon: LayoutDashboardIcon,
    label: 'Dashboard'
  }, {
    path: '/volunteer/surveillance',
    icon: VideoIcon,
    label: 'Surveillance'
  }, {
    path: '/volunteer/location',
    icon: MapPinIcon,
    label: 'Geo-Location'
  }, {
    path: '/volunteer/lost-found',
    icon: PackageSearchIcon,
    label: 'Lost & Found'
  }];
  const attendeeLinks = [{
    path: '/attendee/issues',
    icon: AlertTriangleIcon,
    label: 'Report Issues'
  }, {
    path: '/attendee/evacuation',
    icon: MapIcon,
    label: 'Evacuation Plan'
  }, {
    path: '/attendee/alerts',
    icon: BellIcon,
    label: 'Alerts'
  }];
  const links = role === 'admin' ? adminLinks : role === 'volunteer' ? volunteerLinks : attendeeLinks;
  const roleColor = role === 'admin' ? 'blue' : role === 'volunteer' ? 'green' : 'purple';
  return <>
      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full bg-slate-900 border-r border-slate-700 transition-all duration-300 z-40 ${collapsed ? 'w-20' : 'w-64'}`}>
        {/* Header */}
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          {!collapsed && <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg bg-${roleColor}-600 flex items-center justify-center`}>
                <LayoutDashboardIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-white font-bold capitalize">{role}</h2>
                <p className="text-slate-400 text-sm">Panel</p>
              </div>
            </div>}
          <button onClick={handleToggleCollapse} className="p-2 hover:bg-slate-800 rounded-lg transition-all text-slate-400 hover:text-white">
            {collapsed ? <ChevronRightIcon className="w-5 h-5" /> : <ChevronLeftIcon className="w-5 h-5" />}
          </button>
        </div>
        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {links.map(link => {
          const isActive = location.pathname === link.path;
          return <button key={link.path} onClick={() => navigate(link.path)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive ? `bg-${roleColor}-600 text-white` : 'text-slate-400 hover:bg-slate-800 hover:text-white'} ${collapsed ? 'justify-center' : ''}`} title={collapsed ? link.label : ''}>
                <link.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span>{link.label}</span>}
              </button>;
        })}
        </nav>
        {/* Logout */}
        <div className="absolute bottom-0 w-full p-4 border-t border-slate-700">
          <button onClick={() => navigate('/login')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-all ${collapsed ? 'justify-center' : ''}`} title={collapsed ? 'Logout' : ''}>
            <LogOutIcon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </div>
    </>;
}