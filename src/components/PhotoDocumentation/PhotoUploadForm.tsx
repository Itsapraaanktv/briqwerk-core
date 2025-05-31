import { useState, useRef, useCallback } from 'react';
import type { DragEvent, ChangeEvent } from 'react';
import type { PhotoUploadFormProps, FormData } from './types';
import { Button, Card, Textarea } from '../ui';
import { SpeechInput } from '../ui';
import { compressImage, validateEntry, validatePhoto } from './utils';
import { MAX_TEXT_LENGTH } from '../../lib/constants';
import { reformulateText } from '../../lib/openai';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export default function PhotoUploadForm({ onSubmit }: PhotoUploadFormProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<FormData>(() => {
    const now = new Date().toISOString();
    return {
      text: "",
      photo: "",
      image: null,
      coords: undefined,
      createdAt: now,
      updatedAt: now,
      images: [],
      unsynced: true,
      timestamp: now
    };
  });

  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isReformulating, setIsReformulating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  const handleDragEnter = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (dragCounter.current === 1) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Bitte nur Bilddateien hochladen (JPEG, PNG, etc.).');
      return;
    }

    setIsLoading(true);
    setError(null);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const { dataUrl, thumbnailUrl } = await compressImage(file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Validate compressed image
      const validation = validatePhoto(dataUrl);
      if (!validation.isValid) {
        throw new Error(validation.errors[0]?.message || 'Ungültiges Foto');
      }

      setPreview(thumbnailUrl);
      
      // Focus description field after successful upload
      setTimeout(() => {
        descriptionRef.current?.focus();
      }, 100);

      return dataUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Verarbeiten des Bildes.');
      console.error('Image processing error:', err);
      return null;
    } finally {
      setIsLoading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      await processFile(file);
    }
  };

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const handleLocationToggle = async () => {
    if (!formData.coords) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });

        setFormData(prev => ({
          ...prev,
          coords: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }
        }));

        toast({
          title: 'Standort erfasst',
          description: `${position.coords.latitude}, ${position.coords.longitude}`,
        });
      } catch (error) {
        toast({
          title: 'Fehler',
          description: 'Standort konnte nicht ermittelt werden',
          variant: 'destructive'
        });
      }
    } else {
      setFormData(prev => ({ ...prev, coords: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setIsSubmitting(true);

      // Validate form data
      const validation = validateEntry(formData);

      if (!validation.isValid && validation.errors.length > 0) {
        const firstError = validation.errors[0];
        throw new Error(firstError?.message || 'Validierungsfehler');
      }

      // Submit form data
      await onSubmit(formData);

      const now = new Date().toISOString();

      // Reset form
      setFormData({
        text: '',
        photo: '',
        coords: undefined,
        image: null,
        createdAt: now,
        updatedAt: now,
        images: [],
        unsynced: true,
        timestamp: now
      });
      setPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
    } finally {
      setIsSubmitting(false);
    }
  };

  const remainingChars = MAX_TEXT_LENGTH - formData.text.length;
  const isDescriptionTooLong = remainingChars < 0;

  return (
    <Card className="mb-6">
      <form onSubmit={handleSubmit}>
        <div
          className={`
            relative min-h-[200px] rounded-lg border-2 border-dashed
            transition-colors duration-200 mb-4
            ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
            ${preview ? 'bg-gray-100' : 'bg-white'}
            ${isLoading ? 'cursor-wait' : 'cursor-pointer'}
          `}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isLoading && fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          aria-label={isLoading ? 'Bild wird verarbeitet...' : 'Klicken oder Bild hierher ziehen zum Hochladen'}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          aria-busy={isLoading}
        >
          {uploadProgress > 0 && (
            <div 
              className="absolute top-0 left-0 h-1 bg-blue-500 transition-all duration-200"
              style={{ width: `${uploadProgress}%` }}
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={uploadProgress}
            />
          )}

          {preview ? (
            <div className="relative p-4">
              <img
                src={preview}
                alt="Vorschau des hochgeladenen Bildes"
                className="max-h-[300px] mx-auto rounded"
              />
              <Button
                variant="danger"
                size="sm"
                className="absolute top-2 right-2"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  setPreview(null);
                }}
                aria-label="Bild entfernen"
              >
                ✕
              </Button>
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
              <svg
                className={`w-12 h-12 mb-4 transition-colors ${isDragging ? 'text-blue-500' : 'text-gray-400'}`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="text-gray-600 mb-2">
                {isDragging ? 'Foto hier ablegen' : 'Foto hierher ziehen oder'}
              </p>
              {!isLoading && (
                <Button
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  variant="secondary"
                >
                  Foto auswählen
                </Button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
                aria-label="Foto auswählen"
                disabled={isLoading}
              />
            </div>
          )}
        </div>

        {error && (
          <div 
            className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm"
            role="alert"
            aria-live="assertive"
          >
            {error}
          </div>
        )}

        <div className="relative">
          <div className="flex gap-2 mb-4">
            <div className="flex-1">
              <Textarea
                ref={descriptionRef}
                label="Beschreibung"
                value={formData.text}
                onChange={(e) => setFormData(prev => ({ ...prev, text: e.target.value }))}
                placeholder="Beschreiben Sie die Situation..."
                required
                maxLength={MAX_TEXT_LENGTH}
                aria-invalid={isDescriptionTooLong}
                aria-describedby="description-info"
              />
            </div>
            <div className="flex flex-col items-center justify-start pt-6">
              <SpeechInput
                onTranscript={(text: string) => {
                  setFormData(prev => {
                    const newText = prev.text ? `${prev.text} ${text}` : text;
                    return {
                      ...prev,
                      text: newText.slice(0, MAX_TEXT_LENGTH)
                    };
                  });
                  descriptionRef.current?.focus();
                }}
              />
            </div>
          </div>

          <div className="flex justify-between items-center gap-2 mb-4">
            <div 
              id="description-info"
              className={`text-sm ${isDescriptionTooLong ? 'text-red-600' : 'text-gray-500'}`}
            >
              {remainingChars} Zeichen übrig
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                if (!formData.text.trim()) return;
                
                setError(null);
                setIsReformulating(true);
                
                try {
                  const reformulatedText = await reformulateText(formData.text);
                  setFormData(prev => ({
                    ...prev,
                    text: reformulatedText
                  }));
                  
                  // Fokussiere das Textfeld nach der Umformulierung
                  descriptionRef.current?.focus();
                } catch (err) {
                  setError('Fehler bei der KI-Umformulierung. Bitte versuchen Sie es später erneut.');
                  console.error('Reformulation error:', err);
                } finally {
                  setIsReformulating(false);
                }
              }}
              disabled={!formData.text.trim() || isReformulating}
              className="whitespace-nowrap"
            >
              {isReformulating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  KI denkt...
                </>
              ) : (
                '✨ Mit KI umformulieren'
              )}
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center space-x-2">
            <Switch
              id="location"
              checked={!!formData.coords}
              onCheckedChange={() => handleLocationToggle()}
            />
            <Label htmlFor="location">Standort hinzufügen</Label>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || !formData.text || !formData.photo}
            variant="primary"
          >
            {isSubmitting ? 'Wird gespeichert...' : 'Speichern'}
          </Button>
        </div>
      </form>
    </Card>
  );
} 