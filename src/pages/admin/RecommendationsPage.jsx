import { useEffect, useState } from 'react'
import { getApiErrorMessage } from '../../services/api'
import {
  getRecommendationsForReview,
  updateRecommendationStatus,
} from '../../services/recruiterService'

function formatDate(value) {
  if (!value) return 'Not reviewed'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
}

export default function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    let active = true
    getRecommendationsForReview()
      .then((results) => {
        if (active) setRecommendations(Array.isArray(results) ? results : [])
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

  async function handleReview(recommendationId, status) {
    setUpdatingId(recommendationId)
    setError('')
    setSuccess('')
    try {
      await updateRecommendationStatus(recommendationId, status)
      const refreshedRecommendations = await getRecommendationsForReview()
      setRecommendations(Array.isArray(refreshedRecommendations) ? refreshedRecommendations : [])
      setSuccess(`Recommendation ${status.toLowerCase()}.`)
    } catch (requestError) {
      setError(getApiErrorMessage(requestError))
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="admin-page">
      <header className="admin-page-heading">
        <div>
          <p className="eyebrow">CANDIDATE RECOMMENDATIONS</p>
          <h1 className="page-heading">Recruiter recommendations</h1>
          <p className="page-description">Review recruiter recommendations. Application decisions remain managed separately by the placement office.</p>
        </div>
      </header>
      {success && <div className="success-banner" role="status">{success}</div>}
      {error && <div className="alert" role="alert">{error}</div>}
      {loading ? (
        <div className="content-loading" role="status">Loading recommendations...</div>
      ) : recommendations.length === 0 ? (
        <div className="admin-empty-state"><strong>No recruiter recommendations yet.</strong></div>
      ) : (
        <div className="list-stack">
          {recommendations.map((recommendation) => (
            <article className="info-card" key={recommendation.recommendationId}>
              <div className="info-card-header">
                <div>
                  <p className="eyebrow compact">{recommendation.driveTitle}</p>
                  <h2>{recommendation.studentName}</h2>
                </div>
                <span className={`status-badge status-${String(recommendation.status).toLowerCase()}`}>
                  {recommendation.status}
                </span>
              </div>
              <p>{recommendation.reason}</p>
              <div className="meta-row">
                <span>Submitted by {recommendation.recruiterEmail}</span>
                <span>{formatDate(recommendation.submittedAt)}</span>
              </div>
              {recommendation.status === 'PENDING' && (
                <div className="detail-actions">
                  <button type="button" className="primary-button"
                    disabled={updatingId === recommendation.recommendationId}
                    onClick={() => handleReview(recommendation.recommendationId, 'APPROVED')}>
                    Approve recommendation
                  </button>
                  <button type="button" className="secondary-button"
                    disabled={updatingId === recommendation.recommendationId}
                    onClick={() => handleReview(recommendation.recommendationId, 'DECLINED')}>
                    Decline
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
