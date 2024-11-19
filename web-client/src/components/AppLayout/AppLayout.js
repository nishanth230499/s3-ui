import './AppLayout.scss'

import AccountCircleRoundedIcon from '@mui/icons-material/AccountCircleRounded'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import MenuIcon from '@mui/icons-material/Menu'
import {
  AppBar,
  Box,
  Container,
  CssBaseline,
  Divider,
  Drawer,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
} from '@mui/material'
import classNames from 'classnames'
import { useSnackbar } from 'notistack'
import { Fragment, useContext, useState } from 'react'
import { Link, Navigate, Route, Routes } from 'react-router-dom'

import AppContext from '../../AppContext'
import ChangePassword from '../ChangePassword/ChangePassword'
import AppBarSelectors from './AppBarSelectors'
import { ROUTES } from './AppLayoutConstants'

function AppLayout() {
  const { enqueueSnackbar } = useSnackbar()

  const { logout } = useContext(AppContext)
  const [open, setOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const toggleDrawer = () => {
    setOpen(!open)
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar position="absolute" className={classNames('app-bar', { 'app-bar--open': open })}>
        <Toolbar
          sx={{
            pr: '24px',
          }}
        >
          <IconButton
            edge="start"
            color="inherit"
            aria-label="open drawer"
            onClick={toggleDrawer}
            sx={{
              marginRight: '36px',
              ...(open && { display: 'none' }),
            }}
          >
            <MenuIcon />
          </IconButton>
          <Grid container spacing={2} direction="row" alignItems="center">
            <Routes>
              {ROUTES.map(({ route, name, schoolDependant }) => (
                <Route
                  key={route}
                  path={route}
                  element={
                    <>
                      <Grid item flex="1">
                        <Typography component="h1" variant="h6" color="inherit" noWrap sx={{ flexGrow: 1 }}>
                          {name}
                        </Typography>
                      </Grid>
                      {schoolDependant && <AppBarSelectors />}
                    </>
                  }
                />
              ))}
              <Route
                path="/change-password"
                element={
                  <Grid item flex="1">
                    <Typography component="h1" variant="h6" color="inherit" noWrap sx={{ flexGrow: 1 }}>
                      Change Password
                    </Typography>
                  </Grid>
                }
              />
              <Route
                path="*"
                element={
                  <Grid item flex="1">
                    <Typography component="h1" variant="h6" color="inherit" noWrap sx={{ flexGrow: 1 }}>
                      Welcome
                    </Typography>
                  </Grid>
                }
              />
            </Routes>
            <Grid item>
              <IconButton onClick={() => setUserMenuOpen(true)} sx={{ p: 0 }}>
                <AccountCircleRoundedIcon fontSize="large" style={{ color: 'white' }} />
              </IconButton>
              <Menu
                sx={{ mt: '45px' }}
                id="menu-appbar"
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={userMenuOpen}
                onClose={() => setUserMenuOpen(false)}
              >
                <MenuItem component={Link} to="/change-password">
                  <Typography textAlign="center">Change Password</Typography>
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    enqueueSnackbar('Logout Successful!', {
                      variant: 'success',
                    })
                    logout()
                    setUserMenuOpen(false)
                  }}
                >
                  <Typography textAlign="center">Logout</Typography>
                </MenuItem>
              </Menu>
            </Grid>
          </Grid>
        </Toolbar>
      </AppBar>
      <Drawer variant="permanent" className={classNames('app-drawer', { 'app-drawer--close': !open })}>
        <Toolbar
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            px: [1],
          }}
        >
          <IconButton onClick={toggleDrawer}>
            <ChevronLeftIcon />
          </IconButton>
        </Toolbar>
        <Divider />
        <List component="nav">
          {ROUTES.map(({ route, name, icon }) => (
            <ListItem component={Link} to={route} key={route}>
              <ListItemIcon>{icon}</ListItemIcon>
              <ListItemText primary={name} />
            </ListItem>
          ))}
        </List>
      </Drawer>
      <Box
        component="main"
        sx={{
          backgroundColor: (theme) =>
            theme.palette.mode === 'light' ? theme.palette.grey[100] : theme.palette.grey[900],
          flexGrow: 1,
          height: '100vh',
          overflow: 'auto',
        }}
      >
        <Toolbar />
        <Container maxWidth={false} sx={{ mt: 4, mb: 4 }}>
          {Boolean(ROUTES.length) && (
            <Routes>
              {ROUTES.map(({ route, component }) => (
                <Route key={route} path={route} element={component} />
              ))}
              <Route path="/change-password" element={<ChangePassword />} />
              <Route path="*" element={<Navigate to={ROUTES[0].route} />} />
            </Routes>
          )}
        </Container>
      </Box>
    </Box>
  )
}

export default AppLayout
