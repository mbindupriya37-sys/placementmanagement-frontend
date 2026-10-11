import api from './api'

function getResponseData(response) {
  return response.data?.data
}

export async function getRoundInterviewSchedules(roundId) {
  const response = await api.get(`/rounds/${roundId}/schedules`)
  return getResponseData(response) || []
}

export async function getInterviewSchedule(scheduleId) {
  const response = await api.get(`/schedules/${scheduleId}`)
  return getResponseData(response)
}

export async function createInterviewSchedule(roundId, payload) {
  const response = await api.post(`/rounds/${roundId}/schedules`, payload)
  return getResponseData(response)
}

export async function getApplicationInterviewSchedules(applicationId) {
  const response = await api.get(`/applications/${applicationId}/schedules`)
  return getResponseData(response) || []
}

export async function updateInterviewSchedule(scheduleId, payload) {
  const response = await api.put(`/schedules/${scheduleId}`, payload)
  return getResponseData(response)
}

export async function cancelInterviewSchedule(scheduleId) {
  const response = await api.patch(`/schedules/${scheduleId}/cancel`)
  return getResponseData(response)
}

export async function updateInterviewScheduleStatus(scheduleId, status) {
  const response = await api.patch(`/schedules/${scheduleId}/status`, { status })
  return getResponseData(response)
}
