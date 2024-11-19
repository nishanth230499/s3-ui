import { API_HOST } from '../../config'

const fetcher = async (path) => {
  return fetch(API_HOST + path, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('access_token')}`,
    },
  }).then(async (res) => {
    const response = await res.json()
    if (res.ok) return response
    throw new Error(JSON.stringify(response))
  })
}

export default fetcher
