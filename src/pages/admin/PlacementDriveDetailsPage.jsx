import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { getApiErrorMessage } from '../../services/api'
import {
  deletePlacementDrive,
  getPlacementDriveById,
  updatePlacementDriveStatus,
} from '../../services/placementDriveAdminService'
import {
  driveStatuses,
  formatBranches,
  formatDriveDate,
  formatDriveStatus,
  formatEmploymentType,
  formatPackage,
  getDriveStatusClass,
} from '../../utils/placementDriveAdmin'

export default function PlacementDriveDetailsPage() {
  const { driveId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [drive, setDrive] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(location.state?.success || '')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    let active = true
    getPlacementDriveById(driveId)
      .then((result) => {
        if (!active) return
        setDrive(result)
        setSelectedStatus(result?.status || '')
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

  async function handleStatusUpdate() {
    setUpdatingStatus(true)
    setError('')
    setSuccess('')
    try {
      await updatePlacementDriveStatus(driveId, selectedStatus)
      const updatedDrive = await getPlacementDriveById(driveId)
      setDrive(updatedDrive)
      setSelectedStatus(updatedDrive?.status || '')
      setSuccess('Drive status updated successfully.')
    } catch (requestError) {
      setError(getApiErrorMessage(requestError))
    } finally {
      setUpdatingStatus(false)
    }
  }

  async function handleDelete() {
    if (!window.confirm('Are you sure you want to delete this placement drive?')) return
    setDeleting(true)
    setError('')
    try {
      await deletePlacementDrive(driveId)
      navigate('/admin/drives', { replace: true, state: { success: 'Placement drive deleted successfully.' } })
    } catch (requestError) {
      setError(getApiErrorMessage(requestError))
      setDeleting(false)
    }
  }

  if (loading) return <div className="content-loading" role="status">Loading placement drive...</div>
  if (!drive) {
    return (
      <div className="company-form-error">
        <h1 className="page-heading">Unable to load placement drive</h1>
        <div className="alert" role="alert">{error || 'Placement drive not found.'}</div>
        <Link className="secondary-button" to="/admin/drives">Back to Placement Drives</Link>
      </div>
    )
  }

  return (
    <div className="admin-drive-details-page">
      <Link className="back-link" to="/admin/drives">← Back to Placement Drives</Link>
      {success && <div className="success-banner" role="status">{success}</div>}
      {error && <div className="alert admin-drive-alert" role="alert">{error}</div>}
      <header className="admin-drive-details-header">
        <span className="company-avatar company-avatar-xl" aria-hidden="true">
          {(drive.companyName || 'C').slice(0, 1).toUpperCase()}
        </span>
        <div className="admin-drive-details-title">
          <p className="eyebrow">{drive.companyName || 'Company not specified'}</p>
          <h1 className="page-heading">{drive.driveTitle}</h1>
          <p className="page-description">{drive.jobRole} · {drive.location || 'Location not specified'}</p>
        </div>
        <span className={`status-badge drive-status ${getDriveStatusClass(drive.status)}`}>
          {formatDriveStatus(drive.status)}
        </span>
        <div className="admin-drive-details-actions">
          <Link className="secondary-button" to={`/admin/drives/${driveId}/applications`}>View Applications</Link>
          <Link className="secondary-button" to={`/admin/drives/${driveId}/final-decisions`}>Final Decisions</Link>
          <Link className="secondary-button" to={`/admin/drives/${driveId}/rounds`}>Selection Rounds</Link>
          <Link className="secondary-button" to={`/admin/drives/${driveId}/edit`}>Edit Drive</Link>
          <button className="company-delete-button" type="button" disabled={deleting} onClick={handleDelete}>
            {deleting ? 'Deleting...' : 'Delete Drive'}
          </button>
        </div>
      </header>

      <div className="admin-drive-detail-grid">
        <DetailSection title="Company">
          <Detail label="Company name" value={drive.companyName || 'Not specified'} />
          <Detail label="Company ID" value={drive.companyId ?? 'Not specified'} />
        </DetailSection>
        <DetailSection title="Job">
          <Detail label="Drive title" value={drive.driveTitle || 'Not specified'} wide />
          <Detail label="Job role" value={drive.jobRole || 'Not specified'} />
          <Detail label="Employment type" value={formatEmploymentType(drive.employmentType)} />
          <Detail label="Location" value={drive.location || 'Not specified'} />
          <Detail label="Package" value={formatPackage(drive.packageLpa)} />
          <Detail label="Job description" value={drive.jobDescription || 'Not specified'} wide />
        </DetailSection>
        <DetailSection title="Eligibility">
          <Detail label="Minimum CGPA" value={drive.minimumCgpa ?? 'Not specified'} />
          <Detail label="Maximum backlogs" value={drive.maximumBacklogs ?? 'Not specified'} />
          <Detail label="Eligible branches" value={formatBranches(drive.eligibleBranches)} wide />
          <Detail label="Graduation year" value={drive.graduationYear ?? 'Not specified'} />
        </DetailSection>
        <DetailSection title="Important Dates">
          <Detail label="Application start" value={formatDriveDate(drive.applicationStartDate)} />
          <Detail label="Application end" value={formatDriveDate(drive.applicationEndDate)} />
          <Detail label="Drive date" value={formatDriveDate(drive.driveDate)} />
        </DetailSection>
      </div>

      <section className="admin-drive-status-panel">
        <div>
          <p className="eyebrow">STATUS MANAGEMENT</p>
          <h2>Update drive status</h2>
          <p>The backend validates whether this status change is permitted.</p>
        </div>
        <div className="admin-drive-status-control">
          <label className="filter-label" htmlFor="drive-status-select">
            <span>Status</span>
            <select id="drive-status-select" value={selectedStatus}
              onChange={(event) => setSelectedStatus(event.target.value)}>
              {driveStatuses.map((status) => (
                <option key={status} value={status}>{formatDriveStatus(status)}</option>
              ))}
            </select>
          </label>
          <button className="primary-button" type="button"
            disabled={updatingStatus || selectedStatus === drive.status} onClick={handleStatusUpdate}>
            {updatingStatus ? 'Updating...' : 'Update Status'}
          </button>
        </div>
      </section>
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
