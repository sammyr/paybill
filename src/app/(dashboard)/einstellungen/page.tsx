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
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/db?action=getSettings');
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Fehler beim Laden der Einstellungen');
      }
      const data = await response.json();
      setSettings(data);
    } catch (error) {
      console.error('Fehler beim Laden der Einstellungen:', error);
      toast({
        variant: 'destructive',
        title: 'Fehler',
        description: error.message || 'Die Einstellungen konnten nicht geladen werden'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    try {
      setSaving(true);
      const response = await fetch('/api/db?action=updateSettings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Die Einstellungen konnten nicht gespeichert werden');
      }
      
      const updatedSettings = await response.json();
      setSettings(updatedSettings);
      toast({
        title: 'Erfolg',
        description: 'Die Einstellungen wurden erfolgreich gespeichert'
      });
    } catch (error) {
      console.error('Fehler beim Speichern der Einstellungen:', error);
      toast({
        variant: 'destructive',
        title: 'Fehler',
        description: error.message || 'Die Einstellungen konnten nicht gespeichert werden'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof Settings, value: string) => {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
  };

  if (loading) {
    return <div className="p-8">Lade Einstellungen...</div>;
  }

  if (!settings) {
    return <div className="p-8">Keine Einstellungen gefunden</div>;
  }

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Einstellungen</h1>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Speichere...' : 'Speichern'}
        </Button>
      </div>

      <div className="space-y-6">
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
              onChange={(e) => handleChange('companyName', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="taxId">Steuernummer</Label>
            <Input
              id="taxId"
              value={settings.taxId || ''}
              onChange={(e) => handleChange('taxId', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vatId">USt.-ID</Label>
            <Input
              id="vatId"
              value={settings.vatId || ''}
              onChange={(e) => handleChange('vatId', e.target.value)}
              placeholder="DE123456789"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="street">Straße</Label>
            <Input
              id="street"
              value={settings.street || ''}
              onChange={(e) => handleChange('street', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="zipCode">PLZ</Label>
              <Input
                id="zipCode"
                value={settings.zipCode || ''}
                onChange={(e) => handleChange('zipCode', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">Stadt</Label>
              <Input
                id="city"
                value={settings.city || ''}
                onChange={(e) => handleChange('city', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">Land</Label>
            <Select
              value={settings.country}
              onValueChange={(value) => handleChange('country', value)}
            >
              <SelectTrigger id="country">
                <SelectValue placeholder="Wähle ein Land" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Deutschland">Deutschland</SelectItem>
                <SelectItem value="Österreich">Österreich</SelectItem>
                <SelectItem value="Schweiz">Schweiz</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Adresse</Label>
            <Input
              id="address"
              value={settings.address || ''}
              onChange={(e) => handleChange('address', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="inhaber">Firmeninhaber</Label>
            <Input
              id="inhaber"
              value={settings.companyOwner || ''}
              onChange={(e) => handleChange('companyOwner', e.target.value)}
              placeholder="Max Mustermann"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rechtsform">Rechtsform</Label>
            <Select
              value={settings.legalForm || 'Einzelunternehmer'}
              onValueChange={(value) => handleChange('legalForm', value)}
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
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Kontaktdaten</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefonnummer</Label>
              <Input
                type="tel"
                id="phone"
                value={settings.phone || ''}
                onChange={(e) => handleChange('phone', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-Mail</Label>
              <Input
                type="email"
                id="email"
                value={settings.email || ''}
                onChange={(e) => handleChange('email', e.target.value)}
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="website">Webseite</Label>
              <Input
                type="url"
                id="website"
                placeholder="https://"
                value={settings.website || ''}
                onChange={(e) => handleChange('website', e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Rechnungen</h2>
          
          <div className="space-y-2">
            <Label htmlFor="paymentTermDays">Zahlungsziel (Tage)</Label>
            <Select
              value={settings.paymentTermDays?.toString() || '14'}
              onValueChange={(value) => handleChange('paymentTermDays', value)}
            >
              <SelectTrigger id="paymentTermDays">
                <SelectValue placeholder="Zahlungsziel auswählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 Tage</SelectItem>
                <SelectItem value="14">14 Tage</SelectItem>
                <SelectItem value="30">30 Tage</SelectItem>
                <SelectItem value="45">45 Tage</SelectItem>
                <SelectItem value="60">60 Tage</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="defaultTax">Standard-Steuersatz</Label>
            <Select
              value={settings.defaultTax?.toString() || '19'}
              onValueChange={(value) => handleChange('defaultTax', value)}
            >
              <SelectTrigger id="defaultTax">
                <SelectValue placeholder="Steuersatz auswählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">0% (Steuerfrei)</SelectItem>
                <SelectItem value="7">7% (Ermäßigt)</SelectItem>
                <SelectItem value="19">19% (Standard)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4 mt-6">
          <h2 className="text-lg font-semibold">Bankverbindung</h2>
            
          <div className="space-y-2">
            <Label htmlFor="bankName">Bank</Label>
            <Input
              id="bankName"
              value={settings.bankDetails?.bankName || ''}
              onChange={(e) => {
                const newBankDetails = {
                  ...(settings.bankDetails || {}),
                  bankName: e.target.value
                };
                setSettings(prev => {
                  const updated = {
                    ...prev,
                    bankDetails: newBankDetails
                  };
                  return updated;
                });
              }}
              placeholder="Deutsche Bank"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="iban">IBAN</Label>
            <Input
              id="iban"
              value={settings.bankDetails?.iban || ''}
              onChange={(e) => {
                const newBankDetails = {
                  ...(settings.bankDetails || {}),
                  iban: e.target.value.toUpperCase().replace(/\s/g, '')
                };
                setSettings(prev => {
                  const updated = {
                    ...prev,
                    bankDetails: newBankDetails
                  };
                  return updated;
                });
              }}
              placeholder="DE12 3456 7890 1234 5678 90"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bic">BIC</Label>
            <Input
              id="bic"
              value={settings.bankDetails?.bic || ''}
              onChange={(e) => {
                const newBankDetails = {
                  ...(settings.bankDetails || {}),
                  bic: e.target.value.toUpperCase().replace(/\s/g, '')
                };
                setSettings(prev => {
                  const updated = {
                    ...prev,
                    bankDetails: newBankDetails
                  };
                  return updated;
                });
              }}
              placeholder="DEUTDEDBXXX"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountHolder">Kontoinhaber</Label>
            <Input
              id="accountHolder"
              value={settings.bankDetails?.accountHolder || ''}
              onChange={(e) => {
                const newBankDetails = {
                  ...(settings.bankDetails || {}),
                  accountHolder: e.target.value
                };
                setSettings(prev => {
                  const updated = {
                    ...prev,
                    bankDetails: newBankDetails
                  };
                  return updated;
                });
              }}
            />
          </div>
        </div>

        <div className="flex justify-end mt-8 border-t pt-6">
          <Button onClick={handleSave} disabled={saving} className="min-w-[120px]">
            {saving ? 'Speichere...' : 'Speichern'}
          </Button>
        </div>
      </div>
    </div>
  );
}