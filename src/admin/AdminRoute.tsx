import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { getAdminToken } from '../utils/api';

interface AdminRouteProps {
  children: ReactNode;
}

export default function AdminRoute({ children }: AdminRouteProps) {
  const token = getAdminToken();

  if (!token) {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
}
