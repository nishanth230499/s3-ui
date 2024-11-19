import './AppBarSelectors.scss'

import { MenuItem, TextField } from '@mui/material'
import { useContext } from 'react'

import AppContext from '../../AppContext'

function AppBarSelectors() {
  const { selectedBucket, loggedinUser, setSelectedBucket } = useContext(AppContext)

  return (
    <TextField
      className="app-bar-selector"
      margin="none"
      select
      value={selectedBucket || ''}
      onChange={(e) => setSelectedBucket(e.target.value)}
    >
      {loggedinUser?.aws_buckets?.map((bucket) => (
        <MenuItem key={bucket} value={bucket}>
          {bucket}
        </MenuItem>
      ))}
    </TextField>
  )
}

export default AppBarSelectors
