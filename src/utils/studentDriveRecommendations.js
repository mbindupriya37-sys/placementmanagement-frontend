function normalizeSkill(value) {
  return String(value || '').trim().toLocaleLowerCase()
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function getDriveSkillMatches(profileSkills, drive) {
  const driveText = `${drive.jobRole || ''} ${drive.jobDescription || ''}`.toLocaleLowerCase()
  return (Array.isArray(profileSkills) ? profileSkills : [])
    .map((skill) => String(skill || '').trim())
    .filter(Boolean)
    .filter((skill) => {
      const expression = new RegExp(`(^|[^a-z0-9+#.])${escapeRegExp(skill.toLocaleLowerCase())}($|[^a-z0-9+#.])`, 'i')
      return expression.test(driveText)
    })
    .filter((skill, index, matches) =>
      matches.findIndex((match) => normalizeSkill(match) === normalizeSkill(skill)) === index)
}

export function scoreEligibleDrive(profileSkills, drive) {
  const skills = (Array.isArray(profileSkills) ? profileSkills : []).filter((skill) => String(skill).trim())
  const matchedSkills = getDriveSkillMatches(skills, drive)
  const skillScore = skills.length ? Math.round((matchedSkills.length / skills.length) * 30) : 0

  return {
    score: 70 + skillScore,
    matchedSkills,
    totalSkills: skills.length,
  }
}
