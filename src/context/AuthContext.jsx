import { useMemo, useState } from 'react'
import AuthContext from './authContext'
import { clearSession, getStoredToken, getStoredUser, saveSession } from '../utils/authStorage'
import { loginRequest } from '../services/authService'

function getInitialSession() {
  const token = getStoredToken()
  const user = getStoredUser()
  if (!token || !user) {
    clearSession()
    return { token: null, user: null }
  }
  return { token, user }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(getInitialSession)
  const [loading] = useState(false)
  const { user, token } = session

  async function login(credentials) {
    const result = await loginRequest(credentials)
    if (!result?.token || !result?.email || !result?.role) {
      throw new Error('The server returned an incomplete login response.')
    }
    const userInfo = {
      userId: result.userId,
      name: result.name,
      email: result.email,
      role: result.role,
    }
    saveSession(result.token, userInfo)
    setSession({ token: result.token, user: userInfo })
    return userInfo
  }

  function logout() {
    clearSession()
    setSession({ token: null, user: null })
  }

  const value = useMemo(() => ({
    user,
    token,
    isAuthenticated: Boolean(token && user),
    login,
    logout,
    loading,
  }), [user, token, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
