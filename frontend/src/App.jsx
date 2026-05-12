import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import TreesPage from './pages/TreesPage.jsx';
import TreeDetailPage from './pages/TreeDetailPage.jsx';
import TreeMembersPage from './pages/TreeMembersPage.jsx';
import PersonsPage from './pages/PersonsPage.jsx';
import InvitesPage from './pages/InvitesPage.jsx';
import InviteTokenPage from './pages/InviteTokenPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import LandingPage from './pages/LandingPage.jsx';
import VerifyEmailPage from './pages/VerifyEmailPage.jsx';

function HomeRedirect() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/trees" replace /> : <LandingPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/invite/:token" element={<InviteTokenPage />} />

          <Route path="/trees" element={<ProtectedRoute><TreesPage /></ProtectedRoute>} />
          <Route path="/trees/:treeId" element={<ProtectedRoute><TreeDetailPage /></ProtectedRoute>} />
          <Route path="/trees/:treeId/members" element={<ProtectedRoute><TreeMembersPage /></ProtectedRoute>} />
          <Route path="/trees/:treeId/persons" element={<ProtectedRoute><PersonsPage /></ProtectedRoute>} />
          <Route path="/invites" element={<ProtectedRoute><InvitesPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

          <Route path="/" element={<HomeRedirect />} />
          <Route path="*" element={<HomeRedirect />} />
        </Routes>
      </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
