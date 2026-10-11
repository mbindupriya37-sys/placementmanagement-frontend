import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getApiErrorMessage } from '../../services/api'
import { getPlacementDrives } from '../../services/placementDriveService'

function formatDate(value) {
  if (!value) return 'Not set'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function RecruiterDrivesPage() {
  const [drives, setDrives] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function loadDrives() {
      try {
        const data = await getPlacementDrives()
        if (!active) return
        setDrives(Array.isArray(data) ? data : [])
      } catch (requestError) {
        if (!active) return
        setError(getApiErrorMessage(requestError) || 'Unable to load placement drives.')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadDrives()
    return () => {
      active = false
    }
  }, [])

  const filteredDrives = useMemo(() => {
    const lower = search.trim().toLowerCase()
    return drives.filter((drive) => {
      const matchesSearch = !lower || [
        drive.driveTitle,
        drive.jobRole,
        drive.companyName,
        drive.location,
      ].join(' ').toLowerCase().includes(lower)

      const matchesStatus = statusFilter === 'ALL' || drive.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [drives, search, statusFilter])

  return (
    <div className="recruiter-page">
      <header className="page-header-row">
        <div>
          <p className="eyebrow">DRIVES</p>
          <h1 className="page-heading">Placement drives</h1>
          <p className="page-description">Browse placement drives exposed to recruiters. Drive creation and updates are managed by the placement office.</p>
        </div>
      </header>

      <div className="filter-bar">
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by title, role, company or location"
          aria-label="Search drives"
        />
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter drives by status">
          <option value="ALL">All statuses</option>
          <option value="OPEN">Open</option>
          <option value="DRAFT">Draft</option>
          <option value="CLOSED">Closed</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {error && <div className="alert" role="alert">{error}</div>}

      {loading ? (
        <div className="content-loading" role="status">Loading placement drives...</div>
      ) : filteredDrives.length === 0 ? (
        <div className="empty-state">No placement drives match your filters.</div>
      ) : (
        <div className="card-grid">
          {filteredDrives.map((drive) => (
            <article key={drive.id} className="info-card drive-card">
              <div className="info-card-header">
                <div>
                  <p className="eyebrow compact">{drive.companyName || 'Company'}</p>
                  <h2>{drive.driveTitle || 'Untitled drive'}</h2>
                </div>
                <span className={`status-badge status-${String(drive.status || 'OPEN').toLowerCase()}`}>
                  {drive.status || 'OPEN'}
                </span>
              </div>

              <div className="inline-metrics">
                <div><span>Role</span><strong>{drive.jobRole || 'Not specified'}</strong></div>
                <div><span>Employment</span><strong>{drive.employmentType || 'Not specified'}</strong></div>
                <div><span>Location</span><strong>{drive.location || 'Not specified'}</strong></div>
                <div><span>Package</span><strong>{drive.packageLpa ? `₹${drive.packageLpa} LPA` : 'Not specified'}</strong></div>
              </div>

              <div className="meta-row">
                <span>Min CGPA: {drive.minimumCgpa ?? 'N/A'}</span>
                <span>Backlogs: {drive.maximumBacklogs ?? 'N/A'}</span>
              </div>

              <div className="meta-row">
                <span>Applications: {formatDate(drive.applicationStartDate)} to {formatDate(drive.applicationEndDate)}</span>
              </div>

              <div className="detail-actions">
                <Link className="secondary-button" to={`/recruiter/drives/${drive.id}`}>View details</Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
