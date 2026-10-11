import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getApiErrorMessage } from '../../services/api'
import { getMyOffers } from '../../services/offerService'
import { formatCurrency, formatDate, formatOfferStatus, getOfferStatusClass } from '../../utils/finalDecision'

export default function StudentOffersPage() {
  const [offers, setOffers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    getMyOffers()
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
  }, [])

  return (
    <div className="offer-page">
      <header className="drive-page-heading">
        <div>
          <p className="eyebrow">YOUR OFFERS</p>
          <h1 className="page-heading">My offers</h1>
          <p className="page-description">Review your issued offers and respond to the placement team.</p>
        </div>
        <Link className="primary-button" to="/student/final-decision">View final decision</Link>
      </header>

      {loading ? (
        <div className="content-loading" role="status">Loading your offers...</div>
      ) : error ? (
        <div className="alert drive-page-alert" role="alert">{error}</div>
      ) : offers.length === 0 ? (
        <div className="drive-empty-state">
          <div className="drive-empty-icon" aria-hidden="true">◫</div>
          <strong>No offers are available yet.</strong>
          <span>Once you are selected, your offers will appear here.</span>
        </div>
      ) : (
        <div className="offer-list">
          {offers.map((offer) => (
            <article className="offer-card" key={offer.offerId}>
              <div className="offer-card-header">
                <div>
                  <p className="eyebrow">{offer.driveTitle || 'Placement drive'}</p>
                  <h2>{offer.jobTitle || 'Offer'}</h2>
                </div>
                <span className={`status-badge ${getOfferStatusClass(offer.status)}`}>
                  {formatOfferStatus(offer.status)}
                </span>
              </div>

              <div className="offer-meta-grid">
                <div>
                  <span>Package</span>
                  <strong>{formatCurrency(offer.annualPackageLpa)}</strong>
                </div>
                <div>
                  <span>Joining date</span>
                  <strong>{formatDate(offer.joiningDate)}</strong>
                </div>
                <div>
                  <span>Expiry date</span>
                  <strong>{formatDate(offer.expiryDate)}</strong>
                </div>
              </div>

              <div className="offer-actions">
                <Link className="secondary-button" to={`/student/offers/${offer.offerId}`}>
                  View details
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
