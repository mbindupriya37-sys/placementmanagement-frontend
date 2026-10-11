import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getApiErrorMessage } from '../../services/api'
import { getCompanies } from '../../services/companyService'
import {
  createPlacementDrive,
  getPlacementDriveById,
  updatePlacementDrive,
} from '../../services/placementDriveAdminService'
import { driveStatuses, employmentTypes, formatDriveStatus, formatEmploymentType } from '../../utils/placementDriveAdmin'

const blankForm = {
  companyId: '',
  driveTitle: '',
  jobRole: '',
  jobDescription: '',
  employmentType: '',
  location: '',
  minimumCgpa: '',
  maximumBacklogs: '',
  eligibleBranches: [],
  graduationYear: '',
  packageLpa: '',
  applicationStartDate: '',
  applicationEndDate: '',
  driveDate: '',
  status: 'DRAFT',
}

const commonBranches = ['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL', 'AI', 'AIML', 'DS']

export default function PlacementDriveFormPage() {
  const { driveId } = useParams()
  const navigate = useNavigate()
  const isEditing = Boolean(driveId)
  const [values, setValues] = useState(blankForm)
  const [companies, setCompanies] = useState([])
  const [companiesLoading, setCompaniesLoading] = useState(true)
  const [companiesError, setCompaniesError] = useState('')
  const [loadingDrive, setLoadingDrive] = useState(isEditing)
  const [loadError, setLoadError] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [customBranch, setCustomBranch] = useState('')

  useEffect(() => {
    let active = true
    getCompanies()
      .then((result) => {
        if (active) setCompanies(Array.isArray(result) ? result : [])
      })
      .catch((requestError) => {
        if (active) setCompaniesError(getApiErrorMessage(requestError))
      })
      .finally(() => {
        if (active) setCompaniesLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!isEditing) return undefined
    let active = true
    getPlacementDriveById(driveId)
      .then((drive) => {
        if (!active) return
        setValues({
          companyId: String(drive.companyId ?? ''),
          driveTitle: drive.driveTitle || '',
          jobRole: drive.jobRole || '',
          jobDescription: drive.jobDescription || '',
          employmentType: drive.employmentType || '',
          location: drive.location || '',
          minimumCgpa: drive.minimumCgpa ?? '',
          maximumBacklogs: drive.maximumBacklogs ?? '',
          eligibleBranches: Array.isArray(drive.eligibleBranches) ? drive.eligibleBranches : [],
          graduationYear: drive.graduationYear ?? '',
          packageLpa: drive.packageLpa ?? '',
          applicationStartDate: drive.applicationStartDate || '',
          applicationEndDate: drive.applicationEndDate || '',
          driveDate: drive.driveDate || '',
          status: drive.status || 'DRAFT',
        })
      })
      .catch((requestError) => {
        if (active) setLoadError(getApiErrorMessage(requestError))
      })
      .finally(() => {
        if (active) setLoadingDrive(false)
      })
    return () => {
      active = false
    }
  }, [driveId, isEditing])

  function handleChange(event) {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
    setFieldErrors((current) => ({ ...current, [name]: '' }))
    setError('')
  }

  function toggleBranch(branch) {
    setValues((current) => ({
      ...current,
      eligibleBranches: current.eligibleBranches.some((item) => item.toLowerCase() === branch.toLowerCase())
        ? current.eligibleBranches.filter((item) => item.toLowerCase() !== branch.toLowerCase())
        : [...current.eligibleBranches, branch],
    }))
    setFieldErrors((current) => ({ ...current, eligibleBranches: '' }))
  }

  function addCustomBranch() {
    const branch = customBranch.trim()
    if (!branch || values.eligibleBranches.some((item) => item.toLowerCase() === branch.toLowerCase())) return
    setValues((current) => ({ ...current, eligibleBranches: [...current.eligibleBranches, branch] }))
    setCustomBranch('')
    setFieldErrors((current) => ({ ...current, eligibleBranches: '' }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const errors = validateForm(values)
    setFieldErrors(errors)
    setError('')
    if (Object.keys(errors).length) return

    const payload = {
      ...values,
      companyId: Number(values.companyId),
      minimumCgpa: Number(values.minimumCgpa),
      maximumBacklogs: Number(values.maximumBacklogs),
      eligibleBranches: values.eligibleBranches.reduce((branches, value) => {
        const branch = value.trim()
        if (branch && !branches.some((existing) => existing.toLowerCase() === branch.toLowerCase())) {
          branches.push(branch)
        }
        return branches
      }, []),
      graduationYear: Number(values.graduationYear),
      packageLpa: Number(values.packageLpa),
    }

    setSaving(true)
    try {
      const drive = isEditing
        ? await updatePlacementDrive(driveId, payload)
        : await createPlacementDrive(payload)
      const targetId = drive?.id || driveId
      if (targetId) {
        navigate(`/admin/drives/${targetId}`, {
          replace: true,
          state: { success: isEditing ? 'Placement drive updated successfully.' : 'Placement drive created successfully.' },
        })
      } else {
        navigate('/admin/drives', {
          replace: true,
          state: { success: isEditing ? 'Placement drive updated successfully.' : 'Placement drive created successfully.' },
        })
      }
    } catch (requestError) {
      setError(getApiErrorMessage(requestError))
    } finally {
      setSaving(false)
    }
  }

  if (loadingDrive || companiesLoading) {
    return <div className="content-loading" role="status">
      {loadingDrive ? 'Loading placement drive...' : 'Loading companies...'}
    </div>
  }
  if (loadError) {
    return (
      <div className="company-form-error">
        <h1 className="page-heading">Unable to load placement drive</h1>
        <div className="alert" role="alert">{loadError}</div>
        <Link className="secondary-button" to="/admin/drives">Back to Placement Drives</Link>
      </div>
    )
  }
  if (companiesError) {
    return (
      <div className="company-form-error">
        <h1 className="page-heading">Unable to load companies</h1>
        <div className="alert" role="alert">{companiesError}</div>
        <Link className="secondary-button" to="/admin/companies">Manage Companies</Link>
      </div>
    )
  }
  if (!companies.length) {
    return (
      <div className="company-form-error">
        <h1 className="page-heading">No companies available</h1>
        <p className="page-description">No companies available. Please create a company before creating a placement drive.</p>
        <Link className="primary-button" to="/admin/companies">Manage Companies</Link>
      </div>
    )
  }

  return (
    <div className="admin-drive-form-page">
      <Link className="back-link" to={isEditing ? `/admin/drives/${driveId}` : '/admin/drives'}>
        ← {isEditing ? 'Back to placement drive' : 'Back to Placement Drives'}
      </Link>
      <header className="admin-page-heading">
        <div>
          <p className="eyebrow">{isEditing ? 'DRIVE MANAGEMENT' : 'NEW OPPORTUNITY'}</p>
          <h1 className="page-heading">{isEditing ? 'Edit Placement Drive' : 'Create Placement Drive'}</h1>
          <p className="page-description">
            {isEditing ? 'Update the job, eligibility criteria, and schedule.' : 'Set up a recruitment opportunity for your campus.'}
          </p>
        </div>
      </header>
      {error && <div className="alert admin-drive-alert" role="alert">{error}</div>}
      <form className="admin-drive-form-card" onSubmit={handleSubmit} noValidate>
        <FormSection title="Company & Job" description="Choose a company and enter the opportunity details.">
          <FormField label="Company" name="companyId" required error={fieldErrors.companyId} wide>
            <select id="companyId" name="companyId" value={values.companyId} onChange={handleChange}>
              <option value="">Select a company</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>{company.companyName}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Drive title" name="driveTitle" required error={fieldErrors.driveTitle}>
            <input id="driveTitle" name="driveTitle" maxLength={200} value={values.driveTitle}
              onChange={handleChange} placeholder="Enter drive title" />
          </FormField>
          <FormField label="Job role" name="jobRole" required error={fieldErrors.jobRole}>
            <input id="jobRole" name="jobRole" maxLength={150} value={values.jobRole}
              onChange={handleChange} placeholder="Enter job role" />
          </FormField>
          <FormField label="Employment type" name="employmentType" required error={fieldErrors.employmentType}>
            <select id="employmentType" name="employmentType" value={values.employmentType} onChange={handleChange}>
              <option value="">Select type</option>
              {employmentTypes.map((type) => (
                <option key={type} value={type}>{formatEmploymentType(type)}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Location" name="location" required error={fieldErrors.location}>
            <input id="location" name="location" maxLength={200} value={values.location}
              onChange={handleChange} placeholder="Enter location" />
          </FormField>
          <FormField label="Package (LPA)" name="packageLpa" required error={fieldErrors.packageLpa}>
            <input id="packageLpa" name="packageLpa" type="number" min="0" step="0.01"
              value={values.packageLpa} onChange={handleChange} placeholder="0" />
          </FormField>
          <FormField label="Job description" name="jobDescription" error={fieldErrors.jobDescription} wide>
            <textarea id="jobDescription" name="jobDescription" rows="4" maxLength={20000}
              value={values.jobDescription} onChange={handleChange} placeholder="Describe the role and responsibilities" />
          </FormField>
        </FormSection>

        <FormSection title="Eligibility Criteria" description="Store the requirements used by the backend eligibility engine.">
          <FormField label="Minimum CGPA" name="minimumCgpa" required error={fieldErrors.minimumCgpa}>
            <input id="minimumCgpa" name="minimumCgpa" type="number" min="0" max="10" step="0.01"
              value={values.minimumCgpa} onChange={handleChange} placeholder="0.00" />
          </FormField>
          <FormField label="Maximum backlogs" name="maximumBacklogs" required error={fieldErrors.maximumBacklogs}>
            <input id="maximumBacklogs" name="maximumBacklogs" type="number" min="0" step="1"
              value={values.maximumBacklogs} onChange={handleChange} placeholder="0" />
          </FormField>
          <FormField label="Graduation year" name="graduationYear" required error={fieldErrors.graduationYear}>
            <input id="graduationYear" name="graduationYear" type="number" min="2000"
              max={Math.min(2100, new Date().getFullYear() + 10)} step="1"
              value={values.graduationYear} onChange={handleChange} placeholder="Year" />
          </FormField>
          <div className="company-form-field company-form-field-wide">
            <span className="drive-branch-label">Eligible branches <span aria-hidden="true">*</span></span>
            <div className="drive-branch-options">
              {commonBranches.map((branch) => (
                <label className="drive-branch-option" key={branch}>
                  <input type="checkbox" checked={values.eligibleBranches.some((item) => item === branch)}
                    onChange={() => toggleBranch(branch)} />
                  {branch}
                </label>
              ))}
            </div>
            {values.eligibleBranches.filter((branch) => !commonBranches.includes(branch)).map((branch) => (
              <span className="drive-custom-branch" key={branch}>
                {branch}
                <button type="button" aria-label={`Remove ${branch}`} onClick={() => toggleBranch(branch)}>×</button>
              </span>
            ))}
            <div className="drive-add-branch">
              <input value={customBranch} onChange={(event) => setCustomBranch(event.target.value)}
                aria-label="Add another eligible branch" maxLength={100} placeholder="Add another branch" />
              <button className="secondary-button" type="button" disabled={!customBranch.trim()}
                onClick={addCustomBranch}>Add branch</button>
            </div>
            {fieldErrors.eligibleBranches && <small className="field-error">{fieldErrors.eligibleBranches}</small>}
          </div>
        </FormSection>

        <FormSection title="Important Dates" description="Dates are submitted as calendar dates without timezone conversion.">
          <FormField label="Application start date" name="applicationStartDate" required error={fieldErrors.applicationStartDate}>
            <input id="applicationStartDate" name="applicationStartDate" type="date"
              value={values.applicationStartDate} onChange={handleChange} />
          </FormField>
          <FormField label="Application end date" name="applicationEndDate" required error={fieldErrors.applicationEndDate}>
            <input id="applicationEndDate" name="applicationEndDate" type="date"
              value={values.applicationEndDate} onChange={handleChange} />
          </FormField>
          <FormField label="Drive date" name="driveDate" required error={fieldErrors.driveDate}>
            <input id="driveDate" name="driveDate" type="date" value={values.driveDate} onChange={handleChange} />
          </FormField>
        </FormSection>

        <FormSection title="Status" description="New drives remain in draft until you choose to change their status.">
          <FormField label="Drive status" name="status" required error={fieldErrors.status}>
            <select id="status" name="status" value={values.status} onChange={handleChange}>
              {driveStatuses.map((status) => (
                <option key={status} value={status}>{formatDriveStatus(status)}</option>
              ))}
            </select>
          </FormField>
        </FormSection>
        <footer className="company-form-footer">
          <Link className="secondary-button" to={isEditing ? `/admin/drives/${driveId}` : '/admin/drives'}>Cancel</Link>
          <button className="primary-button" type="submit" disabled={saving}>
            {saving ? (isEditing ? 'Saving...' : 'Creating...') : (isEditing ? 'Save Changes' : 'Create Drive')}
          </button>
        </footer>
      </form>
    </div>
  )
}

function validateForm(values) {
  const errors = {}
  if (!values.companyId) errors.companyId = 'Select a company.'
  if (!values.driveTitle.trim()) errors.driveTitle = 'Drive title is required.'
  if (values.driveTitle.length > 200) errors.driveTitle = 'Drive title must be 200 characters or fewer.'
  if (!values.jobRole.trim()) errors.jobRole = 'Job role is required.'
  if (values.jobRole.length > 150) errors.jobRole = 'Job role must be 150 characters or fewer.'
  if (values.jobDescription.length > 20000) errors.jobDescription = 'Description must be 20,000 characters or fewer.'
  if (!values.employmentType) errors.employmentType = 'Select an employment type.'
  if (!values.location.trim()) errors.location = 'Location is required.'
  if (values.location.length > 200) errors.location = 'Location must be 200 characters or fewer.'
  if (!isNumberInRange(values.minimumCgpa, 0, 10)) errors.minimumCgpa = 'Minimum CGPA must be between 0 and 10.'
  if (!isNumberInRange(values.maximumBacklogs, 0)) errors.maximumBacklogs = 'Maximum backlogs must be zero or greater.'
  else if (!Number.isInteger(Number(values.maximumBacklogs))) errors.maximumBacklogs = 'Maximum backlogs must be a whole number.'
  if (!values.eligibleBranches.length) errors.eligibleBranches = 'Select or add at least one eligible branch.'
  const maximumGraduationYear = Math.min(2100, new Date().getFullYear() + 10)
  if (!Number.isInteger(Number(values.graduationYear)) || Number(values.graduationYear) < 2000
    || Number(values.graduationYear) > maximumGraduationYear) {
    errors.graduationYear = `Graduation year must be from 2000 through ${maximumGraduationYear}.`
  }
  if (!isNumberInRange(values.packageLpa, 0)) errors.packageLpa = 'Package must be zero or greater.'
  if (!values.applicationStartDate) errors.applicationStartDate = 'Application start date is required.'
  if (!values.applicationEndDate) errors.applicationEndDate = 'Application end date is required.'
  if (!values.driveDate) errors.driveDate = 'Drive date is required.'
  if (values.applicationStartDate && values.applicationEndDate
    && values.applicationStartDate >= values.applicationEndDate) {
    errors.applicationEndDate = 'Application end date must be after the start date.'
  }
  if (values.applicationEndDate && values.driveDate && values.applicationEndDate > values.driveDate) {
    errors.driveDate = 'Drive date must be on or after the application end date.'
  }
  if (!driveStatuses.includes(values.status)) errors.status = 'Select a valid drive status.'
  return errors
}

function isNumberInRange(value, minimum, maximum = Number.POSITIVE_INFINITY) {
  if (value === '' || value === null || value === undefined) return false
  const number = Number(value)
  return Number.isFinite(number) && number >= minimum && number <= maximum
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

function FormField({ label, name, required = false, error, wide = false, children }) {
  return (
    <div className={`company-form-field ${wide ? 'company-form-field-wide' : ''}`}>
      <label htmlFor={name}>{label}{required && <span aria-hidden="true"> *</span>}</label>
      {children}
      {error && <small className="field-error">{error}</small>}
    </div>
  )
}
