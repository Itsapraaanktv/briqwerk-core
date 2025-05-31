import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/lib/context/AuthContext'
import ProtectedRoute from '@/components/Auth/ProtectedRoute'
import LoginForm from '@/components/Auth/LoginForm'
import RegisterForm from '@/components/Auth/RegisterForm'
import ForgotPasswordForm from '@/components/Auth/ForgotPasswordForm'
import ResetPasswordForm from '@/components/Auth/ResetPasswordForm'
import { Toaster } from '@/components/ui/toaster'
import DocumentList from '@/components/PhotoDocumentation/DocumentList'
import { usePhotoSync } from '@/components/PhotoDocumentation/hooks/usePhotoSync'
import { usePhotoEntries } from '@/components/PhotoDocumentation/hooks/usePhotoEntries'
import type { PhotoEntry } from '@/types/photo'

// Temporärer Test-Code für Umgebungsvariablen
console.log('SUPABASE_URL:', import.meta.env['VITE_SUPABASE_URL'])
console.log('SUPABASE_ANON_KEY:', import.meta.env['VITE_SUPABASE_ANON_KEY'])

function App() {
  // View mode state
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Photo entries management
  const { entries, updateEntry, deleteEntry } = usePhotoEntries()

  // Photo sync management
  const { isSyncing, lastSync, sync } = usePhotoSync(entries, updateEntry)

  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
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
                  entries={entries}
                  onDelete={deleteEntry}
                  onUpdate={updateEntry}
                  viewMode={viewMode}
                  setViewMode={setViewMode}
                  isSyncing={isSyncing}
                  lastSync={lastSync}
                  onSync={sync}
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

          {/* Catch all route - redirect to root */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster />
      </Router>
    </AuthProvider>
  )
}

export default App
