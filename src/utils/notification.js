export function formatNotificationType(type) {
  if (!type) return 'General'
  return String(type)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function getNotificationTypeClass(type) {
  switch (type) {
    case 'APPLICATION_SUBMITTED':
      return 'notification-type-application'
    case 'APPLICATION_ACTIVITY':
      return 'notification-type-application-activity'
    case 'APPLICATION_SHORTLISTED':
      return 'notification-type-shortlisted'
    case 'APPLICATION_REJECTED':
      return 'notification-type-rejected'
    case 'ROUND_SCHEDULED':
      return 'notification-type-round'
    case 'INTERVIEW_SCHEDULED':
      return 'notification-type-interview'
    case 'INTERVIEW_RESCHEDULED':
      return 'notification-type-rescheduled'
    case 'INTERVIEW_CANCELLED':
      return 'notification-type-cancelled'
    case 'FINAL_DECISION':
      return 'notification-type-decision'
    case 'OFFER_ISSUED':
      return 'notification-type-offer'
    case 'OFFER_ACCEPTED':
      return 'notification-type-accepted'
    case 'OFFER_DECLINED':
      return 'notification-type-declined'
    case 'CANDIDATE_RECOMMENDATION':
      return 'notification-type-application-activity'
    default:
      return 'notification-type-general'
  }
}

export function formatNotificationDateTime(value) {
  if (!value) return 'Recently'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  const now = new Date()
  const diffMs = now.getTime() - parsed.getTime()
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000))

  if (diffMinutes < 1) return 'Just now'
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`

  return parsed.toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export function isNotificationRead(notification) {
  if (!notification) return true
  if (typeof notification.read === 'boolean') return notification.read
  if (typeof notification.isRead === 'boolean') return notification.isRead
  return false
}
