import './App.css'

import { SnackbarProvider } from 'notistack'
import { QueryClient, QueryClientProvider } from 'react-query'
import { BrowserRouter } from 'react-router-dom'

import { AppContextWrapper } from './AppContext'
import AuthMonitor from './AuthMonitor'
import AppLayout from './components/AppLayout/AppLayout'

function App() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
      },
    },
  })

  return (
    <SnackbarProvider maxSnack={3}>
      <AppContextWrapper>
        <QueryClientProvider client={queryClient}>
          <AuthMonitor>
            <BrowserRouter>
              <AppLayout />
            </BrowserRouter>
          </AuthMonitor>
        </QueryClientProvider>
      </AppContextWrapper>
    </SnackbarProvider>
  )
}

export default App
