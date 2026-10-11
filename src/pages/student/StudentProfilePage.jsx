import { useEffect, useMemo, useState } from 'react'
import { getApiErrorMessage } from '../../services/api'
import {
  createProfile,
  getMyResume,
  getMyProfile,
  isProfileMissingError,
  uploadMyResume,
  updateProfile,
} from '../../services/studentService'
import { getProfileCompletion } from '../../utils/studentProfile'

const MAX_RESUME_SIZE = 5 * 1024 * 1024
const UPLOADED_RESUME_PREFIX = '/api/student/profile/resume/'

const emptyProfile = {
  phoneNumber: '',
  college: '',
  branch: '',
  graduationYear: '',
  cgpa: '',
  backlogs: '',
  skills: '',
}

function getResumeOpenUrl(resumeUrl, previewUrl) {
  return resumeUrl?.startsWith(UPLOADED_RESUME_PREFIX) ? previewUrl : resumeUrl
}

function getResumeStatus(resumeUrl, previewState) {
  if (!resumeUrl?.startsWith(UPLOADED_RESUME_PREFIX)) return 'Resume link saved'
  if (previewState === 'error') return 'Resume could not be opened'
  if (previewState === 'loaded') return 'Resume uploaded'
  return 'Loading resume...'
}

function getResumeFilename(resumeUrl) {
  const path = String(resumeUrl || '').split(/[?#]/)[0]
  const storedFilename = path.split('/').filter(Boolean).at(-1) || 'Resume PDF'
  const filename = storedFilename.replace(/^[0-9a-f-]{36}-/i, '')
  try {
    return decodeURIComponent(filename)
  } catch {
    return filename
  }
}

function toFormValues(profile) {
  return {
    phoneNumber: profile.phoneNumber || '',
    college: profile.college || '',
    branch: profile.branch || '',
    graduationYear: profile.graduationYear ?? '',
    cgpa: profile.cgpa ?? '',
    backlogs: profile.backlogs ?? '',
    skills: Array.isArray(profile.skills) ? profile.skills.join(', ') : '',
  }
}

function validateProfile(values) {
  const errors = {}
  const year = Number(values.graduationYear)
  const cgpa = Number(values.cgpa)
  const backlogs = Number(values.backlogs)
  const skills = values.skills.split(',').map((skill) => skill.trim()).filter(Boolean)

  if (!values.phoneNumber.trim()) errors.phoneNumber = 'Phone number is required.'
  else if (!/^\+?[0-9() .-]{7,20}$/.test(values.phoneNumber.trim())) {
    errors.phoneNumber = 'Enter a valid phone number.'
  }
  if (!values.college.trim()) errors.college = 'College is required.'
  if (!values.branch.trim()) errors.branch = 'Branch is required.'
  if (!Number.isInteger(year) || year < 1900 || year > 2100) {
    errors.graduationYear = 'Enter a graduation year between 1900 and 2100.'
  }
  if (!Number.isFinite(cgpa) || cgpa < 0 || cgpa > 10) {
    errors.cgpa = 'CGPA must be between 0 and 10.'
  }
  if (!Number.isInteger(backlogs) || backlogs < 0) {
    errors.backlogs = 'Backlogs must be a non-negative whole number.'
  }
  if (!skills.length) errors.skills = 'Add at least one skill, separated by commas.'
  else if (skills.some((skill) => skill.length > 100) || skills.length > 50) {
    errors.skills = 'Use up to 50 skills, with no skill longer than 100 characters.'
  }
  return { errors, skills, year, cgpa, backlogs }
}

export default function StudentProfilePage() {
  const [profile, setProfile] = useState(null)
  const [values, setValues] = useState(emptyProfile)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [pageError, setPageError] = useState('')
  const [formError, setFormError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [success, setSuccess] = useState('')
  const [loadAttempt, setLoadAttempt] = useState(0)
  const [uploadingResume, setUploadingResume] = useState(false)
  const [resumeError, setResumeError] = useState('')
  const [resumeSuccess, setResumeSuccess] = useState('')
  const [selectedResumeFilename, setSelectedResumeFilename] = useState('')
  const [resumePreviewUrl, setResumePreviewUrl] = useState('')
  const [resumePreviewState, setResumePreviewState] = useState('idle')

  useEffect(() => {
    let active = true
    getMyProfile()
      .then((loadedProfile) => {
        if (!active) return
        setProfile(loadedProfile)
        setValues(toFormValues(loadedProfile))
      })
      .catch((error) => {
        if (!active) return
        if (isProfileMissingError(error)) {
          setProfile(null)
          return
        }
        setPageError(getApiErrorMessage(error))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [loadAttempt])

  useEffect(() => {
    let active = true
    let objectUrl = ''
    const resumeUrl = profile?.resumeUrl || ''

    if (!resumeUrl.startsWith(UPLOADED_RESUME_PREFIX)) return undefined
    const filename = resumeUrl.slice(UPLOADED_RESUME_PREFIX.length)
    getMyResume(filename)
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob)
        if (!active) {
          URL.revokeObjectURL(objectUrl)
          return
        }
        setResumePreviewUrl(objectUrl)
        setResumePreviewState('loaded')
      })
      .catch((error) => {
        if (!active) return
        setResumePreviewUrl('')
        setResumePreviewState('error')
        setResumeError(getApiErrorMessage(error))
      })

    return () => {
      active = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [profile?.resumeUrl])

  const completion = useMemo(
    () => getProfileCompletion({
      ...values,
      skills: values.skills.split(',').map((skill) => skill.trim()).filter(Boolean),
    }),
    [values],
  )

  function retryLoad() {
    setLoading(true)
    setPageError('')
    setLoadAttempt((attempt) => attempt + 1)
  }

  function handleChange(event) {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
    setFieldErrors((current) => ({ ...current, [name]: '' }))
    setFormError('')
    setSuccess('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError('')
    setSuccess('')
    const validation = validateProfile(values)
    setFieldErrors(validation.errors)
    if (Object.keys(validation.errors).length) return

    const payload = {
      phoneNumber: values.phoneNumber.trim(),
      college: values.college.trim(),
      branch: values.branch.trim(),
      graduationYear: validation.year,
      cgpa: validation.cgpa,
      backlogs: validation.backlogs,
      skills: validation.skills,
    }

    setSaving(true)
    try {
      const savedProfile = profile
        ? await updateProfile(payload)
        : await createProfile(payload)
      setProfile(savedProfile)
      setValues(toFormValues(savedProfile))
      setSuccess(profile ? 'Profile updated successfully.' : 'Profile created successfully.')
    } catch (error) {
      setFormError(getApiErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  async function handleResumeUpload(event) {
    const file = event.target.files?.[0]
    if (!file) return

    setSelectedResumeFilename(file.name)
    setResumeError('')
    setResumeSuccess('')
    if (!profile) {
      setResumeError('Save your profile before uploading a resume.')
      return
    }

    const hasPdfExtension = file.name.toLowerCase().endsWith('.pdf')
    if (!hasPdfExtension || (file.type && file.type !== 'application/pdf')) {
      setResumeError('Choose a PDF file.')
      return
    }
    if (file.size > MAX_RESUME_SIZE) {
      setResumeError('Resume PDF must not exceed 5 MB.')
      return
    }

    setUploadingResume(true)
    setResumePreviewUrl('')
    setResumePreviewState('idle')
    try {
      const updatedProfile = await uploadMyResume(file)
      setProfile(updatedProfile)
      setResumeSuccess('Resume uploaded successfully.')
      event.target.value = ''
    } catch (error) {
      setResumeError(getApiErrorMessage(error))
    } finally {
      setUploadingResume(false)
    }
  }

  if (loading) {
    return <div className="content-loading" role="status">Loading profile...</div>
  }

  if (pageError) {
    return (
      <section className="profile-state-card">
        <h1 className="page-heading">Student Profile</h1>
        <div className="alert profile-alert" role="alert">{pageError}</div>
        <button type="button" className="secondary-button" onClick={retryLoad}>
          Try again
        </button>
      </section>
    )
  }

  return (
    <div className="profile-page">
      <header className="profile-page-heading">
        <div>
          <h1 className="page-heading">{profile ? 'Your Student Profile' : 'Complete Your Profile'}</h1>
          <p className="page-description">
            Keep your academic details current for your placement journey.
          </p>
        </div>
        <div className="completion-card" aria-label={`Profile completion ${completion}%`}>
          <div className="completion-heading">
            <span>Profile Completion</span>
            <strong>{completion}%</strong>
          </div>
          <div className="progress-track" role="progressbar" aria-valuenow={completion} aria-valuemin="0" aria-valuemax="100">
            <span style={{ width: `${completion}%` }} />
          </div>
        </div>
      </header>

      {!profile && (
        <div className="profile-empty-banner">
          Add your details below to create your student profile.
        </div>
      )}
      {success && <div className="success-banner" role="status">{success}</div>}
      {formError && <div className="alert profile-alert" role="alert">{formError}</div>}

      <form className="profile-form" onSubmit={handleSubmit} noValidate>
        <section className="profile-section">
          <div className="profile-section-heading">
            <span className="profile-section-icon" aria-hidden="true">01</span>
            <div>
              <h2>Personal Information</h2>
              <p>How the placement office can reach you.</p>
            </div>
          </div>
          <div className="profile-fields profile-fields-one">
            <Field label="Phone Number" name="phoneNumber" value={values.phoneNumber}
              onChange={handleChange} error={fieldErrors.phoneNumber}
              inputProps={{ type: 'tel', autoComplete: 'tel', placeholder: '+1 555 123 4567' }} />
          </div>
        </section>

        <section className="profile-section">
          <div className="profile-section-heading">
            <span className="profile-section-icon" aria-hidden="true">02</span>
            <div>
              <h2>Academic Information</h2>
              <p>Your current education and academic record.</p>
            </div>
          </div>
          <div className="profile-fields">
            <Field label="College" name="college" value={values.college} onChange={handleChange}
              error={fieldErrors.college} inputProps={{ placeholder: 'Your college or university', maxLength: 150 }} />
            <Field label="Branch" name="branch" value={values.branch} onChange={handleChange}
              error={fieldErrors.branch} inputProps={{ placeholder: 'e.g. Computer Science', maxLength: 100 }} />
            <Field label="Graduation Year" name="graduationYear" value={values.graduationYear}
              onChange={handleChange} error={fieldErrors.graduationYear}
              inputProps={{ type: 'number', min: 1900, max: 2100, step: 1, placeholder: '2027' }} />
            <Field label="CGPA (out of 10)" name="cgpa" value={values.cgpa} onChange={handleChange}
              error={fieldErrors.cgpa} inputProps={{ type: 'number', min: 0, max: 10, step: '0.01', placeholder: '8.5' }} />
            <Field label="Backlogs" name="backlogs" value={values.backlogs} onChange={handleChange}
              error={fieldErrors.backlogs} inputProps={{ type: 'number', min: 0, step: 1, placeholder: '0' }} />
          </div>
        </section>

        <section className="profile-section">
          <div className="profile-section-heading">
            <span className="profile-section-icon" aria-hidden="true">03</span>
            <div>
              <h2>Skills & Resume</h2>
              <p>Add your skills and upload a PDF resume.</p>
            </div>
          </div>
          <div className="profile-fields profile-fields-one">
            <div className="profile-field">
              <label htmlFor="skills">Skills <span>Separate each skill with a comma</span></label>
              <textarea id="skills" name="skills" rows="3" value={values.skills}
                onChange={handleChange} placeholder="Java, React, SQL" maxLength={5200}
                aria-invalid={Boolean(fieldErrors.skills)} />
              {fieldErrors.skills && <small className="field-error">{fieldErrors.skills}</small>}
            </div>
            <div className="profile-resume-control">
              <label htmlFor="resume-upload">Resume PDF <span>PDF only, up to 5 MB</span></label>
              {profile?.resumeUrl ? (
                <div className="profile-resume-current">
                  <span className="profile-resume-icon" aria-hidden="true">PDF</span>
                  <div className="profile-resume-details">
                    <strong>{getResumeFilename(profile.resumeUrl)}</strong>
                    <small>{getResumeStatus(profile.resumeUrl, resumePreviewState)}</small>
                  </div>
                  {getResumeOpenUrl(profile.resumeUrl, resumePreviewUrl) && (
                    <a className="secondary-button profile-resume-open"
                      href={getResumeOpenUrl(profile.resumeUrl, resumePreviewUrl)}
                      target="_blank" rel="noreferrer">
                      Open
                    </a>
                  )}
                </div>
              ) : (
                <p className="profile-resume-empty">No resume uploaded yet.</p>
              )}
              {!profile && <small className="profile-resume-status">Save your profile before uploading a resume.</small>}
              <input id="resume-upload" className="profile-resume-input" type="file"
                accept=".pdf,application/pdf" onChange={handleResumeUpload} />
              {selectedResumeFilename && (
                <small className="profile-resume-status" aria-live="polite">
                  Selected file: {selectedResumeFilename}
                </small>
              )}
              {uploadingResume && <small className="profile-resume-status" role="status">Uploading resume...</small>}
              {resumeSuccess && <small className="profile-resume-status profile-resume-success" role="status">{resumeSuccess}</small>}
              {(resumeError || resumePreviewState === 'error') && (
                <small className="field-error" role="alert">{resumeError || 'Unable to load your resume.'}</small>
              )}
            </div>
          </div>
        </section>

        <footer className="profile-form-footer">
          <p>Your profile is visible only through authenticated PlacementOS services.</p>
          <button className="primary-button" type="submit" disabled={saving || uploadingResume}>
            {saving ? 'Saving profile...' : profile ? 'Update Profile' : 'Save Profile'}
          </button>
        </footer>
      </form>
    </div>
  )
}

function Field({ label, name, value, onChange, error, inputProps = {} }) {
  return (
    <div className="profile-field">
      <label htmlFor={name}>{label}</label>
      <input id={name} name={name} value={value} onChange={onChange}
        aria-invalid={Boolean(error)} {...inputProps} />
      {error && <small className="field-error">{error}</small>}
    </div>
  )
}
