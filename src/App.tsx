import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/common';
import { Login, Register, VerifyAccount, ForgotPassword, ResetPassword } from './components/auth';
import ChangePassword from './components/auth/ChangePassword';
import { Home, Dashboard, CreateEvent, EventList, EditEvent, EventDetail, StudentEvents } from './pages';
import StudentEventDetail from './pages/StudentEventDetail';
import StudentParticipationHistory from './pages/StudentParticipationHistory';
import StudentProfile from './pages/StudentProfile';
import StudentSeries from './pages/StudentSeries';
import StudentSeriesDetail from './pages/StudentSeriesDetail';
import StudentMinigame from './pages/StudentMinigame';
import StudentMinigamePlay from './pages/StudentMinigamePlay';
import StudentMinigameHistory from './pages/StudentMinigameHistory';
import QRCodeCheckIn from './pages/QRCodeCheckIn';
import SeriesManagement from './pages/admin/SeriesManagement';
import CreateSeries from './pages/admin/CreateSeries';
import EditSeries from './pages/admin/EditSeries';
import SeriesDetail from './pages/admin/SeriesDetail';
import MinigameManagement from './pages/admin/MinigameManagement';
import CreateMinigame from './pages/admin/CreateMinigame';
import CreateMinigameWizard from './pages/admin/CreateMinigameWizard';
import EditQuiz from './pages/admin/EditQuiz';
import AcademicYears from './pages/admin/AcademicYears';
import SemesterManagement from './pages/admin/SemesterManagement';
import Departments from './pages/admin/Departments';
import Statistics from './pages/admin/Statistics';
import UserManagement from './pages/admin/UserManagement';
import StudentAccountManagement from './pages/admin/StudentAccountManagement';
import EventRegistrations from './pages/admin/EventRegistrations';
import ClassManagement from './pages/admin/ClassManagement';
import TaskManagement from './pages/admin/TaskManagement';
import StudentRegistrations from './pages/StudentRegistrations';
import ManagerRegistrations from './pages/ManagerRegistrations';
import StudentTasks from './pages/StudentTasks';
import { Role } from './types';
import TaskSubmissionsRoute from './pages/TaskSubmissionsRoute';
// Removed criteria-based TrainingScore page
import ViewScores from './pages/ViewScores';
import ManagerScores from './pages/ManagerScores';
import SendEmail from './pages/admin/SendEmail';
import SendNotification from './pages/admin/SendNotification';
import EmailHistory from './pages/admin/EmailHistory';
import EmailDetail from './pages/admin/EmailDetail';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ManagerLayout from './components/layout/ManagerLayout';

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
              <Route
                path="/forgot-password"
                element={
                  <ProtectedRoute requireAuth={false}>
                    <ForgotPassword />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reset-password"
                element={
                  <ProtectedRoute requireAuth={false}>
                    <ResetPassword />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/change-password"
                element={
                  <ProtectedRoute requireAuth={true}>
                    <ChangePassword />
                  </ProtectedRoute>
                }
              />
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
                    <ManagerLayout>
                      <Departments />
                    </ManagerLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/academic-years/*"
                element={
                  <ProtectedRoute requireAuth={true} allowedRoles={[Role.ADMIN]}>
                    <ManagerLayout>
                      <AcademicYears />
                    </ManagerLayout>
                  </ProtectedRoute>
                }
              />
              {/* Removed /admin/criteria routes */}

              {/* Event Management Routes */}
              <Route
                path="/manager/events"
                element={
                  <ProtectedRoute requireAuth={true} allowedRoles={[Role.ADMIN, Role.MANAGER]}>
                    <ManagerLayout>
                      <EventList />
                    </ManagerLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/manager/events/create"
                element={
                  <ProtectedRoute requireAuth={true} allowedRoles={[Role.ADMIN, Role.MANAGER]}>
                    <ManagerLayout>
                      <CreateEvent />
                    </ManagerLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/manager/events/:id"
                element={
                  <ProtectedRoute requireAuth={true} allowedRoles={[Role.ADMIN, Role.MANAGER]}>
                    <ManagerLayout>
                      <EventDetail />
                    </ManagerLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/manager/events/:id/edit"
                element={
                  <ProtectedRoute requireAuth={true} allowedRoles={[Role.ADMIN, Role.MANAGER]}>
                    <ManagerLayout>
                      <EditEvent />
                    </ManagerLayout>
                  </ProtectedRoute>
                }
              />

              {/* Admin Routes */}
              <Route
                path="/admin/academic-years"
                element={
                  <ProtectedRoute requireAuth={true} allowedRoles={[Role.ADMIN]}>
                    <ManagerLayout>
                      <AcademicYears />
                    </ManagerLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/semesters/*"
                element={
                  <ProtectedRoute requireAuth={true} allowedRoles={[Role.ADMIN]}>
                    <ManagerLayout>
                      <SemesterManagement />
                    </ManagerLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/departments"
                element={
                  <ProtectedRoute requireAuth={true} allowedRoles={[Role.ADMIN]}>
                    <ManagerLayout>
                      <Departments />
                    </ManagerLayout>
                  </ProtectedRoute>
                }
              />
              {/* Removed /admin/criteria route */}
              {/* Removed /admin/students route */}
              {/* Removed /admin/reports route */}
              <Route
                path="/admin/statistics"
                element={
                  <ProtectedRoute requireAuth={true} allowedRoles={[Role.ADMIN, Role.MANAGER]}>
                    <ManagerLayout>
                      <Statistics />
                    </ManagerLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute requireAuth={true} allowedRoles={[Role.ADMIN]}>
                    <ManagerLayout>
                      <UserManagement />
                    </ManagerLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/student-accounts"
                element={
                  <ProtectedRoute requireAuth={true} allowedRoles={[Role.ADMIN]}>
                    <ManagerLayout>
                      <StudentAccountManagement />
                    </ManagerLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/events/:id/registrations"
                element={
                  <ProtectedRoute requireAuth={true} allowedRoles={[Role.ADMIN, Role.MANAGER]}>
                    <ManagerLayout>
                      <EventRegistrations />
                    </ManagerLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/classes"
                element={
                  <ProtectedRoute requireAuth={true} allowedRoles={[Role.ADMIN, Role.MANAGER]}>
                    <ManagerLayout>
                      <ClassManagement />
                    </ManagerLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/manager/emails/send"
                element={
                  <ProtectedRoute requireAuth={true} allowedRoles={[Role.ADMIN, Role.MANAGER]}>
                    <ManagerLayout>
                      <SendEmail />
                    </ManagerLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/manager/emails/notifications/send"
                element={
                  <ProtectedRoute requireAuth={true} allowedRoles={[Role.ADMIN, Role.MANAGER]}>
                    <ManagerLayout>
                      <SendNotification />
                    </ManagerLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/manager/emails/history"
                element={
                  <ProtectedRoute requireAuth={true} allowedRoles={[Role.ADMIN, Role.MANAGER]}>
                    <ManagerLayout>
                      <EmailHistory />
                    </ManagerLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/manager/emails/history/:id"
                element={
                  <ProtectedRoute requireAuth={true} allowedRoles={[Role.ADMIN, Role.MANAGER]}>
                    <ManagerLayout>
                      <EmailDetail />
                    </ManagerLayout>
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
                path="/student/series"
                element={
                  <ProtectedRoute requireAuth={true} allowedRoles={[Role.STUDENT]}>
                    <StudentSeries />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/series/:id"
                element={
                  <ProtectedRoute requireAuth={true} allowedRoles={[Role.STUDENT]}>
                    <StudentSeriesDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/minigames"
                element={
                  <ProtectedRoute requireAuth={true} allowedRoles={[Role.STUDENT]}>
                    <StudentMinigame />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/minigames/:activityId/play"
                element={
                  <ProtectedRoute requireAuth={true} allowedRoles={[Role.STUDENT]}>
                    <StudentMinigamePlay />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/qr-checkin"
                element={
                  <ProtectedRoute requireAuth={true} allowedRoles={[Role.STUDENT]}>
                    <QRCodeCheckIn />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/minigames/:activityId/history"
                element={
                  <ProtectedRoute requireAuth={true} allowedRoles={[Role.STUDENT]}>
                    <StudentMinigameHistory />
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
                    <ManagerLayout>
                      <ManagerRegistrations />
                    </ManagerLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/manager/scores"
                element={
                  <ProtectedRoute requireAuth={true} allowedRoles={[Role.ADMIN, Role.MANAGER]}>
                    <ManagerLayout>
                      <ManagerScores />
                    </ManagerLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/manager/tasks"
                element={
                  <ProtectedRoute requireAuth={true} allowedRoles={[Role.ADMIN, Role.MANAGER]}>
                    <ManagerLayout>
                      <TaskManagement />
                    </ManagerLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/manager/series"
                element={
                  <ProtectedRoute requireAuth={true} allowedRoles={[Role.ADMIN, Role.MANAGER]}>
                    <ManagerLayout>
                      <SeriesManagement />
                    </ManagerLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/manager/series/create"
                element={
                  <ProtectedRoute requireAuth={true} allowedRoles={[Role.ADMIN, Role.MANAGER]}>
                    <ManagerLayout>
                      <CreateSeries />
                    </ManagerLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/manager/series/:id"
                element={
                  <ProtectedRoute requireAuth={true} allowedRoles={[Role.ADMIN, Role.MANAGER]}>
                    <ManagerLayout>
                      <SeriesDetail />
                    </ManagerLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/manager/series/:id/edit"
                element={
                  <ProtectedRoute requireAuth={true} allowedRoles={[Role.ADMIN, Role.MANAGER]}>
                    <ManagerLayout>
                      <EditSeries />
                    </ManagerLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/manager/minigames"
                element={
                  <ProtectedRoute requireAuth={true} allowedRoles={[Role.ADMIN, Role.MANAGER]}>
                    <ManagerLayout>
                      <MinigameManagement />
                    </ManagerLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/manager/minigames/create"
                element={
                  <ProtectedRoute requireAuth={true} allowedRoles={[Role.ADMIN, Role.MANAGER]}>
                    <ManagerLayout>
                      <CreateMinigameWizard />
                    </ManagerLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/manager/minigames/create-quiz"
                element={
                  <ProtectedRoute requireAuth={true} allowedRoles={[Role.ADMIN, Role.MANAGER]}>
                    <ManagerLayout>
                      <CreateMinigame />
                    </ManagerLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/manager/minigames/edit/:miniGameId"
                element={
                  <ProtectedRoute requireAuth={true} allowedRoles={[Role.ADMIN, Role.MANAGER]}>
                    <ManagerLayout>
                      <EditQuiz />
                    </ManagerLayout>
                  </ProtectedRoute>
                }
              />

              {/* New utility pages */}
              <Route path="/manager/tasks/:taskId/submissions" element={<TaskSubmissionsRoute />} />
              {/* Removed criteria-based training score tool route */}
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
