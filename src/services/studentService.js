import api from './api'
import { getMyApplications as fetchMyApplications } from './placementDriveService'

export async function getMyProfile() {
  const response = await api.get('/student/profile')
  return response.data?.data
}

export async function createProfile(profile) {
  const response = await api.post('/student/profile', profile)
  return response.data?.data
}

export async function updateProfile(profile) {
  const response = await api.put('/student/profile', profile)
  return response.data?.data
}

export async function uploadMyResume(file) {
  const formData = new FormData()
  formData.append('resume', file)
  const response = await api.post('/student/profile/resume', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data?.data
}

export async function getMyResume(filename) {
  const response = await api.get(`/student/profile/resume/${encodeURIComponent(filename)}`, {
    responseType: 'blob',
  })
  return response.data
}

export async function getMyApplications() {
  return fetchMyApplications()
}

export function isProfileMissingError(error) {
  return error?.response?.status === 404
    && error?.response?.data?.message === 'Student profile not found'
}
