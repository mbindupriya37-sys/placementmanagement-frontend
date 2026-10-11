import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getApiErrorMessage } from '../../services/api'
import { createCompany, getCompanyById, updateCompany } from '../../services/companyService'
import { getCompanyErrorMessage } from '../../utils/company'

const blankCompany = {
  companyName: '',
  description: '',
  website: '',
  industry: '',
  location: '',
  companySize: '',
  contactEmail: '',
  contactPhone: '',
}

const fieldLimits = {
  companyName: 200,
  description: 10000,
  website: 2048,
  industry: 100,
  location: 200,
  companySize: 100,
  contactEmail: 254,
  contactPhone: 30,
}

function validate(values) {
  const errors = {}
  const companyName = values.companyName.trim()
  if (!companyName) errors.companyName = 'Company name is required.'
  if (companyName.length > fieldLimits.companyName) errors.companyName = 'Company name must be 200 characters or fewer.'
  if (values.description.length > fieldLimits.description) errors.description = 'Description must be 10,000 characters or fewer.'
  if (values.website && values.website.length > fieldLimits.website) errors.website = 'Website URL is too long.'
  if (values.website) {
    try {
      const url = new URL(values.website)
      if (!['http:', 'https:'].includes(url.protocol)) errors.website = 'Website must use HTTP or HTTPS.'
    } catch {
      errors.website = 'Enter a valid website URL, including http:// or https://.'
    }
  }
  if (values.industry.length > fieldLimits.industry) errors.industry = 'Industry must be 100 characters or fewer.'
  if (values.location.length > fieldLimits.location) errors.location = 'Location must be 200 characters or fewer.'
  if (values.companySize.length > fieldLimits.companySize) errors.companySize = 'Company size must be 100 characters or fewer.'
  if (values.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.contactEmail.trim())) {
    errors.contactEmail = 'Enter a valid email address.'
  }
  if (values.contactEmail.length > fieldLimits.contactEmail) errors.contactEmail = 'Email must be 254 characters or fewer.'
  if (values.contactPhone && !/^\+?[0-9() .-]{7,30}$/.test(values.contactPhone.trim())) {
    errors.contactPhone = 'Enter a valid contact phone number.'
  }
  if (values.contactPhone.length > fieldLimits.contactPhone) errors.contactPhone = 'Phone must be 30 characters or fewer.'
  return errors
}

export default function CompanyFormPage() {
  const { companyId } = useParams()
  const navigate = useNavigate()
  const isEditing = Boolean(companyId)
  const [values, setValues] = useState(blankCompany)
  const [loading, setLoading] = useState(isEditing)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  useEffect(() => {
    if (!isEditing) return undefined
    let active = true
    getCompanyById(companyId)
      .then((company) => {
        if (active) {
          setValues(Object.fromEntries(Object.keys(blankCompany)
            .map((key) => [key, company?.[key] || ''])))
        }
      })
      .catch((requestError) => {
        if (active) setError(getCompanyErrorMessage(requestError) || getApiErrorMessage(requestError))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [companyId, isEditing])

  function handleChange(event) {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
    setFieldErrors((current) => ({ ...current, [name]: '' }))
    setError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const errors = validate(values)
    setFieldErrors(errors)
    setError('')
    if (Object.keys(errors).length) return

    const payload = Object.fromEntries(Object.entries(values).map(([key, value]) => [
      key, typeof value === 'string' ? value.trim() : value,
    ]))
    setSaving(true)
    try {
      if (isEditing) {
        await updateCompany(companyId, payload)
        navigate(`/admin/companies/${companyId}`, {
          replace: true,
          state: { success: 'Company updated successfully.' },
        })
      } else {
        await createCompany(payload)
        navigate('/admin/companies', {
          replace: true,
          state: { success: 'Company created successfully.' },
        })
      }
    } catch (requestError) {
      setError(getCompanyErrorMessage(requestError) || getApiErrorMessage(requestError))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="admin-list-state" role="status">Loading company...</div>
  if (error && isEditing && !values.companyName) {
    return (
      <section className="company-form-error">
        <h1 className="page-heading">Unable to load company</h1>
        <div className="alert" role="alert">{error}</div>
        <Link className="secondary-button" to="/admin/companies">Back to Companies</Link>
      </section>
    )
  }

  return (
    <div className="company-form-page">
      <Link className="back-link" to={isEditing ? `/admin/companies/${companyId}` : '/admin/companies'}>
        ← {isEditing ? 'Back to company' : 'Back to Companies'}
      </Link>
      <header className="admin-page-heading company-form-heading">
        <div>
          <p className="eyebrow">{isEditing ? 'COMPANY DIRECTORY' : 'NEW COMPANY'}</p>
          <h1 className="page-heading">{isEditing ? 'Edit Company' : 'Add Company'}</h1>
          <p className="page-description">
            {isEditing ? 'Update the company information.' : 'Add a company participating in campus placements.'}
          </p>
        </div>
      </header>
      {error && <div className="alert company-page-alert" role="alert">{error}</div>}
      <form className="company-form-card" onSubmit={handleSubmit} noValidate>
        <FormSection title="Company Information" description="Basic details about the organization.">
          <TextField label="Company name" name="companyName" required value={values.companyName}
            onChange={handleChange} error={fieldErrors.companyName} maxLength={200}
            placeholder="Enter company name" />
          <TextField label="Industry" name="industry" value={values.industry} onChange={handleChange}
            error={fieldErrors.industry} maxLength={100} placeholder="e.g. Technology" />
          <TextField label="Company size" name="companySize" value={values.companySize} onChange={handleChange}
            error={fieldErrors.companySize} maxLength={100} placeholder="e.g. 500-1000 employees" />
          <TextField label="Location" name="location" value={values.location} onChange={handleChange}
            error={fieldErrors.location} maxLength={200} placeholder="City, country" />
          <div className="company-form-field company-form-field-wide">
            <label htmlFor="description">Description</label>
            <textarea id="description" name="description" rows="4" value={values.description}
              onChange={handleChange} maxLength={10000} placeholder="Company overview" />
            {fieldErrors.description && <small className="field-error">{fieldErrors.description}</small>}
          </div>
        </FormSection>
        <FormSection title="Contact Information" description="Optional contact details for the company.">
          <TextField label="Website" name="website" type="url" value={values.website}
            onChange={handleChange} error={fieldErrors.website} maxLength={2048}
            placeholder="https://example.com" />
          <TextField label="Contact email" name="contactEmail" type="email" value={values.contactEmail}
            onChange={handleChange} error={fieldErrors.contactEmail} maxLength={254}
            placeholder="contact@example.com" />
          <TextField label="Contact phone" name="contactPhone" type="tel" value={values.contactPhone}
            onChange={handleChange} error={fieldErrors.contactPhone} maxLength={30}
            placeholder="+1 555 123 4567" />
        </FormSection>
        <footer className="company-form-footer">
          <Link className="secondary-button" to={isEditing ? `/admin/companies/${companyId}` : '/admin/companies'}>
            Cancel
          </Link>
          <button className="primary-button" type="submit" disabled={saving}>
            {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Company'}
          </button>
        </footer>
      </form>
    </div>
  )
}

function FormSection({ title, description, children }) {
  return (
    <section className="company-form-section">
      <header>
        <h2>{title}</h2>
        <p>{description}</p>
      </header>
      <div className="company-form-grid">{children}</div>
    </section>
  )
}

function TextField({ label, name, type = 'text', required = false, value, onChange, error, ...props }) {
  return (
    <div className="company-form-field">
      <label htmlFor={name}>{label}{required && <span aria-hidden="true"> *</span>}</label>
      <input id={name} name={name} type={type} required={required} value={value} onChange={onChange}
        aria-invalid={Boolean(error)} {...props} />
      {error && <small className="field-error">{error}</small>}
    </div>
  )
}
