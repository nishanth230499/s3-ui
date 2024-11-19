export const API_HOST =
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://127.0.0.1:5000/api'
    : '/api'

// in milliseconds
export const TOKEN_REFRESH_TIME = 1800000
// export const TOKEN_REFRESH_TIME = 10000
