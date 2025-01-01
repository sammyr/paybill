'use client';

import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { LogoUpload } from "@/components/ui/logo-upload";
import { getDatabase } from '@/lib/db';
import type { Settings } from '@/lib/db/interfaces';

export default function EinstellungenPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

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
      alert('Einstellungen wurden gespeichert');
    } catch (error) {
      console.error('Fehler beim Speichern der Einstellungen:', error);
      alert('Fehler beim Speichern der Einstellungen');
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
            <Label htmlFor="address">Adresse</Label>
            <Input
              id="address"
              value={settings.address || ''}
              onChange={(e) => setSettings({ ...settings, address: e.target.value })}
            />
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
