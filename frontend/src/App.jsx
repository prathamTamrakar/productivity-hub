import React, { Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router'
import { Toaster } from 'sonner'
import { useAuth } from './context/AuthContext'
import { useTheme } from './context/ThemeContext'

// Lazy-loaded pages
const LoginPage = React.lazy(() => import('./pages/LoginPage'))
const SignupPage = React.lazy(() => import('./pages/SignupPage'))
const DashboardLayout = React.lazy(() => import('./components/layout/DashboardLayout'))
const DashboardPage = React.lazy(() => import('./pages/DashboardPage'))
const CalendarPage = React.lazy(() => import('./pages/CalendarPage'))
const JobTrackerPage = React.lazy(() => import('./pages/JobTrackerPage'))
const SettingsPage = React.lazy(() => import('./pages/SettingsPage'))

// Loading fallback
function PageLoader() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'var(--bg-primary)',
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          border: '3px solid var(--border)',
          borderTopColor: 'var(--primary)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
    </div>
  )
}

// Protected route wrapper
function ProtectedRoute({ children }) {
  const { user } = useAuth()
  if (!user) {
    return <Navigate to="/login" replace />
  }
  return children
}

// Auth route — redirect to dashboard if already logged in
function AuthRoute({ children }) {
  const { user } = useAuth()
  if (user) {
    return <Navigate to="/" replace />
  }
  return children
}

export default function App() {
  const { theme } = useTheme()

  return (
    <>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route
            path="/login"
            element={
              <AuthRoute>
                <LoginPage />
              </AuthRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <AuthRoute>
                <SignupPage />
              </AuthRoute>
            }
          />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="jobs" element={<JobTrackerPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <Toaster
        richColors
        position="top-right"
        theme={theme}
        toastOptions={{
          style: {
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          },
        }}
      />
    </>
  )
}
