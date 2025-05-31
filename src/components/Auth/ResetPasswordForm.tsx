import { useState, FormEvent, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Check, X, Eye, EyeOff, AlertTriangle as ExclamationTriangle } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence, useReducedMotion, Variants } from 'framer-motion'
import { type ReactNode } from 'react'

interface FormErrors {
  password?: string
  confirmPassword?: string
}

interface PasswordRequirement {
  id: string
  label: string
  validator: (password: string) => boolean
  description: string
}

interface PasswordStrength {
  label: string
  color: string
  description: string
}

const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  {
    id: 'length',
    label: 'Mindestens 8 Zeichen',
    validator: (password: string) => password.length >= 8,
    description: 'Das Passwort muss mindestens 8 Zeichen lang sein'
  },
  {
    id: 'uppercase',
    label: 'Großbuchstabe',
    validator: (password: string) => /[A-Z]/.test(password),
    description: 'Das Passwort muss mindestens einen Großbuchstaben enthalten'
  },
  {
    id: 'lowercase',
    label: 'Kleinbuchstabe',
    validator: (password: string) => /[a-z]/.test(password),
    description: 'Das Passwort muss mindestens einen Kleinbuchstaben enthalten'
  },
  {
    id: 'number',
    label: 'Zahl',
    validator: (password: string) => /[0-9]/.test(password),
    description: 'Das Passwort muss mindestens eine Zahl enthalten'
  },
  {
    id: 'special',
    label: 'Sonderzeichen',
    validator: (password: string) => /[!@#$%^&*(),.?":{}|<>]/.test(password),
    description: 'Das Passwort muss mindestens ein Sonderzeichen (!@#$%^&*) enthalten'
  }
]

const getPasswordStrength = (fulfilledCount: number): PasswordStrength => {
  const total = PASSWORD_REQUIREMENTS.length
  const percentage = (fulfilledCount / total) * 100

  if (percentage === 100) return {
    label: 'Stark',
    color: 'bg-green-500',
    description: 'Ihr Passwort erfüllt alle Sicherheitsanforderungen'
  }
  if (percentage >= 60) return {
    label: 'Mittel',
    color: 'bg-yellow-500',
    description: 'Ihr Passwort könnte noch sicherer sein'
  }
  return {
    label: 'Schwach',
    color: 'bg-red-500',
    description: 'Ihr Passwort erfüllt nicht die Mindestanforderungen'
  }
}

// Enhanced animation variants
const fadeInVariants: Variants = {
  initial: { opacity: 0, y: -10 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.2, ease: "easeOut" }
  },
  exit: { 
    opacity: 0, 
    y: 10,
    transition: { duration: 0.15, ease: "easeIn" }
  }
}

const shakeVariants: Variants = {
  initial: { x: 0 },
  animate: { 
    x: [0, -10, 10, -5, 5, 0],
    transition: { 
      duration: 0.5,
      ease: "easeInOut"
    }
  }
}

const slideInVariants: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.3, ease: "easeOut" }
  },
  exit: { 
    opacity: 0, 
    x: -20,
    transition: { duration: 0.2, ease: "easeIn" }
  }
}

const MotionWrapper = ({ 
  children, 
  variants, 
  shouldReduceMotion,
  className = "" 
}: { 
  children: ReactNode
  variants: Variants
  shouldReduceMotion: boolean
  className?: string 
}) => {
  const motionProps = shouldReduceMotion ? {} : {
    variants,
    initial: "initial" as const,
    animate: "animate" as const,
    exit: "exit" as const
  }

  return (
    <motion.div
      className={className}
      {...motionProps}
    >
      {children}
    </motion.div>
  )
}

const PasswordRequirementItem = ({ 
  requirement, 
  isFulfilled,
  shouldReduceMotion
}: { 
  requirement: PasswordRequirement
  isFulfilled: boolean
  shouldReduceMotion: boolean
}) => {
  const motionProps = shouldReduceMotion ? {} : {
    variants: fadeInVariants,
    initial: "initial" as const,
    animate: "animate" as const,
    exit: "exit" as const
  }

  return (
    <motion.li 
      layout={!shouldReduceMotion}
      {...motionProps}
      className={cn(
        "flex items-center gap-2 rounded-lg p-3 text-sm transition-colors",
        "touch-target-16",
        isFulfilled 
          ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300" 
          : "bg-gray-50 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400"
      )}
    >
      <span 
        className={cn(
          "flex-shrink-0 rounded-full p-1 transition-colors",
          isFulfilled 
            ? "bg-green-100 dark:bg-green-800/30" 
            : "bg-gray-100 dark:bg-gray-700/30"
        )}
        aria-hidden="true"
      >
        {isFulfilled ? (
          <Check className="h-4 w-4 text-green-500 dark:text-green-400" />
        ) : (
          <X className="h-4 w-4 text-gray-400 dark:text-gray-500" />
        )}
      </span>
      <span>{requirement.label}</span>
      <span className="sr-only">
        {isFulfilled ? "erfüllt" : "nicht erfüllt"}
      </span>
    </motion.li>
  )
}

const PasswordStrengthIndicator = ({ 
  fulfilledRequirements,
  isVisible,
  className,
  shouldReduceMotion
}: { 
  fulfilledRequirements: string[]
  isVisible: boolean
  className?: string
  shouldReduceMotion: boolean
}) => {
  const strength = getPasswordStrength(fulfilledRequirements.length)
  
  if (!isVisible) return null

  const motionProps = shouldReduceMotion ? {} : {
    variants: fadeInVariants,
    initial: "initial" as const,
    animate: "animate" as const,
    exit: "exit" as const
  }

  return (
    <motion.div 
      className={cn("mt-4 space-y-2", className)}
      role="status" 
      aria-live="polite"
      aria-atomic="true"
      {...motionProps}
    >
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600 dark:text-gray-400">Passwortstärke:</span>
        <motion.span 
          layout={!shouldReduceMotion}
          className={cn(
            "font-medium px-2 py-1 rounded-full text-xs",
            strength.label === 'Stark' && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
            strength.label === 'Mittel' && "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
            strength.label === 'Schwach' && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
          )}
        >
          {strength.label}
        </motion.span>
      </div>
      <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <motion.div
          className={cn(
            "h-full transition-all duration-300 ease-out",
            strength.color
          )}
          style={{ 
            width: `${(fulfilledRequirements.length / PASSWORD_REQUIREMENTS.length) * 100}%` 
          }}
          layout={!shouldReduceMotion}
          role="presentation"
        />
      </div>
      <motion.p 
        className="text-sm text-gray-600 dark:text-gray-400" 
        id="password-strength-description"
        layout={!shouldReduceMotion}
      >
        {strength.description}
      </motion.p>
    </motion.div>
  )
}

export default function ResetPasswordForm() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errors, setErrors] = useState<FormErrors>({})
  const [isDirty, setIsDirty] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [fulfilledRequirements, setFulfilledRequirements] = useState<string[]>([])
  const [hasFocusedPassword, setHasFocusedPassword] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const navigate = useNavigate()
  const passwordRef = useRef<HTMLInputElement>(null)
  const errorRef = useRef<HTMLDivElement>(null)
  const shouldReduceMotion = useReducedMotion() ?? false
  const [hasJavaScript, setHasJavaScript] = useState(false)

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        navigate('/login', { replace: true })
      }
    }
    checkSession()
  }, [navigate])

  useEffect(() => {
    const fulfilled = PASSWORD_REQUIREMENTS
      .filter(req => req.validator(password))
      .map(req => req.id)
    setFulfilledRequirements(fulfilled)
  }, [password])

  useEffect(() => {
    if (!isDirty) return

    const newErrors: FormErrors = {}
    const unfulfilledRequirements = PASSWORD_REQUIREMENTS
      .filter(req => !req.validator(password))
      .map(req => req.label)

    if (unfulfilledRequirements.length > 0) {
      newErrors.password = unfulfilledRequirements.join(', ')
    }

    if (password && confirmPassword && password !== confirmPassword) {
      newErrors.confirmPassword = 'Die Passwörter stimmen nicht überein'
    }

    setErrors(newErrors)
  }, [password, confirmPassword, isDirty])

  // JavaScript Detection
  useEffect(() => {
    setHasJavaScript(true)
  }, [])

  // Enhanced focus management
  useEffect(() => {
    if (error) {
      errorRef.current?.focus()
    }
  }, [error])

  // Enhanced keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowPassword(false)
      setShowConfirmPassword(false)
    }
  }

  const handleInvalidSubmit = () => {
    const firstUnfulfilled = PASSWORD_REQUIREMENTS.find(
      req => !req.validator(password)
    )
    if (firstUnfulfilled) {
      setError(`Bitte erfüllen Sie folgende Anforderung: ${firstUnfulfilled.description}`)
      passwordRef.current?.focus()
      return true
    }
    return false
  }

  const handleError = (error: any) => {
    const errorMessage = error.message === 'Invalid password'
      ? 'Das Passwort entspricht nicht den Anforderungen'
      : error.message === 'Network Error'
      ? 'Keine Verbindung zum Server möglich. Bitte überprüfen Sie Ihre Internetverbindung.'
      : 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.'

    setError(errorMessage)
    errorRef.current?.focus()
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsDirty(true)

    if (handleInvalidSubmit()) return

    setError(null)
    setIsLoading(true)

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      })

      if (updateError) throw updateError

      setIsSuccess(true)
      setTimeout(() => {
        navigate('/login', { replace: true })
      }, 3000)
    } catch (error: any) {
      handleError(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFieldChange = (
    value: string,
    setter: (value: string) => void
  ) => {
    if (!isDirty) setIsDirty(true)
    setter(value)
    setError(null)
  }

  const isPasswordValid = fulfilledRequirements.length === PASSWORD_REQUIREMENTS.length
  const isFormValid = isPasswordValid && password === confirmPassword && password.length > 0

  return (
    <div 
      className="flex min-h-[100dvh] items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-12 sm:px-6 lg:px-8 safe-area-inset-bottom"
      onKeyDown={handleKeyDown}
    >
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Neues Passwort festlegen
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Bitte geben Sie Ihr neues Passwort ein
          </p>
        </div>

        <noscript>
          <div className="rounded-md bg-yellow-50 dark:bg-yellow-900/30 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <ExclamationTriangle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  JavaScript ist deaktiviert
                </h3>
                <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                  <p>
                    Für die beste Nutzererfahrung aktivieren Sie bitte JavaScript in Ihrem Browser.
                    Die Formularvalidierung ist ohne JavaScript eingeschränkt.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </noscript>

        <form 
          onSubmit={handleSubmit} 
          className="mt-8 space-y-6"
          noValidate={Boolean(hasJavaScript)}
          aria-label="Formular zum Festlegen eines neuen Passworts"
          aria-busy={isLoading}
        >
          <AnimatePresence mode="wait">
            {error && (
              <MotionWrapper variants={shakeVariants} shouldReduceMotion={Boolean(shouldReduceMotion)}>
                <Alert 
                  variant="destructive"
                  ref={errorRef}
                  tabIndex={-1}
                  role="alert"
                  aria-live="assertive"
                  className="dark:bg-red-900/30 dark:text-red-300 dark:border-red-800"
                >
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </MotionWrapper>
            )}

            {isSuccess && (
              <MotionWrapper variants={slideInVariants} shouldReduceMotion={Boolean(shouldReduceMotion)}>
                <Alert 
                  className="bg-green-50 text-green-900 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800"
                  role="status"
                  aria-live="polite"
                >
                  <AlertDescription>
                    Ihr Passwort wurde erfolgreich geändert. Sie werden in Kürze zum Login weitergeleitet.
                  </AlertDescription>
                </Alert>
              </MotionWrapper>
            )}
          </AnimatePresence>

          <div className="space-y-6">
            <div>
              <Label 
                htmlFor="password" 
                className="block text-base font-medium"
              >
                Neues Passwort
                <span className="sr-only"> - Erforderlich</span>
              </Label>
              <div className="relative mt-2">
                <Input
                  ref={passwordRef}
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => handleFieldChange(e.target.value, setPassword)}
                  onFocus={() => setHasFocusedPassword(true)}
                  disabled={isLoading || isSuccess}
                  className={cn(
                    "pr-24 py-2 text-base",
                    "motion-safe:transition-all motion-safe:duration-200",
                    errors.password && isDirty && "border-destructive focus-visible:ring-destructive",
                    isPasswordValid && "border-green-500 focus-visible:ring-green-500"
                  )}
                  aria-describedby={cn(
                    "password-requirements",
                    errors.password && isDirty ? "password-error" : undefined,
                    "password-strength-description"
                  )}
                  aria-invalid={!!(errors.password && isDirty)}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary rounded-md"
                    aria-label={showPassword ? "Passwort verbergen" : "Passwort anzeigen"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                  {password && (
                    <span 
                      className="text-base"
                      aria-hidden="true"
                    >
                      {isPasswordValid ? (
                        <Check className="h-5 w-5 text-green-500" />
                      ) : (
                        <X className="h-5 w-5 text-destructive" />
                      )}
                    </span>
                  )}
                </div>
              </div>

              <PasswordStrengthIndicator 
                fulfilledRequirements={fulfilledRequirements}
                isVisible={hasFocusedPassword || password.length > 0}
                className="mb-4"
                shouldReduceMotion={shouldReduceMotion}
              />

              <AnimatePresence>
                {(hasFocusedPassword || password.length > 0) && (
                  <motion.div 
                    variants={fadeInVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    id="password-requirements" 
                    className="mt-4 space-y-2"
                  >
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Passwortanforderungen:
                    </p>
                    <ul 
                      className="grid gap-2 sm:grid-cols-2"
                      aria-label="Liste der Passwortanforderungen"
                    >
                      {PASSWORD_REQUIREMENTS.map((req) => (
                        <PasswordRequirementItem
                          key={req.id}
                          requirement={req}
                          isFulfilled={fulfilledRequirements.includes(req.id)}
                          shouldReduceMotion={shouldReduceMotion}
                        />
                      ))}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div>
              <Label 
                htmlFor="confirm-password" 
                className="block text-base font-medium"
              >
                Passwort bestätigen
              </Label>
              <div className="relative mt-2">
                <Input
                  id="confirm-password"
                  name="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => handleFieldChange(e.target.value, setConfirmPassword)}
                  disabled={isLoading || isSuccess}
                  className={cn(
                    "pr-24 py-2 text-base",
                    errors.confirmPassword && isDirty && "border-destructive focus-visible:ring-destructive",
                    confirmPassword && password === confirmPassword && "border-green-500 focus-visible:ring-green-500"
                  )}
                  aria-describedby={errors.confirmPassword ? 'confirm-password-error' : undefined}
                  aria-invalid={!!(errors.confirmPassword && isDirty)}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="p-1 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary rounded-md"
                    aria-label={showConfirmPassword ? "Passwort verbergen" : "Passwort anzeigen"}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                  {confirmPassword && (
                    <span 
                      className="text-base"
                      aria-hidden="true"
                    >
                      {password === confirmPassword ? (
                        <Check className="h-5 w-5 text-green-500" />
                      ) : (
                        <X className="h-5 w-5 text-destructive" />
                      )}
                    </span>
                  )}
                </div>
              </div>
              <AnimatePresence>
                {errors.confirmPassword && isDirty && (
                  <motion.p 
                    variants={fadeInVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    id="confirm-password-error" 
                    className="mt-2 text-sm text-destructive"
                    role="alert"
                  >
                    {errors.confirmPassword}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>

          <Button
            type="submit"
            className={cn(
              "w-full py-3 text-base transition-all duration-200",
              "touch-target-16",
              "motion-safe:transition-transform motion-safe:active:scale-[0.98]",
              isFormValid 
                ? "bg-green-600 hover:bg-green-700 focus-visible:ring-green-500" 
                : "bg-gray-400 dark:bg-gray-600"
            )}
            disabled={isLoading || isSuccess || !isFormValid}
            aria-disabled={isLoading || isSuccess || !isFormValid}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
                <span>Passwort wird geändert...</span>
                <span className="sr-only">Bitte warten</span>
              </>
            ) : (
              'Passwort ändern'
            )}
          </Button>
        </form>
      </div>
    </div>
  )
} 