import { Backdrop, CircularProgress } from '@mui/material'

const OverlayLoader = ({ loading }) => {
  return (
    <Backdrop sx={{ color: 'white', zIndex: (theme) => theme.zIndex.drawer + 1 }} open={loading}>
      <CircularProgress size={60} color="inherit" />
    </Backdrop>
  )
}

export default OverlayLoader
