import api from './api'

function getResponseData(response) {
  return response.data?.data
}

export async function createOffer(applicationId, payload) {
  const response = await api.post(`/applications/${applicationId}/offer`, payload)
  return getResponseData(response)
}

export async function updateOffer(offerId, payload) {
  const response = await api.put(`/offers/${offerId}`, payload)
  return getResponseData(response)
}

export async function issueOffer(offerId) {
  const response = await api.patch(`/offers/${offerId}/issue`)
  return getResponseData(response)
}

export async function withdrawOffer(offerId) {
  const response = await api.patch(`/offers/${offerId}/withdraw`)
  return getResponseData(response)
}

export async function acceptOffer(offerId) {
  const response = await api.patch(`/offers/${offerId}/accept`)
  return getResponseData(response)
}

export async function declineOffer(offerId) {
  const response = await api.patch(`/offers/${offerId}/decline`)
  return getResponseData(response)
}

export async function getOffer(offerId) {
  const response = await api.get(`/offers/${offerId}`)
  return getResponseData(response)
}

export async function getMyOffers() {
  const response = await api.get('/offers/my')
  return getResponseData(response) || []
}

export async function getDriveOffers(driveId) {
  const response = await api.get(`/drives/${driveId}/offers`)
  return getResponseData(response) || []
}
