import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './auth/PrivateRoute.jsx';

const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const Login     = lazy(() => import('./pages/Login.jsx'));
const NotFound  = lazy(() => import('./pages/NotFound.jsx'));

export default function App() {
  return (
    <Suspense fallback={
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div className="spinner-border" role="status"><span className="visually-hidden">Loading...</span></div>
        <div className="mt-2 text-muted">Yükleniyor...</div>
      </div>
    }>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        {/* Protected */}
        <Route path="/dashboard/*" element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }/>
        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
