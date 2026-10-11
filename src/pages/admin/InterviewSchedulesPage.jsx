import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getApiErrorMessage } from '../../services/api'
import { getSelectionRound } from '../../services/selectionRoundService'
import { getRoundInterviewSchedules } from '../../services/interviewScheduleService'
import {
  formatInterviewDateTime,
  formatInterviewMode,
  formatScheduleStatus,
  getInterviewStatusClass,
} from '../../utils/interviewSchedule'

export default function InterviewSchedulesPage() {
  const { driveId, roundId } = useParams()
  const [round, setRound] = useState(null)
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    Promise.all([
      getSelectionRound(roundId),
      getRoundInterviewSchedules(roundId),
    ])
      .then(([roundResult, scheduleResult]) => {
        if (!active) return
        setRound(roundResult)
        setSchedules(Array.isArray(scheduleResult) ? scheduleResult : [])
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
  }, [roundId])

  if (loading) {
    return <div className="content-loading" role="status">Loading interview schedules...</div>
  }

  if (error && !round) {
    return (
      <div className="company-form-error">
        <h1 className="page-heading">Unable to load interview schedules</h1>
        <div className="alert" role="alert">{error}</div>
        <Link className="secondary-button" to={`/admin/drives/${driveId}/rounds`}>Back to rounds</Link>
      </div>
    )
  }

  return (
    <div className="interview-page">
      <Link className="back-link" to={`/admin/drives/${driveId}/rounds/${roundId}`}>← Back to selection round</Link>
      <header className="admin-page-heading">
        <div>
          <p className="eyebrow">INTERVIEW MANAGEMENT</p>
          <h1 className="page-heading">Interview Schedules</h1>
          <p className="page-description">{round?.roundName || 'Selection round'} · {round?.driveTitle || 'Placement drive'}</p>
        </div>
        <Link className="primary-button" to={`/admin/drives/${driveId}/rounds/${roundId}/schedules/new`}>+ Schedule Interview</Link>
      </header>

      {error && <div className="alert company-page-alert" role="alert">{error}</div>}

      {schedules.length === 0 ? (
        <div className="admin-empty-state">
          <span className="admin-empty-icon" aria-hidden="true">◔</span>
          <strong>No interview schedules have been created for this round yet.</strong>
          <Link className="primary-button" to={`/admin/drives/${driveId}/rounds/${roundId}/schedules/new`}>Create schedule</Link>
        </div>
      ) : (
        <div className="interview-list">
          {schedules.map((schedule) => (
            <article key={schedule.scheduleId} className="interview-card">
              <div className="interview-card-heading">
                <div>
                  <p className="eyebrow">Candidate</p>
                  <h2>{schedule.studentName || 'Candidate'}</h2>
                  <p>{schedule.studentEmail || 'Email not available'}</p>
                </div>
                <span className={`status-badge ${getInterviewStatusClass(schedule.status)}`}>
                  {formatScheduleStatus(schedule.status)}
                </span>
              </div>

              <div className="interview-meta-grid">
                <div>
                  <span>Scheduled</span>
                  <strong>{formatInterviewDateTime(schedule.scheduledStartTime)}</strong>
                </div>
                <div>
                  <span>Mode</span>
                  <strong>{formatInterviewMode(schedule.mode)}</strong>
                </div>
                <div>
                  <span>Interviewer</span>
                  <strong>{schedule.interviewerName || 'Pending assignment'}</strong>
                </div>
              </div>

              <div className="interview-detail-note">
                {schedule.mode === 'ONLINE' ? (
                  <>
                    <span>Meeting link</span>
                    <a href={schedule.meetingLink} target="_blank" rel="noreferrer">{schedule.meetingLink || 'No link provided'}</a>
                  </>
                ) : (
                  <>
                    <span>Venue</span>
                    <strong>{schedule.venue || 'Not specified'}</strong>
                  </>
                )}
              </div>

              <div className="interview-card-actions">
                <Link className="secondary-button" to={`/admin/schedules/${schedule.scheduleId}`}>View details</Link>
                <Link className="secondary-button" to={`/admin/schedules/${schedule.scheduleId}/edit`}>Reschedule</Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
