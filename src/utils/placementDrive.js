const employmentLabels = {
  FULL_TIME: 'Full time',
  INTERNSHIP: 'Internship',
  CONTRACT: 'Contract',
}

const driveStatusLabels = {
  DRAFT: 'Draft',
  OPEN: 'Open',
  CLOSED: 'Closed',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
}

const applicationStatusLabels = {
  APPLIED: 'Applied',
  SHORTLISTED: 'Shortlisted',
  REJECTED: 'Rejected',
  WITHDRAWN: 'Withdrawn',
  SELECTED: 'Selected',
}

export function formatEmploymentType(value) {
  return employmentLabels[value] || value || 'Not specified'
}

export function formatDriveStatus(value) {
  return driveStatusLabels[value] || value || 'Status unavailable'
}

export function formatApplicationStatus(value) {
  return applicationStatusLabels[value] || value || 'Status unavailable'
}

export function formatDate(value) {
  if (!value) return 'Not specified'
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  const date = dateOnly
    ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
    : new Date(value)
  if (Number.isNaN(date.getTime())) return 'Not specified'
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...(value.includes('T') ? { hour: 'numeric', minute: '2-digit' } : {}),
  }).format(date)
}

export function formatPackage(value) {
  if (value === null || value === undefined || value === '') return 'Not specified'
  return `${value} LPA`
}

export function getStatusClass(status) {
  return (status || 'unknown').toLowerCase().replaceAll('_', '-')
}

export function getDriveCompanyName(drive) {
  return drive?.companyName || drive?.company?.companyName || 'Company not specified'
}

export function isAlreadyAppliedError(error) {
  const message = error?.response?.data?.message || ''
  return /already applied|application already exists/i.test(message)
}
