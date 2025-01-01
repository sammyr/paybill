'use client';

import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
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
              id="rechtsform"
              value={settings.legalForm || 'Einzelunternehmer'}
              onChange={(e) => setSettings({ ...settings, legalForm: e.target.value })}
            >
              <option value="Einzelunternehmer">Einzelunternehmer</option>
              <option value="GmbH">GmbH</option>
              <option value="UG">UG</option>
              <option value="AG">AG</option>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="branche">Branche</Label>
            <Select
              id="branche"
              value={settings.industry || 'Software Entwicklung'}
              onChange={(e) => setSettings({ ...settings, industry: e.target.value })}
            >
              <option value="Software Entwicklung">Software Entwicklung</option>
              <option value="IT-Beratung">IT-Beratung</option>
              <option value="Webdesign">Webdesign</option>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mitarbeiter">Mitarbeiterzahl</Label>
            <Select
              id="mitarbeiter"
              value={settings.employees || 'Nur ich'}
              onChange={(e) => setSettings({ ...settings, employees: e.target.value })}
            >
              <option value="Nur ich">Nur ich</option>
              <option value="2-5">2-5 Mitarbeiter</option>
              <option value="6-10">6-10 Mitarbeiter</option>
              <option value="11+">11+ Mitarbeiter</option>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Allgemein</h2>
          
          <div className="space-y-2">
            <Label htmlFor="language">Sprache</Label>
            <Select
              id="language"
              value={settings.language}
              onChange={(e) => setSettings({ ...settings, language: e.target.value })}
            >
              <option value="de">Deutsch</option>
              <option value="en">Englisch</option>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone">Zeitzone</Label>
            <Select
              id="timezone"
              value={settings.timezone}
              onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
            >
              <option value="Europe/Berlin">Berlin</option>
              <option value="Europe/London">London</option>
              <option value="America/New_York">New York</option>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Rechnungen</h2>
          
          <div className="space-y-2">
            <Label htmlFor="currency">Währung</Label>
            <Select
              id="currency"
              value={settings.currency}
              onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
            >
              <option value="EUR">Euro (€)</option>
              <option value="USD">US-Dollar ($)</option>
              <option value="GBP">Britisches Pfund (£)</option>
            </Select>
          </div>

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