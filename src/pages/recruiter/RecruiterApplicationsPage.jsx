import { useEffect, useMemo, useState } from 'react'
import { getApiErrorMessage } from '../../services/api'
import {
  getMyRecommendations,
  getRecruiterApplications,
  getRecruiterDrives,
  submitCandidateRecommendation,
} from '../../services/recruiterService'

function formatDate(value) {
  if (!value) return 'Not available'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
}

export default function RecruiterApplicationsPage() {
  const [drives, setDrives] = useState([])
  const [applications, setApplications] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [driveFilter, setDriveFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [reasons, setReasons] = useState({})
  const [loading, setLoading] = useState(true)
  const [loadingApplications, setLoadingApplications] = useState(true)
  const [submittingId, setSubmittingId] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    let active = true
    Promise.all([getRecruiterDrives(), getMyRecommendations()])
      .then(([driveData, recommendationData]) => {
        if (!active) return
        setDrives(Array.isArray(driveData) ? driveData : [])
        setRecommendations(Array.isArray(recommendationData) ? recommendationData : [])
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

  useEffect(() => {
    let active = true
    getRecruiterApplications({ driveId: driveFilter, status: statusFilter })
      .then((data) => {
        if (active) setApplications(Array.isArray(data) ? data : [])
      })
      .catch((requestError) => {
        if (active) setError(getApiErrorMessage(requestError))
      })
      .finally(() => {
        if (active) setLoadingApplications(false)
      })
    return () => {
      active = false
    }
  }, [driveFilter, statusFilter])

  const recommendedApplicationIds = useMemo(
    () => new Set(recommendations.map((item) => item.applicationId)),
    [recommendations],
  )

  async function handleRecommendationSubmit(event, applicationId) {
    event.preventDefault()
    const reason = reasons[applicationId]?.trim() || ''
    if (!reason) {
      setError('Enter a short reason for recommending this candidate.')
      return
    }
    setSubmittingId(applicationId)
    setError('')
    setSuccess('')
    try {
      await submitCandidateRecommendation(applicationId, reason)
      setReasons((current) => ({ ...current, [applicationId]: '' }))
      setSuccess('Recommendation sent to the placement office.')
      try {
        const refreshedRecommendations = await getMyRecommendations()
        setRecommendations(Array.isArray(refreshedRecommendations) ? refreshedRecommendations : [])
      } catch (refreshError) {
        setError(`Recommendation submitted, but the list could not be refreshed. ${getApiErrorMessage(refreshError)}`)
      }
    } catch (requestError) {
      setError(getApiErrorMessage(requestError))
    } finally {
      setSubmittingId(null)
    }
  }

  function updateDriveFilter(event) {
    setLoadingApplications(true)
    setError('')
    setDriveFilter(event.target.value)
  }

  function updateStatusFilter(event) {
    setLoadingApplications(true)
    setError('')
    setStatusFilter(event.target.value)
  }

  return (
    <div className="recruiter-page">
      <header className="page-header-row">
        <div>
          <p className="eyebrow">CANDIDATES</p>
          <h1 className="page-heading">Applications</h1>
          <p className="page-description">Review applicants for your company’s placement drives and send recommendations to the placement office.</p>
        </div>
      </header>

      {success && <div className="success-banner" role="status">{success}</div>}
      {error && <div className="alert" role="alert">{error}</div>}

      <div className="filter-bar">
        <label>
          <span className="sr-only">Filter by drive</span>
          <select value={driveFilter} onChange={updateDriveFilter}>
            <option value="ALL">All my company’s drives</option>
            {drives.map((drive) => <option key={drive.id} value={drive.id}>{drive.driveTitle}</option>)}
          </select>
        </label>
        <label>
          <span className="sr-only">Filter by application status</span>
          <select value={statusFilter} onChange={updateStatusFilter}>
            <option value="ALL">All application statuses</option>
            <option value="APPLIED">Applied</option>
            <option value="SHORTLISTED">Shortlisted</option>
            <option value="REJECTED">Rejected</option>
            <option value="WITHDRAWN">Withdrawn</option>
            <option value="SELECTED">Selected</option>
          </select>
        </label>
      </div>

      <section className="dashboard-panel">
        <div className="panel-header-row"><h2>Company drive applications</h2></div>
        {loading || loadingApplications ? (
          <div className="content-loading" role="status">Loading applications...</div>
        ) : error ? (
          <div className="empty-state">Applications could not be loaded. See the error above for details.</div>
        ) : applications.length === 0 ? (
          <div className="empty-state">{drives.length === 0
            ? 'Your recruiter account is not assigned to a company or your company has no drives.'
            : 'No applications match these filters.'}</div>
        ) : (
          <div className="list-stack">
            {applications.map((application) => (
              <article className="info-card recruiter-application-card" key={application.applicationId}>
                <div className="info-card-header">
                  <div>
                    <p className="eyebrow compact">{application.driveTitle}</p>
                    <h3>{application.studentName}</h3>
                  </div>
                  <span className={`status-badge status-${String(application.status).toLowerCase()}`}>
                    {application.status}
                  </span>
                </div>
                <div className="inline-metrics">
                  <div><span>Branch</span><strong>{application.branch || 'Not provided'}</strong></div>
                  <div><span>CGPA</span><strong>{application.cgpa ?? 'Not provided'}</strong></div>
                  <div><span>Resume</span><strong>{application.resumeAvailable ? 'Available' : 'Not available'}</strong></div>
                  <div><span>Applied</span><strong>{formatDate(application.appliedAt)}</strong></div>
                </div>
                <div className="description-block">
                  <h4>Skills</h4>
                  <p>{application.skills?.length ? application.skills.join(', ') : 'No skills provided'}</p>
                </div>
                {recommendedApplicationIds.has(application.applicationId) ? (
                  <div className="info-note">You have submitted a recommendation for this applicant.</div>
                ) : (
                  <form className="recommendation-form" onSubmit={(event) => handleRecommendationSubmit(event, application.applicationId)}>
                    <label>
                      Recommendation reason
                      <textarea
                        value={reasons[application.applicationId] || ''}
                        onChange={(event) => setReasons((current) => ({
                          ...current,
                          [application.applicationId]: event.target.value,
                        }))}
                        maxLength={500}
                        required
                        rows={3}
                        placeholder="Briefly explain why this candidate is a strong fit."
                      />
                    </label>
                    <button className="primary-button" type="submit" disabled={submittingId === application.applicationId}>
                      {submittingId === application.applicationId ? 'Submitting...' : 'Recommend to TPO'}
                    </button>
                  </form>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="dashboard-panel">
        <div className="panel-header-row"><h2>Submitted recommendations</h2></div>
        {loading ? (
          <div className="content-loading" role="status">Loading recommendations...</div>
        ) : recommendations.length === 0 ? (
          <div className="empty-state">You have not submitted any recommendations.</div>
        ) : (
          <div className="list-stack">
            {recommendations.map((recommendation) => (
              <article className="summary-item neutral-item" key={recommendation.recommendationId}>
                <div>
                  <strong>{recommendation.studentName} · {recommendation.driveTitle}</strong>
                  <span>{recommendation.reason}</span>
                  <span>Submitted {formatDate(recommendation.submittedAt)}</span>
                </div>
                <span className={`status-badge status-${String(recommendation.status).toLowerCase()}`}>
                  {recommendation.status}
                </span>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
