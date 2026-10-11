import api from './api'

function getResponseData(response) {
  return response.data?.data
}

export async function getDriveApplications(driveId) {
  const response = await api.get(`/drives/${driveId}/applications`)
  return getResponseData(response) || []
}

export async function shortlistApplication(applicationId) {
  const response = await api.patch(`/applications/${applicationId}/shortlist`)
  return getResponseData(response)
}

export async function rejectApplication(applicationId) {
  const response = await api.patch(`/applications/${applicationId}/reject`)
  return getResponseData(response)
}

export async function bulkShortlistApplications(driveId, applicationIds) {
  const response = await api.patch(`/drives/${driveId}/applications/shortlist`, { applicationIds })
  return getResponseData(response)
}

export async function bulkRejectApplications(driveId, applicationIds) {
  const response = await api.patch(`/drives/${driveId}/applications/reject`, { applicationIds })
  return getResponseData(response)
}
