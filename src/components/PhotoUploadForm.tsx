import { useState, useRef, FormEvent } from 'react';
import { Button } from "@/components/ui";
import Textarea from "@/components/ui/Textarea";
import { Camera, MapPin, Calendar, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { FormData } from "@/components/PhotoDocumentation/types";

interface PhotoUploadFormProps {
  onSubmit: (entry: FormData) => void;
}

export default function PhotoUploadForm({ onSubmit }: PhotoUploadFormProps) {
  const [step, setStep] = useState(1);
  const now = new Date().toISOString();
  const [formData, setFormData] = useState<FormData>(() => ({
    text: "",
    photo: "",
    image: null,
    coords: undefined,
    createdAt: now,
    updatedAt: now,
    images: [],
    unsynced: true,
    timestamp: now
  }));
  const [preview, setPreview] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({ ...prev, image: file }));
      setPreview(URL.createObjectURL(file));
      setStep(2);
    }
  };

  const handleLocationRequest = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          setFormData((prev) => ({
            ...prev,
            coords: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            }
          }));
          setStep(3);
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (formData.text.trim()) {
      onSubmit(formData);
      const now = new Date().toISOString();
      setFormData({
        text: "",
        photo: "",
        image: null,
        coords: undefined,
        createdAt: now,
        updatedAt: now,
        images: [],
        unsynced: true,
        timestamp: now
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <div className="flex justify-between mb-8">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
              step === s
                ? "bg-blue-600 text-white"
                : step > s
                ? "bg-blue-100 text-blue-600"
                : "bg-gray-100 text-gray-400"
            )}
          >
            {s}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {step === 1 && (
          <div className="space-y-4">
            <div
              className={cn(
                "aspect-[4/3] rounded-2xl border-2 border-dashed",
                "flex flex-col items-center justify-center gap-4",
                "bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer",
                "relative overflow-hidden"
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageSelect}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <Camera className="h-8 w-8 text-gray-400" />
              <p className="text-sm text-gray-600 text-center px-4">
                Tippen Sie hier, um ein Foto aufzunehmen oder wählen Sie ein Bild aus
              </p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            {preview && (
              <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <Textarea
              value={formData.text}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setFormData((prev) => ({
                  ...prev,
                  text: e.target.value,
                }))
              }
              placeholder="Beschreiben Sie den Baufortschritt..."
              className="min-h-[100px]"
            />
            <Button
              type="button"
              className="w-full"
              onClick={() => setStep(3)}
              disabled={!formData.text}
            >
              Weiter
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="rounded-lg border p-4 space-y-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                {format(new Date(), "PPp", { locale: de })}
              </div>
              
              <Button
                type="button"
                variant="outline"
                className="w-full flex items-center gap-2"
                onClick={handleLocationRequest}
              >
                <MapPin className="h-4 w-4" />
                {formData.coords ? 'Standort aktualisieren' : 'Standort hinzufügen'}
              </Button>
            </div>

            <Button
              type="submit"
              className="w-full"
            >
              Dokumentation speichern
            </Button>
          </div>
        )}
      </form>
    </div>
  );
} 