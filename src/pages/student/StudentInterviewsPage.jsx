import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getApiErrorMessage } from '../../services/api'
import { getMyApplications } from '../../services/placementDriveService'
import { getApplicationInterviewSchedules } from '../../services/interviewScheduleService'
import {
  formatInterviewDateTime,
  formatInterviewMode,
  formatScheduleStatus,
  getInterviewStatusClass,
} from '../../utils/interviewSchedule'

export default function StudentInterviewsPage() {
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    getMyApplications()
      .then(async (applications) => {
        const appList = Array.isArray(applications) ? applications : []
        const result = await Promise.all(appList.map(async (application) => {
          try {
            const records = await getApplicationInterviewSchedules(application.applicationId)
            return (Array.isArray(records) ? records : []).map((schedule) => ({
              ...schedule,
              driveTitle: application.driveTitle,
              companyName: application.companyName,
              applicationId: application.applicationId,
            }))
          } catch {
            return []
          }
        }))

        if (!active) return
        setSchedules(result.flat())
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

  if (loading) {
    return <div className="content-loading" role="status">Loading your interview schedule...</div>
  }

  if (error) {
    return (
      <div className="company-form-error">
        <h1 className="page-heading">Unable to load interviews</h1>
        <div className="alert" role="alert">{error}</div>
        <Link className="secondary-button" to="/student">Back to dashboard</Link>
      </div>
    )
  }

  return (
    <div className="interview-page">
      <header className="admin-page-heading">
        <div>
          <p className="eyebrow">YOUR INTERVIEWS</p>
          <h1 className="page-heading">My Interview Schedule</h1>
          <p className="page-description">Interview slots assigned to your applications.</p>
        </div>
      </header>

      {schedules.length === 0 ? (
        <div className="admin-empty-state">
          <span className="admin-empty-icon" aria-hidden="true">☑</span>
          <strong>You do not have any interview schedules yet.</strong>
        </div>
      ) : (
        <div className="interview-list">
          {schedules.map((schedule) => (
            <article key={schedule.scheduleId} className="interview-card">
              <div className="interview-card-heading">
                <div>
                  <p className="eyebrow">{schedule.companyName || schedule.driveTitle || 'Placement drive'}</p>
                  <h2>{schedule.roundName}</h2>
                  <p>{schedule.driveTitle}</p>
                </div>
                <span className={`status-badge ${getInterviewStatusClass(schedule.status)}`}>
                  {formatScheduleStatus(schedule.status)}
                </span>
              </div>

              <div className="interview-meta-grid">
                <div>
                  <span>Interview time</span>
                  <strong>{formatInterviewDateTime(schedule.scheduledStartTime)}</strong>
                </div>
                <div>
                  <span>Mode</span>
                  <strong>{formatInterviewMode(schedule.mode)}</strong>
                </div>
                <div>
                  <span>Interviewer</span>
                  <strong>{schedule.interviewerName || 'To be confirmed'}</strong>
                </div>
              </div>

              <div className="interview-detail-note">
                {schedule.mode === 'ONLINE' ? (
                  <>
                    <span>Meeting link</span>
                    <a href={schedule.meetingLink} target="_blank" rel="noreferrer">{schedule.meetingLink || 'Link will be shared soon'}</a>
                  </>
                ) : (
                  <>
                    <span>Venue</span>
                    <strong>{schedule.venue || 'Venue to be shared shortly'}</strong>
                  </>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
