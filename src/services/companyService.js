import api from './api'

function getResponseData(response) {
  return response.data?.data
}

export async function getCompanies() {
  const response = await api.get('/companies')
  return getResponseData(response) || []
}

export async function getCompanyById(companyId) {
  const response = await api.get(`/companies/${companyId}`)
  return getResponseData(response)
}

export async function createCompany(companyData) {
  const response = await api.post('/companies', companyData)
  return getResponseData(response)
}

export async function updateCompany(companyId, companyData) {
  const response = await api.put(`/companies/${companyId}`, companyData)
  return getResponseData(response)
}

export async function deleteCompany(companyId) {
  await api.delete(`/companies/${companyId}`)
}

export async function assignRecruiterToCompany(companyId, email) {
  const response = await api.put(`/companies/${companyId}/recruiter`, { email })
  return getResponseData(response)
}
