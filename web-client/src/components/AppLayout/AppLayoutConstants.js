import FolderIcon from '@mui/icons-material/Folder'

import BucketContents from '../../containers/BucketContents/BucketContents'

export const ROUTES = [
  {
    icon: <FolderIcon />,
    route: '/',
    name: 'Bucket Contents',
    component: <BucketContents />,
  },
]
