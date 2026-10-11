import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getApiErrorMessage } from '../../services/api'
import { getApplicationFinalDecision } from '../../services/finalDecisionService'
import { getMyApplications } from '../../services/placementDriveService'
import { formatDateTime, formatFinalDecision, getFinalDecisionClass } from '../../utils/finalDecision'

export default function StudentFinalDecisionPage() {
  const { applicationId } = useParams()
  const [decisions, setDecisions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function loadData() {
      try {
        if (applicationId) {
          const decision = await getApplicationFinalDecision(applicationId)
          if (!active) return
          setDecisions(decision ? [decision] : [])
          return
        }

        const applications = await getMyApplications()
        const applicationList = Array.isArray(applications) ? applications : []

        const results = await Promise.all(
          applicationList.map(async (application) => {
            try {
              const result = await getApplicationFinalDecision(application.applicationId)
              return { ...result, driveTitle: application.driveTitle, companyName: application.companyName }
            } catch {
              return null
            }
          })
        )

        if (!active) return
        setDecisions(results.filter(Boolean))
      } catch (requestError) {
        if (active) setError(getApiErrorMessage(requestError))
      } finally {
        if (active) setLoading(false)
      }
    }

    loadData()
    return () => {
      active = false
    }
  }, [applicationId])

  return (
    <div className="offer-page">
      <header className="drive-page-heading">
        <div>
          <p className="eyebrow">FINAL OUTCOME</p>
          <h1 className="page-heading">Final decision</h1>
          <p className="page-description">Review the final outcome for your applications.</p>
        </div>
        <Link className="primary-button" to="/student/applications">Back to applications</Link>
      </header>

      {loading ? (
        <div className="content-loading" role="status">Loading your final decisions...</div>
      ) : error ? (
        <div className="alert drive-page-alert" role="alert">{error}</div>
      ) : decisions.length === 0 ? (
        <div className="drive-empty-state">
          <div className="drive-empty-icon" aria-hidden="true">◈</div>
          <strong>No final decision is available yet.</strong>
          <span>Your decisions will appear here once a placement drive has been finalized.</span>
        </div>
      ) : (
        <div className="offer-list">
          {decisions.map((item) => (
            <article className="offer-card" key={item.decisionId || item.applicationId}>
              <div className="offer-card-header">
                <div>
                  <p className="eyebrow">APPLICATION #{item.applicationId}</p>
                  <h2>{item.driveTitle || 'Placement drive'}</h2>
                </div>
                <span className={`status-badge ${getFinalDecisionClass(item.decision)}`}>
                  {formatFinalDecision(item.decision)}
                </span>
              </div>

              <div className="offer-meta-grid">
                <div>
                  <span>Company</span>
                  <strong>{item.companyName || 'Not available'}</strong>
                </div>
                <div>
                  <span>Decision date</span>
                  <strong>{formatDateTime(item.decidedAt)}</strong>
                </div>
                <div>
                  <span>Decision by</span>
                  <strong>{item.decidedByName || 'Placement team'}</strong>
                </div>
              </div>

              {item.remarks && (
                <div className="offer-note">
                  <span>Remarks</span>
                  <p>{item.remarks}</p>
                </div>
              )}

              {item.decision === 'SELECTED' && (
                <div className="offer-actions">
                  <Link className="primary-button" to="/student/offers">View offers</Link>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
