import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from '../../components/Sidebar';
import { AttendeeReportIssues } from './AttendeeReportIssues';
import { AttendeeEvacuation } from './AttendeeEvacuation';
import { AttendeeAlerts } from './AttendeeAlerts';
export function AttendeeDashboard() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  return <div className="min-h-screen w-full bg-slate-950 flex">
      <Sidebar role="attendee" onCollapsedChange={setSidebarCollapsed} />
      <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
        <Routes>
          <Route path="/" element={<Navigate to="/attendee/issues" replace />} />
          <Route path="/issues" element={<AttendeeReportIssues />} />
          <Route path="/evacuation" element={<AttendeeEvacuation />} />
          <Route path="/alerts" element={<AttendeeAlerts />} />
        </Routes>
      </div>
    </div>;
}