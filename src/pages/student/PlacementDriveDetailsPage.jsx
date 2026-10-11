import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getApiErrorMessage } from '../../services/api'
import {
  applyToPlacementDrive,
  checkEligibility,
  getMyApplications,
  getPlacementDriveById,
} from '../../services/placementDriveService'
import {
  formatDate,
  formatEmploymentType,
  formatPackage,
  formatDriveStatus,
  getDriveCompanyName,
  getStatusClass,
  isAlreadyAppliedError,
} from '../../utils/placementDrive'

export default function PlacementDriveDetailsPage() {
  const { driveId } = useParams()
  const [drive, setDrive] = useState(null)
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [eligibility, setEligibility] = useState(null)
  const [eligibilityLoading, setEligibilityLoading] = useState(false)
  const [eligibilityError, setEligibilityError] = useState('')
  const [applicationLoading, setApplicationLoading] = useState(false)
  const [applicationError, setApplicationError] = useState('')
  const [applicationSuccess, setApplicationSuccess] = useState('')
  const [applicationId, setApplicationId] = useState(null)

  useEffect(() => {
    let active = true

    Promise.all([
      getPlacementDriveById(driveId),
      getMyApplications().catch(() => []),
    ])
      .then(([driveResult, applicationResult]) => {
        if (!active) return
        setDrive(driveResult)
        setApplications(Array.isArray(applicationResult) ? applicationResult : [])
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

  const existingApplication = applications.find(
    (application) => String(application.driveId) === String(driveId),
  )
  const applied = Boolean(existingApplication || applicationId)
  const canApply = eligibility?.eligible === true && drive?.status === 'OPEN' && !applied

  async function handleCheckEligibility() {
    setEligibilityLoading(true)
    setEligibilityError('')
    setApplicationError('')
    setApplicationSuccess('')
    try {
      const result = await checkEligibility(driveId)
      setEligibility(result)
    } catch (requestError) {
      setEligibility(null)
      setEligibilityError(getApiErrorMessage(requestError))
    } finally {
      setEligibilityLoading(false)
    }
  }

  async function handleApply() {
    if (!canApply || applicationLoading) return
    const confirmed = window.confirm(`Are you sure you want to apply for ${drive.driveTitle || 'this placement drive'}?`)
    if (!confirmed) return

    setApplicationLoading(true)
    setApplicationError('')
    setApplicationSuccess('')
    try {
      const result = await applyToPlacementDrive(driveId)
      setApplicationId(result?.applicationId || result?.id || true)
      setApplicationSuccess('Application submitted successfully.')
      setApplications((current) => [
        { ...result, driveId: result?.driveId || drive.id, status: result?.status || 'APPLIED' },
        ...current,
      ])
    } catch (requestError) {
      if (isAlreadyAppliedError(requestError)) {
        setApplicationError('You have already applied for this drive.')
        setApplications((current) => current.some(
          (application) => String(application.driveId) === String(driveId),
        ) ? current : [...current, { driveId, status: 'APPLIED' }])
      } else {
        setApplicationError(getApiErrorMessage(requestError))
      }
    } finally {
      setApplicationLoading(false)
    }
  }

  if (loading) return <div className="content-loading" role="status">Loading placement drive...</div>
  if (error) {
    return (
      <div className="drive-error-state" role="alert">
        <h1 className="page-heading">Unable to load placement drive</h1>
        <p>{error}</p>
        <Link className="secondary-button" to="/student/drives">Back to placement drives</Link>
      </div>
    )
  }

  if (!drive) return null

  return (
    <div className="drive-details-page">
      <Link className="back-link" to="/student/drives">← Back to Placement Drives</Link>
      <header className="drive-details-hero">
        <div className="company-monogram company-monogram-large" aria-hidden="true">
          {getDriveCompanyName(drive).slice(0, 1).toUpperCase()}
        </div>
        <div className="drive-details-title">
          <p className="drive-company-name">{getDriveCompanyName(drive)}</p>
          <h1>{drive.driveTitle}</h1>
          <p>{drive.jobRole} <span>·</span> {formatEmploymentType(drive.employmentType)}</p>
        </div>
        <span className={`status-badge drive-status ${getStatusClass(drive.status)}`}>
          {formatDriveStatus(drive.status)}
        </span>
      </header>

      <div className="drive-details-layout">
        <main className="drive-details-main">
          <DetailSection title="Job Information">
            <p className="drive-description">
              {drive.jobDescription || 'No job description has been provided.'}
            </p>
            <div className="drive-detail-grid">
              <Detail label="Job role" value={drive.jobRole} />
              <Detail label="Employment type" value={formatEmploymentType(drive.employmentType)} />
              <Detail label="Job location" value={drive.location} />
              <Detail label="Annual package" value={formatPackage(drive.packageLpa)} />
            </div>
          </DetailSection>

          <DetailSection title="Company Information">
            <div className="company-detail-card">
              <div className="company-monogram" aria-hidden="true">
                {getDriveCompanyName(drive).slice(0, 1).toUpperCase()}
              </div>
              <div>
                <strong>{getDriveCompanyName(drive)}</strong>
                <span>Company details provided for this placement drive</span>
              </div>
            </div>
          </DetailSection>

          <DetailSection title="Eligibility Criteria">
            <div className="drive-detail-grid">
              <Detail label="Minimum CGPA" value={drive.minimumCgpa} />
              <Detail label="Maximum backlogs" value={drive.maximumBacklogs} />
              <Detail label="Graduation year" value={drive.graduationYear} />
              <Detail label="Eligible branches"
                value={Array.isArray(drive.eligibleBranches) ? drive.eligibleBranches.join(', ') : null} />
            </div>
            <p className="criteria-note">Eligibility is checked by PlacementOS using your current student profile.</p>
          </DetailSection>

          <DetailSection title="Important Dates">
            <div className="dates-list">
              <DateDetail label="Applications open" value={drive.applicationStartDate} />
              <DateDetail label="Application deadline" value={drive.applicationEndDate} />
              <DateDetail label="Drive date" value={drive.driveDate} />
            </div>
          </DetailSection>
        </main>

        <aside className="drive-action-panel">
          <div className="drive-action-panel-heading">
            <p className="eyebrow">YOUR NEXT STEP</p>
            <h2>Check your eligibility</h2>
            <p>Get an eligibility result based on your current profile.</p>
          </div>
          <button className="primary-button eligibility-button" type="button"
            onClick={handleCheckEligibility} disabled={eligibilityLoading}>
            {eligibilityLoading ? 'Checking eligibility...' : eligibility ? 'Check Eligibility Again' : 'Check Eligibility'}
          </button>

          {eligibilityError && <div className="alert drive-inline-alert" role="alert">{eligibilityError}</div>}
          {applicationError && <div className="alert drive-inline-alert" role="alert">{applicationError}</div>}
          {applicationSuccess && (
            <div className="success-banner drive-inline-success" role="status">
              {applicationSuccess}
              <Link to="/student/applications">View My Applications</Link>
            </div>
          )}

          {applied && !applicationSuccess && (
            <div className="applied-notice">
              <strong>You have already applied for this drive.</strong>
              <Link to="/student/applications">View My Applications</Link>
            </div>
          )}

          {eligibility && (
            <div className={`eligibility-result ${eligibility.eligible ? 'eligible' : 'not-eligible'}`}>
              <strong>
                {eligibility.eligible
                  ? '✓ You are eligible for this drive.'
                  : '✗ You are not eligible for this drive.'}
              </strong>
              {eligibility.eligible ? (
                <p>You are eligible to apply.</p>
              ) : (
                <>
                  <p>Application unavailable because you are not eligible for this drive.</p>
                  {eligibility.reasons?.length > 0 && (
                    <ul>
                      {eligibility.reasons.map((reason, index) => <li key={`${index}-${reason}`}>{reason}</li>)}
                    </ul>
                  )}
                </>
              )}
            </div>
          )}

          {eligibility?.eligible && drive.status !== 'OPEN' && (
            <div className="drive-closed-notice">
              Applications are unavailable because this drive is {formatDriveStatus(drive.status).toLowerCase()}.
            </div>
          )}

          {canApply && (
            <button className="primary-button apply-button" type="button" onClick={handleApply}
              disabled={applicationLoading}>
              {applicationLoading ? 'Submitting application...' : 'Apply Now'}
            </button>
          )}
        </aside>
      </div>
    </div>
  )
}

function DetailSection({ title, children }) {
  return (
    <section className="drive-detail-section">
      <h2>{title}</h2>
      {children}
    </section>
  )
}

function Detail({ label, value }) {
  return (
    <div className="drive-detail">
      <span>{label}</span>
      <strong>{value === null || value === undefined || value === '' ? 'Not specified' : value}</strong>
    </div>
  )
}

function DateDetail({ label, value }) {
  return (
    <div className="date-detail">
      <span>{label}</span>
      <strong>{formatDate(value)}</strong>
    </div>
  )
}
