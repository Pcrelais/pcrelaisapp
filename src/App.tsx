import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import HomePage from './pages/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import Dashboard from './pages/dashboard/Dashboard';
import RequestRepairPage from './pages/request/RequestRepairPage';
import RepairDetailPage from './pages/repair/RepairDetailPage';
import ChatPage from './pages/chat/ChatPage';
import NotificationsPage from './pages/NotificationsPage';
import ProfilePage from './pages/ProfilePage';
import RelayPointsList from './pages/admin/RelayPointsList';
import RelayPointForm from './pages/admin/RelayPointForm';
import ScanQRCodePage from './pages/relay/ScanQRCodePage';

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/request-repair" element={<RequestRepairPage />} />
          
          {/* Protected routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/repair/:id" 
            element={
              <ProtectedRoute>
                <RepairDetailPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/tech/repair/:id" 
            element={
              <ProtectedRoute>
                <RepairDetailPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/chat/:id" 
            element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/notifications" 
            element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } 
          />
          
          {/* Routes pour les points relais */}
          <Route 
            path="/relay/scan" 
            element={
              <ProtectedRoute>
                <ScanQRCodePage />
              </ProtectedRoute>
            } 
          />
          
          {/* Routes pour la gestion des points relais */}
          <Route 
            path="/admin/relay-points" 
            element={
              <ProtectedRoute>
                <RelayPointsList />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/relay-points/new" 
            element={
              <ProtectedRoute>
                <RelayPointForm />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/relay-points/edit/:id" 
            element={
              <ProtectedRoute>
                <RelayPointForm />
              </ProtectedRoute>
            } 
          />
          
          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;