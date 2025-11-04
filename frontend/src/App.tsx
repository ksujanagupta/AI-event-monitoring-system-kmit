import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Homepage } from './pages/Homepage';
import { Login } from './pages/auth/Login';
import { SignUp } from './pages/auth/SignUp';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { VolunteerDashboard } from './pages/volunteer/VolunteerDashboard';
import { AttendeeDashboard } from './pages/attendee/AttendeeDashboard';
export function App() {
  return <BrowserRouter>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/admin/*" element={<AdminDashboard />} />
        <Route path="/volunteer/*" element={<VolunteerDashboard />} />
        <Route path="/attendee/*" element={<AttendeeDashboard />} />
      </Routes>
    </BrowserRouter>;
}