import api from './api'

function getResponseData(response) {
  return response.data?.data
}

export async function getApplicationFinalDecision(applicationId) {
  const response = await api.get(`/applications/${applicationId}/final-decision`)
  return getResponseData(response)
}

export async function decideApplication(applicationId, payload) {
  const response = await api.patch(`/applications/${applicationId}/final-decision`, payload)
  return getResponseData(response)
}

export async function getDriveFinalDecisions(driveId) {
  const response = await api.get(`/drives/${driveId}/final-decisions`)
  return getResponseData(response) || []
}
