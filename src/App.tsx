import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/common';
import { Login, Register, VerifyAccount } from './components/auth';
import { Home, Dashboard, CreateEvent, EventList, EditEvent, EventDetail } from './pages';
import AcademicYears from './pages/admin/AcademicYears';
import Departments from './pages/admin/Departments';
import Criteria from './pages/admin/Criteria';
import Students from './pages/admin/Students';
import Reports from './pages/admin/Reports';
import EventRegistrations from './pages/admin/EventRegistrations';
import StudentRegistrations from './pages/StudentRegistrations';
import ManagerRegistrations from './pages/ManagerRegistrations';
import StudentTasks from './pages/StudentTasks';
import TaskManagement from './pages/TaskManagement';
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
                  <Departments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/academic-years/*"
              element={
                <ProtectedRoute requireAuth={true} allowedRoles={[Role.ADMIN]}>
                  <AcademicYears />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/criteria/*"
              element={
                <ProtectedRoute requireAuth={true} allowedRoles={[Role.ADMIN]}>
                  <Criteria />
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

            {/* Admin Routes */}
            <Route
              path="/admin/academic-years"
              element={
                <ProtectedRoute requireAuth={true} allowedRoles={[Role.ADMIN]}>
                  <AcademicYears />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/departments"
              element={
                <ProtectedRoute requireAuth={true} allowedRoles={[Role.ADMIN]}>
                  <Departments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/criteria"
              element={
                <ProtectedRoute requireAuth={true} allowedRoles={[Role.ADMIN]}>
                  <Criteria />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/students"
              element={
                <ProtectedRoute requireAuth={true} allowedRoles={[Role.ADMIN]}>
                  <Students />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/reports"
              element={
                <ProtectedRoute requireAuth={true} allowedRoles={[Role.ADMIN]}>
                  <Reports />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/events/:id/registrations"
              element={
                <ProtectedRoute requireAuth={true} allowedRoles={[Role.ADMIN, Role.MANAGER]}>
                  <EventRegistrations />
                </ProtectedRoute>
              }
            />

            {/* Student Routes */}
            <Route
              path="/student/registrations"
              element={
                <ProtectedRoute requireAuth={true} allowedRoles={[Role.STUDENT]}>
                  <StudentRegistrations />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/tasks"
              element={
                <ProtectedRoute requireAuth={true} allowedRoles={[Role.STUDENT]}>
                  <StudentTasks />
                </ProtectedRoute>
              }
            />

            {/* Manager Routes */}
            <Route
              path="/manager/registrations"
              element={
                <ProtectedRoute requireAuth={true} allowedRoles={[Role.ADMIN, Role.MANAGER]}>
                  <ManagerRegistrations />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manager/tasks"
              element={
                <ProtectedRoute requireAuth={true} allowedRoles={[Role.ADMIN, Role.MANAGER]}>
                  <TaskManagement />
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
