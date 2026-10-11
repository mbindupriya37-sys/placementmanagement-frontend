import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { getApiErrorMessage } from '../../services/api'
import { getDriveApplications } from '../../services/applicationAdminService'
import {
  createInterviewSchedule,
  getInterviewSchedule,
  updateInterviewSchedule,
} from '../../services/interviewScheduleService'
import { getSelectionRound } from '../../services/selectionRoundService'
import { toLocalDateTimeInput } from '../../utils/interviewSchedule'

const blankSchedule = {
  applicationId: '',
  scheduledStartTime: '',
  scheduledEndTime: '',
  mode: 'ONLINE',
  meetingLink: '',
  venue: '',
  interviewerName: '',
  interviewerEmail: '',
  notes: '',
}

export default function InterviewScheduleFormPage() {
  const { driveId, roundId, scheduleId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const isEditing = Boolean(scheduleId)
  const [roundInfo, setRoundInfo] = useState(null)
  const [applications, setApplications] = useState([])
  const [values, setValues] = useState(blankSchedule)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function loadForCreate() {
      try {
        const [selectionRound, applicationList] = await Promise.all([
          getSelectionRound(roundId),
          getDriveApplications(driveId),
        ])
        if (!active) return
        setRoundInfo(selectionRound)
        setApplications(Array.isArray(applicationList) ? applicationList : [])
        setValues((current) => ({
          ...current,
          applicationId: new URLSearchParams(location.search).get('applicationId') || current.applicationId,
        }))
      } catch (requestError) {
        if (active) setError(getApiErrorMessage(requestError))
      } finally {
        if (active) setLoading(false)
      }
    }

    if (!isEditing) {
      loadForCreate()
      return () => {
        active = false
      }
    }

    Promise.all([
      getInterviewSchedule(scheduleId),
      getSelectionRound(roundId),
    ])
      .then(([scheduleResult, selectionRound]) => {
        if (!active) return
        setRoundInfo(selectionRound)
        setValues({
          applicationId: scheduleResult?.applicationId || '',
          scheduledStartTime: toLocalDateTimeInput(scheduleResult?.scheduledStartTime),
          scheduledEndTime: toLocalDateTimeInput(scheduleResult?.scheduledEndTime),
          mode: scheduleResult?.mode || 'ONLINE',
          meetingLink: scheduleResult?.meetingLink || '',
          venue: scheduleResult?.venue || '',
          interviewerName: scheduleResult?.interviewerName || '',
          interviewerEmail: scheduleResult?.interviewerEmail || '',
          notes: scheduleResult?.notes || '',
        })
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
  }, [driveId, isEditing, location.search, roundId, scheduleId])

  function handleChange(event) {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
    setError('')
  }

  function validate() {
    const errors = []
    if (!values.applicationId) errors.push('Application is required.')
    if (!values.scheduledStartTime) errors.push('Interview start time is required.')
    if (!values.scheduledEndTime) errors.push('Interview end time is required.')
    if (values.scheduledStartTime && values.scheduledEndTime) {
      const start = new Date(values.scheduledStartTime)
      const end = new Date(values.scheduledEndTime)
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start >= end) {
        errors.push('The interview must start before it ends.')
      }
    }
    if (values.mode === 'ONLINE' && !values.meetingLink.trim()) {
      errors.push('Meeting link is required for online interviews.')
    }
    if (values.mode === 'OFFLINE' && !values.venue.trim()) {
      errors.push('Venue is required for offline interviews.')
    }
    if (values.interviewerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.interviewerEmail.trim())) {
      errors.push('Interviewer email must be valid.')
    }
    return errors
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const validationErrors = validate()
    if (validationErrors.length > 0) {
      setError(validationErrors.join(' '))
      return
    }

    const payload = {
      applicationId: Number(values.applicationId),
      scheduledStartTime: values.scheduledStartTime,
      scheduledEndTime: values.scheduledEndTime,
      mode: values.mode,
      meetingLink: values.mode === 'ONLINE' ? values.meetingLink.trim() : '',
      venue: values.mode === 'OFFLINE' ? values.venue.trim() : '',
      interviewerName: values.interviewerName.trim(),
      interviewerEmail: values.interviewerEmail.trim(),
      notes: values.notes.trim(),
    }

    setSaving(true)
    setError('')

    try {
      if (isEditing) {
        await updateInterviewSchedule(scheduleId, payload)
        navigate(`/admin/schedules/${scheduleId}`, { replace: true, state: { success: 'Interview rescheduled successfully.' } })
      } else {
        const result = await createInterviewSchedule(roundId, payload)
        navigate(`/admin/schedules/${result.scheduleId}`, { replace: true, state: { success: 'Interview scheduled successfully.' } })
      }
    } catch (requestError) {
      setError(getApiErrorMessage(requestError))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="content-loading" role="status">Loading interview schedule form...</div>
  }

  if (error && !roundInfo && !isEditing) {
    return (
      <div className="company-form-error">
        <h1 className="page-heading">Unable to load round</h1>
        <div className="alert" role="alert">{error}</div>
        <Link className="secondary-button" to={`/admin/drives/${driveId}/rounds/${roundId}/schedules`}>Back to schedules</Link>
      </div>
    )
  }

  return (
    <div className="company-form-page">
      <Link className="back-link" to={isEditing ? `/admin/schedules/${scheduleId}` : `/admin/drives/${driveId}/rounds/${roundId}/schedules`}>
        ← {isEditing ? 'Back to schedule' : 'Back to schedules'}
      </Link>

      <header className="admin-page-heading company-form-heading">
        <div>
          <p className="eyebrow">INTERVIEW SCHEDULING</p>
          <h1 className="page-heading">{isEditing ? 'Reschedule Interview' : 'Create Interview Schedule'}</h1>
          <p className="page-description">{roundInfo?.roundName || 'Selection round'}</p>
        </div>
      </header>

      {error && <div className="alert company-page-alert" role="alert">{error}</div>}

      <form className="company-form-card" onSubmit={handleSubmit} noValidate>
        <section className="company-form-section">
          <header>
            <h2>Interview details</h2>
            <p>Choose the shortlisted application and define the interview slot.</p>
          </header>

          <div className="company-form-grid">
            <div className="company-form-field">
              <label htmlFor="applicationId">Application</label>
              {applications.length > 0 ? (
                <select id="applicationId" name="applicationId" value={values.applicationId} onChange={handleChange}>
                  <option value="">Select a shortlisted application</option>
                  {applications
                    .filter((application) => application.applicationStatus === 'SHORTLISTED')
                    .map((application) => (
                      <option key={application.applicationId} value={application.applicationId}>
                        {application.studentName} ({application.applicationId})
                      </option>
                    ))}
                </select>
              ) : (
                <input
                  id="applicationId"
                  name="applicationId"
                  type="number"
                  min="1"
                  placeholder="Application ID"
                  value={values.applicationId}
                  onChange={handleChange}
                />
              )}
            </div>

            <div className="company-form-field">
              <label htmlFor="mode">Interview mode</label>
              <select id="mode" name="mode" value={values.mode} onChange={handleChange}>
                <option value="ONLINE">ONLINE</option>
                <option value="OFFLINE">OFFLINE</option>
              </select>
            </div>

            <div className="company-form-field">
              <label htmlFor="scheduledStartTime">Start time</label>
              <input
                id="scheduledStartTime"
                name="scheduledStartTime"
                type="datetime-local"
                step="60"
                value={values.scheduledStartTime}
                onChange={handleChange}
              />
            </div>

            <div className="company-form-field">
              <label htmlFor="scheduledEndTime">End time</label>
              <input
                id="scheduledEndTime"
                name="scheduledEndTime"
                type="datetime-local"
                step="60"
                value={values.scheduledEndTime}
                onChange={handleChange}
              />
            </div>

            {values.mode === 'ONLINE' && (
              <div className="company-form-field company-form-field-wide">
                <label htmlFor="meetingLink">Meeting link</label>
                <input
                  id="meetingLink"
                  name="meetingLink"
                  type="url"
                  placeholder="https://meet.google.com/..."
                  value={values.meetingLink}
                  onChange={handleChange}
                />
              </div>
            )}

            {values.mode === 'OFFLINE' && (
              <div className="company-form-field company-form-field-wide">
                <label htmlFor="venue">Venue</label>
                <input
                  id="venue"
                  name="venue"
                  type="text"
                  placeholder="Conference room or campus venue"
                  value={values.venue}
                  onChange={handleChange}
                />
              </div>
            )}

            <div className="company-form-field">
              <label htmlFor="interviewerName">Interviewer name</label>
              <input
                id="interviewerName"
                name="interviewerName"
                type="text"
                value={values.interviewerName}
                onChange={handleChange}
                placeholder="e.g. Aisha Verma"
              />
            </div>

            <div className="company-form-field">
              <label htmlFor="interviewerEmail">Interviewer email</label>
              <input
                id="interviewerEmail"
                name="interviewerEmail"
                type="email"
                value={values.interviewerEmail}
                onChange={handleChange}
                placeholder="interviewer@company.com"
              />
            </div>

            <div className="company-form-field company-form-field-wide">
              <label htmlFor="notes">Notes</label>
              <textarea
                id="notes"
                name="notes"
                rows="4"
                value={values.notes}
                onChange={handleChange}
                placeholder="Optional interview notes or instructions"
              />
            </div>
          </div>
        </section>

        <div className="company-form-footer">
          <button type="submit" className="primary-button" disabled={saving}>
            {saving ? (isEditing ? 'Updating...' : 'Scheduling...') : (isEditing ? 'Update schedule' : 'Create schedule')}
          </button>
          <Link className="secondary-button" to={isEditing ? `/admin/schedules/${scheduleId}` : `/admin/drives/${driveId}/rounds/${roundId}/schedules`}>
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
