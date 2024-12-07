import { Typography } from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import { useMemo } from 'react'

function ZipProgress({ zipProgress, loading }) {
  const columns = [
    {
      field: 'name',
      headerName: 'ZIP File Name',
      width: 400,
    },
    { field: 'progress', headerName: 'Progress', width: 200 },
    { field: 'requestedAt', headerName: 'Requested At', width: 200 },
  ]
  const dataRows = useMemo(
    () =>
      zipProgress?.map((file) => ({
        id: file.zipFileName,
        name: file.zipFileName,
        progress: file.progress,
        requestedAt: new Date(file.createdAt).toLocaleString(),
      })) || [],

    [zipProgress],
  )
  return (
    <>
      <Typography variant="h5" mx={2}>
        ZIP Requests (last 24 hours)
      </Typography>
      <DataGrid
        rows={dataRows}
        columns={columns}
        sx={{ border: 0 }}
        hideFooterPagination
        loading={loading}
        rowSelection={false}
      />
    </>
  )
}

export default ZipProgress
