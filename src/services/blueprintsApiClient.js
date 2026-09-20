// Este se conecta al real que estara en el lab4 y tendra (getAll, getByAuthor,getByAuthorAndName, create)
import api from './apiClient.js'

async function getAll() {
  const { data } = await api.get('/blueprints')
  return data
}

async function getByAuthor(author) {
  const { data } = await api.get(`/blueprints/${encodeURIComponent(author)}`)
  return data
}

async function getByAuthorAndName(author, name) {
  const { data } = await api.get(
    `/blueprints/${encodeURIComponent(author)}/${encodeURIComponent(name)}`,
  )
  return data
}

async function create(payload) {
  const { data } = await api.post('/blueprints', payload)
  return data
}

export default { getAll, getByAuthor, getByAuthorAndName, create }