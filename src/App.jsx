import { Navigate, Route, Routes, useParams } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import AuthLayout from './layouts/AuthLayout'
import MainLayout from './layouts/MainLayout'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import StudentDashboardPage from './pages/student/StudentDashboardPage'
import StudentProfilePage from './pages/student/StudentProfilePage'
import PlacementDrivesPage from './pages/student/PlacementDrivesPage'
import PlacementDriveDetailsPage from './pages/student/PlacementDriveDetailsPage'
import MyApplicationsPage from './pages/student/MyApplicationsPage'
import StudentRoundsPage from './pages/student/StudentRoundsPage'
import PlaceholderPage from './pages/PlaceholderPage'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminApplicationsPage from './pages/admin/AdminApplicationsPage'
import CompaniesPage from './pages/admin/CompaniesPage'
import CompanyFormPage from './pages/admin/CompanyFormPage'
import CompanyDetailsPage from './pages/admin/CompanyDetailsPage'
import AdminPlacementDrivesPage from './pages/admin/PlacementDrivesPage'
import PlacementDriveFormPage from './pages/admin/PlacementDriveFormPage'
import AdminPlacementDriveDetailsPage from './pages/admin/PlacementDriveDetailsPage'
import SelectionRoundsPage from './pages/admin/SelectionRoundsPage'
import SelectionRoundFormPage from './pages/admin/SelectionRoundFormPage'
import SelectionRoundDetailsPage from './pages/admin/SelectionRoundDetailsPage'
import RoundResultsPage from './pages/admin/RoundResultsPage'
import InterviewSchedulesPage from './pages/admin/InterviewSchedulesPage'
import InterviewManagementPage from './pages/admin/InterviewManagementPage'
import InterviewScheduleFormPage from './pages/admin/InterviewScheduleFormPage'
import InterviewScheduleDetailsPage from './pages/admin/InterviewScheduleDetailsPage'
import FinalDecisionsPage from './pages/admin/FinalDecisionsPage'
import FinalDecisionFormPage from './pages/admin/FinalDecisionFormPage'
import AdminFinalDecisionOverviewPage from './pages/admin/AdminFinalDecisionOverviewPage'
import AdminOfferOverviewPage from './pages/admin/AdminOfferOverviewPage'
import OfferListPage from './pages/admin/OfferListPage'
import OfferFormPage from './pages/admin/OfferFormPage'
import OfferDetailsPage from './pages/admin/OfferDetailsPage'
import DriveApplicationsPage from './pages/admin/DriveApplicationsPage'
import ApplicationDetailsPage from './pages/admin/ApplicationDetailsPage'
import RecommendationsPage from './pages/admin/RecommendationsPage'
import StudentInterviewsPage from './pages/student/StudentInterviewsPage'
import StudentFinalDecisionPage from './pages/student/StudentFinalDecisionPage'
import StudentOffersPage from './pages/student/StudentOffersPage'
import StudentOfferDetailsPage from './pages/student/StudentOfferDetailsPage'
import RecruiterDashboardPage from './pages/recruiter/RecruiterDashboardPage'
import RecruiterCompanyPage from './pages/recruiter/RecruiterCompanyPage'
import RecruiterDrivesPage from './pages/recruiter/RecruiterDrivesPage'
import RecruiterDriveDetailsPage from './pages/recruiter/RecruiterDriveDetailsPage'
import RecruiterRoundsPage from './pages/recruiter/RecruiterRoundsPage'
import RecruiterSchedulesPage from './pages/recruiter/RecruiterSchedulesPage'
import RecruiterApplicationsPage from './pages/recruiter/RecruiterApplicationsPage'
import NotificationsPage from './pages/notifications/NotificationsPage'
import ProtectedRoute from './components/ProtectedRoute'
import './App.css'

const roleRoutes = {
  STUDENT: '/student',
  TPO_ADMIN: '/admin',
  COMPANY_RECRUITER: '/recruiter',
  DEPARTMENT_COORDINATOR: '/coordinator',
}

function HomeRedirect() {
  const { isAuthenticated, user, loading } = useAuth()

  if (loading) return <div className="page-loading">Restoring your session...</div>
  return <Navigate to={isAuthenticated ? roleRoutes[user?.role] || '/login' : '/login'} replace />
}

function PlacementDriveDetailsRoute() {
  const { driveId } = useParams()
  return <PlacementDriveDetailsPage key={driveId} />
}

function App() {
  const dashboardRoutes = Object.entries(roleRoutes)

  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>
      {dashboardRoutes.map(([role, path]) => (
        <Route
          key={role}
          element={<ProtectedRoute allowedRoles={[role]} />}
        >
          <Route element={<MainLayout />}>
            <Route path={path} element={role === 'STUDENT'
              ? <StudentDashboardPage />
            : role === 'TPO_ADMIN'
            ? <AdminDashboardPage />
            : role === 'COMPANY_RECRUITER'
            ? <RecruiterDashboardPage />
            : <DashboardPage />} />
            {role === 'STUDENT' && (
              <>
                <Route path="/student/profile" element={<StudentProfilePage />} />
                <Route path="/student/drives" element={<PlacementDrivesPage />} />
                <Route path="/student/drives/:driveId" element={<PlacementDriveDetailsRoute />} />
                <Route path="/student/applications" element={<MyApplicationsPage />} />
                <Route path="/student/applications/:applicationId/rounds" element={<StudentRoundsPage />} />
                <Route path="/student/interviews" element={<StudentInterviewsPage />} />
                <Route path="/student/final-decision" element={<StudentFinalDecisionPage />} />
                <Route path="/student/final-decision/:applicationId" element={<StudentFinalDecisionPage />} />
                <Route path="/student/offers" element={<StudentOffersPage />} />
                <Route path="/student/offers/:offerId" element={<StudentOfferDetailsPage />} />
              </>
            )}
            {role === 'TPO_ADMIN' && (
              <>
                <Route path="/admin/companies" element={<CompaniesPage />} />
                <Route path="/admin/companies/new" element={<CompanyFormPage />} />
                <Route path="/admin/companies/:companyId/edit" element={<CompanyFormPage />} />
                <Route path="/admin/companies/:companyId" element={<CompanyDetailsPage />} />
                <Route path="/admin/applications" element={<AdminApplicationsPage />} />
                <Route path="/admin/recommendations" element={<RecommendationsPage />} />
                <Route path="/admin/drives" element={<AdminPlacementDrivesPage />} />
                <Route path="/admin/drives/new" element={<PlacementDriveFormPage />} />
                <Route path="/admin/drives/:driveId/edit" element={<PlacementDriveFormPage />} />
                <Route path="/admin/drives/:driveId/applications" element={<DriveApplicationsPage />} />
                <Route path="/admin/drives/:driveId/applications/:applicationId" element={<ApplicationDetailsPage />} />
                <Route path="/admin/drives/:driveId/applications/:applicationId/final-decision" element={<FinalDecisionFormPage />} />
                <Route path="/admin/drives/:driveId/applications/:applicationId/offer" element={<OfferFormPage />} />
                <Route path="/admin/final-decisions" element={<AdminFinalDecisionOverviewPage />} />
                <Route path="/admin/drives/:driveId/final-decisions" element={<FinalDecisionsPage />} />
                <Route path="/admin/offers" element={<AdminOfferOverviewPage />} />
                <Route path="/admin/drives/:driveId/offers" element={<OfferListPage />} />
                <Route path="/admin/offers/:offerId" element={<OfferDetailsPage />} />
                <Route path="/admin/offers/:offerId/edit" element={<OfferFormPage />} />
                <Route path="/admin/interviews" element={<InterviewManagementPage />} />
                <Route path="/admin/drives/:driveId/rounds" element={<SelectionRoundsPage />} />
                <Route path="/admin/drives/:driveId/rounds/new" element={<SelectionRoundFormPage />} />
                <Route path="/admin/drives/:driveId/rounds/:roundId/edit" element={<SelectionRoundFormPage />} />
                <Route path="/admin/drives/:driveId/rounds/:roundId/results" element={<RoundResultsPage />} />
                <Route path="/admin/drives/:driveId/rounds/:roundId/schedules" element={<InterviewSchedulesPage />} />
                <Route path="/admin/drives/:driveId/rounds/:roundId/schedules/new" element={<InterviewScheduleFormPage />} />
                <Route path="/admin/drives/:driveId/rounds/:roundId" element={<SelectionRoundDetailsPage />} />
                <Route path="/admin/schedules/:scheduleId" element={<InterviewScheduleDetailsPage />} />
                <Route path="/admin/schedules/:scheduleId/edit" element={<InterviewScheduleFormPage />} />
                <Route path="/admin/drives/:driveId" element={<AdminPlacementDriveDetailsPage />} />
              </>
            )}
            {role === 'COMPANY_RECRUITER' && (
              <>
                <Route path="/recruiter" element={<RecruiterDashboardPage />} />
                <Route path="/recruiter/company" element={<RecruiterCompanyPage />} />
                <Route path="/recruiter/drives" element={<RecruiterDrivesPage />} />
                <Route path="/recruiter/applications" element={<RecruiterApplicationsPage />} />
                <Route path="/recruiter/drives/:driveId" element={<RecruiterDriveDetailsPage />} />
                <Route path="/recruiter/rounds" element={<RecruiterRoundsPage />} />
                <Route path="/recruiter/schedules" element={<RecruiterSchedulesPage />} />
              </>
            )}
            <Route path={`${path}/*`} element={<PlaceholderPage />} />
          </Route>
        </Route>
      ))}
      <Route element={<ProtectedRoute allowedRoles={Object.keys(roleRoutes)} />}>
        <Route element={<MainLayout />}>
          <Route path="/notifications" element={<NotificationsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  )
}

export default App
