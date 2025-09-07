import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/common';
import { Login, Register, VerifyAccount } from './components/auth';
import { Home, Dashboard, CreateEvent, EventList, EditEvent, EventDetail } from './pages';
import DepartmentManagement from './pages/admin/DepartmentManagement';
import AcademicYearManagement from './pages/admin/AcademicYearManagement';
import SemesterManagement from './pages/admin/SemesterManagement';
import CriteriaGroupManagement from './pages/admin/CriteriaGroupManagement';
import CriteriaItemManagement from './pages/admin/CriteriaItemManagement';
import EditSemester from './pages/admin/EditSemester';
import EditCriteriaItem from './pages/admin/EditCriteriaItem';
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

            {/* Admin Management Routes */}
            <Route
              path="/admin/departments/*"
              element={
                <ProtectedRoute requireAuth={true} allowedRoles={[Role.ADMIN]}>
                  <DepartmentManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/academic-years/*"
              element={
                <ProtectedRoute requireAuth={true} allowedRoles={[Role.ADMIN]}>
                  <AcademicYearManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/academic-years/:yearId/semesters/*"
              element={
                <ProtectedRoute requireAuth={true} allowedRoles={[Role.ADMIN]}>
                  <SemesterManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/semesters/:id/edit"
              element={
                <ProtectedRoute requireAuth={true} allowedRoles={[Role.ADMIN]}>
                  <EditSemester />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/criteria-groups/*"
              element={
                <ProtectedRoute requireAuth={true} allowedRoles={[Role.ADMIN]}>
                  <CriteriaGroupManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/criteria-groups/:groupId/items/*"
              element={
                <ProtectedRoute requireAuth={true} allowedRoles={[Role.ADMIN]}>
                  <CriteriaItemManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/criteria-items/:id/edit"
              element={
                <ProtectedRoute requireAuth={true} allowedRoles={[Role.ADMIN]}>
                  <EditCriteriaItem />
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
