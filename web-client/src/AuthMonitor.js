import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import {
  Avatar,
  Box,
  Button,
  Container,
  CssBaseline,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  OutlinedInput,
  TextField,
  Typography,
} from '@mui/material'
import { useSnackbar } from 'notistack'
import React, { useCallback, useContext, useEffect, useState } from 'react'

import AppContext from './AppContext'
import AppLogo from './assets/sp-logo.jpg'
import ChangePassword from './components/ChangePassword/ChangePassword'
import OverlayLoader from './components/OverlayLoader/OverlayLoader'
import { API_HOST, TOKEN_REFRESH_TIME } from './config'
import { SOMETHING_WENT_WRONG } from './constants/stringConstants'
import { validateEmail } from './utils/validate'

function AuthMonitor({ children }) {
  const { enqueueSnackbar } = useSnackbar()

  const { setIsLoggedin, setLoggedinUser, isLoggedin, loggedinUser } = useContext(AppContext)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailError, setEmailError] = useState(false)
  const [passwordError, setPasswordError] = useState(false)

  const [showPassword, setShowPassword] = useState(false)

  const [loginLoading, setLoginLoading] = useState(false)
  const [refreshTokenLoading, setRefreshTokenLoading] = useState(true)

  const fetchAccessToken = useCallback(async () => {
    const refreshToken = localStorage.getItem('refresh_token')
    if (refreshToken) {
      try {
        const res = await fetch(`${API_HOST}/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${refreshToken}`,
          },
        })
        const data = await res.json()

        if (data.tokens) {
          localStorage.setItem('access_token', data.tokens.access_token)
          setTimeout(fetchAccessToken, TOKEN_REFRESH_TIME)
        }
        setRefreshTokenLoading(false)
        return data
      } catch (err) {
        setRefreshTokenLoading(false)
      }
    } else {
      setRefreshTokenLoading(false)
    }
    return null
  }, [])

  const handleAuth = useCallback(async () => {
    const data = await fetchAccessToken()
    if (data?.tokens) {
      setLoggedinUser(data.user)
      setIsLoggedin(true)
    }
  }, [fetchAccessToken, setIsLoggedin, setLoggedinUser])

  useEffect(() => {
    handleAuth()
  }, [handleAuth])

  const handleSubmit = async (event) => {
    event.preventDefault()
    let error = false
    if (!validateEmail(email)) {
      setEmailError(true)
      error = true
    }
    if (password === '') {
      setPasswordError(true)
      error = true
    }

    if (error) return
    setLoginLoading(true)
    fetch(`${API_HOST}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.tokens) {
          enqueueSnackbar('Login Successful!', { variant: 'success' })
          localStorage.setItem('access_token', data.tokens.access_token)
          localStorage.setItem('refresh_token', data.tokens.refresh_token)
          setEmail('')
          setPassword('')
          setEmailError(false)
          setPasswordError(false)
          setShowPassword(false)
          setLoggedinUser(data.user)
          setIsLoggedin(true)
          setTimeout(fetchAccessToken, TOKEN_REFRESH_TIME)
        } else {
          enqueueSnackbar('Incorrect Credentials!', { variant: 'error' })
        }
        setLoginLoading(false)
      })
      .catch(() => {
        setLoginLoading(false)
        enqueueSnackbar(SOMETHING_WENT_WRONG, { variant: 'error' })
      })
  }

  if (refreshTokenLoading) return <OverlayLoader loading />
  if (isLoggedin && loggedinUser.change_password) return <ChangePassword />
  if (isLoggedin) return children
  return (
    <Container component="main" maxWidth="xs">
      <OverlayLoader loading={loginLoading} />
      <CssBaseline />
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Avatar src={AppLogo} sx={{ m: 1, bgcolor: 'secondary.main' }} />
        <Typography component="h1" variant="h5">
          Samruddhi Publishers
        </Typography>
        <Typography component="h1">S3 UI</Typography>
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoFocus
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setEmailError(!validateEmail(e.target.value))
            }}
            error={emailError}
          />
          <FormControl fullWidth margin="normal" required variant="outlined">
            <InputLabel htmlFor="password">Password</InputLabel>
            <OutlinedInput
              label="Password"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setPasswordError(e.target.value === '')
              }}
              error={passwordError}
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
          <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>
            Login
          </Button>
        </Box>
      </Box>
    </Container>
  )
}

export default AuthMonitor
