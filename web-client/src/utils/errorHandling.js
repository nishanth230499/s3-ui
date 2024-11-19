import { SOMETHING_WENT_WRONG } from '../constants/stringConstants'

export const processError = (error) => {
  try {
    const res = JSON.parse(error?.message)
    return res?.message
  } catch {
    return SOMETHING_WENT_WRONG
  }
}
