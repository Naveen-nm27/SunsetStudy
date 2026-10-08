import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import DustParticles from './components/DustParticles';
import { ThemeProvider } from './components/ThemeProvider';
import Layout from './components/Layout';
import { ToastProvider } from './components/ToastProvider';
import { ConfirmProvider } from './components/ConfirmProvider';
import StudyTimerProvider from './components/StudyTimerProvider';
const LandingPage = lazy(() => import('./pages/LandingPage'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Profile = lazy(() => import('./pages/Profile'));
const MemoryHub = lazy(() => import('./pages/MemoryHub'));
const TimelinePage = lazy(() => import('./pages/TimelinePage'));
const LibraryPage = lazy(() => import('./pages/LibraryPage'));
const SessionsPage = lazy(() => import('./pages/SessionsPage'));
const TodosPage = lazy(() => import('./pages/TodosPage'));

function ProtectedLayout() {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return (
    <StudyTimerProvider><Layout>
      <Outlet />
    </Layout></StudyTimerProvider>
  );
}

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <ConfirmProvider>
          <Router>
            <DustParticles />
            <div className="relative z-10 w-full min-h-screen flex flex-col">
              <Suspense fallback={<p role="status" className="p-10 text-center text-text-muted">Loading your study space…</p>}><Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route element={<ProtectedLayout />}>
                  <Route path="dashboard">
                    <Route index element={<Navigate to="memory" replace />} />
                    <Route path="memory" element={<MemoryHub />} />
                    <Route path="timeline" element={<TimelinePage />} />
                    <Route path="library" element={<LibraryPage />} />
                    <Route path="sessions" element={<SessionsPage />} />
                    <Route path="todos" element={<TodosPage />} />
                  </Route>
                  <Route path="profile" element={<Profile />} />
                </Route>
              </Routes></Suspense>
            </div>
          </Router>
        </ConfirmProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
