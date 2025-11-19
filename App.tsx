import React from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { InstructorDashboard } from './pages/InstructorDashboard';
import { StudentDashboard } from './pages/StudentDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { UserRole } from './types';

const AppContent: React.FC = () => {
  const { user } = useStore();

  if (!user) {
    return <LoginPage />;
  }

  return (
    <Layout>
      {user.role === UserRole.ADMIN ? (
        <AdminDashboard />
      ) : user.role === UserRole.INSTRUCTOR ? (
        <InstructorDashboard />
      ) : (
        <StudentDashboard />
      )}
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
};

export default App;
