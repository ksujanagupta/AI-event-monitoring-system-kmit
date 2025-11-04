import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from '../../components/Sidebar';
import { AdminDashboardHome } from './AdminDashboardHome';
import { AdminSurveillance } from './AdminSurveillance';
import { AdminAlerts } from './AdminAlerts';
import { AdminUsers } from './AdminUsers';
import { AdminAISummary } from './AdminAISummary';
import { AdminLostFound } from './AdminLostFound';
export function AdminDashboard() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  return <div className="min-h-screen w-full bg-slate-950 flex">
      <Sidebar role="admin" onCollapsedChange={setSidebarCollapsed} />
      <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
        <Routes>
          <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/dashboard" element={<AdminDashboardHome />} />
          <Route path="/surveillance" element={<AdminSurveillance />} />
          <Route path="/alerts" element={<AdminAlerts />} />
          <Route path="/users" element={<AdminUsers />} />
          <Route path="/ai-summary" element={<AdminAISummary />} />
          <Route path="/lost-found" element={<AdminLostFound />} />
        </Routes>
      </div>
    </div>;
}