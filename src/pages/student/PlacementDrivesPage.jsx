import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getApiErrorMessage } from '../../services/api'
import { getPlacementDrives } from '../../services/placementDriveService'
import {
  formatDate,
  formatEmploymentType,
  formatPackage,
  formatDriveStatus,
  getDriveCompanyName,
  getStatusClass,
} from '../../utils/placementDrive'

export default function PlacementDrivesPage() {
  const [drives, setDrives] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [employmentFilter, setEmploymentFilter] = useState('')

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
      const matchesSearch = !query
        || [getDriveCompanyName(drive), drive.driveTitle, drive.jobRole]
          .some((value) => value?.toLowerCase().includes(query))
      return matchesSearch
        && (!statusFilter || drive.status === statusFilter)
        && (!employmentFilter || drive.employmentType === employmentFilter)
    })
  }, [drives, search, statusFilter, employmentFilter])

  return (
    <div className="drive-page">
      <header className="drive-page-heading">
        <div>
          <p className="eyebrow">OPPORTUNITIES</p>
          <h1 className="page-heading">Placement Drives</h1>
          <p className="page-description">Explore recruitment opportunities shared with your campus.</p>
        </div>
      </header>

      <section className="drive-filter-bar" aria-label="Filter placement drives">
        <label className="drive-search">
          <span aria-hidden="true">⌕</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search company, role, or drive"
            aria-label="Search company, role, or drive"
          />
        </label>
        <label className="filter-label">
          <span>Status</span>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="">All statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="OPEN">Open</option>
            <option value="CLOSED">Closed</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </label>
        <label className="filter-label">
          <span>Employment</span>
          <select value={employmentFilter} onChange={(event) => setEmploymentFilter(event.target.value)}>
            <option value="">All types</option>
            <option value="FULL_TIME">Full time</option>
            <option value="INTERNSHIP">Internship</option>
            <option value="CONTRACT">Contract</option>
          </select>
        </label>
      </section>

      {loading ? (
        <div className="content-loading" role="status">Loading placement drives...</div>
      ) : error ? (
        <div className="alert drive-page-alert" role="alert">
          <strong>Unable to load placement drives.</strong> {error}
        </div>
      ) : filteredDrives.length === 0 ? (
        <div className="drive-empty-state">
          <div className="drive-empty-icon" aria-hidden="true">▣</div>
          <strong>{drives.length ? 'No drives match your filters.' : 'No placement drives available.'}</strong>
          <span>{drives.length ? 'Try changing or clearing your search and filters.' : 'Check back later for new opportunities.'}</span>
        </div>
      ) : (
        <div className="drive-card-grid">
          {filteredDrives.map((drive) => (
            <article className="drive-card" key={drive.id}>
              <header className="drive-card-header">
                <div className="company-monogram" aria-hidden="true">
                  {getDriveCompanyName(drive).slice(0, 1).toUpperCase()}
                </div>
                <span className={`status-badge drive-status ${getStatusClass(drive.status)}`}>
                  {formatDriveStatus(drive.status)}
                </span>
              </header>
              <p className="drive-company-name">{getDriveCompanyName(drive)}</p>
              <h2>{drive.driveTitle || 'Placement drive'}</h2>
              <p className="drive-role">{drive.jobRole || 'Role not specified'}</p>
              <div className="drive-card-facts">
                <DriveFact label="Employment" value={formatEmploymentType(drive.employmentType)} />
                <DriveFact label="Location" value={drive.location || 'Not specified'} />
                <DriveFact label="Package" value={formatPackage(drive.packageLpa)} />
                <DriveFact label="Minimum CGPA" value={drive.minimumCgpa ?? 'Not specified'} />
                <DriveFact label="Maximum backlogs" value={drive.maximumBacklogs ?? 'Not specified'} />
                <DriveFact label="Graduation year" value={drive.graduationYear ?? 'Not specified'} />
              </div>
              <div className="drive-card-dates">
                <DateItem label="Applications open" value={drive.applicationStartDate} />
                <DateItem label="Deadline" value={drive.applicationEndDate} />
                <DateItem label="Drive date" value={drive.driveDate} />
              </div>
              <Link className="secondary-button drive-details-link" to={`/student/drives/${drive.id}`}>
                View Details <span aria-hidden="true">→</span>
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

function DriveFact({ label, value }) {
  return (
    <div className="drive-fact">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function DateItem({ label, value }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{formatDate(value)}</strong>
    </div>
  )
}
