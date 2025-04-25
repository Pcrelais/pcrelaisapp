import React from 'react';
import { useAuth } from '../../context/AuthContext';
import ClientDashboard from './ClientDashboard';
import RelayDashboard from './RelayDashboard';
import TechDashboard from './TechDashboard';
import AdminDashboard from './AdminDashboard';
import Layout from '../../components/layout/Layout';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  
  const renderDashboard = () => {
    if (!user) {
      return <div>Chargement...</div>;
    }
    
    switch (user.role) {
      case 'client':
        return <ClientDashboard />;
      case 'relayPoint':
        return <RelayDashboard />;
      case 'technician':
        return <TechDashboard />;
      case 'admin':
        return <AdminDashboard />;
      default:
        return <div>Type d'utilisateur non reconnu</div>;
    }
  };
  
  return (
    <Layout>
      {renderDashboard()}
    </Layout>
  );
};

export default Dashboard;