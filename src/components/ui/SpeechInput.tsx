import { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Mic } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SpeechInputProps {
  onTranscript: (text: string) => void
  className?: string
}

// TypeScript-Definitionen für die Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionResultList {
  readonly length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  readonly length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
  isFinal: boolean
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  onend: ((this: SpeechRecognition, ev: Event) => any) | null
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null
  start(): void
  stop(): void
}

interface Window {
  SpeechRecognition?: new () => SpeechRecognition
  webkitSpeechRecognition?: new () => SpeechRecognition
}

export function SpeechInput({ onTranscript, className }: SpeechInputProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognitionAPI = (window as Window).SpeechRecognition || (window as Window).webkitSpeechRecognition;
      if (!SpeechRecognitionAPI) return;

      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'de-DE';

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        // results ist garantiert vorhanden im onresult Event
        const transcript = Array.from(event.results)
          .map(result => result[0]?.transcript || '')
          .join(' ');
        
        const lastResult = event.results[event.results.length - 1];
        if (lastResult?.isFinal) {
          onTranscript(transcript);
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      setRecognition(recognition);
    }
  }, [onTranscript])

  const toggleRecording = useCallback(() => {
    if (!recognition) return

    try {
      if (isRecording) {
        recognition.stop()
      } else {
        recognition.start()
        setIsRecording(true)
      }
    } catch (error) {
      console.error('Fehler bei der Spracherkennung:', error)
      setIsRecording(false)
    }
  }, [recognition, isRecording])

  if (!recognition) {
    return null // Keine Spracherkennung verfügbar
  }

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={toggleRecording}
        className={cn(
          "h-10 w-10 rounded-full",
          isRecording && "animate-pulse bg-blue-50 dark:bg-blue-900"
        )}
        aria-label={isRecording ? "Spracheingabe beenden" : "Spracheingabe starten"}
      >
        <Mic
          className={cn(
            "h-5 w-5",
            isRecording
              ? "text-blue-600 dark:text-blue-400"
              : "text-gray-600 dark:text-gray-400"
          )}
        />
      </Button>
      <span className="text-sm text-gray-500 dark:text-gray-400">
        Sprich zur Eingabe
      </span>
    </div>
  )
} 