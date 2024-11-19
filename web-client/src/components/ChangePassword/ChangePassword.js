import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import {
  Box,
  Button,
  Container,
  CssBaseline,
  FormControl,
  FormHelperText,
  IconButton,
  InputAdornment,
  InputLabel,
  OutlinedInput,
  Typography,
} from '@mui/material'
import { useSnackbar } from 'notistack'
import { useContext, useMemo, useState } from 'react'
import { useMutation } from 'react-query'

import AppContext from '../../AppContext'
import mutator from '../../utils/api/mutator'
import { processError } from '../../utils/errorHandling'
import { validatePassword } from '../../utils/validate'
import OverlayLoader from '../OverlayLoader/OverlayLoader'

const ChangePassword = () => {
  const { enqueueSnackbar } = useSnackbar()
  const { logout } = useContext(AppContext)

  const [showPassword, setShowPassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [currentPasswordError, setCurrentPasswordError] = useState(false)
  const [newPasswordError, setNewPasswordError] = useState(false)
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false)

  const confirmPasswordError = useMemo(
    () => confirmPasswordTouched && newPassword !== confirmPassword,
    [confirmPassword, confirmPasswordTouched, newPassword],
  )

  const { mutate: changePassword, isLoading: ischangePasswordLoading } = useMutation({
    mutationFn: (body) => mutator('/change-password', body),
  })

  const clearForm = () => {
    setShowPassword(false)
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setCurrentPasswordError(false)
    setNewPasswordError(false)
    setConfirmPasswordTouched(false)
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    var error = false
    if (!validatePassword(newPassword)) {
      setNewPasswordError(true)
      error = true
    }
    if (newPassword !== confirmPassword) {
      setConfirmPasswordTouched(true)
      error = true
    }
    if (currentPassword === '') {
      setCurrentPassword(true)
      error = true
    }
    if (error) return
    changePassword(
      { current_password: currentPassword, new_password: newPassword },
      {
        onSuccess: (data) => {
          enqueueSnackbar(data.message, {
            variant: 'success',
          })
          clearForm()
          logout()
        },
        onError: (apiError) => {
          enqueueSnackbar(processError(apiError), { variant: 'error' })
        },
      },
    )
  }

  return (
    <Container component="main" maxWidth="xs">
      <OverlayLoader loading={ischangePasswordLoading} />
      <CssBaseline />
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography component="h1" variant="h5">
          Change Password
        </Typography>
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
          <FormControl fullWidth margin="normal" required variant="outlined">
            <InputLabel htmlFor="current-password">Current Password</InputLabel>
            <OutlinedInput
              label="Current Password"
              type={showPassword ? 'text' : 'password'}
              id="current-password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => {
                setCurrentPassword(e.target.value)
                setCurrentPasswordError(e.target.value === '')
              }}
              error={currentPasswordError}
              endAdornment={
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={() => setShowPassword(!showPassword)}
                    onMouseDown={(e) => e.preventDefault()}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              }
            />
          </FormControl>
          <FormControl fullWidth margin="normal" required variant="outlined">
            <InputLabel htmlFor="new-password">New Password</InputLabel>
            <OutlinedInput
              label="New Password"
              type={'password'}
              id="new-password"
              autoComplete="current-password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value)
                setNewPasswordError(!validatePassword(e.target.value))
              }}
              error={newPasswordError}
            />
            <FormHelperText>
              Password must contain atleast 1 number, 1 small letter, 1 capital letter, 1 special character and must be
              8 to 15 characters long.
            </FormHelperText>
          </FormControl>
          <FormControl fullWidth margin="normal" required variant="outlined">
            <InputLabel htmlFor="confirm-password">Confirm Password</InputLabel>
            <OutlinedInput
              label="Confirm Password"
              type={'password'}
              id="confirm-password"
              autoComplete="current-password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value)
                setConfirmPasswordTouched(true)
              }}
              error={confirmPasswordError}
            />
            <FormHelperText>Passwords should match</FormHelperText>
          </FormControl>
          <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>
            Change Password
          </Button>
        </Box>
      </Box>
    </Container>
  )
}

export default ChangePassword
