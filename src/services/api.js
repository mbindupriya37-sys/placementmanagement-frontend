import axios from 'axios'
import { getStoredToken } from '../utils/authStorage'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = getStoredToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export function getApiErrorMessage(error) {
  const status = error?.response?.status
  const responseData = error?.response?.data
  const serverMessage = responseData?.message

  if (status === 401) return 'Your session could not be verified. Please log in again.'
  if (status === 403) return serverMessage || 'You do not have permission to perform this action.'
  if (status === 404) return serverMessage || 'The requested resource was not found.'
  if (status === 409) return serverMessage || 'This request conflicts with existing data. Please refresh and try again.'
  if (status === 413) return serverMessage || 'The selected file is too large. Choose a smaller file and try again.'
  if (status === 400) {
    const validationErrors = responseData?.errors
    if (validationErrors && typeof validationErrors === 'object') {
      const messages = Object.entries(validationErrors)
        .map(([field, message]) => `${field}: ${message}`)
      if (messages.length) return messages.join('. ')
    }
    if (serverMessage) return serverMessage
    return 'Please check the submitted information and try again.'
  }
  if (status >= 500) return 'The server encountered a problem. Please try again later.'
  if (!error?.response) return 'Unable to connect to the server. Check your connection and try again.'
  return 'Something went wrong. Please try again.'
}

export default api
