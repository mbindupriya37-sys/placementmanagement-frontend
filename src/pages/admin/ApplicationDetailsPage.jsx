import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getApiErrorMessage } from '../../services/api'
import {
  getDriveApplications,
  rejectApplication,
  shortlistApplication,
} from '../../services/applicationAdminService'
import {
  canReviewApplication,
  formatApplicationDate,
  formatApplicationStatus,
  getApplicationErrorMessage,
  getApplicationStatusClass,
} from '../../utils/applicationAdmin'

export default function ApplicationDetailsPage() {
  const { driveId, applicationId } = useParams()
  const [application, setApplication] = useState(null)
  const [loading, setLoading] = useState(true)
  const [action, setAction] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function loadApplication() {
    setError('')
    try {
      const result = await getDriveApplications(driveId)
      const applications = Array.isArray(result) ? result : []
      const found = applications.find((item) => String(item.applicationId) === String(applicationId))
      if (!found) {
        setApplication(null)
        setError('Application not found for this placement drive.')
        return
      }
      setApplication(found)
    } catch (requestError) {
      setError(getApplicationErrorMessage(requestError) || getApiErrorMessage(requestError))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    getDriveApplications(driveId)
      .then((result) => {
        if (!active) return
        const applications = Array.isArray(result) ? result : []
        const found = applications.find((item) => String(item.applicationId) === String(applicationId))
        if (found) setApplication(found)
        else setError('Application not found for this placement drive.')
      })
      .catch((requestError) => {
        if (active) setError(getApplicationErrorMessage(requestError) || getApiErrorMessage(requestError))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [applicationId, driveId])

  async function handleAction(actionName) {
    if (!application || !canReviewApplication(application)) return
    const verb = actionName === 'shortlist' ? 'shortlist' : 'reject'
    if (!window.confirm(`${verb === 'shortlist' ? 'Shortlist' : 'Reject'} this application?`)) return
    setAction(actionName)
    setError('')
    setSuccess('')
    try {
      if (actionName === 'shortlist') await shortlistApplication(application.applicationId)
      else await rejectApplication(application.applicationId)
      setSuccess(`Application ${actionName === 'shortlist' ? 'shortlisted' : 'rejected'} successfully.`)
      await loadApplication()
    } catch (requestError) {
      setError(getApplicationErrorMessage(requestError) || getApiErrorMessage(requestError))
    } finally {
      setAction('')
    }
  }

  if (loading) return <div className="content-loading" role="status">Loading application...</div>
  if (!application) {
    return (
      <div className="company-form-error">
        <h1 className="page-heading">Unable to load application</h1>
        <div className="alert" role="alert">{error || 'Placement drive or application not found.'}</div>
        <Link className="secondary-button" to={`/admin/drives/${driveId}/applications`}>Back to Applications</Link>
      </div>
    )
  }

  const reviewable = canReviewApplication(application)
  return (
    <div className="admin-application-details-page">
      <Link className="back-link" to={`/admin/drives/${driveId}/applications`}>← Back to Drive Applications</Link>
      {success && <div className="success-banner" role="status">{success}</div>}
      {error && <div className="alert admin-drive-alert" role="alert">{error}</div>}
      <header className="admin-application-details-header">
        <div className="company-avatar company-avatar-xl" aria-hidden="true">
          {(application.studentName || 'S').slice(0, 1).toUpperCase()}
        </div>
        <div className="admin-application-details-title">
          <p className="eyebrow">APPLICATION #{application.applicationId}</p>
          <h1 className="page-heading">{application.studentName || 'Student name unavailable'}</h1>
          <p className="page-description">{application.studentEmail || 'Student email unavailable'}</p>
        </div>
        <span className={`status-badge application-status ${getApplicationStatusClass(application.applicationStatus)}`}>
          {formatApplicationStatus(application.applicationStatus)}
        </span>
      </header>

      <div className="admin-drive-detail-grid">
        <DetailSection title="Student">
          <Detail label="Student name" value={application.studentName || 'Not available'} />
          <Detail label="Email" value={application.studentEmail || 'Not available'} />
          <Detail label="Student ID" value={application.studentId ?? 'Not available'} />
        </DetailSection>
        <DetailSection title="Academic Information">
          <Detail label="Branch" value={application.branch || 'Not available'} />
          <Detail label="Graduation year" value={application.graduationYear ?? 'Not available'} />
          <Detail label="CGPA" value={application.cgpa ?? 'Not available'} />
          <Detail label="Backlogs" value={application.backlogs ?? 'Not available'} />
        </DetailSection>
        <DetailSection title="Placement Drive">
          <Detail label="Drive title" value={application.driveTitle || 'Not available'} wide />
          <Detail label="Drive ID" value={application.placementDriveId ?? driveId} />
        </DetailSection>
        <DetailSection title="Application">
          <Detail label="Status" value={formatApplicationStatus(application.applicationStatus)} />
          <Detail label="Applied at" value={formatApplicationDate(application.appliedAt)} />
          <Detail label="Last updated" value={formatApplicationDate(application.updatedAt)} />
        </DetailSection>
      </div>

      {reviewable && (
        <section className="admin-application-review-panel">
          <div>
            <p className="eyebrow">APPLICATION REVIEW</p>
            <h2>Review this application</h2>
            <p>Only applications with APPLIED status can be shortlisted or rejected.</p>
          </div>
          <div className="application-row-actions">
            <button className="primary-button" type="button" disabled={Boolean(action)}
              onClick={() => handleAction('shortlist')}>
              {action === 'shortlist' ? 'Shortlisting...' : 'Shortlist'}
            </button>
            <button className="company-delete-button" type="button" disabled={Boolean(action)}
              onClick={() => handleAction('reject')}>
              {action === 'reject' ? 'Rejecting...' : 'Reject'}
            </button>
          </div>
        </section>
      )}
    </div>
  )
}

function DetailSection({ title, children }) {
  return (
    <section className="admin-drive-detail-section">
      <h2>{title}</h2>
      <div className="company-details-grid">{children}</div>
    </section>
  )
}

function Detail({ label, value, wide = false }) {
  return (
    <div className={`company-info-item ${wide ? 'company-info-wide' : ''}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}
