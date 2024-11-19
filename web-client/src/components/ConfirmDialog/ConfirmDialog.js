import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material'
import { useEffect, useRef } from 'react'

function ConfirmDialog({ open, onClose, onConfirm, confirmText, confirmContent, confirmDisabled }) {
  const confirmButtonRef = useRef(null)

  useEffect(() => {
    if (open && confirmButtonRef.current) confirmButtonRef.current.focus()
  }, [open])

  return (
    <Dialog maxWidth="xs" fullWidth open={open} onClose={onClose}>
      {!confirmDisabled && <DialogTitle>Please Confirm</DialogTitle>}
      <DialogContent>
        <DialogContentText>{confirmText}</DialogContentText>
        {confirmContent}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{confirmDisabled ? 'OK' : 'No'}</Button>
        {!confirmDisabled && (
          <Button onClick={onConfirm} variant="contained" ref={confirmButtonRef} autoFocus>
            Yes
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}

export default ConfirmDialog
