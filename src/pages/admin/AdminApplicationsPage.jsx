import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getApiErrorMessage } from '../../services/api'
import { getDriveApplications } from '../../services/applicationAdminService'
import { getPlacementDrives } from '../../services/placementDriveAdminService'
import {
  applicationStatuses,
  formatApplicationDate,
  formatApplicationStatus,
  getApplicationErrorMessage,
  getApplicationStatusClass,
} from '../../utils/applicationAdmin'

async function getApplicationsAcrossDrives() {
  const drivesResult = await getPlacementDrives()
  const drives = Array.isArray(drivesResult) ? drivesResult : []
  const applicationsByDrive = await Promise.all(drives.map(async (drive) => {
    const result = await getDriveApplications(drive.id)
    return (Array.isArray(result) ? result : []).map((application) => ({
      ...application,
      placementDriveId: application.placementDriveId ?? drive.id,
      driveTitle: application.driveTitle || drive.driveTitle,
      companyName: application.companyName || drive.companyName,
      jobRole: drive.jobRole,
    }))
  }))
  return applicationsByDrive.flat()
}

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  async function loadApplications(showRefreshing = false) {
    if (showRefreshing) setRefreshing(true)
    try {
      setApplications(await getApplicationsAcrossDrives())
    } catch (requestError) {
      setError(getApplicationErrorMessage(requestError) || getApiErrorMessage(requestError))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    let active = true
    getApplicationsAcrossDrives()
      .then((records) => {
        if (active) setApplications(records)
      })
      .catch((requestError) => {
        if (active) {
          setError(getApplicationErrorMessage(requestError) || getApiErrorMessage(requestError))
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const filteredApplications = useMemo(() => {
    const query = search.trim().toLowerCase()
    return applications.filter((application) => {
      const matchesStatus = !statusFilter || application.applicationStatus === statusFilter
      const matchesSearch = !query || [
        application.studentName,
        application.studentEmail,
        application.companyName,
        application.driveTitle,
        application.jobRole,
        application.applicationId,
      ].some((value) => String(value ?? '').toLowerCase().includes(query))
      return matchesStatus && matchesSearch
    })
  }, [applications, search, statusFilter])

  return (
    <div className="admin-applications-page">
      <header className="admin-page-heading">
        <div>
          <p className="eyebrow">APPLICATION OVERVIEW</p>
          <h1 className="page-heading">All Applications</h1>
          <p className="page-description">Applications across all placement drives.</p>
        </div>
        <div className="admin-applications-header-actions">
          <span className="application-count">
            {applications.length} {applications.length === 1 ? 'application' : 'applications'}
          </span>
          <button
            className="secondary-button"
            type="button"
            disabled={loading || refreshing}
            onClick={() => {
              setError('')
              loadApplications(true)
            }}
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </header>

      {error && <div className="alert admin-drive-alert" role="alert">{error}</div>}

      <section className="admin-application-filters" aria-label="Search and filter applications">
        <label className="company-search admin-drive-search">
          <span aria-hidden="true">⌕</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search candidate, email, company, drive, or role"
            aria-label="Search candidate, email, company, drive, or role"
          />
        </label>
        <label className="filter-label">
          <span>Status</span>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="">All statuses</option>
            {applicationStatuses.map((status) => (
              <option key={status} value={status}>{formatApplicationStatus(status)}</option>
            ))}
          </select>
        </label>
      </section>

      {loading ? (
        <div className="content-loading" role="status">Loading applications...</div>
      ) : error && applications.length === 0 ? (
        <div className="alert admin-drive-alert" role="alert">{error}</div>
      ) : applications.length === 0 ? (
        <div className="admin-empty-state">
          <span className="admin-empty-icon" aria-hidden="true">▤</span>
          <strong>No applications have been submitted yet.</strong>
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className="admin-empty-state"><strong>No applications match your search or status filter.</strong></div>
      ) : (
        <div className="admin-application-table-wrap">
          <table className="admin-application-table">
            <thead>
              <tr>
                <th scope="col">Student / Candidate</th>
                <th scope="col">Company</th>
                <th scope="col">Drive title</th>
                <th scope="col">Job role</th>
                <th scope="col">Applied</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredApplications.map((application) => (
                <tr key={`${application.placementDriveId}-${application.applicationId}`}>
                  <td>
                    <div className="application-student-cell">
                      <Link to={`/admin/drives/${application.placementDriveId}/applications/${application.applicationId}`}>
                        {application.studentName || 'Name unavailable'}
                      </Link>
                      {application.studentEmail && <span>{application.studentEmail}</span>}
                      <small>Application #{application.applicationId}</small>
                    </div>
                  </td>
                  <td>{application.companyName || 'Company unavailable'}</td>
                  <td>{application.driveTitle || 'Drive title unavailable'}</td>
                  <td>{application.jobRole || 'Job role unavailable'}</td>
                  <td>{formatApplicationDate(application.appliedAt)}</td>
                  <td>
                    <span className={`status-badge application-status ${getApplicationStatusClass(application.applicationStatus)}`}>
                      {formatApplicationStatus(application.applicationStatus)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
