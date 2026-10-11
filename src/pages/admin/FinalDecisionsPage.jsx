import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getApiErrorMessage } from '../../services/api'
import { getDriveFinalDecisions } from '../../services/finalDecisionService'
import { formatDateTime, formatFinalDecision, getFinalDecisionClass } from '../../utils/finalDecision'

export default function FinalDecisionsPage() {
  const { driveId } = useParams()
  const [decisions, setDecisions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    getDriveFinalDecisions(driveId)
      .then((result) => {
        if (!active) return
        setDecisions(Array.isArray(result) ? result : [])
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
          <p className="eyebrow">FINAL SELECTIONS</p>
          <h1 className="page-heading">Final decisions</h1>
          <p className="page-description">Review the outcome for each shortlisted application in this placement drive.</p>
        </div>
        <Link className="primary-button" to={`/admin/drives/${driveId}/applications`}>Back to applications</Link>
      </header>

      {loading ? (
        <div className="content-loading" role="status">Loading final decisions...</div>
      ) : error ? (
        <div className="alert drive-page-alert" role="alert">{error}</div>
      ) : decisions.length === 0 ? (
        <div className="drive-empty-state">
          <div className="drive-empty-icon" aria-hidden="true">◈</div>
          <strong>No final decisions have been recorded yet.</strong>
          <span>Select shortlisted applications to finalize outcomes for this drive.</span>
        </div>
      ) : (
        <div className="offer-list">
          {decisions.map((item) => (
            <article className="offer-card" key={item.decisionId || item.applicationId}>
              <div className="offer-card-header">
                <div>
                  <p className="eyebrow">APPLICATION #{item.applicationId}</p>
                  <h2>{item.studentName || 'Student'}</h2>
                </div>
                <span className={`status-badge ${getFinalDecisionClass(item.decision)}`}>
                  {item.decision ? formatFinalDecision(item.decision) : 'Awaiting decision'}
                </span>
              </div>

              <div className="offer-meta-grid">
                <div>
                  <span>Drive</span>
                  <strong>{item.driveTitle || 'Placement drive'}</strong>
                </div>
                <div>
                  <span>Student email</span>
                  <strong>{item.studentEmail || 'Not provided'}</strong>
                </div>
                <div>
                  <span>Decided</span>
                  <strong>{formatDateTime(item.decidedAt)}</strong>
                </div>
              </div>

              {item.remarks && (
                <div className="offer-note">
                  <span>Remarks</span>
                  <p>{item.remarks}</p>
                </div>
              )}

              <div className="offer-actions">
                <Link className="secondary-button" to={`/admin/drives/${driveId}/applications/${item.applicationId}/final-decision`}>
                  Manage decision
                </Link>
                {item.decision === 'SELECTED' && (
                  <Link className="primary-button" to={`/admin/drives/${driveId}/applications/${item.applicationId}/offer`}>
                    Create offer
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
