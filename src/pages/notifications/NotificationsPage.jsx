import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getApiErrorMessage } from '../../services/api'
import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '../../services/notificationService'
import {
  formatNotificationDateTime,
  formatNotificationType,
  getNotificationTypeClass,
  isNotificationRead,
} from '../../utils/notification'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [markingAll, setMarkingAll] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadNotifications = useCallback(async () => {
    setError('')
    try {
      const [list, count] = await Promise.all([
        getNotifications(),
        getUnreadNotificationCount(),
      ])
      setNotifications(Array.isArray(list) ? list : [])
      setUnreadCount(Number(count) || 0)
    } catch (requestError) {
      setError(getApiErrorMessage(requestError) || 'Unable to load notifications.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  async function handleRefresh() {
    setRefreshing(true)
    await loadNotifications()
  }

  async function handleMarkAsRead(notificationId) {
    try {
      const result = await markNotificationAsRead(notificationId)
      const isRead = result?.isRead ?? result?.read ?? true
      const updated = notifications.map((item) => {
        if (item.id !== notificationId) return item
        return {
          ...item,
          isRead,
          read: isRead,
        }
      })
      setNotifications(updated)
      setUnreadCount(updated.filter((item) => !isNotificationRead(item)).length)
      setSuccess('Notification marked as read.')
    } catch (requestError) {
      setError(getApiErrorMessage(requestError) || 'Unable to mark this notification as read.')
    }
  }

  async function handleMarkAllAsRead() {
    setMarkingAll(true)
    setSuccess('')
    try {
      await markAllNotificationsAsRead()
      setNotifications((current) => current.map((item) => ({ ...item, isRead: true, read: true })))
      setUnreadCount(0)
      setSuccess('All notifications marked as read.')
    } catch (requestError) {
      setError(getApiErrorMessage(requestError) || 'Unable to mark all notifications as read.')
    } finally {
      setMarkingAll(false)
    }
  }

  const unreadVisible = notifications.filter((notification) => !isNotificationRead(notification)).length

  return (
    <div className="notification-page">
      <header className="drive-page-heading">
        <div>
          <p className="eyebrow">UPDATES</p>
          <h1 className="page-heading">Notifications</h1>
          <p className="page-description">Stay informed about your placement journey and platform activity.</p>
        </div>
        <div className="notification-toolbar">
          <button type="button" className="secondary-button" onClick={handleRefresh} disabled={refreshing}>
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button type="button" className="primary-button" onClick={handleMarkAllAsRead} disabled={markingAll || unreadVisible === 0}>
            {markingAll ? 'Updating...' : 'Mark all as read'}
          </button>
        </div>
      </header>

      {success && <div className="success-banner" role="status">{success}</div>}
      {error && <div className="alert drive-page-alert" role="alert">{error}</div>}

      {loading ? (
        <div className="content-loading" role="status">Loading notifications...</div>
      ) : notifications.length === 0 ? (
        <div className="drive-empty-state">
          <div className="drive-empty-icon" aria-hidden="true">🔔</div>
          <strong>No notifications yet.</strong>
          <span>Notifications will appear here when there is an update for you.</span>
        </div>
      ) : (
        <div className="notification-list">
          {notifications.map((notification) => {
            const read = isNotificationRead(notification)
            return (
              <article key={notification.id} className={`notification-item ${read ? 'notification-read' : 'notification-unread'}`}>
                <div className="notification-header">
                  <span className={`notification-type ${getNotificationTypeClass(notification.notificationType)}`}>
                    {formatNotificationType(notification.notificationType)}
                  </span>
                  {!read && <span className="notification-dot" aria-label="Unread" />}
                </div>

                <div className="notification-body">
                  <h2>{notification.title}</h2>
                  <p>{notification.message}</p>
                  {notification.notificationType === 'APPLICATION_ACTIVITY'
                    && notification.referenceType === 'PLACEMENT_DRIVE'
                    && notification.referenceId && (
                      <Link
                        className="secondary-button notification-drive-link"
                        to={`/admin/drives/${notification.referenceId}/applications`}
                      >
                        View drive applications
                      </Link>
                    )}
                </div>

                <div className="notification-footer">
                  <time>{formatNotificationDateTime(notification.createdAt)}</time>
                  {!read && (
                    <button type="button" className="secondary-button notification-read-button" onClick={() => handleMarkAsRead(notification.id)}>
                      Mark as read
                    </button>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}

      {!loading && unreadCount > 0 && (
        <div className="notification-summary">
          <strong>{unreadCount}</strong> unread notification{unreadCount === 1 ? '' : 's'}
        </div>
      )}
    </div>
  )
}
