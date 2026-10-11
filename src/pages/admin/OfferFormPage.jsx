import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getApiErrorMessage } from '../../services/api'
import { createOffer, getOffer, updateOffer } from '../../services/offerService'

const blankOffer = {
  offerLetterNumber: '',
  jobTitle: '',
  employmentType: 'FULL_TIME',
  location: '',
  annualPackageLpa: '',
  joiningDate: '',
  expiryDate: '',
  notes: '',
}

export default function OfferFormPage() {
  const { driveId, applicationId, offerId } = useParams()
  const navigate = useNavigate()
  const isEditing = Boolean(offerId)
  const [values, setValues] = useState(blankOffer)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isEditing) {
      setLoading(false)
      return
    }

    let active = true
    getOffer(offerId)
      .then((result) => {
        if (!active) return
        setValues({
          offerLetterNumber: result?.offerLetterNumber || '',
          jobTitle: result?.jobTitle || '',
          employmentType: result?.employmentType || 'FULL_TIME',
          location: result?.location || '',
          annualPackageLpa: result?.annualPackageLpa || '',
          joiningDate: result?.joiningDate || '',
          expiryDate: result?.expiryDate || '',
          notes: result?.notes || '',
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
  }, [isEditing, offerId])

  function handleChange(event) {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
    setError('')
  }

  function validate() {
    const errors = []
    if (!values.offerLetterNumber.trim()) errors.push('Offer letter number is required.')
    if (!values.jobTitle.trim()) errors.push('Job title is required.')
    if (!values.annualPackageLpa) errors.push('Annual package is required.')
    if (!values.joiningDate) errors.push('Joining date is required.')
    if (!values.expiryDate) errors.push('Expiry date is required.')
    if (Number(values.annualPackageLpa) < 0) errors.push('Annual package must be zero or greater.')
    if (values.joiningDate && values.expiryDate && new Date(values.joiningDate) > new Date(values.expiryDate)) {
      errors.push('Joining date must be before or equal to expiry date.')
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
      offerLetterNumber: values.offerLetterNumber.trim(),
      jobTitle: values.jobTitle.trim(),
      employmentType: values.employmentType,
      location: values.location.trim(),
      annualPackageLpa: Number(values.annualPackageLpa),
      joiningDate: values.joiningDate,
      expiryDate: values.expiryDate,
      notes: values.notes.trim(),
    }

    setSaving(true)
    setError('')

    try {
      let result
      if (isEditing) {
        result = await updateOffer(offerId, payload)
        navigate(`/admin/offers/${offerId}`, { replace: true, state: { success: 'Offer updated successfully.' } })
      } else {
        result = await createOffer(applicationId, payload)
        navigate(`/admin/offers/${result.offerId}`, { replace: true, state: { success: 'Offer created successfully.' } })
      }
    } catch (requestError) {
      setError(getApiErrorMessage(requestError))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="content-loading" role="status">Loading offer form...</div>

  return (
    <div className="company-form-page">
      <Link className="back-link" to={isEditing ? `/admin/offers/${offerId}` : `/admin/drives/${driveId}/offers`}>
        ← {isEditing ? 'Back to offer' : 'Back to offers'}
      </Link>

      <header className="admin-page-heading company-form-heading">
        <div>
          <p className="eyebrow">OFFER</p>
          <h1 className="page-heading">{isEditing ? 'Edit offer' : 'Create offer'}</h1>
          <p className="page-description">Set the employment details for the selected candidate.</p>
        </div>
      </header>

      {error && <div className="alert company-page-alert" role="alert">{error}</div>}

      <form className="company-form-card" onSubmit={handleSubmit} noValidate>
        <div className="company-form-grid">
          <div className="company-form-field">
            <label htmlFor="offerLetterNumber">Offer letter number</label>
            <input id="offerLetterNumber" name="offerLetterNumber" value={values.offerLetterNumber} onChange={handleChange} placeholder="OFF-2026-001" />
          </div>

          <div className="company-form-field">
            <label htmlFor="jobTitle">Job title</label>
            <input id="jobTitle" name="jobTitle" value={values.jobTitle} onChange={handleChange} placeholder="Software Engineer" />
          </div>

          <div className="company-form-field">
            <label htmlFor="employmentType">Employment type</label>
            <select id="employmentType" name="employmentType" value={values.employmentType} onChange={handleChange}>
              <option value="FULL_TIME">FULL_TIME</option>
              <option value="INTERNSHIP">INTERNSHIP</option>
              <option value="CONTRACT">CONTRACT</option>
            </select>
          </div>

          <div className="company-form-field">
            <label htmlFor="location">Location</label>
            <input id="location" name="location" value={values.location} onChange={handleChange} placeholder="Bengaluru, India" />
          </div>

          <div className="company-form-field">
            <label htmlFor="annualPackageLpa">Annual package (LPA)</label>
            <input id="annualPackageLpa" name="annualPackageLpa" type="number" min="0" step="0.01" value={values.annualPackageLpa} onChange={handleChange} />
          </div>

          <div className="company-form-field">
            <label htmlFor="joiningDate">Joining date</label>
            <input id="joiningDate" name="joiningDate" type="date" value={values.joiningDate} onChange={handleChange} />
          </div>

          <div className="company-form-field">
            <label htmlFor="expiryDate">Expiry date</label>
            <input id="expiryDate" name="expiryDate" type="date" value={values.expiryDate} onChange={handleChange} />
          </div>

          <div className="company-form-field company-form-field-wide">
            <label htmlFor="notes">Notes</label>
            <textarea id="notes" name="notes" rows="5" value={values.notes} onChange={handleChange} placeholder="Optional terms or instructions" />
          </div>
        </div>

        <div className="company-form-footer">
          <button type="submit" className="primary-button" disabled={saving}>
            {saving ? 'Saving...' : (isEditing ? 'Update offer' : 'Create offer')}
          </button>
          <Link className="secondary-button" to={isEditing ? `/admin/offers/${offerId}` : `/admin/drives/${driveId}/offers`}>
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
