import { useState, useRef } from 'react';
import { Button } from './ui/Button';
import Textarea from './ui/Textarea';
import { Sparkles, Loader2 } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/components/ui/use-toast';
import { reformulateText } from '../api/openai';

const MAX_TEXT_LENGTH = 500;

interface EntryFormProps {
  onSubmit: (text: string) => void;
}

export function EntryForm({ onSubmit }: EntryFormProps) {
  const [note, setNote] = useState('');
  const [isReformulating, setIsReformulating] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!note.trim()) return;
    
    onSubmit(note.trim());
    setNote('');
  };

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (newValue.length <= MAX_TEXT_LENGTH) {
      setNote(newValue);
    }
  };

  const rephraseNoteWithAI = async () => {
    if (!note.trim()) return;
    
    setIsReformulating(true);
    
    try {
      const reformulatedText = await reformulateText(note);

      if (reformulatedText.length > MAX_TEXT_LENGTH) {
        throw new Error(`Die KI-Antwort überschreitet die maximale Länge von ${MAX_TEXT_LENGTH} Zeichen`);
      }

      setNote(reformulatedText);
      toast({
        title: "Erfolg",
        description: "Text wurde erfolgreich umformuliert",
        variant: "default",
      });
      textareaRef.current?.focus();
    } catch (err) {
      toast({
        title: "Fehler",
        description: err instanceof Error ? err.message : 'Fehler bei der KI-Umformulierung. Bitte versuchen Sie es später erneut.',
        variant: "destructive",
      });
      console.error('Reformulation error:', err);
    } finally {
      setIsReformulating(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={note}
            onChange={handleNoteChange}
            placeholder="Notizen hier eingeben..."
            className="min-h-[100px] resize-none"
            maxLength={MAX_TEXT_LENGTH}
            aria-label={`Notizen (maximal ${MAX_TEXT_LENGTH} Zeichen)`}
          />
          <div className="absolute bottom-2 right-2 text-xs text-gray-500">
            {note.length}/{MAX_TEXT_LENGTH}
          </div>
        </div>

        {note.trim() && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="secondary"
                  className="mt-4"
                  onClick={rephraseNoteWithAI}
                  disabled={isReformulating || note.length > MAX_TEXT_LENGTH}
                  aria-label="Text von KI umformulieren"
                >
                  {isReformulating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      KI denkt...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Mit KI umformulieren
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                GPT-gestützte Formulierung
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      <Button 
        type="submit" 
        disabled={!note.trim() || note.length > MAX_TEXT_LENGTH || isReformulating}
      >
        Speichern
      </Button>
    </form>
  );
} 