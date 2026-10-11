import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom'
import { getApiErrorMessage } from '../../services/api'
import { assignRecruiterToCompany, deleteCompany, getCompanyById } from '../../services/companyService'
import { formatCompanyDate, getCompanyErrorMessage } from '../../utils/company'

export default function CompanyDetailsPage() {
  const { companyId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [company, setCompany] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [recruiterEmail, setRecruiterEmail] = useState('')
  const [assigningRecruiter, setAssigningRecruiter] = useState(false)
  const [assignmentSuccess, setAssignmentSuccess] = useState('')
  const [success] = useState(location.state?.success || '')

  useEffect(() => {
    let active = true
    getCompanyById(companyId)
      .then((result) => {
        if (active) setCompany(result)
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
  }, [companyId])

  async function handleDelete() {
    if (!window.confirm(`Are you sure you want to delete ${company.companyName}?`)) return
    setDeleting(true)
    setError('')
    try {
      await deleteCompany(companyId)
      navigate('/admin/companies', {
        replace: true,
        state: { success: `${company.companyName} was deleted successfully.` },
      })
    } catch (requestError) {
      setError(getApiErrorMessage(requestError))
      setDeleting(false)
    }
  }

  async function handleAssignRecruiter(event) {
    event.preventDefault()
    setAssigningRecruiter(true)
    setError('')
    setAssignmentSuccess('')
    try {
      await assignRecruiterToCompany(companyId, recruiterEmail.trim())
      setAssignmentSuccess(`Recruiter ${recruiterEmail.trim()} is now assigned to ${company.companyName}.`)
      setRecruiterEmail('')
    } catch (requestError) {
      setError(getApiErrorMessage(requestError))
    } finally {
      setAssigningRecruiter(false)
    }
  }

  if (loading) return <div className="admin-list-state" role="status">Loading company...</div>

  if (!company) {
    return (
      <section className="company-form-error">
        <h1 className="page-heading">Unable to load company</h1>
        <div className="alert" role="alert">{error || 'Company not found.'}</div>
        <Link className="secondary-button" to="/admin/companies">Back to Companies</Link>
      </section>
    )
  }

  return (
    <div className="company-details-page">
      <Link className="back-link" to="/admin/companies">← Back to Companies</Link>
      {success && <div className="success-banner" role="status">{success}</div>}
      {error && <div className="alert company-page-alert" role="alert">{error}</div>}
      <header className="company-details-heading">
        <span className="company-avatar company-avatar-xl" aria-hidden="true">
          {(company.companyName || 'C').slice(0, 1).toUpperCase()}
        </span>
        <div className="company-details-title">
          <p className="eyebrow">COMPANY PROFILE</p>
          <h1 className="page-heading">{company.companyName}</h1>
          <p className="page-description">{company.industry || 'Industry not specified'}</p>
        </div>
        <div className="company-details-actions">
          <Link className="secondary-button" to={`/admin/companies/${companyId}/edit`}>Edit Company</Link>
          <button className="company-delete-button" type="button" disabled={deleting} onClick={handleDelete}>
            {deleting ? 'Deleting...' : 'Delete Company'}
          </button>
        </div>
      </header>
      <section className="company-details-card">
        <div className="admin-section-heading">
          <h2>Company Information</h2>
          <p>Company details and contact information.</p>
        </div>
        <div className="company-details-grid">
          <Detail label="Description" value={company.description || 'Not specified'} wide />
          <Detail label="Industry" value={company.industry || 'Not specified'} />
          <Detail label="Location" value={company.location || 'Not specified'} />
          <Detail label="Company size" value={company.companySize || 'Not specified'} />
          <Detail label="Website" value={company.website || 'Not specified'} link={company.website} />
          <Detail label="Contact email" value={company.contactEmail || 'Not specified'}
            link={company.contactEmail ? `mailto:${company.contactEmail}` : undefined} />
          <Detail label="Contact phone" value={company.contactPhone || 'Not specified'}
            link={company.contactPhone ? `tel:${company.contactPhone}` : undefined} />
        </div>
      </section>
      {assignmentSuccess && <div className="success-banner" role="status">{assignmentSuccess}</div>}
      <section className="company-details-card">
        <div className="admin-section-heading">
          <h2>Assign company recruiter</h2>
          <p>Only a TPO administrator can link a recruiter account to this company.</p>
        </div>
        <form className="company-recruiter-assignment" onSubmit={handleAssignRecruiter}>
          <label className="form-field">
            Recruiter account email
            <input
              type="email"
              value={recruiterEmail}
              onChange={(event) => setRecruiterEmail(event.target.value)}
              required
              placeholder="recruiter@example.com"
            />
          </label>
          <button className="primary-button" type="submit" disabled={assigningRecruiter}>
            {assigningRecruiter ? 'Assigning...' : 'Assign recruiter'}
          </button>
        </form>
      </section>
      <section className="company-timestamps" aria-label="Record timestamps">
        <span>Created: <strong>{formatCompanyDate(company.createdAt)}</strong></span>
        <span>Last updated: <strong>{formatCompanyDate(company.updatedAt)}</strong></span>
      </section>
    </div>
  )
}

function Detail({ label, value, link, wide = false }) {
  let safeLink
  if (link?.startsWith('mailto:') || link?.startsWith('tel:')) {
    safeLink = link
  } else if (link) {
    try {
      const url = new URL(link)
      if (['http:', 'https:'].includes(url.protocol)) safeLink = url.toString()
    } catch {
      safeLink = undefined
    }
  }
  const content = safeLink ? <a href={safeLink} target={safeLink.startsWith('http') ? '_blank' : undefined}
    rel={safeLink.startsWith('http') ? 'noreferrer' : undefined}>{value}</a> : value
  return (
    <div className={`company-info-item ${wide ? 'company-info-wide' : ''}`}>
      <span>{label}</span>
      <strong>{content}</strong>
    </div>
  )
}
