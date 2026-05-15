import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import MemoryHub from './pages/MemoryHub';
import TimelinePage from './pages/TimelinePage';
import LibraryPage from './pages/LibraryPage';
import SessionsPage from './pages/SessionsPage';
import DustParticles from './components/DustParticles';
import { ThemeProvider } from './components/ThemeProvider';
import Layout from './components/Layout';

function ProtectedLayout() {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

function App() {
  return (
    <ThemeProvider>
      <Router>
        <DustParticles />
        <div className="relative z-10 w-full min-h-screen flex flex-col">
          <Routes>
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
              </Route>
              <Route path="profile" element={<Profile />} />
            </Route>
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
