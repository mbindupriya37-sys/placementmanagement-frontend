import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getApiErrorMessage } from '../../services/api'
import { createSelectionRound, getSelectionRound, updateSelectionRound } from '../../services/selectionRoundService'
import {
  formatRoundStatus,
  formatRoundType,
  roundStatuses,
  roundTypes,
  toLocalDateTimeInput,
  getSelectionErrorMessage,
} from '../../utils/selectionRound'

const initialForm = {
  roundName: '',
  roundType: '',
  roundOrder: '',
  description: '',
  scheduledDateTime: '',
  status: 'UPCOMING',
}

export default function SelectionRoundFormPage() {
  const { driveId, roundId } = useParams()
  const navigate = useNavigate()
  const editing = Boolean(roundId)
  const [form, setForm] = useState(initialForm)
  const [loading, setLoading] = useState(editing)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [fieldError, setFieldError] = useState('')

  useEffect(() => {
    if (!editing) return undefined
    let active = true
    getSelectionRound(roundId)
      .then((round) => {
        if (!active) return
        setForm({
          roundName: round.roundName || '',
          roundType: round.roundType || '',
          roundOrder: round.roundOrder ?? '',
          description: round.description || '',
          scheduledDateTime: toLocalDateTimeInput(round.scheduledDateTime),
          status: round.status || 'UPCOMING',
        })
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
  }, [editing, roundId])

  function handleChange(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
    setError('')
    setFieldError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!form.roundName.trim() || !form.roundType || !Number.isInteger(Number(form.roundOrder))
      || Number(form.roundOrder) <= 0 || !form.scheduledDateTime || !form.status) {
      setFieldError('Complete all required fields with a positive round order.')
      return
    }
    if (form.roundName.length > 200 || form.description.length > 10000) {
      setFieldError('Round name must be 200 characters or fewer and description must be 10,000 characters or fewer.')
      return
    }
    const payload = {
      roundName: form.roundName.trim(),
      roundType: form.roundType,
      roundOrder: Number(form.roundOrder),
      description: form.description.trim() || null,
      scheduledDateTime: form.scheduledDateTime,
      status: form.status,
    }
    setSaving(true)
    setError('')
    try {
      if (editing) await updateSelectionRound(roundId, payload)
      else await createSelectionRound(driveId, payload)
      navigate(editing
        ? `/admin/drives/${driveId}/rounds/${roundId}`
        : `/admin/drives/${driveId}/rounds`, {
        replace: true,
        state: { success: editing ? 'Selection round updated successfully.' : 'Selection round created successfully.' },
      })
    } catch (requestError) {
      setError(getSelectionErrorMessage(requestError) || getApiErrorMessage(requestError))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="content-loading" role="status">Loading round...</div>

  return (
    <div className="selection-form-page">
      <Link className="back-link" to={editing ? `/admin/drives/${driveId}/rounds/${roundId}` : `/admin/drives/${driveId}/rounds`}>
        ← {editing ? 'Back to round' : 'Back to Selection Rounds'}
      </Link>
      <header>
        <p className="eyebrow">SELECTION PROCESS</p>
        <h1 className="page-heading">{editing ? 'Edit Selection Round' : 'Create Selection Round'}</h1>
        <p className="page-description">Define the round details and schedule.</p>
      </header>
      {error && <div className="alert admin-drive-alert" role="alert">{error}</div>}
      <form className="admin-drive-form-card selection-form-card" onSubmit={handleSubmit} noValidate>
        <div className="company-form-grid">
          <Field label="Round name" name="roundName" required error={fieldError}>
            <input id="roundName" name="roundName" maxLength={200} value={form.roundName}
              onChange={handleChange} placeholder="Round name" />
          </Field>
          <Field label="Round type" name="roundType" required>
            <select id="roundType" name="roundType" value={form.roundType} onChange={handleChange}>
              <option value="">Select round type</option>
              {roundTypes.map((type) => <option key={type} value={type}>{formatRoundType(type)}</option>)}
            </select>
          </Field>
          <Field label="Round order" name="roundOrder" required>
            <input id="roundOrder" name="roundOrder" type="number" min="1" step="1"
              value={form.roundOrder} onChange={handleChange} placeholder="1" />
          </Field>
          <Field label="Scheduled date and time" name="scheduledDateTime" required>
            <input id="scheduledDateTime" name="scheduledDateTime" type="datetime-local" step="1"
              value={form.scheduledDateTime} onChange={handleChange} />
          </Field>
          <Field label="Status" name="status" required>
            <select id="status" name="status" value={form.status} onChange={handleChange}>
              {roundStatuses.map((status) => (
                <option key={status} value={status}>{formatRoundStatus(status)}</option>
              ))}
            </select>
          </Field>
          <Field label="Description" name="description" wide>
            <textarea id="description" name="description" rows="5" maxLength={10000}
              value={form.description} onChange={handleChange} placeholder="Optional round details" />
          </Field>
        </div>
        {fieldError && <p className="field-error" role="alert">{fieldError}</p>}
        <footer className="company-form-footer">
          <Link className="secondary-button" to={editing
            ? `/admin/drives/${driveId}/rounds/${roundId}`
            : `/admin/drives/${driveId}/rounds`}>Cancel</Link>
          <button className="primary-button" type="submit" disabled={saving}>
            {saving ? (editing ? 'Updating round...' : 'Creating round...') : (editing ? 'Save Changes' : 'Create Round')}
          </button>
        </footer>
      </form>
    </div>
  )
}

function Field({ label, name, required = false, wide = false, error, children }) {
  return (
    <div className={`company-form-field ${wide ? 'company-form-field-wide' : ''}`}>
      <label htmlFor={name}>{label}{required && <span aria-hidden="true"> *</span>}</label>
      {children}
      {error && <small className="field-error">{error}</small>}
    </div>
  )
}
