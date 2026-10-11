import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { getApiErrorMessage } from '../../services/api'
import { getOffer, issueOffer, withdrawOffer } from '../../services/offerService'
import { formatCurrency, formatDate, formatDateTime, formatOfferStatus, getOfferStatusClass } from '../../utils/finalDecision'

export default function OfferDetailsPage() {
  const { offerId } = useParams()
  const location = useLocation()
  const [offer, setOffer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
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

  async function handleIssue() {
    setSaving(true)
    setError('')
    try {
      const result = await issueOffer(offerId)
      setOffer(result)
      setSuccess('Offer issued successfully.')
    } catch (requestError) {
      setError(getApiErrorMessage(requestError))
    } finally {
      setSaving(false)
    }
  }

  async function handleWithdraw() {
    if (!window.confirm('Withdraw this offer?')) return
    setSaving(true)
    setError('')
    try {
      const result = await withdrawOffer(offerId)
      setOffer(result)
      setSuccess('Offer withdrawn successfully.')
    } catch (requestError) {
      setError(getApiErrorMessage(requestError))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="content-loading" role="status">Loading offer...</div>
  if (!offer) {
    return (
      <div className="company-form-error">
        <h1 className="page-heading">Unable to load offer</h1>
        <div className="alert" role="alert">{error || 'Offer not found.'}</div>
        <Link className="secondary-button" to="/admin/drives">Back to drives</Link>
      </div>
    )
  }

  return (
    <div className="offer-page">
      <Link className="back-link" to={`/admin/drives/${offer.driveId}/offers`}>← Back to drive offers</Link>

      {success && <div className="success-banner" role="status">{success}</div>}
      {error && <div className="alert company-page-alert" role="alert">{error}</div>}

      <header className="admin-page-heading">
        <div>
          <p className="eyebrow">OFFER</p>
          <h1 className="page-heading">{offer.jobTitle || 'Offer letter'}</h1>
          <p className="page-description">{offer.studentName} • {offer.studentEmail}</p>
        </div>
        <span className={`status-badge ${getOfferStatusClass(offer.status)}`}>
          {formatOfferStatus(offer.status)}
        </span>
      </header>

      <div className="interview-detail-grid">
        <div className="interview-card detail-surface">
          <div className="offer-meta-grid">
            <div>
              <span>Offer ID</span>
              <strong>{offer.offerId}</strong>
            </div>
            <div>
              <span>Letter number</span>
              <strong>{offer.offerLetterNumber || 'Not provided'}</strong>
            </div>
            <div>
              <span>Drive</span>
              <strong>{offer.driveTitle || 'Not provided'}</strong>
            </div>
            <div>
              <span>Employment</span>
              <strong>{offer.employmentType || 'Not provided'}</strong>
            </div>
            <div>
              <span>Package</span>
              <strong>{formatCurrency(offer.annualPackageLpa)}</strong>
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
          </div>

          {offer.notes && (
            <div className="offer-note">
              <span>Notes</span>
              <p>{offer.notes}</p>
            </div>
          )}

          <div className="offer-note">
            <span>Last updated</span>
            <p>{formatDateTime(offer.updatedAt)}</p>
          </div>
        </div>

        <div className="interview-card detail-controls">
          <div className="interview-action-stack">
            <Link className="secondary-button" to={`/admin/offers/${offer.offerId}/edit`}>Edit Offer</Link>
            {offer.status === 'DRAFT' && (
              <button type="button" className="primary-button" onClick={handleIssue} disabled={saving}>
                {saving ? 'Issuing...' : 'Issue Offer'}
              </button>
            )}
            {offer.status === 'ISSUED' && (
              <button type="button" className="company-delete-button" onClick={handleWithdraw} disabled={saving}>
                {saving ? 'Withdrawing...' : 'Withdraw Offer'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
