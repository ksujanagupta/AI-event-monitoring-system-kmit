import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from '../../components/Sidebar';
import { VolunteerDashboardHome } from './VolunteerDashboardHome';
import { VolunteerSurveillance } from './VolunteerSurveillance';
import { VolunteerLocation } from './VolunteerLocation';
import { VolunteerLostFound } from './VolunteerLostFound';
export function VolunteerDashboard() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  return <div className="min-h-screen w-full bg-slate-950 flex">
      <Sidebar role="volunteer" onCollapsedChange={setSidebarCollapsed} />
      <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
        <Routes>
          <Route path="/" element={<Navigate to="/volunteer/dashboard" replace />} />
          <Route path="/dashboard" element={<VolunteerDashboardHome />} />
          <Route path="/surveillance" element={<VolunteerSurveillance />} />
          <Route path="/location" element={<VolunteerLocation />} />
          <Route path="/lost-found" element={<VolunteerLostFound />} />
        </Routes>
      </div>
    </div>;
}