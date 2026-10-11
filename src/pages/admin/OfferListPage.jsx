import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getApiErrorMessage } from '../../services/api'
import { getDriveOffers } from '../../services/offerService'
import { formatCurrency, formatDate, formatOfferStatus, getOfferStatusClass } from '../../utils/finalDecision'

export default function OfferListPage() {
  const { driveId } = useParams()
  const [offers, setOffers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    getDriveOffers(driveId)
      .then((result) => {
        if (!active) return
        setOffers(Array.isArray(result) ? result : [])
      })
      .catch((requestError) => {
        if (active) setError(getApiErrorMessage(requestError))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [driveId])

  return (
    <div className="offer-page">
      <header className="drive-page-heading">
        <div>
          <p className="eyebrow">OFFER MANAGEMENT</p>
          <h1 className="page-heading">Drive offers</h1>
          <p className="page-description">Review all offers issued for this placement drive.</p>
        </div>
        <Link className="primary-button" to={`/admin/drives/${driveId}/applications`}>Review applications</Link>
      </header>

      {loading ? (
        <div className="content-loading" role="status">Loading offers...</div>
      ) : error ? (
        <div className="alert drive-page-alert" role="alert">{error}</div>
      ) : offers.length === 0 ? (
        <div className="drive-empty-state">
          <div className="drive-empty-icon" aria-hidden="true">◫</div>
          <strong>No offers have been created for this drive.</strong>
          <span>Once a student is selected, create and issue their offer here.</span>
        </div>
      ) : (
        <div className="offer-list">
          {offers.map((offer) => (
            <article className="offer-card" key={offer.offerId}>
              <div className="offer-card-header">
                <div>
                  <p className="eyebrow">OFFER #{offer.offerId}</p>
                  <h2>{offer.studentName || 'Student'}</h2>
                </div>
                <span className={`status-badge ${getOfferStatusClass(offer.status)}`}>
                  {formatOfferStatus(offer.status)}
                </span>
              </div>

              <div className="offer-meta-grid">
                <div>
                  <span>Job title</span>
                  <strong>{offer.jobTitle || 'Not specified'}</strong>
                </div>
                <div>
                  <span>Package</span>
                  <strong>{formatCurrency(offer.annualPackageLpa)}</strong>
                </div>
                <div>
                  <span>Offer date</span>
                  <strong>{formatDate(offer.offerDate)}</strong>
                </div>
              </div>

              <div className="offer-actions">
                <Link className="secondary-button" to={`/admin/offers/${offer.offerId}`}>
                  View details
                </Link>
                {offer.status === 'DRAFT' && (
                  <Link className="primary-button" to={`/admin/offers/${offer.offerId}/edit`}>
                    Edit draft
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
