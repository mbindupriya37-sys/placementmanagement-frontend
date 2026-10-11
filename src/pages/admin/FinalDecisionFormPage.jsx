import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getApiErrorMessage } from '../../services/api'
import { decideApplication, getApplicationFinalDecision } from '../../services/finalDecisionService'
import { formatDateTime, formatFinalDecision, getFinalDecisionClass } from '../../utils/finalDecision'

const blankDecision = {
  decision: 'SELECTED',
  remarks: '',
}

export default function FinalDecisionFormPage() {
  const { driveId, applicationId } = useParams()
  const [values, setValues] = useState(blankDecision)
  const [existingDecision, setExistingDecision] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadExistingDecision = useCallback(async () => {
    try {
      const result = await getApplicationFinalDecision(applicationId)
      if (result) setExistingDecision(result)
      return result
    } catch (requestError) {
      if (requestError.response?.status === 404) return null
      throw requestError
    }
  }, [applicationId])

  useEffect(() => {
    let active = true
    loadExistingDecision()
      .then((result) => {
        if (!active) return
        if (result) {
          setValues({
            decision: result.decision || 'SELECTED',
            remarks: result.remarks || '',
          })
        }
      })
      .catch((requestError) => {
        if (active) {
          setValues(blankDecision)
          setError(getApiErrorMessage(requestError))
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [loadExistingDecision])

  function handleChange(event) {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
    setError('')
    setSuccess('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const result = await decideApplication(applicationId, values)
      setExistingDecision(result)
      setSuccess('Final decision recorded successfully.')
    } catch (requestError) {
      const existing = await loadExistingDecision().catch(() => null)
      if (existing) setError('')
      else setError(getApiErrorMessage(requestError))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="content-loading" role="status">Loading final decision form...</div>

  return (
    <div className="company-form-page">
      <Link className="back-link" to={`/admin/drives/${driveId}/final-decisions`}>← Back to final decisions</Link>

      <header className="admin-page-heading company-form-heading">
        <div>
          <p className="eyebrow">FINAL DECISION</p>
          <h1 className="page-heading">Application final outcome</h1>
          <p className="page-description">Set the result for application #{applicationId}.</p>
        </div>
      </header>

      {success && <div className="success-banner" role="status">{success}</div>}
      {error && <div className="alert company-page-alert" role="alert">{error}</div>}

      {existingDecision ? (
        <section className="company-form-card final-decision-readonly" aria-labelledby="existing-decision-heading">
          <div className="final-decision-recorded-banner" role="status">
            A final decision has already been recorded for this application.
          </div>
          <div className="company-form-heading">
            <p className="eyebrow">SAVED FINAL DECISION</p>
            <h2 id="existing-decision-heading">Decision is read-only</h2>
            <p className="page-description">This application already has its final outcome. No duplicate decision can be created.</p>
          </div>
          <div className="company-details-grid">
            <div className="company-info-item">
              <span>Decision</span>
              <strong className={`status-badge ${getFinalDecisionClass(existingDecision.decision)}`}>
                {formatFinalDecision(existingDecision.decision)}
              </strong>
            </div>
            <div className="company-info-item">
              <span>Decided</span>
              <strong>{formatDateTime(existingDecision.decidedAt)}</strong>
            </div>
            <div className="company-info-item company-info-wide">
              <span>Remarks</span>
              <strong>{existingDecision.remarks || 'No remarks provided.'}</strong>
            </div>
          </div>
          <div className="company-form-footer">
            <Link className="secondary-button" to={`/admin/drives/${driveId}/final-decisions`}>
              Back to final decisions
            </Link>
            {existingDecision.decision === 'SELECTED' && (
              <Link className="primary-button" to={`/admin/drives/${driveId}/applications/${applicationId}/offer`}>
                Create offer
              </Link>
            )}
          </div>
        </section>
      ) : (
        <form className="company-form-card" onSubmit={handleSubmit} noValidate>
          <div className="company-form-grid">
            <div className="company-form-field">
              <label htmlFor="decision">Decision</label>
              <select id="decision" name="decision" value={values.decision} onChange={handleChange}>
                <option value="SELECTED">SELECTED</option>
                <option value="REJECTED">REJECTED</option>
              </select>
            </div>

            <div className="company-form-field company-form-field-wide">
              <label htmlFor="remarks">Remarks</label>
              <textarea
                id="remarks"
                name="remarks"
                rows="5"
                value={values.remarks}
                onChange={handleChange}
                placeholder="Optional final review notes"
              />
            </div>
          </div>

          <div className="company-form-footer">
            <button type="submit" className="primary-button" disabled={saving}>
              {saving ? 'Saving...' : 'Save decision'}
            </button>
            <Link className="secondary-button" to={`/admin/drives/${driveId}/applications`}>
              Back to drive applications
            </Link>
          </div>
        </form>
      )}
    </div>
  )
}
