import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { getApiErrorMessage } from '../../services/api'
import { getPlacementDriveById } from '../../services/placementDriveAdminService'
import { deleteSelectionRound, getSelectionRounds } from '../../services/selectionRoundService'
import {
  formatLocalDateTime,
  formatRoundStatus,
  formatRoundType,
  getRoundStatusClass,
  getSelectionErrorMessage,
  resolveSelectionRoundDriveId,
} from '../../utils/selectionRound'

export default function SelectionRoundsPage() {
  const { driveId } = useParams()
  const location = useLocation()
  const [drive, setDrive] = useState(null)
  const [rounds, setRounds] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(location.state?.success || '')
  const [deletingId, setDeletingId] = useState(null)

  async function refreshRounds() {
    setError('')
    try {
      const result = await getSelectionRounds(driveId)
      setRounds(Array.isArray(result) ? result : [])
    } catch (requestError) {
      setError(getSelectionErrorMessage(requestError) || getApiErrorMessage(requestError))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    Promise.all([getPlacementDriveById(driveId), getSelectionRounds(driveId)])
      .then(([driveResult, roundsResult]) => {
        if (!active) return
        setDrive(driveResult)
        setRounds(Array.isArray(roundsResult) ? roundsResult : [])
      })
      .catch((requestError) => {
        if (active) setError(getSelectionErrorMessage(requestError) || getApiErrorMessage(requestError))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [driveId])

  async function handleDelete(round) {
    if (!window.confirm('Are you sure you want to delete this selection round?')) return
    setDeletingId(round.id)
    setError('')
    setSuccess('')
    try {
      await deleteSelectionRound(round.id)
      setRounds((current) => current.filter((item) => item.id !== round.id))
      setSuccess('Selection round deleted successfully.')
    } catch (requestError) {
      setError(getSelectionErrorMessage(requestError) || getApiErrorMessage(requestError))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="selection-page">
      <Link className="back-link" to={`/admin/drives/${driveId}`}>← Back to Placement Drive</Link>
      <header className="admin-page-heading">
        <div>
          <p className="eyebrow">SELECTION PROCESS</p>
          <h1 className="page-heading">Selection Rounds</h1>
          <p className="page-description">{drive?.driveTitle || `Placement drive #${driveId}`}</p>
        </div>
        <Link className="primary-button" to={`/admin/drives/${driveId}/rounds/new`}>+ Create Round</Link>
      </header>
      {success && <div className="success-banner" role="status">{success}</div>}
      {error && <div className="alert admin-drive-alert" role="alert">{error}</div>}
      {loading ? (
        <div className="content-loading" role="status">Loading rounds...</div>
      ) : error && rounds.length === 0 ? (
        <div className="admin-list-state admin-error-state">Unable to load selection rounds.</div>
      ) : rounds.length === 0 ? (
        <div className="admin-empty-state">
          <span className="admin-empty-icon" aria-hidden="true">◷</span>
          <strong>No selection rounds have been created for this drive yet.</strong>
          <Link className="primary-button" to={`/admin/drives/${driveId}/rounds/new`}>Create Round</Link>
        </div>
      ) : (
        <div className="selection-round-list">
          {rounds.map((round) => (
            <article className="selection-round-card" key={round.id}>
              <div className="round-order-mark">#{round.roundOrder}</div>
              <div className="selection-round-main">
                <p className="eyebrow">{formatRoundType(round.roundType)}</p>
                <h2>{round.roundName}</h2>
                <p>{formatLocalDateTime(round.scheduledDateTime)}</p>
              </div>
              <span className={`status-badge selection-round-status ${getRoundStatusClass(round.status)}`}>
                {formatRoundStatus(round.status)}
              </span>
              <div className="selection-round-actions">
                <Link className="secondary-button" to={`/admin/drives/${resolveSelectionRoundDriveId(round, driveId)}/rounds/${round.id}`}>View</Link>
                <Link className="secondary-button" to={`/admin/drives/${resolveSelectionRoundDriveId(round, driveId)}/rounds/${round.id}/edit`}>Edit</Link>
                <Link className="secondary-button" to={`/admin/drives/${resolveSelectionRoundDriveId(round, driveId)}/rounds/${round.id}/results`}>View Results</Link>
                <button className="company-delete-button" type="button" disabled={deletingId === round.id}
                  onClick={() => handleDelete(round)}>
                  {deletingId === round.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
      {!loading && rounds.length > 0 && (
        <button className="secondary-button selection-refresh" type="button" onClick={refreshRounds}>
          Refresh rounds
        </button>
      )}
    </div>
  )
}
