import { createContext, useEffect, useMemo, useRef, useState } from 'react'

import ConfirmDialog from './components/ConfirmDialog/ConfirmDialog'

const AppContext = createContext()

export function AppContextWrapper({ children }) {
  const [isLoggedin, setIsLoggedin] = useState(false)
  const [loggedinUser, setLoggedinUser] = useState()
  const [selectedBucket, setSelectedBucket] = useState()

  const logout = () => {
    localStorage.clear()
    setIsLoggedin(false)
    setLoggedinUser(null)
    setSelectedBucket(null)
  }

  useEffect(() => {
    const lastSelectedBucket = localStorage.getItem('selectedBucket')
    const firstBucket = loggedinUser?.buckets?.[0]
    if (lastSelectedBucket && loggedinUser?.buckets?.find((b) => b === lastSelectedBucket)) {
      setSelectedBucket(lastSelectedBucket)
    } else if (firstBucket) {
      localStorage.setItem('selectedBucket', firstBucket)
      setSelectedBucket(firstBucket)
    }
  }, [loggedinUser?.buckets])

  const handleBucketChange = (id) => {
    setSelectedBucket(id)
    localStorage.setItem('selectedBucket', id)
  }

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [confirmContent, setConfirmContent] = useState()
  const [confirmDisabled, setConfirmDisabled] = useState(false)
  const okayHandlerRef = useRef()
  const cancelHandlerRef = useRef()

  const confirmAction = (text, { onConfirm, onCancel, content, disabled }) => {
    setConfirmText(text)
    setConfirmContent(content)
    setConfirmDisabled(disabled || false)
    okayHandlerRef.current = onConfirm
    cancelHandlerRef.current = onCancel
    setConfirmDialogOpen(true)
  }

  return (
    <AppContext.Provider
      value={useMemo(
        () => ({
          loggedinUser,
          setLoggedinUser,
          isLoggedin,
          setIsLoggedin,
          selectedBucket,
          setSelectedBucket: handleBucketChange,
          confirmAction,
          logout,
        }),
        [isLoggedin, loggedinUser, selectedBucket],
      )}
    >
      {children}
      <ConfirmDialog
        open={confirmDialogOpen}
        onClose={() => {
          setConfirmDialogOpen(false)
          if (cancelHandlerRef.current) cancelHandlerRef.current()
        }}
        onConfirm={() => {
          setConfirmDialogOpen(false)
          if (okayHandlerRef.current) okayHandlerRef.current()
        }}
        confirmText={confirmText}
        confirmContent={confirmContent}
        confirmDisabled={confirmDisabled}
      />
    </AppContext.Provider>
  )
}

export default AppContext
