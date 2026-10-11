export function formatFinalDecision(decision) {
  if (!decision) return 'Not available'
  return decision.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function getFinalDecisionClass(decision) {
  switch (decision) {
    case 'SELECTED':
      return 'final-decision-selected'
    case 'REJECTED':
      return 'final-decision-rejected'
    default:
      return 'final-decision-default'
  }
}

export function formatOfferStatus(status) {
  if (!status) return 'Not available'
  return status.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function getOfferStatusClass(status) {
  switch (status) {
    case 'DRAFT':
      return 'offer-status-draft'
    case 'ISSUED':
      return 'offer-status-issued'
    case 'ACCEPTED':
      return 'offer-status-accepted'
    case 'DECLINED':
      return 'offer-status-declined'
    case 'WITHDRAWN':
      return 'offer-status-withdrawn'
    case 'EXPIRED':
      return 'offer-status-expired'
    default:
      return 'offer-status-default'
  }
}

export function formatCurrency(value) {
  if (value === null || value === undefined || value === '') return 'Not provided'
  const amount = Number(value)
  if (Number.isNaN(amount)) return 'Not provided'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(dateValue) {
  if (!dateValue) return 'Not available'
  const parsed = new Date(dateValue)
  if (Number.isNaN(parsed.getTime())) return dateValue
  return parsed.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDateTime(dateValue) {
  if (!dateValue) return 'Not available'
  const parsed = new Date(dateValue)
  if (Number.isNaN(parsed.getTime())) return dateValue
  return parsed.toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}
