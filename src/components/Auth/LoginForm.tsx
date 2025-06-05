import { useState, FormEvent, useEffect, useRef } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { cn } from '@/lib/utils'

interface LocationState {
  from?: {
    pathname: string
  }
}

interface FormErrors {
  email?: string
  password?: string
}

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isFormValid, setIsFormValid] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as LocationState
  
  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const errorRef = useRef<HTMLDivElement>(null)

  // Formularvalidierung
  useEffect(() => {
    if (!isDirty) return // Keine Validierung vor erster Interaktion

    const newErrors: FormErrors = {}
    let isValid = true

    if (email) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        newErrors.email = 'Bitte geben Sie eine gültige E-Mail-Adresse ein'
        isValid = false
      }
    } else {
      newErrors.email = 'E-Mail ist erforderlich'
      isValid = false
    }

    if (password) {
      if (password.length < 6) {
        newErrors.password = 'Das Passwort muss mindestens 6 Zeichen lang sein'
        isValid = false
      }
    } else {
      newErrors.password = 'Passwort ist erforderlich'
      isValid = false
    }

    setErrors(newErrors)
    setIsFormValid(isValid)
  }, [email, password, isDirty])

  // Fokusmanagement für Fehler
  useEffect(() => {
    if (serverError && errorRef.current) {
      errorRef.current.focus()
    }
  }, [serverError])

  const handleFieldChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (value: string) => void
  ) => {
    if (!isDirty) setIsDirty(true)
    setter(e.target.value)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!isDirty) setIsDirty(true)
    
    if (!isFormValid) {
      // Fokussiere das erste Feld mit Fehler
      if (errors.email && emailRef.current) {
        emailRef.current.focus()
      } else if (errors.password && passwordRef.current) {
        passwordRef.current.focus()
      }
      return
    }

    setServerError(null)
    setIsLoading(true)

    try {
      const { data: { session }, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (signInError) throw signInError

      // Session-Persistenz basierend auf Remember-Me setzen
      if (session) {
        if (rememberMe) {
          // Persistente Session im localStorage
          localStorage.setItem('supabase.auth.token', JSON.stringify(session))
        } else {
          // Temporäre Session im sessionStorage
          sessionStorage.setItem('supabase.auth.token', JSON.stringify(session))
          localStorage.removeItem('supabase.auth.token')
        }
      }

      // Erfolgreiche Anmeldung
      const from = state?.from?.pathname || '/photos'
      navigate(from, { replace: true })
    } catch (error: any) {
      // Spezifische Fehlermeldungen
      let errorMessage = 'Ein unerwarteter Fehler ist aufgetreten'
      
      switch (error.message) {
        case 'Invalid login credentials':
          errorMessage = 'E-Mail oder Passwort ist falsch'
          break
        case 'Email not confirmed':
          errorMessage = 'Bitte bestätigen Sie zuerst Ihre E-Mail-Adresse'
          break
        case 'Too many requests':
          errorMessage = 'Zu viele Anmeldeversuche. Bitte warten Sie einen Moment'
          break
        case 'Database error':
          errorMessage = 'Verbindungsfehler. Bitte versuchen Sie es später erneut'
          break
      }
      
      setServerError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        {/* Logo and App Name */}
        <div className="flex flex-col items-center justify-center space-y-4">
          <img
            src="/logo.svg"
            alt="BriqWerk Core Logo"
            className="h-16 w-auto"
          />
          <h1 className="text-2xl font-bold text-gray-900">BriqWerk Core</h1>
        </div>

        {/* Welcome Text */}
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800">
            Willkommen
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Bitte melde dich an:
          </p>
        </div>

        <form 
          onSubmit={handleSubmit} 
          className="mt-8 space-y-6 bg-white rounded-lg shadow-sm p-6 border border-gray-200"
          noValidate
        >
          {serverError && (
            <Alert 
              variant="destructive"
              ref={errorRef}
              tabIndex={-1}
              role="alert"
            >
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                E-Mail
              </Label>
              <Input
                ref={emailRef}
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => handleFieldChange(e, setEmail)}
                disabled={isLoading}
                className={cn(
                  "mt-1 h-12 rounded-lg",
                  errors.email && isDirty && "border-destructive focus-visible:ring-destructive"
                )}
                placeholder="max@beispiel.de"
                aria-invalid={!!(errors.email && isDirty)}
              />
              {errors.email && isDirty && (
                <p className="mt-1 text-sm text-destructive" role="alert">
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Passwort
              </Label>
              <div className="relative">
                <Input
                  ref={passwordRef}
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => handleFieldChange(e, setPassword)}
                  disabled={isLoading}
                  className={cn(
                    "mt-1 h-12 rounded-lg pr-10",
                    errors.password && isDirty && "border-destructive focus-visible:ring-destructive"
                  )}
                  aria-invalid={!!(errors.password && isDirty)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && isDirty && (
                <p className="mt-1 text-sm text-destructive" role="alert">
                  {errors.password}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember-me"
                checked={rememberMe}
                onCheckedChange={(checked: boolean) => setRememberMe(checked)}
                disabled={isLoading}
              />
              <Label
                htmlFor="remember-me"
                className="text-sm text-gray-700"
              >
                Angemeldet bleiben
              </Label>
            </div>
            <Link
              to="/forgot-password"
              className="text-sm font-medium text-primary hover:text-primary/80"
            >
              Passwort vergessen?
            </Link>
          </div>

          <div className="space-y-4">
            <Button
              type="submit"
              className="w-full h-12 text-base font-medium"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Anmeldung...
                </>
              ) : (
                'Anmelden'
              )}
            </Button>

            <p className="text-center text-sm text-gray-600">
              Noch kein Konto?{' '}
              <Link
                to="/register"
                className="font-medium text-primary hover:text-primary/80"
              >
                Registrieren
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
} 