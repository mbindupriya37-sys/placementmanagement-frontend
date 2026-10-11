import api from './api'

export async function loginRequest(credentials) {
  const response = await api.post('/auth/login', credentials)
  return response.data?.data
}

export async function registerRequest(details) {
  const response = await api.post('/auth/register', details)
  return response.data?.data
}
