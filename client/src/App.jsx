import { Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage.jsx';
import { Login } from './pages/Login.jsx';
import { Onboarding } from './pages/Onboarding.jsx';
import { ParentDashboard } from './pages/ParentDashboard.jsx';
import { TeenDashboard } from './pages/TeenDashboard.jsx';
import { HouseholdProvider } from './context/HouseholdContext.jsx';
import { useAuth } from './context/AuthContext.jsx';

function RequireRole({ role, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to="/" replace />;
  return <HouseholdProvider>{children}</HouseholdProvider>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route
        path="/parent"
        element={
          <RequireRole role="parent">
            <ParentDashboard />
          </RequireRole>
        }
      />
      <Route
        path="/teen"
        element={
          <RequireRole role="teen">
            <TeenDashboard />
          </RequireRole>
        }
      />
    </Routes>
  );
}
