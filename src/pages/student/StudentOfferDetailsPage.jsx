import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { getApiErrorMessage } from '../../services/api'
import { acceptOffer, declineOffer, getOffer } from '../../services/offerService'
import { formatCurrency, formatDate, formatDateTime, formatOfferStatus, getOfferStatusClass } from '../../utils/finalDecision'

export default function StudentOfferDetailsPage() {
  const { offerId } = useParams()
  const location = useLocation()
  const [offer, setOffer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(location.state?.success || '')

  async function loadOffer() {
    setError('')
    try {
      const result = await getOffer(offerId)
      setOffer(result)
    } catch (requestError) {
      setError(getApiErrorMessage(requestError))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOffer()
  }, [offerId])

  async function handleDecision(action) {
    setActionLoading(true)
    setError('')
    setSuccess('')
    try {
      const result = action === 'accept' ? await acceptOffer(offerId) : await declineOffer(offerId)
      setOffer(result)
      setSuccess(`Offer ${action === 'accept' ? 'accepted' : 'declined'} successfully.`)
    } catch (requestError) {
      setError(getApiErrorMessage(requestError))
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) return <div className="content-loading" role="status">Loading offer details...</div>
  if (!offer) {
    return (
      <div className="company-form-error">
        <h1 className="page-heading">Unable to load offer</h1>
        <div className="alert" role="alert">{error || 'Offer not found.'}</div>
        <Link className="secondary-button" to="/student/offers">Back to offers</Link>
      </div>
    )
  }

  return (
    <div className="offer-page">
      <Link className="back-link" to="/student/offers">← Back to offers</Link>

      {success && <div className="success-banner" role="status">{success}</div>}
      {error && <div className="alert company-page-alert" role="alert">{error}</div>}

      <header className="admin-page-heading">
        <div>
          <p className="eyebrow">OFFER DETAILS</p>
          <h1 className="page-heading">{offer.jobTitle || 'Offer letter'}</h1>
          <p className="page-description">{offer.driveTitle || 'Placement drive'}</p>
        </div>
        <span className={`status-badge ${getOfferStatusClass(offer.status)}`}>
          {formatOfferStatus(offer.status)}
        </span>
      </header>

      <div className="interview-detail-grid">
        <div className="interview-card detail-surface">
          <div className="offer-meta-grid">
            <div>
              <span>Offer letter</span>
              <strong>{offer.offerLetterNumber || 'Not provided'}</strong>
            </div>
            <div>
              <span>Package</span>
              <strong>{formatCurrency(offer.annualPackageLpa)}</strong>
            </div>
            <div>
              <span>Employment type</span>
              <strong>{offer.employmentType || 'Not provided'}</strong>
            </div>
            <div>
              <span>Location</span>
              <strong>{offer.location || 'Not provided'}</strong>
            </div>
            <div>
              <span>Joining date</span>
              <strong>{formatDate(offer.joiningDate)}</strong>
            </div>
            <div>
              <span>Expiry date</span>
              <strong>{formatDate(offer.expiryDate)}</strong>
            </div>
            <div>
              <span>Offer date</span>
              <strong>{formatDate(offer.offerDate)}</strong>
            </div>
            <div>
              <span>Last updated</span>
              <strong>{formatDateTime(offer.updatedAt)}</strong>
            </div>
          </div>

          {offer.notes && (
            <div className="offer-note">
              <span>Notes</span>
              <p>{offer.notes}</p>
            </div>
          )}
        </div>

        {offer.status === 'ISSUED' && (
          <div className="interview-card detail-controls">
            <div className="interview-action-stack">
              <button type="button" className="primary-button" onClick={() => handleDecision('accept')} disabled={actionLoading}>
                {actionLoading ? 'Accepting...' : 'Accept offer'}
              </button>
              <button type="button" className="company-delete-button" onClick={() => handleDecision('decline')} disabled={actionLoading}>
                {actionLoading ? 'Declining...' : 'Decline offer'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
