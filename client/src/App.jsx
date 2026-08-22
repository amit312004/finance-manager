import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '@/pages/Login';
import RegisterPage from '@/pages/Register';
import { useAuth } from '@/context/AuthContext';
import { TransactionProvider } from '@/context/TransactionContext';
import Layout from '@/components/Layout';
import DashboardPage from '@/pages/Dashboard';
import TransactionsPage from '@/pages/Transactions';
import AnalyticsPage from '@/pages/Analytics';
import BudgetsPage from '@/pages/Budgets';
import ScannerPage from '@/pages/Scanner';
import SettingsPage from '@/pages/Settings';
import HealthScorePage from '@/pages/HealthScore';

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;

  return (
    <TransactionProvider>
      <Layout>
        {children}
      </Layout>
    </TransactionProvider>
  );
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected Dashboard Routes */}
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/health-score" element={<ProtectedRoute><HealthScorePage /></ProtectedRoute>} />
      <Route path="/transactions" element={<ProtectedRoute><TransactionsPage /></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
      <Route path="/budgets" element={<ProtectedRoute><BudgetsPage /></ProtectedRoute>} />
      <Route path="/scanner" element={<ProtectedRoute><ScannerPage /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

      <Route path="/" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}

export default App;
