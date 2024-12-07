/* eslint-disable jsx-a11y/anchor-is-valid */
import FolderZipIcon from '@mui/icons-material/FolderZip'
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
import { validateFileName } from '../../utils/validate'
import ZipProgress from './ZipProgress'

function BucketContents() {
  const { enqueueSnackbar } = useSnackbar()

  const { selectedBucket } = useContext(AppContext)

  const [currentFolder, setCurrentFolder] = useState('')
  const [selectedFiles, setSelectedFiles] = useState([])

  const [presignedUrlDialogueOpen, setPresignedUrlDialogueOpen] = useState(false)
  const [expirationTime, setExpirationTime] = useState(6)
  const [expirationTimeError, setExpirationTimeError] = useState(false)
  const [presignedUrlsOpen, setPresignedUrlsOpen] = useState(false)

  const [zipFilesDialogueOpen, setZipFilesDialogueOpen] = useState(false)
  const [zipFileName, setZipFileName] = useState('')
  const [zipFileNameError, setZipFileNameError] = useState(false)

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

  const { mutate: zipFiles, isLoading: zipFilesLoading } = useMutation({
    mutationFn: (body) => mutator(`/zip-files/${selectedBucket}/`, body),
  })

  const isLoading = useMemo(
    () => filesFoldersLoading || getPresignedUrlLoading || zipFilesLoading,
    [filesFoldersLoading, getPresignedUrlLoading, zipFilesLoading],
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
        type: file.Key.split('.').slice(-1)[0],
        size: formatBytes(file.Size),
        lastModified: new Date(file.LastModified).toLocaleString(),
      })) || []),
    ],
    [filesFolders?.files, filesFolders?.folders],
  )

  const contentsDict = useMemo(() => {
    const contentsDictObj = {}
    dataRows?.forEach((file) => {
      contentsDictObj[file.id] = file
    })
    return contentsDictObj
  }, [dataRows])

  const shareWithPresignedURLButtonDisabled = useMemo(
    () => selectedFiles.length === 0 || Boolean(selectedFiles?.find((file) => contentsDict[file]?.type === 'Folder')),
    [contentsDict, selectedFiles],
  )

  const zipFilesButtonDisabled = useMemo(
    () => selectedFiles.length === 0 || Boolean(selectedFiles?.find((file) => contentsDict[file]?.type === 'zip')),
    [contentsDict, selectedFiles],
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
    } else {
      setExpirationTimeError(true)
    }
  }

  const handleZipFilesClick = () => {
    setZipFileName('')
    setZipFileNameError(false)
    setZipFilesDialogueOpen(true)
  }

  const handleZipFilesConfirm = () => {
    if (zipFileName && validateFileName(zipFileName)) {
      setZipFilesDialogueOpen(false)
      zipFiles(
        { folder: currentFolder, prefixes: selectedFiles, zip_file_name: `${zipFileName}.zip` },
        {
          onSuccess: (data) => {
            enqueueSnackbar(data.message, { variant: 'success' })
            refetchFilesFolders()
          },
          onError: (error) => {
            enqueueSnackbar(processError(error), { variant: 'error' })
          },
        },
      )
    } else {
      setZipFileNameError(true)
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
      <ConfirmDialog
        open={zipFilesDialogueOpen}
        onClose={() => setZipFilesDialogueOpen(false)}
        confirmText={`Zip ${selectedFiles.length} file(s) / folder(s)`}
        confirmContent={
          <>
            <FormControl fullWidth margin="normal" required variant="outlined">
              <InputLabel htmlFor="zip-file-name">Zip File Name</InputLabel>
              <OutlinedInput
                id="zip-file-name"
                label="Zip File Name"
                endAdornment=".zip"
                value={zipFileName}
                onChange={(e) => {
                  setZipFileName(e.target.value)
                  setZipFileNameError(e.target.value === '' || !validateFileName(e.target.value))
                }}
                error={zipFileNameError}
              />
            </FormControl>
            <ul>
              <li>
                <Typography>If there exists another zip file with the same name, that will be overwritten.</Typography>
              </li>
              <li>
                <Typography>The newly created zip files wil be automatically deleted after 180 days.</Typography>
              </li>
              <li>
                <Typography>
                  .zip files anywhere inside the selected folder will not be included in the new zip.
                </Typography>
              </li>
            </ul>
          </>
        }
        onConfirm={handleZipFilesConfirm}
      />

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
              disabled={isLoading || shareWithPresignedURLButtonDisabled}
            >
              Share with Presigned URLs
            </Button>
            <Button
              variant="contained"
              startIcon={<FolderZipIcon />}
              onClick={handleZipFilesClick}
              disabled={isLoading || zipFilesButtonDisabled}
            >
              Zip Files
            </Button>
          </Grid>
        </Grid>
        {filesFoldersError ? (
          <Typography variant="h5">{processError(filesFoldersError) || SOMETHING_WENT_WRONG}</Typography>
        ) : (
          <>
            <DataGrid
              rows={dataRows}
              columns={columns}
              checkboxSelection
              onRowSelectionModelChange={(rowSelectionModel) => setSelectedFiles(rowSelectionModel)}
              sx={{ border: 0 }}
              hideFooterPagination
              loading={isLoading}
            />
            {Boolean(filesFolders?.zip_progress?.length) && (
              <ZipProgress zipProgress={filesFolders?.zip_progress} loading={isLoading} />
            )}
          </>
        )}
      </Paper>
    </>
  )
}

export default BucketContents
