import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getApiErrorMessage } from '../../services/api'
import { getDriveApplications } from '../../services/applicationAdminService'
import { getPlacementDrives } from '../../services/placementDriveAdminService'
import { getSelectionRounds } from '../../services/selectionRoundService'
import { getRoundInterviewSchedules } from '../../services/interviewScheduleService'
import { isInterviewRoundType } from '../../utils/selectionRound'
import {
  formatInterviewDateTime,
  formatInterviewMode,
  formatScheduleStatus,
  getInterviewStatusClass,
} from '../../utils/interviewSchedule'

function getDriveLabel(drive) {
  return `${drive.driveTitle || drive.title || `Placement drive #${drive.id}`} · ${drive.companyName || 'Company not specified'}`
}

export default function InterviewManagementPage() {
  const [drives, setDrives] = useState([])
  const [selectedDriveId, setSelectedDriveId] = useState('')
  const [applications, setApplications] = useState([])
  const [rounds, setRounds] = useState([])
  const [schedules, setSchedules] = useState([])
  const [roundSelections, setRoundSelections] = useState({})
  const [loadingDrives, setLoadingDrives] = useState(true)
  const [loadingDriveData, setLoadingDriveData] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    getPlacementDrives()
      .then((result) => {
        if (!active) return
        const availableDrives = Array.isArray(result) ? result : []
        setDrives(availableDrives)
        if (availableDrives.length > 0) setSelectedDriveId(String(availableDrives[0].id))
      })
      .catch((requestError) => {
        if (active) setError(getApiErrorMessage(requestError))
      })
      .finally(() => {
        if (active) setLoadingDrives(false)
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!selectedDriveId) {
      setApplications([])
      setRounds([])
      setSchedules([])
      return undefined
    }

    let active = true
    setLoadingDriveData(true)
    setError('')
    Promise.all([
      getDriveApplications(selectedDriveId),
      getSelectionRounds(selectedDriveId),
    ])
      .then(async ([applicationResult, roundResult]) => {
        const availableRounds = Array.isArray(roundResult) ? roundResult : []
        const interviewRounds = availableRounds.filter((round) => isInterviewRoundType(round.roundType))
        const roundSchedules = await Promise.all(
          availableRounds.map(async (round) => {
            const result = await getRoundInterviewSchedules(round.id)
            return Array.isArray(result) ? result : []
          }),
        )
        if (!active) return
        setApplications(Array.isArray(applicationResult) ? applicationResult : [])
        setRounds(interviewRounds)
        setSchedules(roundSchedules.flat())
        setRoundSelections({})
      })
      .catch((requestError) => {
        if (active) {
          setApplications([])
          setRounds([])
          setSchedules([])
          setError(getApiErrorMessage(requestError))
        }
      })
      .finally(() => {
        if (active) setLoadingDriveData(false)
      })

    return () => {
      active = false
    }
  }, [selectedDriveId])

  const shortlistedApplications = useMemo(
    () => applications.filter((application) => application.applicationStatus === 'SHORTLISTED'),
    [applications],
  )
  const applicationStatusCounts = useMemo(() => applications.reduce((counts, application) => {
    const status = application.applicationStatus || 'UNKNOWN'
    counts[status] = (counts[status] || 0) + 1
    return counts
  }, {}), [applications])
  const schedulesByApplication = useMemo(() => {
    const grouped = new Map()
    schedules.forEach((schedule) => {
      const current = grouped.get(schedule.applicationId) || []
      current.push(schedule)
      grouped.set(schedule.applicationId, current)
    })
    return grouped
  }, [schedules])

  const selectedDrive = drives.find((drive) => String(drive.id) === selectedDriveId)

  return (
    <div className="interview-page interview-management-page">
      <header className="admin-page-heading">
        <div>
          <p className="eyebrow">TPO WORKSPACE</p>
          <h1 className="page-heading">Interview Management</h1>
          <p className="page-description">Select a placement drive to schedule and manage interviews for shortlisted applications.</p>
        </div>
      </header>

      {error && <div className="alert company-page-alert" role="alert">{error}</div>}

      <section className="interview-management-toolbar interview-card">
        <div className="company-form-field">
          <label htmlFor="interviewDrive">Placement drive</label>
          {loadingDrives ? (
            <div className="content-loading" role="status">Loading placement drives...</div>
          ) : drives.length === 0 ? (
            <p className="admin-list-state">No placement drives are available.</p>
          ) : (
            <select
              id="interviewDrive"
              value={selectedDriveId}
              onChange={(event) => setSelectedDriveId(event.target.value)}
            >
              {drives.map((drive) => (
                <option key={drive.id} value={drive.id}>{getDriveLabel(drive)}</option>
              ))}
            </select>
          )}
        </div>
        {selectedDrive && (
          <div className="interview-management-summary">
            <span>Shortlisted applications</span>
            <strong>{shortlistedApplications.length}</strong>
          </div>
        )}
      </section>

      {loadingDriveData ? (
        <div className="content-loading" role="status">Loading shortlisted applications and interview schedules...</div>
      ) : !selectedDriveId ? (
        <div className="admin-empty-state">
          <strong>Select a placement drive to begin.</strong>
        </div>
      ) : rounds.length === 0 ? (
        <div className="admin-empty-state">
          <strong>No interview rounds are configured for this drive.</strong>
          <span>Configure a Technical, HR, or other interview-type selection round before scheduling interviews.</span>
          <Link className="primary-button" to={`/admin/drives/${selectedDriveId}/rounds/new`}>Create selection round</Link>
        </div>
      ) : shortlistedApplications.length === 0 ? (
        <div className="admin-empty-state">
          <strong>No shortlisted applications are available.</strong>
          <span>Only shortlisted applications can receive interview schedules. The API returned {applications.length} application{applications.length === 1 ? '' : 's'} for this drive.</span>
          {Object.keys(applicationStatusCounts).length > 0 && (
            <span className="interview-management-status-summary">
              {Object.entries(applicationStatusCounts).map(([status, count]) => `${status}: ${count}`).join(' · ')}
            </span>
          )}
          <Link className="secondary-button" to={`/admin/drives/${selectedDriveId}/applications`}>Review applications</Link>
        </div>
      ) : (
        <div className="interview-management-list">
          {shortlistedApplications.map((application) => {
            const applicationSchedules = schedulesByApplication.get(application.applicationId) || []
            const defaultRound = rounds[0]
            const selectedRoundId = roundSelections[application.applicationId] || defaultRound.id
            return (
              <article className="interview-card interview-management-card" key={application.applicationId}>
                <div className="interview-card-heading">
                  <div>
                    <p className="eyebrow">APPLICATION #{application.applicationId}</p>
                    <h2>{application.studentName}</h2>
                    <p>{application.studentEmail}</p>
                  </div>
                  <span className="status-badge application-status selected">Shortlisted</span>
                </div>

                <div className="interview-meta-grid">
                  <div><span>Branch</span><strong>{application.branch || 'Not provided'}</strong></div>
                  <div><span>CGPA</span><strong>{application.cgpa ?? 'Not provided'}</strong></div>
                  <div><span>Drive</span><strong>{selectedDrive?.driveTitle || 'Placement drive'}</strong></div>
                </div>

                {applicationSchedules.length > 0 ? (
                  <div className="interview-management-schedules">
                    <span className="interview-management-label">Existing schedules</span>
                    {applicationSchedules.map((schedule) => (
                      <div className="interview-management-schedule" key={schedule.scheduleId}>
                        <div>
                          <strong>{schedule.roundName}</strong>
                          <span>{formatInterviewDateTime(schedule.scheduledStartTime)} · {formatInterviewMode(schedule.mode)}</span>
                        </div>
                        <span className={`status-badge ${getInterviewStatusClass(schedule.status)}`}>
                          {formatScheduleStatus(schedule.status)}
                        </span>
                        <Link className="secondary-button" to={`/admin/schedules/${schedule.scheduleId}`}>Manage</Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="interview-management-empty">No interview schedule has been created for this application yet.</p>
                )}

                <div className="interview-card-actions interview-management-actions">
                  <label htmlFor={`round-${application.applicationId}`}>Schedule round</label>
                  <select
                    id={`round-${application.applicationId}`}
                    value={selectedRoundId}
                    onChange={(event) => setRoundSelections((current) => ({
                      ...current,
                      [application.applicationId]: event.target.value,
                    }))}
                  >
                    {rounds.map((round) => (
                      <option key={round.id} value={round.id}>{round.roundName} · {round.roundType}</option>
                    ))}
                  </select>
                  <Link
                    className="primary-button"
                    to={`/admin/drives/${selectedDriveId}/rounds/${selectedRoundId}/schedules/new?applicationId=${application.applicationId}`}
                  >
                    Schedule interview
                  </Link>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
