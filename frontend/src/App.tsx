import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Provider, useDispatch, useSelector } from 'react-redux'
import { store, RootState } from './store/index.js'
import { setProjects } from './store/project.slice.js'
import { api } from './lib/axios.js'
import { Sidebar } from './components/layout/Sidebar.js'
import { Login } from './pages/auth/Login.js'
import { Register } from './pages/auth/Register.js'
import { DashboardHome } from './pages/dashboard/DashboardHome.js'
import { InsightsPage } from './pages/insights/InsightsPage.js'
import { FunnelsPage } from './pages/funnels/FunnelsPage.js'
import { RetentionPage } from './pages/retention/RetentionPage.js'
import { FlowsPage } from './pages/flows/FlowsPage.js'
import { EventsPage } from './pages/events/EventsPage.js'
import { PeopleList } from './pages/people/PeopleList.js'
import { SettingsPage } from './pages/settings/SettingsPage.js'
import { PersonDetail } from './pages/people/PersonDetail.js'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30000, retry: 1 } },
})

function RequireAuth() {
  const token = localStorage.getItem('g5_jwt')
  if (!token) return <Navigate to="/login" replace />
  return <Outlet />
}

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSelector((s: RootState) => s.theme.theme)

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'light') {
      root.classList.add('light')
      root.classList.remove('dark')
    } else {
      root.classList.add('dark')
      root.classList.remove('light')
    }
  }, [theme])

  return <>{children}</>
}

function AppLayout() {
  const dispatch = useDispatch()
  const token = useSelector((s: RootState) => s.auth.token)

  useEffect(() => {
    if (!token) return
    api.get('/projects').then((res) => {
      dispatch(setProjects(res.data))
    }).catch(() => { })
  }, [token, dispatch])

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Outlet />
      </div>
    </div>
  )
}

export default function App() {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              <Route element={<RequireAuth />}>
                <Route element={<AppLayout />}>
                  <Route path="/dashboard" element={<DashboardHome />} />
                  <Route path="/insights" element={<InsightsPage />} />
                  <Route path="/funnels" element={<FunnelsPage />} />
                  <Route path="/retention" element={<RetentionPage />} />
                  <Route path="/flows" element={<FlowsPage />} />
                  <Route path="/events" element={<EventsPage />} />
                  <Route path="/people" element={<PeopleList />} />
                <Route path="/people/:profileId" element={<PersonDetail />} />
                <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                </Route>
              </Route>

              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </BrowserRouter>
        </QueryClientProvider>
      </ThemeProvider>
    </Provider>
  )
}
