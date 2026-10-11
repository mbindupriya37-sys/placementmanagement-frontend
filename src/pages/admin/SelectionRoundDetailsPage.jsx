import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { getApiErrorMessage } from '../../services/api'
import { deleteSelectionRound, getSelectionRound, updateSelectionRoundStatus } from '../../services/selectionRoundService'
import {
  formatLocalDateTime,
  formatRoundStatus,
  formatRoundType,
  getRoundStatusClass,
  getSelectionErrorMessage,
  resolveSelectionRoundDriveId,
  roundStatuses,
} from '../../utils/selectionRound'

export default function SelectionRoundDetailsPage() {
  const { driveId, roundId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [round, setRound] = useState(null)
  const [selectedStatus, setSelectedStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(location.state?.success || '')
  const resolvedDriveId = resolveSelectionRoundDriveId(round, driveId)

  useEffect(() => {
    let active = true
    getSelectionRound(roundId)
      .then((result) => {
        if (!active) return
        setRound(result)
        setSelectedStatus(result?.status || '')
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
  }, [roundId])

  async function handleStatusUpdate() {
    setUpdating(true)
    setError('')
    setSuccess('')
    try {
      const result = await updateSelectionRoundStatus(roundId, selectedStatus)
      setRound(result)
      setSelectedStatus(result?.status || selectedStatus)
      setSuccess('Selection round status updated successfully.')
    } catch (requestError) {
      setError(getSelectionErrorMessage(requestError) || getApiErrorMessage(requestError))
    } finally {
      setUpdating(false)
    }
  }

  async function handleDelete() {
    if (!window.confirm('Are you sure you want to delete this selection round?')) return
    setDeleting(true)
    setError('')
    try {
      await deleteSelectionRound(roundId)
      navigate(`/admin/drives/${resolvedDriveId}/rounds`, {
        replace: true,
        state: { success: 'Selection round deleted successfully.' },
      })
    } catch (requestError) {
      setError(getSelectionErrorMessage(requestError) || getApiErrorMessage(requestError))
      setDeleting(false)
    }
  }

  if (loading) return <div className="content-loading" role="status">Loading round...</div>
  if (!round) {
    return (
      <div className="company-form-error">
        <h1 className="page-heading">Unable to load selection round</h1>
        <div className="alert" role="alert">{error || 'Selection round not found.'}</div>
        <Link className="secondary-button" to={`/admin/drives/${resolvedDriveId}/rounds`}>Back to Selection Rounds</Link>
      </div>
    )
  }

  return (
    <div className="selection-page">
      <Link className="back-link" to={`/admin/drives/${resolvedDriveId}/rounds`}>← Back to Selection Rounds</Link>
      {success && <div className="success-banner" role="status">{success}</div>}
      {error && <div className="alert admin-drive-alert" role="alert">{error}</div>}
      <header className="selection-detail-header">
        <div className="round-order-mark">#{round.roundOrder}</div>
        <div className="selection-detail-title">
          <p className="eyebrow">{round.driveTitle || `Placement drive #${resolvedDriveId}`} · {formatRoundType(round.roundType)}</p>
          <h1 className="page-heading">{round.roundName}</h1>
          <p className="page-description">{formatLocalDateTime(round.scheduledDateTime)}</p>
        </div>
        <span className={`status-badge selection-round-status ${getRoundStatusClass(round.status)}`}>
          {formatRoundStatus(round.status)}
        </span>
      </header>
      <section className="admin-drive-detail-section selection-description-section">
        <h2>Round Information</h2>
        <div className="company-details-grid">
          <Detail label="Round name" value={round.roundName} />
          <Detail label="Round type" value={formatRoundType(round.roundType)} />
          <Detail label="Round order" value={round.roundOrder} />
          <Detail label="Scheduled date and time" value={formatLocalDateTime(round.scheduledDateTime)} />
          <Detail label="Description" value={round.description || 'Not specified'} wide />
          <Detail label="Placement drive" value={round.driveTitle || `Drive #${round.placementDriveId}`} wide />
        </div>
      </section>
      <section className="admin-drive-status-panel">
        <div>
          <p className="eyebrow">ROUND STATUS</p>
          <h2>Update status</h2>
          <p>Permitted status transitions are validated by the backend.</p>
        </div>
        <div className="admin-drive-status-control">
          <label className="filter-label" htmlFor="selection-round-status">
            <span>Status</span>
            <select id="selection-round-status" value={selectedStatus}
              onChange={(event) => setSelectedStatus(event.target.value)}>
              {roundStatuses.map((status) => (
                <option key={status} value={status}>{formatRoundStatus(status)}</option>
              ))}
            </select>
          </label>
          <button className="primary-button" type="button" disabled={updating || selectedStatus === round.status}
            onClick={handleStatusUpdate}>
            {updating ? 'Updating...' : 'Update Status'}
          </button>
        </div>
      </section>
      <footer className="selection-detail-actions">
        <Link className="secondary-button" to={`/admin/drives/${resolvedDriveId}/rounds/${roundId}/edit`}>Edit Round</Link>
        <Link className="secondary-button" to={`/admin/drives/${resolvedDriveId}/rounds/${roundId}/schedules`}>View Schedules</Link>
        <Link className="primary-button" to={`/admin/drives/${resolvedDriveId}/rounds/${roundId}/results`}>View Results</Link>
        <button className="company-delete-button" type="button" disabled={deleting} onClick={handleDelete}>
          {deleting ? 'Deleting...' : 'Delete Round'}
        </button>
      </footer>
    </div>
  )
}

function Detail({ label, value, wide = false }) {
  return (
    <div className={`company-info-item ${wide ? 'company-info-wide' : ''}`}>
      <span>{label}</span>
      <strong>{value ?? 'Not specified'}</strong>
    </div>
  )
}
