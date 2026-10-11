import api from './api'

function getResponseData(response) {
  return response.data?.data
}

export async function getRoundResults(roundId) {
  const response = await api.get(`/rounds/${roundId}/results`)
  return getResponseData(response) || []
}

export async function createRoundResult(roundId, resultData) {
  const response = await api.post(`/rounds/${roundId}/results`, resultData)
  return getResponseData(response)
}

export async function updateRoundResult(resultId, resultData) {
  const response = await api.put(`/round-results/${resultId}`, resultData)
  return getResponseData(response)
}

export async function getMyApplicationRoundResults(applicationId) {
  const response = await api.get(`/applications/${applicationId}/round-results`)
  return getResponseData(response) || []
}
