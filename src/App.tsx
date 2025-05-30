import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/lib/context/AuthContext'
import ProtectedRoute from '@/components/Auth/ProtectedRoute'
import LoginForm from '@/components/Auth/LoginForm'
import RegisterForm from '@/components/Auth/RegisterForm'
import ForgotPasswordForm from '@/components/Auth/ForgotPasswordForm'
import ResetPasswordForm from '@/components/Auth/ResetPasswordForm'
import { Toaster } from '@/components/ui/toaster'
import DocumentList from '@/components/PhotoDocumentation/DocumentList'

// Temporärer Test-Code für Umgebungsvariablen
console.log('SUPABASE_URL:', import.meta.env['VITE_SUPABASE_URL'])
console.log('SUPABASE_ANON_KEY:', import.meta.env['VITE_SUPABASE_ANON_KEY'])

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/register" element={<RegisterForm />} />
          <Route path="/forgot-password" element={<ForgotPasswordForm />} />
          <Route path="/reset-password" element={<ResetPasswordForm />} />

          {/* Protected Routes */}
          <Route
            path="/photos"
            element={
              <ProtectedRoute>
                <DocumentList 
                  entries={[]}
                  onDelete={() => {}}
                  onUpdate={() => {}}
                  viewMode="grid"
                  isLoading={false}
                  error={null}
                  onRetry={() => {}}
                />
              </ProtectedRoute>
            }
          />

          {/* Protected Routes */}
          <Route
            path="/dokumentation/*"
            element={
              <ProtectedRoute>
                {/* <Documentation /> */}
                <div>Dokumentation (Protected)</div>
              </ProtectedRoute>
            }
          />

          {/* Redirect root to documentation */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Navigate to="/dokumentation" replace />
              </ProtectedRoute>
            }
          />

          {/* Catch all route - redirect to root */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster />
      </Router>
    </AuthProvider>
  )
}

export default App
