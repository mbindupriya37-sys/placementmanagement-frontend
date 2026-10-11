import { useEffect, useState } from 'react'
import { getApiErrorMessage } from '../../services/api'
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

export default function RecruiterRoundsPage() {
  const [rounds, setRounds] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function loadRounds() {
      try {
        const drives = await getPlacementDrives()
        if (!active) return
        const availableDrives = Array.isArray(drives) ? drives : []

        const roundResults = await Promise.all(
          availableDrives.map((drive) => getSelectionRounds(drive.id)),
        )
        if (!active) return

        const flattenedRounds = roundResults
          .flat()
          .filter(Boolean)
          .map((round) => ({
            ...round,
            companyName: availableDrives.find((drive) => drive.id === round.placementDriveId)?.companyName || 'Company',
          }))

        setRounds(flattenedRounds)
      } catch (requestError) {
        if (!active) return
        setError(getApiErrorMessage(requestError) || 'Unable to load selection rounds.')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadRounds()
    return () => {
      active = false
    }
  }, [])

  return (
    <div className="recruiter-page">
      <header className="page-header-row">
        <div>
          <p className="eyebrow">ROUNDS</p>
          <h1 className="page-heading">Selection rounds</h1>
          <p className="page-description">Review the recruitment stages for placement drives. Round creation, status changes, and candidate results are managed by the placement office.</p>
        </div>
      </header>

      {error && <div className="alert" role="alert">{error}</div>}

      {loading ? (
        <div className="content-loading" role="status">Loading selection rounds...</div>
      ) : rounds.length === 0 ? (
        <div className="empty-state">No selection rounds are available.</div>
      ) : (
        <div className="card-grid compact-grid">
          {rounds.map((round) => (
            <article key={round.id} className="info-card">
              <div className="info-card-header">
                <div>
                  <p className="eyebrow compact">{round.companyName}</p>
                  <h2>{round.roundName}</h2>
                </div>
                <span className={`status-badge status-${String(round.status || 'UPCOMING').toLowerCase()}`}>
                  {round.status || 'UPCOMING'}
                </span>
              </div>

              <div className="info-list">
                <div><span>Drive</span><strong>{round.driveTitle || 'Drive unavailable'}</strong></div>
                <div><span>Round type</span><strong>{round.roundType || 'Not specified'}</strong></div>
                <div><span>Schedule</span><strong>{formatDateTime(round.scheduledDateTime)}</strong></div>
                <div><span>Order</span><strong>{round.roundOrder ?? 'N/A'}</strong></div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
