import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getApiErrorMessage } from '../../services/api'
import { getCompanies } from '../../services/companyService'
import { getRoundInterviewSchedules } from '../../services/interviewScheduleService'
import { getPlacementDrives } from '../../services/placementDriveService'
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

export default function RecruiterDashboardPage() {
  const [companies, setCompanies] = useState([])
  const [drives, setDrives] = useState([])
  const [rounds, setRounds] = useState([])
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function loadDashboard() {
      try {
        const [companyList, driveList] = await Promise.all([
          getCompanies(),
          getPlacementDrives(),
        ])
        if (!active) return

        const availableCompanies = Array.isArray(companyList) ? companyList : []
        const availableDrives = Array.isArray(driveList) ? driveList : []
        setCompanies(availableCompanies)
        setDrives(availableDrives)

        const roundResults = await Promise.all(
          availableDrives.map((drive) => getSelectionRounds(drive.id)),
        )
        if (!active) return

        const flattenedRounds = roundResults.flat().filter(Boolean)
        setRounds(flattenedRounds)

        const scheduleResults = await Promise.all(
          flattenedRounds.map((round) => getRoundInterviewSchedules(round.id)),
        )
        if (!active) return

        setSchedules(scheduleResults.flat().filter(Boolean))
      } catch (requestError) {
        if (!active) return
        setError(getApiErrorMessage(requestError) || 'Unable to load recruiter dashboard data.')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadDashboard()
    return () => {
      active = false
    }
  }, [])

  const activeDrives = drives.filter((drive) => drive.status === 'OPEN' || drive.status === 'DRAFT')
  const recentDrives = drives.slice(0, 3)

  return (
    <div className="recruiter-page">
      <header className="page-header-row">
        <div>
          <p className="eyebrow">COMPANY RECRUITER</p>
          <h1 className="page-heading">Recruiter dashboard</h1>
          <p className="page-description">Operational overview for recruitment activity and scheduling.</p>
        </div>
      </header>

      {error && <div className="alert" role="alert">{error}</div>}

      {loading ? (
        <div className="content-loading" role="status">Loading recruitment overview...</div>
      ) : (
        <>
          <section className="stats-grid">
            <div className="stat-card">
              <span>Companies</span>
              <strong>{companies.length}</strong>
            </div>
            <div className="stat-card">
              <span>Placement drives</span>
              <strong>{drives.length}</strong>
            </div>
            <div className="stat-card">
              <span>Open drives</span>
              <strong>{activeDrives.length}</strong>
            </div>
            <div className="stat-card">
              <span>Interviews</span>
              <strong>{schedules.length}</strong>
            </div>
          </section>

          <div className="info-note">
            Candidate applications, selection results, final decisions, and offers are managed by the placement office. Recruiter access to those operations is not available.
          </div>

          <section className="dashboard-panels">
            <div className="dashboard-panel">
              <div className="panel-header-row">
                <h2>Recent placement drives</h2>
                <Link className="text-link" to="/recruiter/drives">View all</Link>
              </div>
              {recentDrives.length === 0 ? (
                <div className="empty-state">No placement drives found.</div>
              ) : (
                <div className="list-stack">
                  {recentDrives.map((drive) => (
                    <Link key={drive.id} className="summary-item" to={`/recruiter/drives/${drive.id}`}>
                      <div>
                        <strong>{drive.driveTitle || 'Untitled drive'}</strong>
                        <span>{drive.companyName || 'Company'} • {drive.jobRole || 'Role not specified'}</span>
                      </div>
                      <time>{formatDate(drive.driveDate)}</time>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="dashboard-panel">
              <div className="panel-header-row">
                <h2>Selection round snapshot</h2>
                <Link className="text-link" to="/recruiter/rounds">View rounds</Link>
              </div>
              {rounds.length === 0 ? (
                <div className="empty-state">No selection rounds currently available.</div>
              ) : (
                <div className="list-stack">
                  {rounds.slice(0, 4).map((round) => (
                    <div key={round.id} className="summary-item neutral-item">
                      <div>
                        <strong>{round.roundName}</strong>
                        <span>{round.driveTitle || 'Drive'} • {round.status}</span>
                      </div>
                      <time>{formatDate(round.scheduledDateTime)}</time>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  )
}
