const roundTypeLabels = {
  APTITUDE: 'Aptitude',
  TECHNICAL: 'Technical',
  HR: 'HR',
  GROUP_DISCUSSION: 'Group Discussion',
  CODING: 'Coding',
  OTHER: 'Other',
}

const roundStatusLabels = {
  UPCOMING: 'Upcoming',
  ONGOING: 'Ongoing',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
}

const resultStatusLabels = {
  PENDING: 'Pending',
  PASSED: 'Passed',
  FAILED: 'Failed',
  ABSENT: 'Absent',
}

export const roundTypes = Object.keys(roundTypeLabels)
export const roundStatuses = Object.keys(roundStatusLabels)
export const roundResultStatuses = Object.keys(resultStatusLabels)

export const interviewRoundTypes = ['TECHNICAL', 'HR', 'GROUP_DISCUSSION']

export function isInterviewRoundType(value) {
  return interviewRoundTypes.includes(value)
}

export function formatRoundType(value) {
  return roundTypeLabels[value] || value || 'Type unavailable'
}

export function formatRoundStatus(value) {
  return roundStatusLabels[value] || value || 'Status unavailable'
}

export function formatRoundResultStatus(value) {
  return resultStatusLabels[value] || value || 'Result unavailable'
}

export function getRoundStatusClass(value) {
  return (value || 'unknown').toLowerCase()
}

export function getRoundResultStatusClass(value) {
  return (value || 'unknown').toLowerCase()
}

export function formatLocalDateTime(value) {
  if (!value) return 'Not specified'
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value)
  if (!match) return 'Not specified'
  const [, year, month, day, hour, minute] = match
  const date = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute))
  if (Number.isNaN(date.getTime())) return 'Not specified'
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

export function toLocalDateTimeInput(value) {
  if (!value) return ''
  const match = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,9})?)?)/.exec(value)
  return match?.[1] || ''
}

export function getSelectionErrorMessage(error) {
  const status = error?.response?.status
  const serverMessage = error?.response?.data?.message
  if (status === 403) return 'You do not have permission to manage selection rounds.'
  if (status === 404) return serverMessage || 'Selection round or result not found.'
  if (status === 409) return serverMessage || 'The round or result has changed. Please refresh and try again.'
  return ''
}

export function resolveSelectionRoundDriveId(round, routeDriveId) {
  const roundDriveId = round?.placementDriveId
  if (roundDriveId !== null && roundDriveId !== undefined && String(roundDriveId) !== 'undefined') {
    return roundDriveId
  }
  return routeDriveId
}
