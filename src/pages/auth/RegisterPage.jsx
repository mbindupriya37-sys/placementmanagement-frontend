import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getApiErrorMessage } from '../../services/api'
import { registerRequest } from '../../services/authService'

const accountRoles = [
  {
    value: 'STUDENT',
    label: 'Student',
    description: 'Set up your student account to get started.',
    info: 'Student registration is open. Staff accounts are managed by your placement office.',
    placeholder: 'you@college.edu',
    buttonLabel: 'Create student account',
  },
  {
    value: 'COMPANY_RECRUITER',
    label: 'Company recruiter',
    description: 'Set up your company recruiter account to manage hiring workflows.',
    info: 'Company recruiter registration is open. Your account will be available immediately after verification.',
    placeholder: 'you@company.com',
    buttonLabel: 'Create recruiter account',
  },
]

export default function RegisterPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('STUDENT')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const selectedRole = accountRoles.find((item) => item.value === role) ?? accountRoles[0]

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      await registerRequest({ name: name.trim(), email: email.trim(), password, role })
      navigate('/login', { replace: true, state: { registered: true, role } })
    } catch (requestError) {
      setError(getApiErrorMessage(requestError))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-card">
      <h2>Create your account</h2>
      <p className="auth-subtitle">{selectedRole.description}</p>
      {error && <div className="alert" role="alert">{error}</div>}
      <div className="auth-role-switcher" role="radiogroup" aria-label="Select account type">
        {accountRoles.map((option) => (
          <label key={option.value} className={`auth-role-option ${role === option.value ? 'selected' : ''}`}>
            <input
              type="radio"
              name="register-role"
              value={option.value}
              checked={role === option.value}
              onChange={() => setRole(option.value)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
      <div className="info-note">{selectedRole.info}</div>
      <form onSubmit={handleSubmit}>
        <div className="form-field">
          <label htmlFor="register-name">Full name</label>
          <input
            id="register-name"
            type="text"
            autoComplete="name"
            placeholder="Your name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            maxLength={120}
          />
        </div>
        <div className="form-field">
          <label htmlFor="register-email">Email address</label>
          <input
            id="register-email"
            type="email"
            autoComplete="email"
            placeholder={selectedRole.placeholder}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="register-password">Password</label>
          <input
            id="register-password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 6 characters"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={6}
          />
        </div>
        <button className="primary-button auth-submit" type="submit" disabled={loading}>
          {loading ? 'Creating account...' : selectedRole.buttonLabel}
        </button>
      </form>
      <p className="auth-bottom">
        Already registered? <Link to="/login">Sign in</Link>
      </p>
    </div>
  )
}
