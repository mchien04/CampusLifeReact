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
import CreateEventSeries from './pages/CreateEventSeries';
import SelectEventTypePage from './pages/SelectEventTypePage';
import CreateSeriesEventPage from "./pages/CreateSeriesEventPage";
import EventSeriesView from './pages/EventSeriesView';
import SeriesList from './pages/SeriesList';
import SeriesDetailPage from "./pages/SeriesDetailPage";

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
              <Route
                  path="/manager/events/create-series"
                  element={
                      <ProtectedRoute requireAuth={true} allowedRoles={[Role.ADMIN, Role.MANAGER]}>
                          <CreateEventSeries />
                      </ProtectedRoute>
                  }
              />
              <Route
                  path="/manager/events/select-type"
                  element={
                      <ProtectedRoute requireAuth={true} allowedRoles={[Role.ADMIN, Role.MANAGER]}>
                          <SelectEventTypePage />
                      </ProtectedRoute>
                  }
              />
              <Route
                  path="/manager/events/create-series/event"
                  element={<CreateSeriesEventPage />}
              />
              <Route
                  path="/manager/event-series/:seriesId/events"
                  element={
                      <ProtectedRoute requireAuth={true} allowedRoles={[Role.ADMIN, Role.MANAGER]}>
                          <EventSeriesView />
                      </ProtectedRoute>
                  }
              />
              <Route
                  path="/manager/event-series"
                  element={
                      <ProtectedRoute requireAuth={true} allowedRoles={[Role.ADMIN, Role.MANAGER]}>
                          <SeriesList />
                      </ProtectedRoute>
                  }
              />
              <Route
                  path="/manager/event-series/:id"
                  element={
                      <ProtectedRoute requireAuth={true} allowedRoles={[Role.ADMIN, Role.MANAGER]}>
                          <SeriesDetailPage />
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
