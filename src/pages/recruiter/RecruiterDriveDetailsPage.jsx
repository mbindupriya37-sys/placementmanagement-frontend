import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getApiErrorMessage } from '../../services/api'
import { getRoundInterviewSchedules } from '../../services/interviewScheduleService'
import { getPlacementDriveById } from '../../services/placementDriveService'
import { getSelectionRounds } from '../../services/selectionRoundService'

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

function formatDateTime(value) {
  if (!value) return 'Not scheduled'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export default function RecruiterDriveDetailsPage() {
  const { driveId } = useParams()
  const [drive, setDrive] = useState(null)
  const [rounds, setRounds] = useState([])
  const [scheduleMap, setScheduleMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function loadDriveDetails() {
      try {
        const [driveData, roundData] = await Promise.all([
          getPlacementDriveById(driveId),
          getSelectionRounds(driveId),
        ])
        if (!active) return

        setDrive(driveData)
        const availableRounds = Array.isArray(roundData) ? roundData : []
        setRounds(availableRounds)

        const scheduleResults = await Promise.all(
          availableRounds.map((round) => getRoundInterviewSchedules(round.id)),
        )
        if (!active) return

        const nextMap = {}
        availableRounds.forEach((round, index) => {
          nextMap[round.id] = Array.isArray(scheduleResults[index]) ? scheduleResults[index] : []
        })
        setScheduleMap(nextMap)
      } catch (requestError) {
        if (!active) return
        setError(getApiErrorMessage(requestError) || 'Unable to load drive details.')
      } finally {
        if (active) setLoading(false)
      }
    }

    if (driveId) {
      loadDriveDetails()
    }

    return () => {
      active = false
    }
  }, [driveId])

  if (loading) return <div className="content-loading" role="status">Loading drive details...</div>
  if (error) return <div className="alert" role="alert">{error}</div>
  if (!drive) return <div className="empty-state">Drive details are unavailable.</div>

  return (
    <div className="recruiter-page">
      <header className="page-header-row">
        <div>
          <p className="eyebrow">DRIVE</p>
          <h1 className="page-heading">{drive.driveTitle || 'Drive details'}</h1>
          <p className="page-description">{drive.companyName || 'Company'} • {drive.jobRole || 'Role not specified'}</p>
        </div>
        <Link className="secondary-button" to="/recruiter/drives">Back to drives</Link>
      </header>

      <section className="info-card detail-card">
        <div className="info-card-header">
          <div>
            <p className="eyebrow compact">Key details</p>
            <h2>{drive.driveTitle}</h2>
          </div>
          <span className={`status-badge status-${String(drive.status || 'OPEN').toLowerCase()}`}>
            {drive.status || 'OPEN'}
          </span>
        </div>

        <div className="inline-metrics wide-metrics">
          <div><span>Company</span><strong>{drive.companyName || 'Not provided'}</strong></div>
          <div><span>Location</span><strong>{drive.location || 'Not provided'}</strong></div>
          <div><span>Employment</span><strong>{drive.employmentType || 'Not provided'}</strong></div>
          <div><span>Package</span><strong>{drive.packageLpa ? `₹${drive.packageLpa} LPA` : 'Not provided'}</strong></div>
          <div><span>Min CGPA</span><strong>{drive.minimumCgpa ?? 'N/A'}</strong></div>
          <div><span>Max backlogs</span><strong>{drive.maximumBacklogs ?? 'N/A'}</strong></div>
          <div><span>Graduation year</span><strong>{drive.graduationYear ?? 'N/A'}</strong></div>
          <div><span>Drive date</span><strong>{formatDate(drive.driveDate)}</strong></div>
          <div><span>Applications open</span><strong>{formatDate(drive.applicationStartDate)} to {formatDate(drive.applicationEndDate)}</strong></div>
          <div><span>Eligible branches</span><strong>{Array.isArray(drive.eligibleBranches) && drive.eligibleBranches.length ? drive.eligibleBranches.join(', ') : 'Not specified'}</strong></div>
        </div>

        {drive.jobDescription && (
          <div className="description-block">
            <h3>Role description</h3>
            <p>{drive.jobDescription}</p>
          </div>
        )}
      </section>

      <section className="dashboard-panel">
        <div className="panel-header-row">
          <h2>Selection rounds</h2>
        </div>
        {rounds.length === 0 ? (
          <div className="empty-state">No selection rounds are available for this drive.</div>
        ) : (
          <div className="list-stack">
            {rounds.map((round) => (
              <div key={round.id} className="summary-item neutral-item">
                <div>
                  <strong>{round.roundName}</strong>
                  <span>{round.roundType} • {round.status}</span>
                </div>
                <div className="round-meta-flex">
                  <time>{formatDateTime(round.scheduledDateTime)}</time>
                  <span>{(scheduleMap[round.id] || []).length} interview{(scheduleMap[round.id] || []).length === 1 ? '' : 's'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
