import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { getApiErrorMessage } from '../../services/api'
import { checkEligibility, getPlacementDrives } from '../../services/placementDriveService'
import { getMyApplications, getMyProfile, isProfileMissingError } from '../../services/studentService'
import { getProfileCompletion } from '../../utils/studentProfile'
import { scoreEligibleDrive } from '../../utils/studentDriveRecommendations'

const quickActions = [
  ['View Profile', '/student/profile', 'Update your academic information'],
  ['Browse Placement Drives', '/student/drives', 'Explore available opportunities'],
  ['My Applications', '/student/applications', 'Review your submitted applications'],
  ['Interviews', '/student/interviews', 'View interview details'],
  ['Offers', '/student/offers', 'Review your offers'],
  ['Notifications', '/notifications', 'See updates from your placement journey'],
]

const recentStatusLabels = {
  APPLIED: 'Application submitted',
  SHORTLISTED: 'Application shortlisted',
  REJECTED: 'Application update',
  WITHDRAWN: 'Application withdrawn',
  SELECTED: 'Final selection recorded',
}

export default function StudentDashboardPage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [profileState, setProfileState] = useState('loading')
  const [profileError, setProfileError] = useState('')
  const [applications, setApplications] = useState([])
  const [applicationsState, setApplicationsState] = useState('loading')
  const [applicationsError, setApplicationsError] = useState('')
  const [driveRecommendations, setDriveRecommendations] = useState([])
  const [recommendationsState, setRecommendationsState] = useState('loading')
  const [recommendationsError, setRecommendationsError] = useState('')

  useEffect(() => {
    let active = true
    getMyProfile()
      .then((data) => {
        if (!active) return
        setProfile(data)
        setProfileState('loaded')
      })
      .catch((error) => {
        if (!active) return
        if (isProfileMissingError(error)) {
          setProfileState('missing')
        } else {
          setProfileError(getApiErrorMessage(error))
          setProfileState('error')
        }
      })

    getMyApplications()
      .then((data) => {
        if (!active) return
        setApplications(Array.isArray(data) ? data : [])
        setApplicationsState('loaded')
      })
      .catch((error) => {
        if (!active) return
        setApplicationsError(getApiErrorMessage(error))
        setApplicationsState('error')
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (profileState !== 'loaded' || !profile || applicationsState === 'loading') return undefined
    if (profileState === 'missing' || applicationsState === 'error') return undefined

    let active = true

    async function loadRecommendations() {
      try {
        const drives = await getPlacementDrives()
        const openDrives = (Array.isArray(drives) ? drives : [])
          .filter((drive) => drive.status === 'OPEN')
        const eligibilityResults = await Promise.all(openDrives.map(async (drive) => ({
          drive,
          eligibility: await checkEligibility(drive.id),
        })))
        if (!active) return

        const ranked = eligibilityResults
          .filter(({ eligibility }) => eligibility?.eligible)
          .map(({ drive }) => ({
            drive,
            ...scoreEligibleDrive(profile.skills, drive),
          }))
          .filter(({ drive }) => !applications.some((application) =>
            String(application.driveId) === String(drive.id)))
          .sort((left, right) =>
            right.score - left.score
            || String(left.drive.applicationEndDate || '').localeCompare(String(right.drive.applicationEndDate || ''))
            || String(left.drive.driveTitle || '').localeCompare(String(right.drive.driveTitle || '')))

        setDriveRecommendations(ranked.slice(0, 3))
        setRecommendationsState('loaded')
      } catch (error) {
        if (!active) return
        setRecommendationsError(getApiErrorMessage(error))
        setRecommendationsState('error')
      }
    }

    loadRecommendations()
    return () => {
      active = false
    }
  }, [applications, applicationsState, profile, profileState])

  const completion = profile ? getProfileCompletion(profile) : 0
  const recentApplications = applications.slice(0, 3)

  return (
    <div className="student-dashboard">
      <header className="student-dashboard-heading">
        <div>
          <p className="eyebrow">STUDENT WORKSPACE</p>
          <h1 className="page-heading">Welcome, {user?.name || 'Student'}</h1>
          <p className="page-description">Manage your placement journey from here.</p>
        </div>
        <Link className="primary-button dashboard-profile-link" to="/student/profile">
          {profileState === 'loading' ? 'Loading profile...' : profileState === 'loaded' ? 'View Profile' : 'Complete Profile'}
        </Link>
      </header>

      <section className="student-profile-summary">
        {profileState === 'loading' ? (
          <div className="dashboard-loading" role="status">Loading your profile...</div>
        ) : profileState === 'error' ? (
          <div className="dashboard-card-error" role="alert">
            <strong>Unable to load your profile.</strong>
            <span>{profileError}</span>
            <Link to="/student/profile">Open profile page</Link>
          </div>
        ) : profileState === 'missing' ? (
          <div className="profile-summary-empty">
            <div className="summary-empty-icon" aria-hidden="true">+</div>
            <div>
              <h2>Complete your profile to start applying for placement drives.</h2>
              <p>Add your academic details and skills to get your profile ready.</p>
            </div>
            <Link className="primary-button" to="/student/profile">Complete Profile</Link>
          </div>
        ) : (
          <div className="profile-summary-content">
            <div className="profile-summary-main">
              <div className="profile-summary-title">
                <div className="profile-summary-icon" aria-hidden="true">◈</div>
                <div>
                  <p className="eyebrow">YOUR PROFILE</p>
                  <h2>Academic snapshot</h2>
                </div>
              </div>
              <div className="profile-completion-inline">
                <div className="completion-heading">
                  <span>Profile completion</span>
                  <strong>{completion}%</strong>
                </div>
                <div className="progress-track" role="progressbar" aria-valuenow={completion}
                  aria-valuemin="0" aria-valuemax="100">
                  <span style={{ width: `${completion}%` }} />
                </div>
              </div>
              <div className="academic-details-grid">
                <AcademicDetail label="College" value={profile.college} />
                <AcademicDetail label="Branch" value={profile.branch} />
                <AcademicDetail label="CGPA" value={profile.cgpa} />
                <AcademicDetail label="Graduation year" value={profile.graduationYear} />
                <AcademicDetail label="Backlogs" value={profile.backlogs} />
              </div>
            </div>
            <Link className="secondary-button summary-edit" to="/student/profile">Edit profile</Link>
          </div>
        )}
      </section>

      <section className="recommendations-panel" aria-labelledby="recommendations-heading">
        <div className="section-heading-row">
          <div>
            <h2 className="section-title" id="recommendations-heading">Drive recommendations</h2>
            <p className="section-caption">Open drives ranked using your eligibility and profile skills.</p>
          </div>
          <Link className="text-link" to="/student/drives">Browse all drives</Link>
        </div>
        <p className="recommendations-disclaimer">
          No external AI service is configured. This explainable rule-based guide gives eligible drives a 70-point base, then awards up to 30 points based on the share of your saved skills found in the role or description.
        </p>
        {profileState === 'missing' ? (
          <div className="recommendations-empty">
            <span>Complete your profile to get eligibility-based drive recommendations.</span>
            <Link to="/student/profile">Complete profile</Link>
          </div>
        ) : profileState === 'error' ? (
          <div className="recommendations-empty" role="alert">
            Recommendations require your profile, which could not be loaded.
          </div>
        ) : applicationsState === 'error' ? (
          <div className="recommendations-empty" role="alert">
            Recommendations require your applications list to avoid suggesting drives you have already applied to.
          </div>
        ) : recommendationsState === 'loading' ? (
          <div className="dashboard-loading" role="status">Checking open drives against your profile...</div>
        ) : recommendationsState === 'error' ? (
          <div className="dashboard-card-error" role="alert">
            <strong>Unable to generate drive recommendations.</strong>
            <span>{recommendationsError}</span>
          </div>
        ) : driveRecommendations.length === 0 ? (
          <div className="recommendations-empty">
            No new open drives passed the backend eligibility check.
          </div>
        ) : (
          <div className="recommendation-list">
            {driveRecommendations.map(({ drive, score, matchedSkills, totalSkills }) => (
              <article className="recommendation-card" key={drive.id}>
                <div className="recommendation-main">
                  <p className="eyebrow">{drive.companyName || 'Company'}</p>
                  <h3>{drive.driveTitle || 'Placement drive'}</h3>
                  <p className="recommendation-role">{drive.jobRole || 'Role not specified'}</p>
                  <div className="recommendation-meta">
                    {drive.packageLpa != null && <span>{drive.packageLpa} LPA</span>}
                    {drive.applicationEndDate && <span>Apply by {formatDate(drive.applicationEndDate)}</span>}
                  </div>
                  <p className="recommendation-reason">
                    Backend eligibility passed.
                    {matchedSkills.length
                      ? ` Matching profile skills: ${matchedSkills.join(', ')}.`
                      : totalSkills
                        ? ' No profile skills were found in the drive role or description.'
                        : ' Add skills to your profile to improve skill-match ranking.'}
                  </p>
                </div>
                <div className="recommendation-score" aria-label={`Profile match score ${score} out of 100`}>
                  <strong>{score}</strong>
                  <span>match</span>
                </div>
                <Link className="secondary-button" to={`/student/drives/${drive.id}`}>View drive</Link>
              </article>
            ))}
          </div>
        )}
      </section>

      <div className="student-dashboard-columns">
        <section>
          <div className="section-heading-row">
            <div>
              <h2 className="section-title">Quick Actions</h2>
              <p className="section-caption">Shortcuts to your placement tools.</p>
            </div>
          </div>
          <div className="quick-actions-grid">
            {quickActions.map(([label, path, description], index) => (
              <Link className="quick-action-card" to={path} key={path}>
                <span className="quick-action-icon" aria-hidden="true">{['◈', '▣', '▤', '◷', '◇', '✉'][index]}</span>
                <span className="quick-action-copy">
                  <strong>{label}</strong>
                  <small>{description}</small>
                </span>
                <span className="quick-action-arrow" aria-hidden="true">→</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="recent-activity-section">
          <div className="section-heading-row">
            <div>
              <h2 className="section-title">Recent Activity</h2>
              <p className="section-caption">Updates from your applications.</p>
            </div>
            <Link className="text-link" to="/student/applications">View all</Link>
          </div>
          <div className="activity-card">
            {applicationsState === 'loading' ? (
              <div className="dashboard-loading" role="status">Loading recent activity...</div>
            ) : applicationsState === 'error' ? (
              <div className="activity-empty" role="alert">{applicationsError}</div>
            ) : recentApplications.length === 0 ? (
              <div className="activity-empty">No recent activity yet.</div>
            ) : (
              <ul className="activity-list">
                {recentApplications.map((application) => (
                  <li key={application.applicationId}>
                    <span className="activity-dot" aria-hidden="true" />
                    <div className="activity-content">
                      <strong>{recentStatusLabels[application.status] || 'Application updated'}</strong>
                      <span>{application.driveTitle || 'Placement drive'}</span>
                      <small>{application.companyName || 'Company'}</small>
                    </div>
                    <time>{formatDate(application.updatedAt || application.appliedAt)}</time>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

function AcademicDetail({ label, value }) {
  return (
    <div className="academic-detail">
      <span>{label}</span>
      <strong>{value === null || value === undefined || value === '' ? 'Not added' : value}</strong>
    </div>
  )
}

function formatDate(value) {
  if (!value) return 'Date unavailable'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? 'Date unavailable'
    : new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date)
}
