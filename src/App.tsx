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
import TechniciansPage from './pages/admin/TechniciansPage';
import TechnicianEditForm from './pages/admin/TechnicianEditForm';
import UsersPage from './pages/admin/UsersPage';
import SettingsPage from './pages/admin/SettingsPage';
import ReportsPage from './pages/admin/ReportsPage';
import ScanQRCodePage from './pages/relay/ScanQRCodePage';
import RelayProfilePage from './pages/relay/RelayProfilePage';
import TechnicianPickupPage from './pages/technician/TechnicianPickupPage';
import TechnicianDiagnosticPage from './pages/technician/TechnicianDiagnosticPage';
import RepairsListPage from './pages/repair/RepairsListPage';

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
          <Route 
            path="/relay/profile" 
            element={
              <ProtectedRoute>
                <RelayProfilePage />
              </ProtectedRoute>
            } 
          />
          
          {/* Routes pour les techniciens */}
          <Route 
            path="/technician/pickup" 
            element={
              <ProtectedRoute>
                <TechnicianPickupPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/technician/repair/:repairId" 
            element={
              <ProtectedRoute>
                <TechnicianDiagnosticPage />
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
          
          {/* Routes pour la gestion des techniciens */}
          <Route 
            path="/admin/technicians" 
            element={
              <ProtectedRoute>
                <TechniciansPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/technicians/edit/:id" 
            element={
              <ProtectedRoute>
                <TechnicianEditForm />
              </ProtectedRoute>
            } 
          />
          
          {/* Routes pour la gestion des utilisateurs */}
          <Route 
            path="/admin/users" 
            element={
              <ProtectedRoute>
                <UsersPage />
              </ProtectedRoute>
            } 
          />
          
          {/* Routes pour les paramètres du système */}
          <Route 
            path="/admin/settings" 
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            } 
          />
          
          {/* Routes pour les rapports et statistiques */}
          <Route 
            path="/admin/reports" 
            element={
              <ProtectedRoute>
                <ReportsPage />
              </ProtectedRoute>
            } 
          />
          
          {/* Route pour la gestion des réparations */}
          <Route 
            path="/admin/repairs" 
            element={
              <ProtectedRoute>
                <RepairsListPage />
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