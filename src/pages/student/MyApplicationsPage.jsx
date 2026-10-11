import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getApiErrorMessage } from '../../services/api'
import { getMyApplications } from '../../services/placementDriveService'
import {
  formatDate,
  formatApplicationStatus,
  getStatusClass,
} from '../../utils/placementDrive'

export default function MyApplicationsPage() {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    getMyApplications()
      .then((result) => {
        if (active) setApplications(Array.isArray(result) ? result : [])
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
    <div className="applications-page">
      <header className="drive-page-heading">
        <div>
          <p className="eyebrow">YOUR PLACEMENT JOURNEY</p>
          <h1 className="page-heading">My Applications</h1>
          <p className="page-description">Review the placement drives you have applied to and their current status.</p>
        </div>
        {!loading && !error && applications.length > 0 && (
          <span className="application-count">{applications.length} {applications.length === 1 ? 'application' : 'applications'}</span>
        )}
      </header>

      {loading ? (
        <div className="content-loading" role="status">Loading your applications...</div>
      ) : error ? (
        <div className="alert drive-page-alert" role="alert">
          <strong>Unable to load your applications.</strong> {error}
        </div>
      ) : applications.length === 0 ? (
        <div className="drive-empty-state">
          <div className="drive-empty-icon" aria-hidden="true">▤</div>
          <strong>You have not applied to any placement drives yet.</strong>
          <span>Browse available opportunities and check your eligibility before applying.</span>
          <Link className="primary-button" to="/student/drives">Browse Placement Drives</Link>
        </div>
      ) : (
        <div className="application-card-list">
          {applications.map((application) => (
            <article className="application-card" key={application.applicationId}>
              <div className="application-company-icon" aria-hidden="true">
                {(application.companyName || 'C').slice(0, 1).toUpperCase()}
              </div>
              <div className="application-card-main">
                <p className="drive-company-name">{application.companyName || 'Company not specified'}</p>
                <h2>{application.driveTitle || 'Placement drive'}</h2>
                <div className="application-card-meta">
                  <span>Applied {formatDate(application.appliedAt)}</span>
                </div>
              </div>
              <div className="application-card-status">
                <span className="application-status-label">Application status</span>
                <span className={`status-badge application-status ${getStatusClass(application.status)}`}>
                  {formatApplicationStatus(application.status)}
                </span>
              </div>
              {application.driveId && (
                <div className="student-application-actions">
                  <Link className="secondary-button application-view-link"
                    to={`/student/drives/${application.driveId}`}>
                    View Drive
                  </Link>
                  {['SHORTLISTED', 'SELECTED'].includes(application.status) && (
                    <Link className="secondary-button application-view-link"
                      to={`/student/applications/${application.applicationId}/rounds`}>
                      View Rounds
                    </Link>
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
