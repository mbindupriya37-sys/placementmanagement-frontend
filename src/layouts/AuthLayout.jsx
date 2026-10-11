import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const roleHome = {
  STUDENT: '/student',
  TPO_ADMIN: '/admin',
  COMPANY_RECRUITER: '/recruiter',
  DEPARTMENT_COORDINATOR: '/coordinator',
}

export default function AuthLayout() {
  const { isAuthenticated, user, loading } = useAuth()

  if (loading) return <div className="page-loading">Restoring your session...</div>
  if (isAuthenticated) return <Navigate to={roleHome[user?.role] || '/login'} replace />

  return (
    <main className="auth-shell">
      <section className="auth-brand-panel">
        <div className="brand-lockup">
          <span className="brand-mark">P</span>
          <span>PlacementOS</span>
        </div>
        <div className="brand-copy">
          <p className="brand-kicker">Campus recruitment, connected</p>
          <h1>Your next opportunity starts here.</h1>
          <p>A clear, supportive space to navigate every step of your campus placement journey.</p>
        </div>
        <p className="brand-footer">A smarter campus-to-career experience.</p>
      </section>
      <section className="auth-form-panel">
        <Outlet />
      </section>
    </main>
  )
}
