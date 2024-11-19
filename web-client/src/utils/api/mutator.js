import { API_HOST } from '../../config'

const mutator = async (path, body) => {
  return fetch(API_HOST + path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('access_token')}`,
    },
    body: JSON.stringify(body),
  }).then(async (res) => {
    const response = await res.json()
    if (res.ok) return response
    throw new Error(JSON.stringify(response))
  })
}

export default mutator
