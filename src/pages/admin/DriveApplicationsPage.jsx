import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getApiErrorMessage } from '../../services/api'
import {
  bulkRejectApplications,
  bulkShortlistApplications,
  getDriveApplications,
  rejectApplication,
  shortlistApplication,
} from '../../services/applicationAdminService'
import { getPlacementDriveById } from '../../services/placementDriveAdminService'
import {
  applicationStatuses,
  canReviewApplication,
  formatApplicationDate,
  formatApplicationStatus,
  getApplicationErrorMessage,
  getApplicationStatusClass,
} from '../../utils/applicationAdmin'

export default function DriveApplicationsPage() {
  const { driveId } = useParams()
  const [applications, setApplications] = useState([])
  const [drive, setDrive] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState([])
  const [pendingAction, setPendingAction] = useState('')

  async function refreshApplications(showLoading = false) {
    if (showLoading) setRefreshing(true)
    setError('')
    try {
      const result = await getDriveApplications(driveId)
      const records = Array.isArray(result) ? result : []
      setApplications(records)
      setSelectedIds((current) => current.filter((id) =>
        records.some((application) => application.applicationId === id && canReviewApplication(application))))
    } catch (requestError) {
      setError(getApplicationErrorMessage(requestError) || getApiErrorMessage(requestError))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    let active = true
    Promise.all([getDriveApplications(driveId), getPlacementDriveById(driveId)])
      .then(([applicationResult, driveResult]) => {
        if (!active) return
        setApplications(Array.isArray(applicationResult) ? applicationResult : [])
        setDrive(driveResult)
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
  }, [driveId])

  const filteredApplications = useMemo(() => {
    const query = search.trim().toLowerCase()
    return applications.filter((application) => {
      const matchesStatus = !statusFilter || application.applicationStatus === statusFilter
      const matchesSearch = !query || [
        application.studentName,
        application.studentEmail,
        application.branch,
        application.driveTitle,
        application.applicationId,
      ].some((value) => String(value ?? '').toLowerCase().includes(query))
      return matchesStatus && matchesSearch
    })
  }, [applications, search, statusFilter])

  const visibleReviewableIds = filteredApplications
    .filter(canReviewApplication)
    .map((application) => application.applicationId)
  const allVisibleSelected = visibleReviewableIds.length > 0
    && visibleReviewableIds.every((id) => selectedIds.includes(id))

  function toggleSelection(applicationId) {
    setSelectedIds((current) => current.includes(applicationId)
      ? current.filter((id) => id !== applicationId)
      : [...current, applicationId])
  }

  function toggleSelectAll() {
    setSelectedIds((current) => allVisibleSelected
      ? current.filter((id) => !visibleReviewableIds.includes(id))
      : [...new Set([...current, ...visibleReviewableIds])])
  }

  async function handleSingleAction(application, action) {
    const verb = action === 'shortlist' ? 'shortlist' : 'reject'
    if (!window.confirm(`${verb === 'shortlist' ? 'Shortlist' : 'Reject'} this application?`)) return
    setPendingAction(`${action}:${application.applicationId}`)
    setError('')
    setSuccess('')
    try {
      if (action === 'shortlist') await shortlistApplication(application.applicationId)
      else await rejectApplication(application.applicationId)
      setSuccess(`Application ${action === 'shortlist' ? 'shortlisted' : 'rejected'} successfully.`)
      await refreshApplications()
    } catch (requestError) {
      setError(getApplicationErrorMessage(requestError) || getApiErrorMessage(requestError))
    } finally {
      setPendingAction('')
    }
  }

  async function handleBulkAction(action) {
    const count = selectedIds.length
    const actionLabel = action === 'shortlist' ? 'shortlist' : 'reject'
    if (!count || !window.confirm(`Are you sure you want to ${actionLabel} ${count} selected ${count === 1 ? 'application' : 'applications'}?`)) {
      return
    }
    setPendingAction(`bulk:${action}`)
    setError('')
    setSuccess('')
    try {
      if (action === 'shortlist') await bulkShortlistApplications(driveId, selectedIds)
      else await bulkRejectApplications(driveId, selectedIds)
      setSelectedIds([])
      setSuccess(`${count} ${count === 1 ? 'application' : 'applications'} ${action === 'shortlist' ? 'shortlisted' : 'rejected'} successfully.`)
      await refreshApplications()
    } catch (requestError) {
      setError(getApplicationErrorMessage(requestError) || getApiErrorMessage(requestError))
    } finally {
      setPendingAction('')
    }
  }

  return (
    <div className="admin-applications-page">
      <Link className="back-link" to={`/admin/drives/${driveId}`}>← Back to Placement Drive</Link>
      <header className="admin-page-heading">
        <div>
          <p className="eyebrow">APPLICATION REVIEW</p>
          <h1 className="page-heading">Drive Applications</h1>
          <p className="page-description">
            {drive?.driveTitle || applications[0]?.driveTitle || `Placement drive #${driveId}`}
            {drive?.companyName ? ` · ${drive.companyName}` : ''}
          </p>
        </div>
        <div className="admin-applications-header-actions">
          <span className="application-count">
            {applications.length} {applications.length === 1 ? 'application' : 'applications'}
          </span>
          <Link className="secondary-button" to={`/admin/drives/${driveId}/final-decisions`}>
            Final decisions
          </Link>
          <button className="secondary-button" type="button" disabled={loading || refreshing || Boolean(pendingAction)}
            onClick={() => refreshApplications(true)}>
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </header>

      {success && <div className="success-banner" role="status">{success}</div>}
      {error && <div className="alert admin-drive-alert" role="alert">{error}</div>}

      {!loading && applications.length > 0 && (
        <label className="admin-select-all">
          <input type="checkbox" checked={allVisibleSelected} onChange={toggleSelectAll}
            disabled={!visibleReviewableIds.length || Boolean(pendingAction)}
            aria-label="Select all APPLIED applications" />
          <span>Select All APPLIED</span>
          <small>{visibleReviewableIds.length} available in the current view</small>
        </label>
      )}

      <section className="admin-application-filters" aria-label="Search and filter applications">
        <label className="company-search admin-drive-search">
          <span aria-hidden="true">⌕</span>
          <input type="search" value={search} onChange={(event) => setSearch(event.target.value)}
            placeholder="Search student, email, branch, or application ID"
            aria-label="Search student, email, branch, or application ID" />
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

      {selectedIds.length > 0 && (
        <section className="admin-bulk-actions" aria-label="Bulk application actions">
          <strong>{selectedIds.length} {selectedIds.length === 1 ? 'application' : 'applications'} selected</strong>
          <button className="primary-button" type="button" disabled={Boolean(pendingAction)}
            onClick={() => handleBulkAction('shortlist')}>
            {pendingAction === 'bulk:shortlist' ? 'Shortlisting selected applications...' : 'Bulk Shortlist'}
          </button>
          <button className="company-delete-button" type="button" disabled={Boolean(pendingAction)}
            onClick={() => handleBulkAction('reject')}>
            {pendingAction === 'bulk:reject' ? 'Rejecting selected applications...' : 'Bulk Reject'}
          </button>
          <button className="text-button" type="button" disabled={Boolean(pendingAction)}
            onClick={() => setSelectedIds([])}>Clear Selection</button>
        </section>
      )}

      {loading ? (
        <div className="content-loading" role="status">Loading applications...</div>
      ) : error && applications.length === 0 ? (
        <div className="alert admin-drive-alert" role="alert">{error}</div>
      ) : applications.length === 0 ? (
        <div className="admin-empty-state">
          <span className="admin-empty-icon" aria-hidden="true">▤</span>
          <strong>No applications have been submitted for this drive yet.</strong>
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className="admin-empty-state"><strong>No applications match your search or status filter.</strong></div>
      ) : (
        <div className="admin-application-table-wrap">
          <table className="admin-application-table">
            <thead>
              <tr>
                <th scope="col">
                  Select
                </th>
                <th scope="col">Student</th>
                <th scope="col">Academic details</th>
                <th scope="col">Applied</th>
                <th scope="col">Status</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredApplications.map((application) => {
                const reviewable = canReviewApplication(application)
                const busy = pendingAction.endsWith(`:${application.applicationId}`)
                  || Boolean(pendingAction.startsWith('bulk:'))
                return (
                  <tr key={application.applicationId}>
                    <td>
                      <input type="checkbox" checked={selectedIds.includes(application.applicationId)}
                        disabled={!reviewable || Boolean(pendingAction)}
                        onChange={() => toggleSelection(application.applicationId)}
                        aria-label={`Select ${application.studentName || `application ${application.applicationId}`}`} />
                    </td>
                    <td>
                      <div className="application-student-cell">
                        <strong>{application.studentName || 'Name unavailable'}</strong>
                        <span>{application.studentEmail || 'Email unavailable'}</span>
                        <small>Application #{application.applicationId}</small>
                      </div>
                    </td>
                    <td>
                      <div className="application-academic-cell">
                        <span>{application.branch || 'Branch unavailable'}</span>
                        <span>Graduation {application.graduationYear ?? '—'}</span>
                        <span>CGPA {application.cgpa ?? '—'} · Backlogs {application.backlogs ?? '—'}</span>
                      </div>
                    </td>
                    <td>{formatApplicationDate(application.appliedAt)}</td>
                    <td>
                      <span className={`status-badge application-status ${getApplicationStatusClass(application.applicationStatus)}`}>
                        {formatApplicationStatus(application.applicationStatus)}
                      </span>
                    </td>
                    <td>
                      <div className="application-row-actions">
                        <Link className="secondary-button" to={`/admin/drives/${driveId}/applications/${application.applicationId}`}>
                          View
                        </Link>
                        {reviewable && (
                          <>
                            <button className="secondary-button" type="button" disabled={Boolean(pendingAction)}
                              onClick={() => handleSingleAction(application, 'shortlist')}>
                              {pendingAction === `shortlist:${application.applicationId}` ? 'Shortlisting...' : 'Shortlist'}
                            </button>
                            <button className="company-delete-button" type="button" disabled={Boolean(pendingAction)}
                              onClick={() => handleSingleAction(application, 'reject')}>
                              {pendingAction === `reject:${application.applicationId}` ? 'Rejecting...' : 'Reject'}
                            </button>
                          </>
                        )}
                        {busy && <span className="sr-only" role="status">Updating application...</span>}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <div className="admin-application-cards">
            {filteredApplications.map((application) => (
              <ApplicationCard key={application.applicationId} application={application}
                driveId={driveId} selected={selectedIds.includes(application.applicationId)}
                pendingAction={pendingAction} onToggle={toggleSelection} onAction={handleSingleAction} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ApplicationCard({ application, driveId, selected, pendingAction, onToggle, onAction }) {
  const reviewable = canReviewApplication(application)
  const busy = Boolean(pendingAction)
  return (
    <article className="admin-application-card">
      <header>
        <label>
          <input type="checkbox" checked={selected} disabled={!reviewable || busy}
            onChange={() => onToggle(application.applicationId)} />
          <span className="application-card-name">{application.studentName || 'Name unavailable'}</span>
        </label>
        <span className={`status-badge application-status ${getApplicationStatusClass(application.applicationStatus)}`}>
          {formatApplicationStatus(application.applicationStatus)}
        </span>
      </header>
      <div className="admin-application-card-facts">
        <span>{application.studentEmail || 'Email unavailable'}</span>
        <span>{application.branch || 'Branch unavailable'} · Graduation {application.graduationYear ?? '—'}</span>
        <span>CGPA {application.cgpa ?? '—'} · Backlogs {application.backlogs ?? '—'}</span>
        <span>Applied {formatApplicationDate(application.appliedAt)}</span>
      </div>
      <footer className="application-row-actions">
        <Link className="secondary-button" to={`/admin/drives/${driveId}/applications/${application.applicationId}`}>View</Link>
        {reviewable && (
          <>
            <button className="secondary-button" type="button" disabled={busy}
              onClick={() => onAction(application, 'shortlist')}>
              {pendingAction === `shortlist:${application.applicationId}` ? 'Shortlisting...' : 'Shortlist'}
            </button>
            <button className="company-delete-button" type="button" disabled={busy}
              onClick={() => onAction(application, 'reject')}>
              {pendingAction === `reject:${application.applicationId}` ? 'Rejecting...' : 'Reject'}
            </button>
          </>
        )}
      </footer>
    </article>
  )
}
