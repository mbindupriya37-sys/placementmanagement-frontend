const applicationStatusLabels = {
  APPLIED: 'Applied',
  SHORTLISTED: 'Shortlisted',
  REJECTED: 'Rejected',
  WITHDRAWN: 'Withdrawn',
  SELECTED: 'Selected',
}

export const applicationStatuses = Object.keys(applicationStatusLabels)

export function formatApplicationStatus(status) {
  return applicationStatusLabels[status] || status || 'Status unavailable'
}

export function getApplicationStatusClass(status) {
  return (status || 'unknown').toLowerCase().replaceAll('_', '-')
}

export function canReviewApplication(application) {
  return application?.applicationStatus === 'APPLIED'
}

export function formatApplicationDate(value) {
  if (!value) return 'Not specified'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Not specified'
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

export function getApplicationErrorMessage(error) {
  const status = error?.response?.status
  const serverMessage = error?.response?.data?.message
  if (status === 403) return 'You do not have permission to manage applications.'
  if (status === 404) return serverMessage || 'Placement drive or application not found.'
  if (status === 409) return serverMessage || 'Application status has already changed. Please refresh the list.'
  return ''
}
