import { useEffect, useState } from 'react'
import { getApiErrorMessage } from '../../services/api'
import { getRoundInterviewSchedules } from '../../services/interviewScheduleService'
import { getPlacementDrives } from '../../services/placementDriveService'
import { getSelectionRounds } from '../../services/selectionRoundService'

function formatDateTime(value) {
  if (!value) return 'Not scheduled'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export default function RecruiterSchedulesPage() {
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function loadSchedules() {
      try {
        const drives = await getPlacementDrives()
        if (!active) return
        const availableDrives = Array.isArray(drives) ? drives : []

        const roundResults = await Promise.all(
          availableDrives.map((drive) => getSelectionRounds(drive.id)),
        )
        if (!active) return

        const flattenedRounds = roundResults.flat().filter(Boolean)
        const scheduleResults = await Promise.all(
          flattenedRounds.map((round) => getRoundInterviewSchedules(round.id)),
        )
        if (!active) return

        const flattenedSchedules = scheduleResults
          .flat()
          .filter(Boolean)
          .map((schedule) => ({
            ...schedule,
            driveTitle: flattenedRounds.find((round) => round.id === schedule.roundId)?.driveTitle || 'Drive',
          }))

        setSchedules(flattenedSchedules)
      } catch (requestError) {
        if (!active) return
        setError(getApiErrorMessage(requestError) || 'Unable to load interview schedules.')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadSchedules()
    return () => {
      active = false
    }
  }, [])

  return (
    <div className="recruiter-page">
      <header className="page-header-row">
        <div>
          <p className="eyebrow">INTERVIEWS</p>
          <h1 className="page-heading">Interview schedules</h1>
          <p className="page-description">View interview schedules and details for recruitment rounds. Scheduling, rescheduling, cancellation, and status updates are managed by the placement office.</p>
        </div>
      </header>

      {error && <div className="alert" role="alert">{error}</div>}

      {loading ? (
        <div className="content-loading" role="status">Loading interview schedules...</div>
      ) : schedules.length === 0 ? (
        <div className="empty-state">No interview schedules are available.</div>
      ) : (
        <div className="card-grid compact-grid">
          {schedules.map((schedule) => (
            <article key={schedule.scheduleId} className="info-card">
              <div className="info-card-header">
                <div>
                  <p className="eyebrow compact">{schedule.roundName || 'Interview'}</p>
                  <h2>{schedule.studentName || 'Candidate'}</h2>
                </div>
                <span className={`status-badge status-${String(schedule.status || 'SCHEDULED').toLowerCase()}`}>
                  {schedule.status || 'SCHEDULED'}
                </span>
              </div>

              <div className="info-list">
                <div><span>Drive</span><strong>{schedule.driveTitle || 'Drive unavailable'}</strong></div>
                <div><span>Start</span><strong>{formatDateTime(schedule.scheduledStartTime)}</strong></div>
                <div><span>End</span><strong>{formatDateTime(schedule.scheduledEndTime)}</strong></div>
                <div><span>Mode</span><strong>{schedule.mode || 'Not set'}</strong></div>
                <div><span>Venue</span><strong>{schedule.venue || 'Online meeting'}</strong></div>
                <div><span>Meeting link</span><strong>{schedule.meetingLink || 'Not provided'}</strong></div>
                <div><span>Interviewer</span><strong>{schedule.interviewerName || 'Not assigned'}</strong></div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
