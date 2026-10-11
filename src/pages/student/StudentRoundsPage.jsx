import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getApiErrorMessage } from '../../services/api'
import { getMyApplications } from '../../services/placementDriveService'
import { getSelectionRounds } from '../../services/selectionRoundService'
import { getMyApplicationRoundResults } from '../../services/roundResultService'
import {
  formatLocalDateTime,
  formatRoundResultStatus,
  formatRoundStatus,
  formatRoundType,
  getRoundResultStatusClass,
  getRoundStatusClass,
  getSelectionErrorMessage,
} from '../../utils/selectionRound'

export default function StudentRoundsPage() {
  const { applicationId } = useParams()
  const [application, setApplication] = useState(null)
  const [rounds, setRounds] = useState([])
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    getMyApplications()
      .then(async (applicationList) => {
        const ownApplication = (Array.isArray(applicationList) ? applicationList : [])
          .find((item) => String(item.applicationId) === String(applicationId))
        if (!ownApplication) {
          throw new Error('This application could not be found in your applications.')
        }
        const [roundList, resultList] = await Promise.all([
          getSelectionRounds(ownApplication.driveId),
          getMyApplicationRoundResults(applicationId),
        ])
        if (!active) return
        setApplication(ownApplication)
        setRounds(Array.isArray(roundList) ? roundList : [])
        setResults(Array.isArray(resultList) ? resultList : [])
      })
      .catch((requestError) => {
        if (active) {
          setError(getSelectionErrorMessage(requestError) || requestError.message || getApiErrorMessage(requestError))
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [applicationId])

  const resultByRound = new Map(results.map((result) => [String(result.roundId), result]))

  if (loading) return <div className="content-loading" role="status">Loading your selection rounds...</div>
  if (error) {
    return (
      <div className="company-form-error">
        <h1 className="page-heading">Unable to load selection rounds</h1>
        <div className="alert" role="alert">{error}</div>
        <Link className="secondary-button" to="/student/applications">Back to My Applications</Link>
      </div>
    )
  }

  return (
    <div className="selection-page">
      <Link className="back-link" to="/student/applications">← Back to My Applications</Link>
      <header>
        <p className="eyebrow">YOUR PLACEMENT JOURNEY</p>
        <h1 className="page-heading">Selection Rounds</h1>
        <p className="page-description">
          {application?.driveTitle || 'Placement drive'}
          {application?.companyName ? ` · ${application.companyName}` : ''}
        </p>
      </header>
      {rounds.length === 0 ? (
        <div className="admin-empty-state"><strong>No rounds are available for this application yet.</strong></div>
      ) : (
        <div className="student-round-list">
          {rounds.map((round) => {
            const result = resultByRound.get(String(round.id))
            return (
              <article className="student-round-card" key={round.id}>
                <header>
                  <span className="round-order-mark">#{round.roundOrder}</span>
                  <div className="student-round-title">
                    <p className="eyebrow">{formatRoundType(round.roundType)}</p>
                    <h2>{round.roundName}</h2>
                    <span>{formatLocalDateTime(round.scheduledDateTime)}</span>
                  </div>
                  <span className={`status-badge selection-round-status ${getRoundStatusClass(round.status)}`}>
                    {formatRoundStatus(round.status)}
                  </span>
                </header>
                {round.description && <p className="student-round-description">{round.description}</p>}
                <div className="student-round-result">
                  <span>Your result</span>
                  {result ? (
                    <>
                      <span className={`status-badge round-result-status ${getRoundResultStatusClass(result.result)}`}>
                        {formatRoundResultStatus(result.result)}
                      </span>
                      {result.score !== null && result.score !== undefined && <strong>Score: {result.score}</strong>}
                      {result.remarks && <p>{result.remarks}</p>}
                    </>
                  ) : (
                    <strong>No result recorded yet</strong>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
