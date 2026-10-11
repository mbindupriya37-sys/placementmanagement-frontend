import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { getApiErrorMessage } from '../../services/api'

const roleHome = {
  STUDENT: '/student',
  TPO_ADMIN: '/admin',
  COMPANY_RECRUITER: '/recruiter',
  DEPARTMENT_COORDINATOR: '/coordinator',
}

const accountRoles = {
  STUDENT: {
    successMessage: 'Your student account is ready. Please sign in.',
    registerLink: 'Create a student account',
    placeholder: 'you@college.edu',
  },
  COMPANY_RECRUITER: {
    successMessage: 'Your company recruiter account is ready. Please sign in.',
    registerLink: 'Create a company recruiter account',
    placeholder: 'you@company.com',
  },
}

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const registeredRole = location.state?.role || 'STUDENT'
  const loginRole = accountRoles[registeredRole] || accountRoles.STUDENT

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login({ email: email.trim(), password })
      const requestedPath = location.state?.from?.pathname
      navigate(requestedPath || roleHome[user.role] || '/login', { replace: true })
    } catch (requestError) {
      setError(requestError.message === 'The server returned an incomplete login response.'
        ? requestError.message
        : getApiErrorMessage(requestError))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-card">
      <h2>Welcome back</h2>
      <p className="auth-subtitle">Sign in to continue to your PlacementOS workspace.</p>
      {location.state?.registered && (
        <div className="success-note" role="status">{loginRole.successMessage}</div>
      )}
      {error && <div className="alert" role="alert">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-field">
          <label htmlFor="login-email">Email address</label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder={loginRole.placeholder}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>
        <button className="primary-button auth-submit" type="submit" disabled={loading}>
          {loading ? 'Signing in...' : 'Login'}
        </button>
      </form>
      <p className="auth-bottom">
        New to PlacementOS? <Link to="/register">{loginRole.registerLink}</Link>
      </p>
    </div>
  )
}
