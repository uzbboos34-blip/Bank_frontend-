import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useLiveUpdate } from './hooks/useLiveUpdate';
import GlobalToast from './components/GlobalToast';
import DashboardLayout from './components/layout/DashboardLayout';

import Login from './pages/Login';
import DebtorsList from './pages/DebtorsList';
import DebtorDetail from './pages/DebtorDetail';
import Report from './pages/Report';
import ImportExcel from './pages/ImportExcel';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center font-bold text-slate-500">Yuklanmoqda...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function App() {
  useLiveUpdate();

  return (
    <AuthProvider>
      <BrowserRouter>
        <GlobalToast />
        <Routes>
          {/* Public Login Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Mobile Frame matching Screenshots */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/debtors" replace />} />
            <Route path="debtors" element={<DebtorsList />} />
            <Route path="debtor/:id" element={<DebtorDetail />} />
            <Route path="report" element={<Report />} />
            <Route path="import" element={<ImportExcel />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/debtors" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
