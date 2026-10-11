import { useAuth } from '../hooks/useAuth'

const descriptions = {
  STUDENT: 'Keep track of your placement journey and explore the tools available to you.',
  TPO_ADMIN: 'Coordinate placement activity and access the tools available to your office.',
  COMPANY_RECRUITER: 'Review your placement workspace and available recruitment sections.',
  DEPARTMENT_COORDINATOR: 'Stay connected with placement activity across your department.',
}

export default function DashboardPage() {
  const { user } = useAuth()

  return (
    <>
      <div>
        <h1 className="page-heading">Good to see you, {user?.name?.split(' ')[0] || 'there'}</h1>
        <p className="page-description">{descriptions[user?.role] || 'Welcome to your PlacementOS workspace.'}</p>
      </div>
      <section className="welcome-card">
        <h2>Your placement journey starts here</h2>
        <p>
          PlacementOS brings the key steps of campus recruitment together. This workspace is ready
          for your role-specific tools as they are introduced.
        </p>
      </section>
      <h2 className="section-title">Workspace overview</h2>
      <div className="foundation-grid">
        <article className="foundation-card">
          <span className="foundation-icon" aria-hidden="true">01</span>
          <strong>Your role-aware workspace</strong>
          <p>Navigation is tailored to your authenticated account.</p>
        </article>
        <article className="foundation-card">
          <span className="foundation-icon" aria-hidden="true">02</span>
          <strong>Secure sign-in</strong>
          <p>Your session is restored when you return to the application.</p>
        </article>
        <article className="foundation-card">
          <span className="foundation-icon" aria-hidden="true">03</span>
          <strong>More tools coming soon</strong>
          <p>Placement workflows will be introduced in upcoming phases.</p>
        </article>
      </div>
    </>
  )
}
