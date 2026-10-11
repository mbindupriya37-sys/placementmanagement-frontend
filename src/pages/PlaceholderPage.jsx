import { useLocation } from 'react-router-dom'

const labels = {
  profile: 'Student Profile',
  drives: 'Placement Drives',
  applications: 'Applications',
  interviews: 'Interviews',
  offers: 'Offers',
  notifications: 'Notifications',
  companies: 'Companies',
  selection: 'Selection',
}

export default function PlaceholderPage() {
  const location = useLocation()
  const pageKey = location.pathname.split('/').filter(Boolean).at(-1)
  const title = labels[pageKey] || 'Workspace'

  return (
    <>
      <div>
        <h1 className="page-heading">{title}</h1>
        <p className="page-description">This section is part of the PlacementOS workspace.</p>
      </div>
      <section className="placeholder-card">
        <div>
          <strong>{title} tools are coming in a later phase</strong>
          <p>This frontend foundation phase includes navigation placeholders only. No placement workflow has been enabled here yet.</p>
        </div>
      </section>
    </>
  )
}
