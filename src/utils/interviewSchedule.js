export const interviewModes = ['ONLINE', 'OFFLINE']
export const interviewScheduleStatuses = ['SCHEDULED', 'RESCHEDULED', 'COMPLETED', 'CANCELLED']

export function formatInterviewMode(mode) {
  if (!mode) return 'Not specified'
  const normalized = String(mode).replace(/_/g, ' ')
  return normalized
    .toLowerCase()
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function formatScheduleStatus(status) {
  if (!status) return 'Not specified'
  const normalized = String(status).replace(/_/g, ' ')
  return normalized
    .toLowerCase()
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function formatInterviewDateTime(value) {
  if (!value) return 'Not scheduled'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export function toLocalDateTimeInput(value) {
  if (!value) return ''
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return ''
    if (trimmed.length >= 16 && trimmed[10] === 'T') return trimmed.slice(0, 16)
    const date = new Date(trimmed)
    if (!Number.isNaN(date.getTime())) {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      return `${year}-${month}-${day}T${hours}:${minutes}`
    }
    return trimmed.slice(0, 16)
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

export function getInterviewModeClass(mode) {
  if (mode === 'ONLINE') return 'schedule-mode-online'
  if (mode === 'OFFLINE') return 'schedule-mode-offline'
  return 'schedule-mode-default'
}

export function getInterviewStatusClass(status) {
  if (status === 'SCHEDULED' || status === 'RESCHEDULED') return 'schedule-status-pending'
  if (status === 'COMPLETED') return 'schedule-status-success'
  if (status === 'CANCELLED') return 'schedule-status-cancelled'
  return 'schedule-status-default'
}
