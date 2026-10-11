import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getApiErrorMessage } from '../../services/api'
import { getPlacementDrives } from '../../services/placementDriveService'

export default function AdminFinalDecisionOverviewPage() {
  const [drives, setDrives] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    getPlacementDrives()
      .then((result) => {
        if (!active) return
        setDrives(Array.isArray(result) ? result : [])
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

  return (
    <div className="offer-page">
      <header className="drive-page-heading">
        <div>
          <p className="eyebrow">FINAL DECISIONS</p>
          <h1 className="page-heading">Drive final decisions</h1>
          <p className="page-description">Choose a placement drive to review and record final outcomes.</p>
        </div>
      </header>

      {loading ? (
        <div className="content-loading" role="status">Loading drives...</div>
      ) : error ? (
        <div className="alert drive-page-alert" role="alert">{error}</div>
      ) : drives.length === 0 ? (
        <div className="drive-empty-state">
          <div className="drive-empty-icon" aria-hidden="true">◈</div>
          <strong>No placement drives are available.</strong>
          <span>Create a drive before recording final selections.</span>
        </div>
      ) : (
        <div className="offer-list">
          {drives.map((drive) => (
            <article className="offer-card" key={drive.id}>
              <div className="offer-card-header">
                <div>
                  <p className="eyebrow">DRIVE #{drive.id}</p>
                  <h2>{drive.title || 'Placement drive'}</h2>
                </div>
              </div>

              <div className="offer-meta-grid">
                <div>
                  <span>Company</span>
                  <strong>{drive.companyName || 'Company not specified'}</strong>
                </div>
                <div>
                  <span>Status</span>
                  <strong>{drive.status || 'ACTIVE'}</strong>
                </div>
                <div>
                  <span>Location</span>
                  <strong>{drive.location || 'Not specified'}</strong>
                </div>
              </div>

              <div className="offer-actions">
                <Link className="primary-button" to={`/admin/drives/${drive.id}/final-decisions`}>
                  Open final decisions
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
