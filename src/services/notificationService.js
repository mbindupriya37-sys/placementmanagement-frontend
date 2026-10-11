import api from './api'

export const NOTIFICATION_COUNT_CHANGED_EVENT = 'placementos:notification-count-changed'

function getResponseData(response) {
  return response.data?.data
}

function notifyNotificationCountChanged() {
  window.dispatchEvent(new Event(NOTIFICATION_COUNT_CHANGED_EVENT))
}

export async function getNotifications() {
  const response = await api.get('/notifications')
  return getResponseData(response) || []
}

export async function getUnreadNotificationCount() {
  const response = await api.get('/notifications/count')
  const data = getResponseData(response)
  return data?.unreadCount ?? 0
}

export async function markNotificationAsRead(notificationId) {
  const response = await api.patch(`/notifications/${notificationId}/read`)
  notifyNotificationCountChanged()
  return getResponseData(response)
}

export async function markAllNotificationsAsRead() {
  const response = await api.patch('/notifications/read-all')
  notifyNotificationCountChanged()
  return getResponseData(response)
}
