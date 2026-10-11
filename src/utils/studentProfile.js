export function getProfileCompletion(profile) {
  const fields = [
    profile?.phoneNumber,
    profile?.college,
    profile?.branch,
    profile?.graduationYear,
    profile?.cgpa,
    profile?.backlogs,
    Array.isArray(profile?.skills) && profile.skills.length > 0,
    profile?.resumeUrl,
  ]
  const completed = fields.filter((value) => {
    if (typeof value === 'string') return value.trim().length > 0
    return value !== null && value !== undefined && value !== false
  }).length
  return Math.round((completed / fields.length) * 100)
}
