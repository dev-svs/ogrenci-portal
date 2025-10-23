import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';
// useAuth() ile context’ten user alınır.
// user mevcutsa <Outlet/> döner

export default function PrivateRoute() {
  const { user } = useAuth();
  return user ? <Outlet/> : <Navigate to="/login" replace />;
} //user yoksa <Navigate to="/login" replace /> ile yönlendirir
