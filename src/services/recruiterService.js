import api from './api'

function getResponseData(response) {
  return response.data?.data
}

export async function getRecruiterDrives() {
  const response = await api.get('/recruiter/drives')
  return getResponseData(response) || []
}

export async function getRecruiterApplications(filters = {}) {
  const params = {}
  if (filters.driveId) params.driveId = filters.driveId
  if (filters.status && filters.status !== 'ALL') params.status = filters.status
  const response = await api.get('/recruiter/applications', { params })
  return getResponseData(response) || []
}

export async function submitCandidateRecommendation(applicationId, reason) {
  const response = await api.post('/recruiter/recommendations', { applicationId, reason })
  return getResponseData(response)
}

export async function getMyRecommendations() {
  const response = await api.get('/recruiter/recommendations')
  return getResponseData(response) || []
}

export async function getRecommendationsForReview() {
  const response = await api.get('/tpo/recommendations')
  return getResponseData(response) || []
}

export async function updateRecommendationStatus(recommendationId, status) {
  const response = await api.patch(`/tpo/recommendations/${recommendationId}/status`, { status })
  return getResponseData(response)
}
