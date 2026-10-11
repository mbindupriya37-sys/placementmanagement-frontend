import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getApiErrorMessage } from '../../services/api'
import { getDriveApplications } from '../../services/applicationAdminService'
import { getCompanies } from '../../services/companyService'
import { getDriveFinalDecisions } from '../../services/finalDecisionService'
import { getDriveOffers } from '../../services/offerService'
import { getPlacementDrives } from '../../services/placementDriveAdminService'
import { formatCompanyDate } from '../../utils/company'

function countUnique(values) {
  return new Set(values.filter((value) => value !== null && value !== undefined)).size
}

function formatMetric(value) {
  return new Intl.NumberFormat('en-IN').format(value)
}

function getPackageBand(value) {
  if (value < 5) return 'Under 5 LPA'
  if (value < 10) return '5–9.9 LPA'
  if (value < 20) return '10–19.9 LPA'
  return '20+ LPA'
}

function getAnalytics(companies, drives, applications, decisions, offers) {
  const selectedApplicationIds = new Set(
    decisions
      .filter((decision) => decision.decision === 'SELECTED')
      .map((decision) => decision.applicationId),
  )
  const rejectedApplicationIds = new Set(
    applications
      .filter((application) => application.applicationStatus === 'REJECTED')
      .map((application) => application.applicationId),
  )
  const totalApplicationIds = applications.map((application) => application.applicationId)
  const branches = new Map()

  applications.forEach((application) => {
    const branchName = application.branch?.trim() || 'Branch not provided'
    const branch = branches.get(branchName) || { name: branchName, applications: 0, shortlisted: 0, selected: 0 }
    branch.applications += 1
    if (application.applicationStatus === 'SHORTLISTED') branch.shortlisted += 1
    if (selectedApplicationIds.has(application.applicationId)) branch.selected += 1
    branches.set(branchName, branch)
  })

  const companyById = new Map(companies.map((company) => [String(company.id), company]))
  const companyStats = new Map()
  drives.forEach((drive) => {
    const company = companyById.get(String(drive.companyId))
    const companyName = drive.companyName || company?.companyName || 'Company not specified'
    const companyKey = drive.companyId ?? companyName
    const stat = companyStats.get(companyKey) || {
      id: company?.id ?? drive.companyId,
      name: companyName,
      drives: 0,
      applications: 0,
    }
    stat.drives += 1
    stat.applications += applications.filter((application) =>
      String(application.placementDriveId) === String(drive.id)).length
    companyStats.set(companyKey, stat)
  })

  const packageStats = new Map()
  drives.forEach((drive) => {
    const packageLpa = Number(drive.packageLpa)
    if (!Number.isFinite(packageLpa) || packageLpa <= 0) return
    const band = getPackageBand(packageLpa)
    packageStats.set(band, (packageStats.get(band) || 0) + 1)
  })

  const selectedCount = countUnique([...selectedApplicationIds])
  const totalApplications = countUnique(totalApplicationIds)

  return {
    totalApplications,
    shortlisted: countUnique(applications
      .filter((application) => application.applicationStatus === 'SHORTLISTED')
      .map((application) => application.applicationId)),
    selected: selectedCount,
    rejected: countUnique([...rejectedApplicationIds]),
    totalOffers: offers.length,
    acceptedOffers: offers.filter((offer) => offer.status === 'ACCEPTED').length,
    placementRate: totalApplications ? (selectedCount / totalApplications) * 100 : 0,
    branches: [...branches.values()].sort((left, right) => right.applications - left.applications),
    companies: [...companyStats.values()].sort((left, right) =>
      right.drives - left.drives || right.applications - left.applications || left.name.localeCompare(right.name)),
    packages: [...packageStats.entries()]
      .map(([name, drivesCount]) => ({ name, drives: drivesCount }))
      .sort((left, right) => {
        const order = ['Under 5 LPA', '5–9.9 LPA', '10–19.9 LPA', '20+ LPA']
        return order.indexOf(left.name) - order.indexOf(right.name)
      }),
  }
}

function AnalyticsBarList({ items, labelKey, valueKey, emptyMessage, formatValue = formatMetric }) {
  const maximum = Math.max(1, ...items.map((item) => item[valueKey]))

  if (!items.length) return <p className="analytics-empty">{emptyMessage}</p>

  return (
    <div className="analytics-bar-list">
      {items.map((item) => (
        <div className="analytics-bar-row" key={item[labelKey]}>
          <div className="analytics-bar-label">
            <span>{item[labelKey]}</span>
            <strong>{formatValue(item[valueKey])}</strong>
          </div>
          {item.shortlisted !== undefined && (
            <div className="analytics-bar-detail">
              {formatMetric(item.shortlisted)} shortlisted · {formatMetric(item.selected)} selected
            </div>
          )}
          <div className="analytics-bar-track" aria-hidden="true">
            <span style={{ width: `${(item[valueKey] / maximum) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function AdminDashboardPage() {
  const [companies, setCompanies] = useState([])
  const [drives, setDrives] = useState([])
  const [applications, setApplications] = useState([])
  const [decisions, setDecisions] = useState([])
  const [offers, setOffers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function loadDashboard() {
      try {
        const [companyResult, driveResult] = await Promise.all([
          getCompanies(),
          getPlacementDrives(),
        ])
        if (!active) return

        const availableCompanies = Array.isArray(companyResult) ? companyResult : []
        const availableDrives = Array.isArray(driveResult) ? driveResult : []
        const perDriveData = await Promise.all(availableDrives.map(async (drive) => {
          const [driveApplications, driveDecisions, driveOffers] = await Promise.all([
            getDriveApplications(drive.id),
            getDriveFinalDecisions(drive.id),
            getDriveOffers(drive.id),
          ])
          return {
            applications: Array.isArray(driveApplications) ? driveApplications : [],
            decisions: Array.isArray(driveDecisions) ? driveDecisions : [],
            offers: Array.isArray(driveOffers) ? driveOffers : [],
          }
        }))
        if (!active) return

        setCompanies(availableCompanies)
        setDrives(availableDrives)
        setApplications(perDriveData.flatMap((data) => data.applications))
        setDecisions(perDriveData.flatMap((data) => data.decisions))
        setOffers(perDriveData.flatMap((data) => data.offers))
      } catch (requestError) {
        if (active) setError(getApiErrorMessage(requestError))
      } finally {
        if (active) setLoading(false)
      }
    }

    loadDashboard()
    return () => {
      active = false
    }
  }, [])

  const analytics = useMemo(
    () => getAnalytics(companies, drives, applications, decisions, offers),
    [companies, drives, applications, decisions, offers],
  )
  const recentCompanies = useMemo(() => {
    const sortedCompanies = [...companies]
    if (sortedCompanies.some((company) => company.createdAt)) {
      sortedCompanies.sort((left, right) =>
        new Date(right.createdAt || 0).getTime() - new Date(left.createdAt || 0).getTime())
    }
    return sortedCompanies.slice(0, 5)
  }, [companies])
  const metricCards = [
    { label: 'Companies', value: companies.length, href: '/admin/companies', icon: '▤' },
    { label: 'Placement drives', value: drives.length, href: '/admin/drives', icon: '▣' },
    { label: 'Applications', value: analytics.totalApplications, href: '/admin/applications', icon: '▧' },
    { label: 'Shortlisted', value: analytics.shortlisted, href: '/admin/drives', icon: '✓' },
    { label: 'Selected students', value: analytics.selected, href: '/admin/final-decisions', icon: '★' },
    { label: 'Rejected applications', value: analytics.rejected, href: '/admin/drives', icon: '×' },
    { label: 'Offers', value: analytics.totalOffers, href: '/admin/offers', icon: '✉' },
    { label: 'Accepted offers', value: analytics.acceptedOffers, href: '/admin/offers', icon: '✓' },
  ]

  return (
    <div className="admin-dashboard">
      <header className="admin-welcome-header">
        <div>
          <p className="eyebrow">TPO WORKSPACE</p>
          <h1 className="page-heading">TPO Dashboard</h1>
          <p className="page-description">Live placement activity and outcomes from your placement records.</p>
        </div>
        <div className="admin-header-mark" aria-hidden="true">P</div>
      </header>

      {error && <div className="alert" role="alert">{error}</div>}

      <section className="analytics-metric-grid" aria-label="Placement metrics">
        {metricCards.map((metric) => (
          <Link className="analytics-metric-card" to={metric.href} key={metric.label}>
            <span className="analytics-metric-icon" aria-hidden="true">{metric.icon}</span>
            <span className="analytics-metric-label">{metric.label}</span>
            {loading ? (
              <strong className="analytics-metric-value">Loading...</strong>
            ) : error ? (
              <strong className="analytics-metric-value metric-error">Unavailable</strong>
            ) : (
              <strong className="analytics-metric-value">{formatMetric(metric.value)}</strong>
            )}
          </Link>
        ))}
        <article className="analytics-metric-card placement-rate-card">
          <span className="analytics-metric-icon" aria-hidden="true">%</span>
          <span className="analytics-metric-label">Applicant placement rate</span>
          {loading ? (
            <strong className="analytics-metric-value">Loading...</strong>
          ) : error ? (
            <strong className="analytics-metric-value metric-error">Unavailable</strong>
          ) : (
            <strong className="analytics-metric-value">{analytics.placementRate.toFixed(1)}%</strong>
          )}
          <small>Selected applicants / total applications</small>
        </article>
      </section>

      <div className="analytics-panels">
        <section className="analytics-panel">
          <div className="analytics-panel-heading">
            <div>
              <h2>Branch-wise applications</h2>
              <p>Applications and pipeline counts for each branch.</p>
            </div>
          </div>
          {loading ? (
            <div className="admin-list-state" role="status">Loading branch statistics...</div>
          ) : error ? (
            <div className="admin-list-state admin-error-state" role="alert">Branch statistics are unavailable.</div>
          ) : (
            <AnalyticsBarList
              items={analytics.branches.map((branch) => ({
                ...branch,
                shortlisted: branch.shortlisted,
                selected: branch.selected,
              }))}
              labelKey="name"
              valueKey="applications"
              emptyMessage="No application branch data is available."
            />
          )}
        </section>

        <section className="analytics-panel">
          <div className="analytics-panel-heading">
            <div>
              <h2>Drive package distribution</h2>
              <p>Placement drives grouped by their configured package in LPA.</p>
            </div>
          </div>
          {loading ? (
            <div className="admin-list-state" role="status">Loading package statistics...</div>
          ) : error ? (
            <div className="admin-list-state admin-error-state" role="alert">Package statistics are unavailable.</div>
          ) : (
            <AnalyticsBarList
              items={analytics.packages}
              labelKey="name"
              valueKey="drives"
              emptyMessage="No placement drives have package/LPA data."
              formatValue={(value) => `${formatMetric(value)} drive${value === 1 ? '' : 's'}`}
            />
          )}
        </section>
      </div>

      <section className="analytics-panel analytics-company-panel">
        <div className="analytics-panel-heading">
          <div>
            <h2>Company and drive statistics</h2>
            <p>Companies with placement drives, including their application volume.</p>
          </div>
          <Link className="text-link" to="/admin/drives">Manage drives</Link>
        </div>
        {loading ? (
          <div className="admin-list-state" role="status">Loading company statistics...</div>
        ) : error ? (
          <div className="admin-list-state admin-error-state" role="alert">Company statistics are unavailable.</div>
        ) : analytics.companies.length === 0 ? (
          <div className="admin-list-state">No company drive statistics are available.</div>
        ) : (
          <div className="analytics-table-wrap">
            <table className="analytics-table">
              <thead>
                <tr><th>Company</th><th>Drives</th><th>Applications</th></tr>
              </thead>
              <tbody>
                {analytics.companies.map((company) => (
                  <tr key={company.id ?? company.name}>
                    <td>{company.name}</td>
                    <td>{formatMetric(company.drives)}</td>
                    <td>{formatMetric(company.applications)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="admin-recent-section">
        <div className="admin-section-heading admin-recent-heading">
          <div>
            <h2>Recent Companies</h2>
            <p>{loading ? 'Loading company records...' : 'Companies returned by the company service.'}</p>
          </div>
          <Link className="text-link" to="/admin/companies">View all companies</Link>
        </div>
        {loading ? (
          <div className="admin-list-state" role="status">Loading companies...</div>
        ) : error ? (
          <div className="admin-list-state admin-error-state" role="alert">{error}</div>
        ) : recentCompanies.length === 0 ? (
          <div className="admin-list-state">No companies found.</div>
        ) : (
          <div className="recent-company-list">
            {recentCompanies.map((company) => (
              <Link className="recent-company-row" to={`/admin/companies/${company.id}`} key={company.id}>
                <span className="company-avatar" aria-hidden="true">
                  {(company.companyName || 'C').slice(0, 1).toUpperCase()}
                </span>
                <span className="recent-company-name">
                  <strong>{company.companyName}</strong>
                  <small>{company.industry || 'Industry not specified'}</small>
                </span>
                <span className="recent-company-location">{company.location || 'Location not specified'}</span>
                {company.createdAt && <time>{formatCompanyDate(company.createdAt)}</time>}
                <span className="recent-company-arrow" aria-hidden="true">→</span>
              </Link>
            ))}
          </div>
        )}
      </section>
      <p className="analytics-footnote">
        Placement rate is selected applications divided by total applications. Overall student-population placement percentage is not available from the existing admin APIs.
      </p>
    </div>
  )
}
