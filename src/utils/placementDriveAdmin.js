const employmentTypeLabels = {
  FULL_TIME: 'Full Time',
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

export const employmentTypes = Object.keys(employmentTypeLabels)
export const driveStatuses = Object.keys(driveStatusLabels)

export function formatEmploymentType(value) {
  return employmentTypeLabels[value] || value || 'Not specified'
}

export function formatDriveStatus(value) {
  return driveStatusLabels[value] || value || 'Status unavailable'
}

export function formatDriveDate(value) {
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
  }).format(date)
}

export function formatPackage(value) {
  if (value === null || value === undefined || value === '') return 'Not specified'
  return `${value} LPA`
}

export function formatBranches(value) {
  return Array.isArray(value) && value.length ? value.join(', ') : 'Not specified'
}

export function getDriveStatusClass(status) {
  return (status || 'unknown').toLowerCase().replaceAll('_', '-')
}

export function getDriveCompanyName(drive) {
  return drive?.companyName || drive?.company?.companyName || 'Company not specified'
}
