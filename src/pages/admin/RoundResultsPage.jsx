import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getApiErrorMessage } from '../../services/api'
import { getDriveApplications } from '../../services/applicationAdminService'
import { getPlacementDriveById } from '../../services/placementDriveAdminService'
import { getSelectionRound } from '../../services/selectionRoundService'
import { createRoundResult, getRoundResults, updateRoundResult } from '../../services/roundResultService'
import {
  formatRoundResultStatus,
  formatRoundType,
  getRoundResultStatusClass,
  getSelectionErrorMessage,
  resolveSelectionRoundDriveId,
  roundResultStatuses,
} from '../../utils/selectionRound'

const emptyForm = { applicationId: '', result: 'PENDING', score: '', remarks: '' }

export default function RoundResultsPage() {
  const { driveId, roundId } = useParams()
  const navigate = useNavigate()
  const [round, setRound] = useState(null)
  const [driveTitle, setDriveTitle] = useState('')
  const [results, setResults] = useState([])
  const [shortlisted, setShortlisted] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const resolvedDriveId = resolveSelectionRoundDriveId(round, driveId)

  useEffect(() => {
    let active = true
    getSelectionRound(roundId)
      .then(async (roundResult) => {
        const roundDriveId = resolveSelectionRoundDriveId(roundResult, driveId)
        const [resultList, applications, drive] = await Promise.all([
          getRoundResults(roundId),
          getDriveApplications(roundDriveId),
          getPlacementDriveById(roundDriveId),
        ])
        if (!active) return
        const savedResults = Array.isArray(resultList) ? resultList : []
        const eligibleApplications = (Array.isArray(applications) ? applications : [])
          .filter((application) => application.applicationStatus === 'SHORTLISTED')
          .filter((application) => !savedResults.some((result) => result.applicationId === application.applicationId))
        setRound(roundResult)
        setResults(savedResults)
        setShortlisted(eligibleApplications)
        setDriveTitle(drive?.driveTitle || roundResult?.driveTitle || '')
        if (String(roundDriveId) !== String(driveId)) {
          navigate(`/admin/drives/${roundDriveId}/rounds/${roundId}/results`, { replace: true })
        }
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
  }, [driveId, navigate, roundId])

  const visibleResults = useMemo(
    () => results.filter((result) => !statusFilter || result.result === statusFilter),
    [results, statusFilter],
  )

  function startEdit(result) {
    setEditing(result)
    setForm({
      applicationId: String(result.applicationId),
      result: result.result || 'PENDING',
      score: result.score ?? '',
      remarks: result.remarks || '',
    })
    setError('')
    setSuccess('')
  }

  function resetForm() {
    setEditing(null)
    setForm(emptyForm)
  }

  async function refreshResults() {
    setError('')
    try {
      const resultsData = await getRoundResults(roundId)
      setResults(Array.isArray(resultsData) ? resultsData : [])
      const applications = await getDriveApplications(resolvedDriveId)
      setShortlisted((Array.isArray(applications) ? applications : [])
        .filter((application) => application.applicationStatus === 'SHORTLISTED')
        .filter((application) => !resultsData.some((result) => result.applicationId === application.applicationId)))
    } catch (requestError) {
      setError(getSelectionErrorMessage(requestError) || getApiErrorMessage(requestError))
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!form.result || (!editing && !form.applicationId)) {
      setError('Choose a shortlisted application and result status.')
      return
    }
    const score = form.score === '' ? null : Number(form.score)
    if (score !== null && (!Number.isFinite(score) || score < 0)) {
      setError('Score must be zero or greater.')
      return
    }
    if (form.remarks.length > 10000) {
      setError('Remarks must be 10,000 characters or fewer.')
      return
    }
    const payload = {
      ...(editing ? {} : { applicationId: Number(form.applicationId) }),
      result: form.result,
      score,
      remarks: form.remarks.trim() || null,
    }
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      if (editing) await updateRoundResult(editing.resultId, payload)
      else await createRoundResult(roundId, payload)
      resetForm()
      setSuccess(editing ? 'Round result updated successfully.' : 'Round result recorded successfully.')
      await refreshResults()
    } catch (requestError) {
      setError(getSelectionErrorMessage(requestError) || getApiErrorMessage(requestError))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="content-loading" role="status">Loading results...</div>

  return (
    <div className="selection-page">
      <Link className="back-link" to={`/admin/drives/${resolvedDriveId}/rounds/${roundId}`}>← Back to Round</Link>
      <header className="admin-page-heading">
        <div>
          <p className="eyebrow">{driveTitle || `Drive #${resolvedDriveId}`} · {formatRoundType(round?.roundType)}</p>
          <h1 className="page-heading">Round Results</h1>
          <p className="page-description">{round?.roundName || `Selection round #${roundId}`}</p>
        </div>
        <span className="application-count">{results.length} {results.length === 1 ? 'result' : 'results'}</span>
      </header>
      {success && <div className="success-banner" role="status">{success}</div>}
      {error && <div className="alert admin-drive-alert" role="alert">{error}</div>}

      <section className="admin-drive-detail-section result-entry-section">
        <h2>{editing ? 'Update Result' : 'Record a Result'}</h2>
        <p className="page-description">Only shortlisted applications from this drive can receive a result.</p>
        {!editing && shortlisted.length === 0 ? (
          <div className="result-no-candidates">No shortlisted applications are available without a recorded result.</div>
        ) : (
          <form className="result-entry-form" onSubmit={handleSubmit}>
            {!editing && (
              <label className="filter-label">
                <span>Shortlisted student</span>
                <select value={form.applicationId} onChange={(event) => setForm((current) => ({
                  ...current, applicationId: event.target.value,
                }))} required>
                  <option value="">Select application</option>
                  {shortlisted.map((application) => (
                    <option key={application.applicationId} value={application.applicationId}>
                      {application.studentName || 'Name unavailable'} · {application.studentEmail || `Application #${application.applicationId}`}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {editing && <div className="result-edit-student">Updating result for {editing.studentName || `Application #${editing.applicationId}`}</div>}
            <label className="filter-label">
              <span>Result status</span>
              <select value={form.result} onChange={(event) => setForm((current) => ({
                ...current, result: event.target.value,
              }))}>
                {roundResultStatuses.map((status) => (
                  <option key={status} value={status}>{formatRoundResultStatus(status)}</option>
                ))}
              </select>
            </label>
            <label className="filter-label">
              <span>Score (optional)</span>
              <input type="number" min="0" step="0.01" value={form.score}
                onChange={(event) => setForm((current) => ({ ...current, score: event.target.value }))} />
            </label>
            <label className="filter-label result-remarks-field">
              <span>Remarks (optional)</span>
              <textarea rows="2" maxLength={10000} value={form.remarks}
                onChange={(event) => setForm((current) => ({ ...current, remarks: event.target.value }))} />
            </label>
            <div className="result-form-actions">
              {editing && <button className="secondary-button" type="button" disabled={saving} onClick={resetForm}>Cancel edit</button>}
              <button className="primary-button" type="submit" disabled={saving}>
                {saving ? (editing ? 'Updating result...' : 'Saving result...') : (editing ? 'Update Result' : 'Save Result')}
              </button>
            </div>
          </form>
        )}
      </section>

      <section className="result-list-section">
        <header className="admin-page-heading result-list-heading">
          <div><h2 className="section-title">Recorded Results</h2></div>
          <div className="admin-applications-header-actions">
            <label className="filter-label">
              <span>Filter by status</span>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="">All statuses</option>
                {roundResultStatuses.map((status) => (
                  <option key={status} value={status}>{formatRoundResultStatus(status)}</option>
                ))}
              </select>
            </label>
            <button className="secondary-button" type="button" onClick={refreshResults}>Refresh</button>
          </div>
        </header>
        {results.length === 0 && !error ? (
          <div className="admin-empty-state"><strong>No results have been recorded for this round yet.</strong></div>
        ) : results.length > 0 && visibleResults.length === 0 ? (
          <div className="admin-empty-state"><strong>No results match this status.</strong></div>
        ) : (
          <div className="round-result-list">
            {visibleResults.map((result) => (
              <article className="round-result-card" key={result.resultId}>
                <div className="application-company-icon" aria-hidden="true">
                  {(result.studentName || 'S').slice(0, 1).toUpperCase()}
                </div>
                <div className="round-result-student">
                  <strong>{result.studentName || 'Student name unavailable'}</strong>
                  <span>{result.studentEmail || 'Email unavailable'}</span>
                  <small>Application #{result.applicationId}</small>
                </div>
                <div className="round-result-score">
                  <span>Score</span>
                  <strong>{result.score ?? 'Not recorded'}</strong>
                </div>
                <span className={`status-badge round-result-status ${getRoundResultStatusClass(result.result)}`}>
                  {formatRoundResultStatus(result.result)}
                </span>
                <button className="secondary-button" type="button" onClick={() => startEdit(result)}>Edit Result</button>
                {result.remarks && <p className="round-result-remarks">{result.remarks}</p>}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
