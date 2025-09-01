import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/common';
import { Login, Register, VerifyAccount } from './components/auth';
import { Home, Dashboard, CreateEvent, EventList, EditEvent, EventDetail } from './pages';
import { Role } from './types';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />

            {/* Auth Routes - redirect to dashboard if already authenticated */}
            <Route
              path="/login"
              element={
                <ProtectedRoute requireAuth={false}>
                  <Login />
                </ProtectedRoute>
              }
            />
            <Route
              path="/register"
              element={
                <ProtectedRoute requireAuth={false}>
                  <Register />
                </ProtectedRoute>
              }
            />
            <Route path="/verify" element={<VerifyAccount />} />
            <Route path="/verify-account" element={<VerifyAccount />} />
            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute requireAuth={true}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            {/* Event Management Routes */}
            <Route
              path="/manager/events"
              element={
                <ProtectedRoute requireAuth={true} allowedRoles={[Role.ADMIN, Role.MANAGER]}>
                  <EventList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manager/events/create"
              element={
                <ProtectedRoute requireAuth={true} allowedRoles={[Role.ADMIN, Role.MANAGER]}>
                  <CreateEvent />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manager/events/:id"
              element={
                <ProtectedRoute requireAuth={true} allowedRoles={[Role.ADMIN, Role.MANAGER]}>
                  <EventDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manager/events/:id/edit"
              element={
                <ProtectedRoute requireAuth={true} allowedRoles={[Role.ADMIN, Role.MANAGER]}>
                  <EditEvent />
                </ProtectedRoute>
              }
            />

            {/* Redirect any unknown routes to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
