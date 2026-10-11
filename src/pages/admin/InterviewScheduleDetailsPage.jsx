import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { getApiErrorMessage } from '../../services/api'
import { getInterviewSchedule, updateInterviewScheduleStatus, cancelInterviewSchedule } from '../../services/interviewScheduleService'
import { getSelectionRound } from '../../services/selectionRoundService'
import {
  formatInterviewDateTime,
  formatInterviewMode,
  formatScheduleStatus,
  getInterviewStatusClass,
  interviewScheduleStatuses,
} from '../../utils/interviewSchedule'

export default function InterviewScheduleDetailsPage() {
  const { scheduleId } = useParams()
  const location = useLocation()
  const [schedule, setSchedule] = useState(null)
  const [round, setRound] = useState(null)
  const [selectedStatus, setSelectedStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(location.state?.success || '')

  useEffect(() => {
    let active = true
    getInterviewSchedule(scheduleId)
      .then(async (result) => {
        if (!active) return
        setSchedule(result)
        setSelectedStatus(result?.status || '')
        if (result?.roundId) {
          const roundResult = await getSelectionRound(result.roundId)
          if (active) setRound(roundResult)
        }
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
  }, [scheduleId])

  async function handleStatusUpdate() {
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const result = await updateInterviewScheduleStatus(scheduleId, selectedStatus)
      setSchedule(result)
      setSelectedStatus(result.status)
      setSuccess('Interview status updated successfully.')
    } catch (requestError) {
      setError(getApiErrorMessage(requestError))
    } finally {
      setSaving(false)
    }
  }

  async function handleCancel() {
    if (!window.confirm('Are you sure you want to cancel this interview schedule?')) return
    setCancelling(true)
    setError('')
    setSuccess('')
    try {
      const result = await cancelInterviewSchedule(scheduleId)
      setSchedule(result)
      setSelectedStatus(result.status)
      setSuccess('Interview schedule cancelled successfully.')
    } catch (requestError) {
      setError(getApiErrorMessage(requestError))
    } finally {
      setCancelling(false)
    }
  }

  if (loading) {
    return <div className="content-loading" role="status">Loading interview schedule...</div>
  }

  if (!schedule) {
    return (
      <div className="company-form-error">
        <h1 className="page-heading">Unable to load interview schedule</h1>
        <div className="alert" role="alert">{error || 'Interview schedule not found.'}</div>
        <Link className="secondary-button" to={round ? `/admin/drives/${round.driveId}/rounds/${round.id}/schedules` : '/admin/drives'}>
          Back to schedules
        </Link>
      </div>
    )
  }

  return (
    <div className="interview-page">
      <Link className="back-link" to={round ? `/admin/drives/${round.driveId}/rounds/${round.id}/schedules` : '/admin/drives'}>
        ← Back to schedules
      </Link>

      {success && <div className="success-banner" role="status">{success}</div>}
      {error && <div className="alert company-page-alert" role="alert">{error}</div>}

      <header className="admin-page-heading">
        <div>
          <p className="eyebrow">INTERVIEW DETAILS</p>
          <h1 className="page-heading">{schedule.studentName}</h1>
          <p className="page-description">{schedule.studentEmail}</p>
        </div>
        <span className={`status-badge ${getInterviewStatusClass(schedule.status)}`}>
          {formatScheduleStatus(schedule.status)}
        </span>
      </header>

      <div className="interview-detail-grid">
        <div className="interview-card detail-surface">
          <div className="interview-meta-grid">
            <div>
              <span>Round</span>
              <strong>{schedule.roundName || 'Selection round'}</strong>
            </div>
            <div>
              <span>Start time</span>
              <strong>{formatInterviewDateTime(schedule.scheduledStartTime)}</strong>
            </div>
            <div>
              <span>End time</span>
              <strong>{formatInterviewDateTime(schedule.scheduledEndTime)}</strong>
            </div>
            <div>
              <span>Mode</span>
              <strong>{formatInterviewMode(schedule.mode)}</strong>
            </div>
            <div>
              <span>Interviewer</span>
              <strong>{schedule.interviewerName || 'Not assigned'}</strong>
            </div>
            <div>
              <span>Email</span>
              <strong>{schedule.interviewerEmail || 'Not provided'}</strong>
            </div>
          </div>

          <div className="interview-detail-note">
            {schedule.mode === 'ONLINE' ? (
              <>
                <span>Meeting link</span>
                <a href={schedule.meetingLink} target="_blank" rel="noreferrer">{schedule.meetingLink || 'Not provided'}</a>
              </>
            ) : (
              <>
                <span>Venue</span>
                <strong>{schedule.venue || 'Not provided'}</strong>
              </>
            )}
          </div>

          {schedule.notes && (
            <div className="interview-detail-note">
              <span>Notes</span>
              <p>{schedule.notes}</p>
            </div>
          )}
        </div>

        <div className="interview-card detail-controls">
          <div className="company-form-field">
            <label htmlFor="schedule-status">Status</label>
            <select id="schedule-status" value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value)}>
              {interviewScheduleStatuses.map((status) => (
                <option key={status} value={status}>{formatScheduleStatus(status)}</option>
              ))}
            </select>
          </div>

          <div className="interview-action-stack">
            <button type="button" className="primary-button" onClick={handleStatusUpdate} disabled={saving || selectedStatus === schedule.status}>
              {saving ? 'Updating...' : 'Update status'}
            </button>
            <Link className="secondary-button" to={`/admin/schedules/${schedule.scheduleId}/edit`}>Reschedule</Link>
            <button type="button" className="company-delete-button" onClick={handleCancel} disabled={cancelling || schedule.status === 'CANCELLED'}>
              {cancelling ? 'Cancelling...' : 'Cancel interview'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
