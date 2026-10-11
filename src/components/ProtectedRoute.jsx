import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const roleHome = {
  STUDENT: '/student',
  TPO_ADMIN: '/admin',
  COMPANY_RECRUITER: '/recruiter',
  DEPARTMENT_COORDINATOR: '/coordinator',
}

export default function ProtectedRoute({ allowedRoles }) {
  const { isAuthenticated, user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <div className="page-loading">Restoring your session...</div>
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />
  if (!allowedRoles.includes(user?.role)) {
    return <Navigate to={roleHome[user?.role] || '/login'} replace />
  }
  return <Outlet />
}
