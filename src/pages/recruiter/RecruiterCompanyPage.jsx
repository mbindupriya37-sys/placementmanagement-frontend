import { useEffect, useState } from 'react'
import { getApiErrorMessage } from '../../services/api'
import { getCompanies } from '../../services/companyService'

export default function RecruiterCompanyPage() {
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function loadCompanies() {
      try {
        const data = await getCompanies()
        if (!active) return
        setCompanies(Array.isArray(data) ? data : [])
      } catch (requestError) {
        if (!active) return
        setError(getApiErrorMessage(requestError) || 'Unable to load company information.')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadCompanies()
    return () => {
      active = false
    }
  }, [])

  return (
    <div className="recruiter-page">
      <header className="page-header-row">
        <div>
          <p className="eyebrow">COMPANY</p>
          <h1 className="page-heading">Company information</h1>
          <p className="page-description">Read-only company directory available to recruiters.</p>
        </div>
      </header>

      <div className="info-note">
        The backend exposes the shared company directory to recruiters; it does not provide a recruiter-specific company profile or company editing operation.
      </div>

      {error && <div className="alert" role="alert">{error}</div>}

      {loading ? (
        <div className="content-loading" role="status">Loading company information...</div>
      ) : companies.length === 0 ? (
        <div className="empty-state">No company details are currently available.</div>
      ) : (
        <div className="card-grid">
          {companies.map((company) => (
            <article key={company.id} className="info-card">
              <div className="info-card-header">
                <div>
                  <p className="eyebrow compact">Company</p>
                  <h2>{company.companyName || 'Company name unavailable'}</h2>
                </div>
              </div>

              <div className="info-list">
                <div><span>Industry</span><strong>{company.industry || 'Not provided'}</strong></div>
                <div><span>Location</span><strong>{company.location || 'Not provided'}</strong></div>
                <div><span>Company size</span><strong>{company.companySize || 'Not provided'}</strong></div>
                <div><span>Website</span><strong>{company.website || 'Not provided'}</strong></div>
                <div><span>Contact email</span><strong>{company.contactEmail || 'Not provided'}</strong></div>
                <div><span>Contact phone</span><strong>{company.contactPhone || 'Not provided'}</strong></div>
              </div>

              {company.description && (
                <div className="description-block">
                  <h3>About</h3>
                  <p>{company.description}</p>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
