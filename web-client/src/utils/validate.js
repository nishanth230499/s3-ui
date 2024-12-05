export const validateEmail = (email) => {
  const regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/
  return regex.test(email)
}

export const validatePassword = (password) => {
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@.#$!%*?&^])[A-Za-z\d@.#$!%*?&]{8,15}$/
  return regex.test(password)
}

export const validateFileName = (name) => {
  const regex = /^[a-zA-Z0-9][a-zA-Z0-9 ]*$/
  return regex.test(name)
}
