import React, { useRef, useState } from 'react';
import { Button } from './button';
import { Label } from './label';
import { useToast } from './use-toast';

interface LogoUploadProps {
  logo?: string;
  onChange: (logo: string) => void;
  onRemove: () => void;
}

export function LogoUpload({ logo, onChange, onRemove }: LogoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const optimizeImage = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Maximale Dimensionen
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 400;

        // Skaliere das Bild, wenn es zu groß ist
        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context nicht verfügbar'));
          return;
        }

        // Zeichne das Bild auf den Canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Konvertiere zu WebP mit hoher Qualität
        const optimizedDataUrl = canvas.toDataURL('image/webp', 0.9);
        resolve(optimizedDataUrl);
      };

      img.onerror = () => reject(new Error('Fehler beim Laden des Bildes'));

      // Lade das Bild
      const reader = new FileReader();
      reader.onloadend = () => {
        img.src = reader.result as string;
      };
      reader.onerror = () => reject(new Error('Fehler beim Lesen der Datei'));
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsLoading(true);

      // Validiere Dateityp
      if (!file.type.startsWith('image/')) {
        throw new Error('Bitte wählen Sie eine Bilddatei aus (JPG, PNG oder WebP)');
      }

      // Validiere Dateigröße (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        throw new Error('Das Bild darf maximal 2MB groß sein');
      }

      // Optimiere das Bild
      const optimizedImage = await optimizeImage(file);

      // Validiere die optimierte Dateigröße
      const base64Size = optimizedImage.length * 0.75; // Ungefähre Größe in Bytes
      if (base64Size > 1 * 1024 * 1024) {
        throw new Error('Das optimierte Bild ist zu groß. Bitte verwenden Sie ein kleineres Bild.');
      }

      // Speichere das optimierte Bild
      onChange(optimizedImage);
      
      toast({
        title: "Logo hochgeladen",
        description: "Das Logo wurde erfolgreich optimiert und gespeichert.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Fehler beim Hochladen",
        description: error instanceof Error ? error.message : 'Fehler beim Verarbeiten des Bildes',
      });
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Reset input
      }
    }
  };

  const handleRemove = () => {
    onRemove();
    toast({
      title: "Logo entfernt",
      description: "Das Logo wurde erfolgreich entfernt.",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Label htmlFor="logo">Firmenlogo</Label>
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
        >
          {isLoading ? 'Verarbeite...' : 'Logo auswählen'}
        </Button>
        {logo && (
          <Button
            type="button"
            variant="outline"
            onClick={handleRemove}
            disabled={isLoading}
          >
            Logo entfernen
          </Button>
        )}
      </div>

      <input
        id="logo"
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
      />

      {logo && (
        <div className="relative w-48 h-24 border rounded overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logo}
            alt="Firmenlogo"
            className="w-full h-full object-contain"
          />
        </div>
      )}

      <div className="text-sm text-gray-500 space-y-1">
        <p>Empfohlene Größe: 800x400 Pixel</p>
        <p>Unterstützte Formate: JPG, PNG, WebP</p>
        <p>Maximale Dateigröße: 2MB</p>
      </div>
    </div>
  );
}
