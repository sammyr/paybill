'use client';

import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LogoUpload } from "@/components/ui/logo-upload";
import { getDatabase } from '@/lib/db';
import type { Settings } from '@/lib/db/interfaces';
import { useToast } from "@/components/ui/use-toast";

export default function EinstellungenPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadSettings = async () => {
      const db = getDatabase();
      const settings = await db.getSettings();
      setSettings(settings);
      setLoading(false);
    };
    loadSettings();
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    
    const db = getDatabase();
    try {
      await db.updateSettings(settings);
      toast({
        title: "Einstellungen gespeichert",
        description: "Ihre Einstellungen wurden erfolgreich gespeichert.",
        duration: 3000
      });
    } catch (error) {
      toast({
        title: "Fehler beim Speichern",
        description: "Die Einstellungen konnten nicht gespeichert werden.",
        variant: "destructive",
        duration: 3000
      });
    }
  };

  if (loading) {
    return <div className="p-8">Lade Einstellungen...</div>;
  }

  if (!settings) {
    return <div className="p-8">Fehler beim Laden der Einstellungen</div>;
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Einstellungen</h1>
        <Button onClick={handleSave}>Speichern</Button>
      </div>

      <div className="space-y-6 max-w-2xl">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Firma</h2>
          
          <LogoUpload
            logo={settings.logo}
            onChange={(logo) => setSettings({ ...settings, logo })}
            onRemove={() => setSettings({ ...settings, logo: undefined })}
          />

          <div className="space-y-2">
            <Label htmlFor="companyName">Firmenname</Label>
            <Input
              id="companyName"
              value={settings.companyName || ''}
              onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="taxId">Steuernummer</Label>
            <Input
              id="taxId"
              value={settings.taxId || ''}
              onChange={(e) => setSettings({ ...settings, taxId: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="street">Straße</Label>
            <Input
              id="street"
              value={settings.street || ''}
              onChange={(e) => setSettings({ ...settings, street: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="zip">PLZ</Label>
              <Input
                id="zip"
                value={settings.zip || ''}
                onChange={(e) => setSettings({ ...settings, zip: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">Stadt</Label>
              <Input
                id="city"
                value={settings.city || ''}
                onChange={(e) => setSettings({ ...settings, city: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">Land</Label>
            <Input
              id="country"
              value={settings.country || 'Deutschland'}
              onChange={(e) => setSettings({ ...settings, country: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Adresse</Label>
            <Input
              id="address"
              value={settings.address || ''}
              onChange={(e) => setSettings({ ...settings, address: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="firmenzusatz">Firmenzusatz</Label>
            <Input
              id="firmenzusatz"
              value={settings.companyAddition || ''}
              onChange={(e) => setSettings({ ...settings, companyAddition: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="inhaber">Inhaber</Label>
            <Input
              id="inhaber"
              value={settings.owner || ''}
              onChange={(e) => setSettings({ ...settings, owner: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rechtsform">Rechtsform</Label>
            <Select
              value={settings.legalForm || 'Einzelunternehmer'}
              onValueChange={(value) => setSettings({ ...settings, legalForm: value })}
            >
              <SelectTrigger id="rechtsform">
                <SelectValue placeholder="Rechtsform auswählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Einzelunternehmer">Einzelunternehmer</SelectItem>
                <SelectItem value="GmbH">GmbH</SelectItem>
                <SelectItem value="UG">UG (haftungsbeschränkt)</SelectItem>
                <SelectItem value="AG">AG</SelectItem>
                <SelectItem value="GbR">GbR</SelectItem>
                <SelectItem value="OHG">OHG</SelectItem>
                <SelectItem value="KG">KG</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="branche">Branche</Label>
            <Select
              value={settings.industry || 'Software Entwicklung'}
              onValueChange={(value) => setSettings({ ...settings, industry: value })}
            >
              <SelectTrigger id="branche">
                <SelectValue placeholder="Branche auswählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Software Entwicklung">Software Entwicklung</SelectItem>
                <SelectItem value="IT-Beratung">IT-Beratung</SelectItem>
                <SelectItem value="Webdesign">Webdesign</SelectItem>
                <SelectItem value="E-Commerce">E-Commerce</SelectItem>
                <SelectItem value="Marketing">Marketing</SelectItem>
                <SelectItem value="Beratung">Beratung</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mitarbeiter">Mitarbeiterzahl</Label>
            <Select
              value={settings.employees || 'Nur ich'}
              onValueChange={(value) => setSettings({ ...settings, employees: value })}
            >
              <SelectTrigger id="mitarbeiter">
                <SelectValue placeholder="Mitarbeiterzahl auswählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Nur ich">Nur ich</SelectItem>
                <SelectItem value="2-5">2-5 Mitarbeiter</SelectItem>
                <SelectItem value="6-10">6-10 Mitarbeiter</SelectItem>
                <SelectItem value="11-20">11-20 Mitarbeiter</SelectItem>
                <SelectItem value="21+">21+ Mitarbeiter</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Allgemeine Einstellungen</h2>

          <div className="space-y-2">
            <Label htmlFor="language">Sprache</Label>
            <Select
              value={settings.language}
              onValueChange={(value) => setSettings({ ...settings, language: value })}
            >
              <SelectTrigger id="language">
                <SelectValue placeholder="Sprache auswählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="de">Deutsch</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">Währung</Label>
            <Select
              value={settings.currency}
              onValueChange={(value) => setSettings({ ...settings, currency: value })}
            >
              <SelectTrigger id="currency">
                <SelectValue placeholder="Währung auswählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EUR">Euro (€)</SelectItem>
                <SelectItem value="USD">US Dollar ($)</SelectItem>
                <SelectItem value="GBP">Britisches Pfund (£)</SelectItem>
                <SelectItem value="CHF">Schweizer Franken (CHF)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone">Zeitzone</Label>
            <Select
              value={settings.timezone}
              onValueChange={(value) => setSettings({ ...settings, timezone: value })}
            >
              <SelectTrigger id="timezone">
                <SelectValue placeholder="Zeitzone auswählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Europe/Berlin">Berlin</SelectItem>
                <SelectItem value="Europe/London">London</SelectItem>
                <SelectItem value="Europe/Paris">Paris</SelectItem>
                <SelectItem value="Europe/Zurich">Zürich</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Rechnungen</h2>
          
          <div className="space-y-2">
            <Label htmlFor="paymentTermDays">Zahlungsziel (Tage)</Label>
            <Input
              id="paymentTermDays"
              type="number"
              value={settings.paymentTermDays}
              onChange={(e) => setSettings({ ...settings, paymentTermDays: parseInt(e.target.value) })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}