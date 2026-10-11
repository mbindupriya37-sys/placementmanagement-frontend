import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { getApiErrorMessage } from '../../services/api'
import { deleteCompany, getCompanies } from '../../services/companyService'
import { formatCompanySize } from '../../utils/company'

export default function CompaniesPage() {
  const location = useLocation()
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [deletingId, setDeletingId] = useState(null)
  const [success, setSuccess] = useState(location.state?.success || '')

  useEffect(() => {
    let active = true
    getCompanies()
      .then((result) => {
        if (active) setCompanies(Array.isArray(result) ? result : [])
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

  const filteredCompanies = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return companies
    return companies.filter((company) =>
      [company.companyName, company.industry, company.location]
        .some((value) => value?.toLowerCase().includes(query)))
  }, [companies, search])

  async function handleDelete(company) {
    if (!window.confirm(`Are you sure you want to delete this company?`)) return
    setDeletingId(company.id)
    setError('')
    setSuccess('')
    try {
      await deleteCompany(company.id)
      setCompanies((current) => current.filter((item) => item.id !== company.id))
      setSuccess(`${company.companyName} was deleted successfully.`)
    } catch (requestError) {
      setError(getApiErrorMessage(requestError))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="company-page">
      <header className="admin-page-heading">
        <div>
          <p className="eyebrow">COMPANY DIRECTORY</p>
          <h1 className="page-heading">Companies</h1>
          <p className="page-description">Manage companies participating in campus placements.</p>
        </div>
        <Link className="primary-button" to="/admin/companies/new">+ Add Company</Link>
      </header>

      {success && <div className="success-banner" role="status">{success}</div>}
      {error && <div className="alert company-page-alert" role="alert">{error}</div>}

      <section className="company-toolbar">
        <label className="company-search">
          <span aria-hidden="true">⌕</span>
          <input type="search" value={search} onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by company, industry, or location"
            aria-label="Search by company, industry, or location" />
        </label>
        {!loading && !error && (
          <span className="company-result-count">
            {filteredCompanies.length} {filteredCompanies.length === 1 ? 'company' : 'companies'}
          </span>
        )}
      </section>

      {loading ? (
        <div className="admin-list-state" role="status">Loading companies...</div>
      ) : !error && filteredCompanies.length === 0 ? (
        <div className="admin-empty-state">
          <span className="admin-empty-icon" aria-hidden="true">▤</span>
          <strong>{companies.length === 0 ? 'No companies found.' : 'No matching companies found.'}</strong>
          <p>{companies.length === 0
            ? 'Add a company to begin building your company directory.'
            : 'Try another search term.'}</p>
          {companies.length === 0 && <Link className="primary-button" to="/admin/companies/new">Add Company</Link>}
        </div>
      ) : !error && (
        <div className="company-card-grid">
          {filteredCompanies.map((company) => (
            <article className="company-card" key={company.id}>
              <header className="company-card-header">
                <span className="company-avatar company-avatar-large" aria-hidden="true">
                  {(company.companyName || 'C').slice(0, 1).toUpperCase()}
                </span>
                <span className="company-card-industry">{company.industry || 'Industry not specified'}</span>
              </header>
              <h2>{company.companyName}</h2>
              <p className="company-card-location">{company.location || 'Location not specified'}</p>
              <div className="company-card-details">
                <CompanyDetail label="Company size" value={formatCompanySize(company.companySize)} />
                <CompanyDetail label="Contact email" value={company.contactEmail || 'Not specified'} />
                <CompanyDetail label="Contact phone" value={company.contactPhone || 'Not specified'} />
                <CompanyDetail label="Website" value={company.website || 'Not specified'} />
              </div>
              <footer className="company-card-actions">
                <Link className="secondary-button" to={`/admin/companies/${company.id}`}>View</Link>
                <Link className="secondary-button" to={`/admin/companies/${company.id}/edit`}>Edit</Link>
                <button className="company-delete-button" type="button"
                  disabled={deletingId === company.id} onClick={() => handleDelete(company)}>
                  {deletingId === company.id ? 'Deleting...' : 'Delete'}
                </button>
              </footer>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

function CompanyDetail({ label, value }) {
  return (
    <div className="company-card-detail">
      <span>{label}</span>
      <strong title={value}>{value}</strong>
    </div>
  )
}
