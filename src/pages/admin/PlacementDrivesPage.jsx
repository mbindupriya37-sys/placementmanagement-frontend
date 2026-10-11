import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { getApiErrorMessage } from '../../services/api'
import { deletePlacementDrive, getPlacementDrives } from '../../services/placementDriveAdminService'
import {
  driveStatuses,
  employmentTypes,
  formatDriveDate,
  formatDriveStatus,
  formatEmploymentType,
  formatPackage,
  getDriveCompanyName,
  getDriveStatusClass,
} from '../../utils/placementDriveAdmin'

export default function PlacementDrivesPage() {
  const location = useLocation()
  const [drives, setDrives] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(location.state?.success || '')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [employmentFilter, setEmploymentFilter] = useState('')
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    let active = true
    getPlacementDrives()
      .then((result) => {
        if (active) setDrives(Array.isArray(result) ? result : [])
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

  const filteredDrives = useMemo(() => {
    const query = search.trim().toLowerCase()
    return drives.filter((drive) => {
      const searchableValues = [
        getDriveCompanyName(drive),
        drive.driveTitle,
        drive.jobRole,
        drive.location,
      ]
      return (!query || searchableValues.some((value) => value?.toLowerCase().includes(query)))
        && (!statusFilter || drive.status === statusFilter)
        && (!employmentFilter || drive.employmentType === employmentFilter)
    })
  }, [drives, search, statusFilter, employmentFilter])

  async function handleDelete(drive) {
    if (!window.confirm('Are you sure you want to delete this placement drive?')) return
    setDeletingId(drive.id)
    setError('')
    setSuccess('')
    try {
      await deletePlacementDrive(drive.id)
      setDrives((current) => current.filter((item) => item.id !== drive.id))
      setSuccess('Placement drive deleted successfully.')
    } catch (requestError) {
      setError(getApiErrorMessage(requestError))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="admin-drive-page">
      <header className="admin-page-heading">
        <div>
          <p className="eyebrow">RECRUITMENT MANAGEMENT</p>
          <h1 className="page-heading">Placement Drives</h1>
          <p className="page-description">Create and manage campus placement opportunities.</p>
        </div>
        <Link className="primary-button" to="/admin/drives/new">+ Create Placement Drive</Link>
      </header>

      {success && <div className="success-banner" role="status">{success}</div>}
      {error && <div className="alert admin-drive-alert" role="alert">{error}</div>}

      <section className="admin-drive-filters" aria-label="Search and filter placement drives">
        <label className="company-search admin-drive-search">
          <span aria-hidden="true">⌕</span>
          <input type="search" value={search} onChange={(event) => setSearch(event.target.value)}
            placeholder="Search company, drive, role, or location"
            aria-label="Search company, drive, role, or location" />
        </label>
        <label className="filter-label">
          <span>Status</span>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="">All</option>
            {driveStatuses.map((status) => <option key={status} value={status}>{formatDriveStatus(status)}</option>)}
          </select>
        </label>
        <label className="filter-label">
          <span>Employment</span>
          <select value={employmentFilter} onChange={(event) => setEmploymentFilter(event.target.value)}>
            <option value="">All</option>
            {employmentTypes.map((type) => (
              <option key={type} value={type}>{formatEmploymentType(type)}</option>
            ))}
          </select>
        </label>
      </section>

      {loading ? (
        <div className="content-loading" role="status">Loading placement drives...</div>
      ) : error && drives.length === 0 ? (
        <div className="alert admin-drive-alert" role="alert">{error}</div>
      ) : filteredDrives.length === 0 ? (
        <div className="admin-empty-state">
          <span className="admin-empty-icon" aria-hidden="true">▣</span>
          <strong>{drives.length ? 'No placement drives match your search or filters.' : 'No placement drives found.'}</strong>
          {!drives.length && <p>Create a drive to add a placement opportunity.</p>}
          {!drives.length && <Link className="primary-button" to="/admin/drives/new">Create Placement Drive</Link>}
        </div>
      ) : (
        <div className="admin-drive-grid">
          {filteredDrives.map((drive) => (
            <article className="admin-drive-card" key={drive.id}>
              <header className="admin-drive-card-header">
                <span className="company-avatar company-avatar-large" aria-hidden="true">
                  {getDriveCompanyName(drive).slice(0, 1).toUpperCase()}
                </span>
                <span className={`status-badge drive-status ${getDriveStatusClass(drive.status)}`}>
                  {formatDriveStatus(drive.status)}
                </span>
              </header>
              <p className="admin-drive-company">{getDriveCompanyName(drive)}</p>
              <h2>{drive.driveTitle || 'Placement drive'}</h2>
              <p className="admin-drive-role">{drive.jobRole || 'Role not specified'}</p>
              <div className="admin-drive-facts">
                <DriveFact label="Employment" value={formatEmploymentType(drive.employmentType)} />
                <DriveFact label="Location" value={drive.location || 'Not specified'} />
                <DriveFact label="Package" value={formatPackage(drive.packageLpa)} />
                <DriveFact label="Minimum CGPA" value={drive.minimumCgpa ?? 'Not specified'} />
                <DriveFact label="Maximum backlogs" value={drive.maximumBacklogs ?? 'Not specified'} />
                <DriveFact label="Graduation year" value={drive.graduationYear ?? 'Not specified'} />
              </div>
              <div className="admin-drive-dates">
                <DriveFact label="Application start" value={formatDriveDate(drive.applicationStartDate)} />
                <DriveFact label="Application end" value={formatDriveDate(drive.applicationEndDate)} />
                <DriveFact label="Drive date" value={formatDriveDate(drive.driveDate)} />
              </div>
              <footer className="admin-drive-actions">
                <Link className="secondary-button" to={`/admin/drives/${drive.id}`}>View</Link>
                <Link className="secondary-button" to={`/admin/drives/${drive.id}/edit`}>Edit</Link>
                <button className="company-delete-button" type="button"
                  disabled={deletingId === drive.id} onClick={() => handleDelete(drive)}>
                  {deletingId === drive.id ? 'Deleting...' : 'Delete'}
                </button>
              </footer>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

function DriveFact({ label, value }) {
  return (
    <div className="company-card-detail">
      <span>{label}</span>
      <strong title={String(value)}>{value}</strong>
    </div>
  )
}
