import { useState, FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { cn } from '@/lib/utils'

interface FormData {
  firstName: string
  lastName: string
  email: string
  password: string
  confirmPassword: string
}

interface FormErrors {
  firstName?: string
  lastName?: string
  email?: string
  password?: string
  confirmPassword?: string
}

export default function RegisterForm() {
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()

  const validateForm = () => {
    const newErrors: FormErrors = {}
    let isValid = true

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Vorname ist erforderlich'
      isValid = false
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Nachname ist erforderlich'
      isValid = false
    }

    if (!formData.email) {
      newErrors.email = 'E-Mail ist erforderlich'
      isValid = false
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Bitte geben Sie eine gültige E-Mail-Adresse ein'
      isValid = false
    }

    if (!formData.password) {
      newErrors.password = 'Passwort ist erforderlich'
      isValid = false
    } else if (formData.password.length < 6) {
      newErrors.password = 'Das Passwort muss mindestens 6 Zeichen lang sein'
      isValid = false
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Die Passwörter stimmen nicht überein'
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }))
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setServerError(null)
    setIsLoading(true)

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName
          },
          emailRedirectTo: `${window.location.origin}/login`
        }
      })

      if (error) throw error

      if (data?.user) {
        setSuccess(true)
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          confirmPassword: ''
        })
        setTimeout(() => {
          navigate('/login')
        }, 3000)
      }
    } catch (error: any) {
      console.error('Registration error:', error)
      setServerError(error.message || 'Ein Fehler ist aufgetreten')
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

        {/* Registration Title */}
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800">
            Erstelle ein neues Konto
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Gib deine Daten ein:
          </p>
        </div>

        <form 
          onSubmit={handleSubmit} 
          className="mt-8 space-y-6 bg-white rounded-lg shadow-sm p-6 border border-gray-200"
        >
          {serverError && (
            <Alert variant="destructive">
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <AlertDescription>
                Registrierung erfolgreich! Bitte bestätige deine E-Mail-Adresse über den Link, den wir dir zugesendet haben. Du wirst in wenigen Sekunden zur Login-Seite weitergeleitet...
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div>
              <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                Vorname
              </Label>
              <Input
                id="firstName"
                name="firstName"
                type="text"
                value={formData.firstName}
                onChange={handleChange}
                className={cn(
                  "mt-1 h-12 rounded-lg",
                  errors.firstName && "border-destructive focus-visible:ring-destructive"
                )}
                disabled={isLoading}
              />
              {errors.firstName && (
                <p className="mt-1 text-sm text-destructive">{errors.firstName}</p>
              )}
            </div>

            <div>
              <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                Nachname
              </Label>
              <Input
                id="lastName"
                name="lastName"
                type="text"
                value={formData.lastName}
                onChange={handleChange}
                className={cn(
                  "mt-1 h-12 rounded-lg",
                  errors.lastName && "border-destructive focus-visible:ring-destructive"
                )}
                disabled={isLoading}
              />
              {errors.lastName && (
                <p className="mt-1 text-sm text-destructive">{errors.lastName}</p>
              )}
            </div>

            <div>
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                E-Mail
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className={cn(
                  "mt-1 h-12 rounded-lg",
                  errors.email && "border-destructive focus-visible:ring-destructive"
                )}
                placeholder="max@beispiel.de"
                disabled={isLoading}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            <div>
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Passwort
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  className={cn(
                    "mt-1 h-12 rounded-lg pr-10",
                    errors.password && "border-destructive focus-visible:ring-destructive"
                  )}
                  disabled={isLoading}
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
              {errors.password && (
                <p className="mt-1 text-sm text-destructive">{errors.password}</p>
              )}
            </div>

            <div>
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                Passwort wiederholen
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={cn(
                    "mt-1 h-12 rounded-lg pr-10",
                    errors.confirmPassword && "border-destructive focus-visible:ring-destructive"
                  )}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-destructive">{errors.confirmPassword}</p>
              )}
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-base font-medium"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Wird registriert...
              </>
            ) : (
              'Konto erstellen'
            )}
          </Button>

          <p className="text-center text-sm text-gray-600">
            Bereits registriert?{' '}
            <Link
              to="/login"
              className="font-medium text-primary hover:text-primary/80"
            >
              Anmelden
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
} 