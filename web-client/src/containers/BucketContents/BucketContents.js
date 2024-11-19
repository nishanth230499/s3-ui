/* eslint-disable jsx-a11y/anchor-is-valid */
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import RefreshIcon from '@mui/icons-material/Refresh'
import ShareIcon from '@mui/icons-material/Share'
import {
  Breadcrumbs,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  InputLabel,
  Link,
  OutlinedInput,
  Paper,
  Typography,
} from '@mui/material'
import Grid from '@mui/material/Grid2'
import { DataGrid } from '@mui/x-data-grid'
import { useSnackbar } from 'notistack'
import { useContext, useMemo, useState } from 'react'
import { useMutation, useQuery } from 'react-query'

import AppContext from '../../AppContext'
import ConfirmDialog from '../../components/ConfirmDialog/ConfirmDialog'
import { SOMETHING_WENT_WRONG } from '../../constants/stringConstants'
import fetcher from '../../utils/api/fetcher'
import mutator from '../../utils/api/mutator'
import { processError } from '../../utils/errorHandling'
import { formatBytes } from '../../utils/format'

function BucketContents() {
  const { enqueueSnackbar } = useSnackbar()

  const { selectedBucket } = useContext(AppContext)

  const [currentFolder, setCurrentFolder] = useState('')
  const [selectedFiles, setSelectedFiles] = useState([])
  const [presignedUrlDialogueOpen, setPresignedUrlDialogueOpen] = useState(false)
  const [expirationTime, setExpirationTime] = useState(6)
  const [expirationTimeError, setExpirationTimeError] = useState(false)
  const [presignedUrlsOpen, setPresignedUrlsOpen] = useState(false)

  const {
    data: filesFolders,
    error: filesFoldersError,
    isFetching: filesFoldersLoading,
    refetch: refetchFilesFolders,
  } = useQuery(
    `/list-files-folders/${selectedBucket}/${currentFolder}`,
    () => fetcher(`/list-files-folders/${selectedBucket}/${currentFolder}`),
    {
      enabled: Boolean(selectedBucket),
    },
  )

  const {
    mutate: getPresignedUrl,
    isLoading: getPresignedUrlLoading,
    data: presignedUrlsData,
  } = useMutation({
    mutationFn: (body) => mutator(`/get-presigned-urls/${selectedBucket}/`, body),
  })

  const isLoading = useMemo(
    () => filesFoldersLoading || getPresignedUrlLoading,
    [filesFoldersLoading, getPresignedUrlLoading],
  )

  const columns = [
    {
      field: 'name',
      headerName: 'Name',
      width: 400,
      renderCell: (gridRowParams) =>
        gridRowParams?.row?.type === 'Folder' ? (
          <Link
            component="button"
            variant="body2"
            onClick={() => {
              setCurrentFolder(gridRowParams?.row?.id)
            }}
          >
            {gridRowParams?.row?.name}
          </Link>
        ) : (
          gridRowParams?.row?.name
        ),
    },
    { field: 'type', headerName: 'Type', width: 200 },
    { field: 'size', headerName: 'Size', width: 200 },
    { field: 'lastModified', headerName: 'Last Modified', width: 200 },
  ]
  const dataRows = useMemo(
    () => [
      ...(filesFolders?.folders?.map((folder) => ({
        id: folder.Prefix,
        name: `${folder.Prefix.split('/').slice(-2)[0]}/`,
        type: 'Folder',
        size: '-',
        lastModified: '-',
      })) || []),
      ...(filesFolders?.files?.map((file) => ({
        id: file.Key,
        name: file.Key.split('/').slice(-1)[0],
        type: 'File',
        size: formatBytes(file.Size),
        lastModified: new Date(file.LastModified).toLocaleString(),
      })) || []),
    ],
    [filesFolders?.files, filesFolders?.folders],
  )

  const handleShareWithPresignedUrlClick = () => {
    setExpirationTime(6)
    setExpirationTimeError(false)
    setPresignedUrlDialogueOpen(true)
  }

  const handlePresignedUrlConfirm = () => {
    if (expirationTime > 0 && expirationTime <= 168) {
      setPresignedUrlDialogueOpen(false)
      getPresignedUrl(
        { expires_in: expirationTime * 3600, keys: selectedFiles },
        {
          onSuccess: () => {
            setPresignedUrlsOpen(true)
          },
          onError: (error) => {
            enqueueSnackbar(processError(error), { variant: 'error' })
          },
        },
      )
    }
  }

  return (
    <>
      <Breadcrumbs aria-label="breadcrumbs" mb={2} separator={<NavigateNextIcon fontSize="small" />}>
        {currentFolder ? (
          <Link variant="body1" color="primary" component="button" onClick={() => setCurrentFolder('')}>
            {selectedBucket}
          </Link>
        ) : (
          <Typography variant="body1">{selectedBucket}</Typography>
        )}

        {currentFolder
          ?.split('/')
          .slice(0, -2)
          .map((folder, index, folderArray) => (
            <Link
              key={folder}
              variant="body1"
              color="primary"
              component="button"
              onClick={() => setCurrentFolder(`${folderArray.slice(0, index + 1).join('/')}/`)}
            >
              {folder}
            </Link>
          ))}
        <Typography variant="body1">{currentFolder?.split('/').slice(-2)[0]}</Typography>
      </Breadcrumbs>
      <ConfirmDialog
        open={presignedUrlDialogueOpen}
        onClose={() => setPresignedUrlDialogueOpen(false)}
        confirmText={`Share ${selectedFiles.length} file(s) with presigned URLs`}
        confirmContent={
          <FormControl fullWidth margin="normal" required variant="outlined">
            <InputLabel htmlFor="expiration-time">Expiration Time(in hours)</InputLabel>
            <OutlinedInput
              id="expiration-time"
              label="Expiration time"
              type="number"
              value={expirationTime}
              onChange={(e) => {
                setExpirationTime(e.target.value)
                setExpirationTimeError(e.target.value <= 0 || e.target.value > 168)
              }}
              error={expirationTimeError}
            />
          </FormControl>
        }
        onConfirm={handlePresignedUrlConfirm}
      />
      <Dialog maxWidth="sm" fullWidth open={presignedUrlsOpen} onClose={() => setPresignedUrlsOpen(false)}>
        <DialogTitle>Presigned Urls</DialogTitle>
        <DialogContent>
          <DialogContentText mb={2}>Copy the following links to share</DialogContentText>
          <ol>
            {presignedUrlsData?.presigned_urls?.map(({ key, url }) => (
              <li key={key}>
                <Link color="primary" href={url} target="_blank" rel="noreferrer">
                  {key.split('/').slice(-1)[0]}
                </Link>
              </li>
            ))}
          </ol>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPresignedUrlsOpen(false)}>OK</Button>
        </DialogActions>
      </Dialog>
      <Paper sx={{ width: '100%' }}>
        <Grid container justifyContent="space-between" mx={2} pt={2}>
          <Typography variant="h5">
            {currentFolder ? currentFolder?.split('/').slice(-2)[0] : selectedBucket}
          </Typography>
          <Grid container spacing={2}>
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={() => refetchFilesFolders()}
              disabled={isLoading}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<ShareIcon />}
              onClick={handleShareWithPresignedUrlClick}
              disabled={isLoading || selectedFiles.length === 0}
            >
              Share with Presigned URLs
            </Button>
          </Grid>
        </Grid>
        {filesFoldersError ? (
          <Typography variant="h5">{processError(filesFoldersError) || SOMETHING_WENT_WRONG}</Typography>
        ) : (
          <DataGrid
            rows={dataRows}
            columns={columns}
            checkboxSelection
            isRowSelectable={(gridRowParams) => gridRowParams?.row?.type !== 'Folder'}
            onRowSelectionModelChange={(rowSelectionModel) => setSelectedFiles(rowSelectionModel)}
            sx={{ border: 0 }}
            hideFooterPagination
            loading={isLoading}
          />
        )}
      </Paper>
    </>
  )
}

export default BucketContents
