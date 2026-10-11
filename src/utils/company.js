export function formatCompanySize(value) {
  return value || 'Not specified'
}

export function formatCompanyDate(value) {
  if (!value) return 'Not available'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Not available'
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

export function getCompanyErrorMessage(error) {
  if (error?.response?.status === 404) return 'Company not found.'
  return ''
}
