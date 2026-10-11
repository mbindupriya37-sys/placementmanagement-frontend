import api from './api'

function getResponseData(response) {
  return response.data?.data
}

export async function getSelectionRounds(driveId) {
  const response = await api.get(`/drives/${driveId}/rounds`)
  return getResponseData(response) || []
}

export async function getSelectionRound(roundId) {
  const response = await api.get(`/rounds/${roundId}`)
  return getResponseData(response)
}

export async function createSelectionRound(driveId, roundData) {
  const response = await api.post(`/drives/${driveId}/rounds`, roundData)
  return getResponseData(response)
}

export async function updateSelectionRound(roundId, roundData) {
  const response = await api.put(`/rounds/${roundId}`, roundData)
  return getResponseData(response)
}

export async function deleteSelectionRound(roundId) {
  await api.delete(`/rounds/${roundId}`)
}

export async function updateSelectionRoundStatus(roundId, status) {
  const response = await api.patch(`/rounds/${roundId}/status`, { status })
  return getResponseData(response)
}
