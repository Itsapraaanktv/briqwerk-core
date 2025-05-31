import { useState, useRef, useEffect, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Check, X, Mail, Clock, AlertTriangle } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence, useReducedMotion, Variants } from 'framer-motion'
import { type ReactNode } from 'react'

interface RateLimitState {
  attempts: number
  lastAttempt: number
  isLocked: boolean
  lockUntil: number
}

const RATE_LIMIT = {
  MAX_ATTEMPTS: 3,
  LOCK_DURATION: 10 * 60 * 1000, // 10 Minuten in Millisekunden
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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
  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      className={className}
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {children}
    </motion.div>
  )
}

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [rateLimit, setRateLimit] = useState<RateLimitState>(() => {
    const stored = localStorage.getItem('passwordResetRateLimit')
    return stored ? JSON.parse(stored) : {
      attempts: 0,
      lastAttempt: 0,
      isLocked: false,
      lockUntil: 0
    }
  })
  const [remainingTime, setRemainingTime] = useState(0)
  const [isValidEmail, setIsValidEmail] = useState(false)
  const [hasJavaScript, setHasJavaScript] = useState(false)
  
  const navigate = useNavigate()
  const emailRef = useRef<HTMLInputElement>(null)
  const errorRef = useRef<HTMLDivElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const shouldReduceMotion = useReducedMotion()

  // JavaScript Detection
  useEffect(() => {
    setHasJavaScript(true)
  }, [])

  // Online/Offline Status überwachen
  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Rate Limiting Timer
  useEffect(() => {
    if (!rateLimit.isLocked) return

    const interval = setInterval(() => {
      const now = Date.now()
      const remaining = rateLimit.lockUntil - now

      if (remaining <= 0) {
        setRateLimit(prev => ({
          ...prev,
          isLocked: false,
          attempts: 0,
          lockUntil: 0
        }))
        setRemainingTime(0)
        localStorage.setItem('passwordResetRateLimit', JSON.stringify({
          attempts: 0,
          lastAttempt: 0,
          isLocked: false,
          lockUntil: 0
        }))
      } else {
        setRemainingTime(Math.ceil(remaining / 1000))
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [rateLimit.isLocked, rateLimit.lockUntil])

  // Enhanced focus management
  useEffect(() => {
    if (error) {
      errorRef.current?.focus()
    }
  }, [error])

  // Enhanced keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && emailRef.current) {
      emailRef.current.blur()
    }
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value
    setEmail(newEmail)
    setIsValidEmail(EMAIL_REGEX.test(newEmail))
    setError(null)
    setIsSuccess(false)
  }

  const updateRateLimit = () => {
    const now = Date.now()
    const newState: RateLimitState = {
      attempts: rateLimit.attempts + 1,
      lastAttempt: now,
      isLocked: false,
      lockUntil: rateLimit.lockUntil
    }

    if (newState.attempts >= RATE_LIMIT.MAX_ATTEMPTS) {
      newState.isLocked = true
      newState.lockUntil = now + RATE_LIMIT.LOCK_DURATION
    }

    setRateLimit(newState)
    localStorage.setItem('passwordResetRateLimit', JSON.stringify(newState))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (isOffline) {
      setError('Keine Internetverbindung. Bitte überprüfen Sie Ihre Verbindung und versuchen Sie es erneut.')
      return
    }

    if (rateLimit.isLocked) {
      setError(`Zu viele Versuche. Bitte warten Sie ${Math.ceil(remainingTime / 60)} Minuten.`)
      return
    }

    setError(null)
    setIsLoading(true)

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password'
      })

      if (resetError) throw resetError

      // Neutrale Erfolgsmeldung
      setIsSuccess(true)
      updateRateLimit()
      
      // Form zurücksetzen
      formRef.current?.reset()
      setEmail('')
      setIsValidEmail(false)
    } catch (error: any) {
      // Neutrale Fehlermeldung
      setError('Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.')
      errorRef.current?.focus()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div 
      className="flex min-h-[100dvh] items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-12 sm:px-6 lg:px-8 safe-area-inset-bottom"
      onKeyDown={handleKeyDown}
    >
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Passwort zurücksetzen
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Geben Sie Ihre E-Mail-Adresse ein, um Ihr Passwort zurückzusetzen
          </p>
        </div>

        <noscript>
          <div className="rounded-md bg-yellow-50 dark:bg-yellow-900/30 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
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
          ref={formRef}
          onSubmit={handleSubmit} 
          className="mt-8 space-y-6"
          noValidate={Boolean(hasJavaScript)}
          aria-label="Formular zum Zurücksetzen des Passworts"
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
                    Wenn ein Konto mit dieser E-Mail-Adresse existiert, haben wir Ihnen eine E-Mail mit weiteren Anweisungen gesendet.
                  </AlertDescription>
                </Alert>
              </MotionWrapper>
            )}

            {isOffline && (
              <MotionWrapper variants={fadeInVariants} shouldReduceMotion={Boolean(shouldReduceMotion)}>
                <Alert 
                  variant="destructive"
                  role="alert"
                  aria-live="assertive"
                  className="bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800"
                >
                  <AlertDescription>
                    Sie sind offline. Bitte stellen Sie eine Internetverbindung her, um fortzufahren.
                  </AlertDescription>
                </Alert>
              </MotionWrapper>
            )}
          </AnimatePresence>

          <div className="space-y-2">
            <Label 
              htmlFor="email" 
              className="block text-base font-medium text-gray-900 dark:text-gray-100"
            >
              E-Mail-Adresse
              <span className="sr-only"> - Erforderlich</span>
            </Label>
            <div className="relative">
              <div 
                className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
                aria-hidden="true"
              >
                <Mail className="h-5 w-5 text-gray-400 dark:text-gray-600" />
              </div>
              <Input
                ref={emailRef}
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={handleEmailChange}
                disabled={isLoading || isSuccess || rateLimit.isLocked}
                className={cn(
                  "pl-10 pr-10 py-2 text-base dark:bg-gray-800 dark:text-white dark:border-gray-700",
                  "motion-safe:transition-all motion-safe:duration-200",
                  error && "border-destructive focus-visible:ring-destructive dark:border-red-800",
                  isValidEmail && email && "border-green-500 focus-visible:ring-green-500 dark:border-green-800"
                )}
                aria-invalid={!!error}
                aria-describedby={cn(
                  error ? 'email-error' : undefined,
                  rateLimit.isLocked ? 'rate-limit-message' : undefined
                )}
                placeholder="max@beispiel.de"
              />
              <AnimatePresence>
                {email && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"
                    aria-hidden="true"
                  >
                    {isValidEmail ? (
                      <Check className="h-5 w-5 text-green-500 dark:text-green-400" />
                    ) : (
                      <X className="h-5 w-5 text-destructive dark:text-red-400" />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {rateLimit.isLocked && (
            <MotionWrapper 
              variants={fadeInVariants} 
              shouldReduceMotion={Boolean(shouldReduceMotion)}
              className="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-4 text-sm text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700"
            >
              <p className="font-medium flex items-center gap-2">
                <span 
                  className="inline-block p-1 bg-yellow-100 dark:bg-yellow-900/30 rounded-full"
                  aria-hidden="true"
                >
                  <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
                </span>
                Zu viele Versuche
              </p>
              <p className="mt-2">
                Bitte warten Sie noch{' '}
                <span className="font-medium tabular-nums">
                  {Math.floor(remainingTime / 60)}:
                  {(remainingTime % 60).toString().padStart(2, '0')}
                </span>{' '}
                Minuten.
              </p>
            </MotionWrapper>
          )}

          <div className="space-y-4">
            <Button
              type="submit"
              className={cn(
                "w-full py-3 text-base transition-all duration-200",
                "touch-target-16",
                "motion-safe:transition-transform motion-safe:active:scale-[0.98]",
                isValidEmail && !rateLimit.isLocked
                  ? "bg-primary hover:bg-primary/90 focus-visible:ring-primary dark:bg-primary/90 dark:hover:bg-primary"
                  : "bg-gray-400 dark:bg-gray-600"
              )}
              disabled={isLoading || isSuccess || rateLimit.isLocked || isOffline || !isValidEmail}
              aria-disabled={isLoading || isSuccess || rateLimit.isLocked || isOffline || !isValidEmail}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
                  <span className="inline-block min-w-[80px]">
                    Wird gesendet...
                  </span>
                  <span className="sr-only">Bitte warten</span>
                </>
              ) : (
                'Link zum Zurücksetzen senden'
              )}
            </Button>

            <div className="text-center">
              <Button
                type="button"
                variant="link"
                onClick={() => navigate('/login')}
                className="text-sm text-gray-600 hover:text-gray-900 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary dark:text-gray-400 dark:hover:text-gray-200"
              >
                Zurück zum Login
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
} 