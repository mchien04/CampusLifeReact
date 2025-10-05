import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/common';
import { Login, Register, VerifyAccount } from './components/auth';
import { Home, Dashboard, CreateEvent, EventList, EditEvent, EventDetail, StudentEvents } from './pages';
import StudentEventDetail from './pages/StudentEventDetail';
import StudentParticipationHistory from './pages/StudentParticipationHistory';
import StudentProfile from './pages/StudentProfile';
import AcademicYears from './pages/admin/AcademicYears';
import Departments from './pages/admin/Departments';
import Criteria from './pages/admin/Criteria';
import Students from './pages/admin/Students';
import Reports from './pages/admin/Reports';
import EventRegistrations from './pages/admin/EventRegistrations';
import ClassManagement from './pages/admin/ClassManagement';
import TaskManagement from './pages/admin/TaskManagement';
import StudentRegistrations from './pages/StudentRegistrations';
import ManagerRegistrations from './pages/ManagerRegistrations';
import StudentTasks from './pages/StudentTasks';
import { Role } from './types';
import TaskSubmissionsRoute from './pages/TaskSubmissionsRoute';
import TrainingScore from './pages/TrainingScore';
import ViewScores from './pages/ViewScores';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const queryClient = new QueryClient();

function App() {
  return (
    <Router>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
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
              <Route
                path="/admin/classes"
                element={
                  <ProtectedRoute requireAuth={true} allowedRoles={[Role.ADMIN, Role.MANAGER]}>
                    <ClassManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/tasks"
                element={
                  <ProtectedRoute requireAuth={true} allowedRoles={[Role.ADMIN, Role.MANAGER]}>
                    <TaskManagement />
                  </ProtectedRoute>
                }
              />

              {/* Student Routes */}
              <Route
                path="/student/events"
                element={
                  <ProtectedRoute requireAuth={true} allowedRoles={[Role.STUDENT]}>
                    <StudentEvents />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/events/:id"
                element={
                  <ProtectedRoute requireAuth={true} allowedRoles={[Role.STUDENT]}>
                    <StudentEventDetail />
                  </ProtectedRoute>
                }
              />
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
              <Route
                path="/student/participation-history"
                element={
                  <ProtectedRoute requireAuth={true} allowedRoles={[Role.STUDENT]}>
                    <StudentParticipationHistory />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/scores"
                element={
                  <ProtectedRoute requireAuth={true} allowedRoles={[Role.STUDENT]}>
                    <ViewScores />
                  </ProtectedRoute>
                }
              />
              {/* Removed /student/address route - address managed inside profile */}
              <Route
                path="/student/profile"
                element={
                  <ProtectedRoute requireAuth={true} allowedRoles={[Role.STUDENT]}>
                    <StudentProfile />
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

              {/* New utility pages */}
              <Route path="/manager/tasks/:taskId/submissions" element={<TaskSubmissionsRoute />} />
              <Route path="/tools/training-score" element={<TrainingScore />} />
              <Route path="/tools/view-scores" element={<ViewScores />} />

              {/* Redirect any unknown routes to home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
          <ToastContainer position="top-right" autoClose={2500} hideProgressBar />
        </QueryClientProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
