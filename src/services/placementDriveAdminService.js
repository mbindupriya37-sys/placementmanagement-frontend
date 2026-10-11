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

export async function createPlacementDrive(driveData) {
  const response = await api.post('/drives', driveData)
  return getResponseData(response)
}

export async function updatePlacementDrive(driveId, driveData) {
  const response = await api.put(`/drives/${driveId}`, driveData)
  return getResponseData(response)
}

export async function deletePlacementDrive(driveId) {
  await api.delete(`/drives/${driveId}`)
}

export async function updatePlacementDriveStatus(driveId, status) {
  const response = await api.patch(`/drives/${driveId}/status`, { status })
  return getResponseData(response)
}
