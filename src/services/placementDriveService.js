import api from './api'

function getResponseData(response) {
  return response.data?.data
}

export async function getPlacementDrives() {
  const response = await api.get('/drives')
  return getResponseData(response) || []
}

export async function getPlacementDriveById(driveId) {
  const response = await api.get(`/drives/${driveId}`)
  return getResponseData(response)
}

export async function checkEligibility(driveId) {
  const response = await api.get(`/drives/${driveId}/eligibility`)
  return getResponseData(response) ?? response.data
}

export async function applyToPlacementDrive(driveId) {
  const response = await api.post(`/applications/${driveId}`)
  return getResponseData(response)
}

export async function getMyApplications() {
  const response = await api.get('/applications/my')
  return getResponseData(response) || []
}
