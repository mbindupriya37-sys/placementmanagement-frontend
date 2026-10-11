import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import {
  getUnreadNotificationCount,
  NOTIFICATION_COUNT_CHANGED_EVENT,
} from '../services/notificationService'

const navigationByRole = {
  STUDENT: [
    ['Dashboard', ''],
    ['Profile', 'profile'],
    ['Placement Drives', 'drives'],
    ['My Applications', 'applications'],
    ['Final Decision', 'final-decision'],
    ['Interviews', 'interviews'],
    ['Offers', 'offers'],
    ['Notifications', 'notifications'],
  ],
  TPO_ADMIN: [
    ['Dashboard', ''],
    ['Companies', 'companies'],
    ['Placement Drives', 'drives'],
    ['Recommendations', 'recommendations'],
    ['Final Decisions', 'final-decisions'],
    ['Offers', 'offers'],
    ['Interview Management', 'interviews'],
  ],
  COMPANY_RECRUITER: [
    ['Dashboard', ''],
    ['Company', 'company'],
    ['Placement Drives', 'drives'],
    ['Applications', 'applications'],
    ['Selection Rounds', 'rounds'],
    ['Interviews', 'schedules'],
    ['Notifications', 'notifications'],
  ],
  DEPARTMENT_COORDINATOR: [
    ['Dashboard', ''],
    ['Drives', 'drives'],
    ['Applications', 'applications'],
    ['Selection', 'selection'],
    ['Interviews', 'interviews'],
    ['Notifications', 'notifications'],
  ],
}

const roleLabels = {
  STUDENT: 'Student',
  TPO_ADMIN: 'TPO administrator',
  COMPANY_RECRUITER: 'Company recruiter',
  DEPARTMENT_COORDINATOR: 'Department coordinator',
}

const roleBasePaths = {
  STUDENT: 'student',
  TPO_ADMIN: 'admin',
  COMPANY_RECRUITER: 'recruiter',
  DEPARTMENT_COORDINATOR: 'coordinator',
}

const notificationRoles = Object.keys(navigationByRole)
const symbols = ['⌂', '◈', '▣', '▤', '◇', '◷', '✉', '●']

export default function MainLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const basePath = location.pathname === '/notifications'
    ? roleBasePaths[user?.role]
    : location.pathname.split('/')[1]
  const navigation = navigationByRole[user?.role] || []
  const currentPath = location.pathname.split('/').filter(Boolean).at(-1)
  const canViewNotifications = notificationRoles.includes(user?.role)

  useEffect(() => {
    let isMounted = true
    let latestRequest = 0

    async function loadUnreadCount() {
      if (!canViewNotifications) return
      const requestId = ++latestRequest
      try {
        const count = await getUnreadNotificationCount()
        if (isMounted && requestId === latestRequest) {
          setUnreadCount(Number(count) || 0)
        }
      } catch {
        if (isMounted && requestId === latestRequest) {
          setUnreadCount(0)
        }
      }
    }

    function refreshWhenVisible() {
      if (document.visibilityState === 'visible') {
        loadUnreadCount()
      }
    }

    loadUnreadCount()
    window.addEventListener('focus', loadUnreadCount)
    window.addEventListener(NOTIFICATION_COUNT_CHANGED_EVENT, loadUnreadCount)
    document.addEventListener('visibilitychange', refreshWhenVisible)
    return () => {
      isMounted = false
      latestRequest += 1
      window.removeEventListener('focus', loadUnreadCount)
      window.removeEventListener(NOTIFICATION_COUNT_CHANGED_EVENT, loadUnreadCount)
      document.removeEventListener('visibilitychange', refreshWhenVisible)
    }
  }, [canViewNotifications, location.pathname, user?.email, user?.role])
  const isDriveDetails = basePath === 'student'
    && location.pathname.startsWith('/student/drives/')
    && currentPath !== 'drives'
  const isStudentRounds = basePath === 'student'
    && location.pathname.includes('/applications/')
  const isAdminDriveApplications = basePath === 'admin'
    && location.pathname.includes('/applications')
  const isAdminSelection = basePath === 'admin'
    && location.pathname.includes('/rounds')
  const isAdminSchedules = basePath === 'admin'
    && location.pathname.includes('/schedules')
  const isStudentInterviews = basePath === 'student'
    && location.pathname === '/student/interviews'
  const isStudentOffers = basePath === 'student' && location.pathname.startsWith('/student/offers')
  const isAdminOffers = basePath === 'admin' && location.pathname.includes('/offers')
  const isAdminInterviewManagement = basePath === 'admin' && location.pathname === '/admin/interviews'
  const isStudentFinalDecision = basePath === 'student' && location.pathname.startsWith('/student/final')
  const isRecruiterCompany = basePath === 'recruiter' && location.pathname === '/recruiter/company'
  const isRecruiterDrives = basePath === 'recruiter' && (location.pathname === '/recruiter/drives' || location.pathname.startsWith('/recruiter/drives/'))
  const isRecruiterDriveDetails = basePath === 'recruiter'
    && location.pathname.startsWith('/recruiter/drives/')
    && currentPath !== 'drives'
  const isRecruiterRounds = basePath === 'recruiter' && location.pathname === '/recruiter/rounds'
  const isRecruiterSchedules = basePath === 'recruiter' && location.pathname === '/recruiter/schedules'
  const isNotificationsPage = location.pathname === '/notifications'
  const pageTitle = isNotificationsPage
    ? 'Notifications'
    : isRecruiterCompany
    ? 'Company'
    : isRecruiterDriveDetails
    ? 'Drive Details'
    : isRecruiterDrives
    ? 'Placement Drives'
    : isRecruiterRounds
    ? 'Selection Rounds'
    : isRecruiterSchedules
    ? 'Interviews'
    : isDriveDetails
    ? 'Drive Details'
    : isStudentRounds
    ? 'Selection Rounds'
    : isStudentInterviews
    ? 'Interviews'
    : isStudentOffers
    ? 'Offers'
    : isStudentFinalDecision
    ? 'Final Decision'
    : isAdminDriveApplications
    ? location.pathname.split('/').filter(Boolean).at(-1) === 'applications'
      ? 'Drive Applications'
      : 'Application Details'
    : isAdminSelection
    ? currentPath === 'results'
      ? 'Round Results'
      : currentPath === 'edit'
        ? 'Edit Selection Round'
        : currentPath === 'new'
          ? 'Create Selection Round'
          : currentPath === 'rounds' ? 'Selection Rounds' : 'Selection Round Details'
    : isAdminSchedules
    ? currentPath === 'new'
      ? 'New Interview Schedule'
      : currentPath === 'edit'
        ? 'Edit Interview Schedule'
        : currentPath === 'schedules'
          ? 'Interview Schedules'
          : 'Interview Schedule Details'
    : isAdminOffers
    ? 'Offers'
    : isAdminInterviewManagement
    ? 'Interview Management'
    : basePath === 'admin' && location.pathname.startsWith('/admin/drives/')
    ? currentPath === 'edit'
      ? 'Edit Placement Drive'
      : currentPath === 'new' ? 'Create Placement Drive' : 'Placement Drive Details'
    : currentPath && currentPath !== basePath
    ? navigation.find(([, path]) => path === currentPath)?.[0] || 'Workspace'
    : 'Dashboard'

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? 'is-open' : ''}`}>
        <div className="brand-lockup">
          <span className="brand-mark">P</span>
          <span>PlacementOS</span>
        </div>
        <p className="nav-label">Workspace</p>
        <nav className="side-nav" aria-label="Main navigation">
          {navigation.map(([label, path], index) => {
            const isNotificationsLink = path === 'notifications'
            const to = isNotificationsLink ? '/notifications' : path ? `/${basePath}/${path}` : `/${basePath}`
            return (
              <NavLink
                key={label}
                to={to}
                end={!path || isNotificationsLink}
                onClick={() => setMenuOpen(false)}
                className={({ isActive: navIsActive }) => navIsActive ? 'active' : ''}
              >
                <span className="nav-symbol" aria-hidden="true">{isNotificationsLink ? '🔔' : symbols[index % symbols.length]}</span>
                <span>{label}</span>
                {isNotificationsLink && unreadCount > 0 && (
                  <span className="nav-badge">{unreadCount}</span>
                )}
              </NavLink>
            )
          })}
        </nav>
        <div className="sidebar-spacer" />
        <div className="sidebar-help">
          <strong>Placement support</strong>
          <p>Your placement journey, organized in one place.</p>
        </div>
      </aside>
      <div className="main-column">
        <header className="topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="mobile-menu-button"
              aria-label="Toggle navigation menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              ☰
            </button>
            <div className="topbar-title">
              PlacementOS workspace
              <strong>{pageTitle}</strong>
            </div>
          </div>
          <div className="user-menu">
            {canViewNotifications && (
              <button
                type="button"
                className="header-notification-button"
                aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
                title="Notifications"
                onClick={() => navigate('/notifications')}
              >
                <span aria-hidden="true">🔔</span>
                {unreadCount > 0 && <span className="header-notification-badge" aria-hidden="true">{unreadCount}</span>}
              </button>
            )}
            <div className="avatar" aria-hidden="true">
              {(user?.name || user?.email || 'U').slice(0, 1).toUpperCase()}
            </div>
            <div className="user-meta">
              <strong>{user?.name || user?.email}</strong>
              <span>{roleLabels[user?.role] || user?.role}</span>
            </div>
            <button type="button" className="logout-button" onClick={handleLogout}>Log out</button>
          </div>
        </header>
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
