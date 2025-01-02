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
      const loadedSettings = await db.getSettings();
      // Setze Deutschland als Standardwert, wenn kein Land gesetzt ist
      setSettings({
        ...loadedSettings,
        country: loadedSettings.country || 'Deutschland'
      });
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

  const handleChange = (field: string, value: string) => {
    setSettings({ ...settings, [field]: value });
  };

  if (loading) {
    return <div className="p-8">Lade Einstellungen...</div>;
  }

  if (!settings) {
    return <div className="p-8">Fehler beim Laden der Einstellungen</div>;
  }

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Einstellungen</h1>
        <Button onClick={handleSave}>Speichern</Button>
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
            <Label htmlFor="vatId">USt.-ID</Label>
            <Input
              id="vatId"
              value={settings.vatId || ''}
              onChange={(e) => setSettings({ ...settings, vatId: e.target.value })}
              placeholder="DE123456789"
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
            <Select
              value={settings.country}
              onValueChange={(value) => setSettings({ ...settings, country: value })}
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
          <h2 className="text-lg font-semibold">Kontaktdaten</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefonnummer</Label>
              <Input
                type="tel"
                id="phone"
                value={settings.phone || ''}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-Mail</Label>
              <Input
                type="email"
                id="email"
                value={settings.email || ''}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="website">Webseite</Label>
              <Input
                type="url"
                id="website"
                placeholder="https://"
                value={settings.website || ''}
                onChange={(e) => setSettings({ ...settings, website: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Rechnungen</h2>
          
          <div className="space-y-2">
            <Label htmlFor="invoiceNumberPrefix">Rechnungsnummer-Präfix</Label>
            <Select
              value={settings.invoiceNumberPrefix || 'RE'}
              onValueChange={(value) => setSettings({ ...settings, invoiceNumberPrefix: value })}
            >
              <SelectTrigger id="invoiceNumberPrefix">
                <SelectValue placeholder="Präfix auswählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="RE">RE</SelectItem>
                <SelectItem value="R">R</SelectItem>
                <SelectItem value="INV">INV</SelectItem>
                <SelectItem value="CUSTOM">Benutzerdefiniert</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentTermDays">Zahlungsziel (Tage)</Label>
            <Select
              value={settings.paymentTermDays?.toString() || '14'}
              onValueChange={(value) => setSettings({ ...settings, paymentTermDays: parseInt(value) })}
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
            <Label htmlFor="invoiceTemplate">Rechnungsvorlage</Label>
            <Select
              value={settings.invoiceTemplate || 'standard'}
              onValueChange={(value) => setSettings({ ...settings, invoiceTemplate: value })}
            >
              <SelectTrigger id="invoiceTemplate">
                <SelectValue placeholder="Vorlage auswählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="modern">Modern</SelectItem>
                <SelectItem value="classic">Klassisch</SelectItem>
                <SelectItem value="minimal">Minimalistisch</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="defaultTax">Standard-Steuersatz</Label>
            <Select
              value={settings.defaultTax?.toString() || '19'}
              onValueChange={(value) => setSettings({ ...settings, defaultTax: parseInt(value) })}
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
            <Label htmlFor="accountHolder">Kontoinhaber</Label>
            <Input
              id="accountHolder"
              value={settings.bankDetails?.accountHolder || ''}
              onChange={(e) => setSettings({
                ...settings,
                bankDetails: {
                  ...settings.bankDetails,
                  accountHolder: e.target.value
                }
              })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="iban">IBAN</Label>
            <Input
              id="iban"
              value={settings.bankDetails?.iban || ''}
              onChange={(e) => setSettings({
                ...settings,
                bankDetails: {
                  ...settings.bankDetails,
                  iban: e.target.value.toUpperCase().replace(/\s/g, '')
                }
              })}
              placeholder="DE12 3456 7890 1234 5678 90"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bic">BIC</Label>
            <Input
              id="bic"
              value={settings.bankDetails?.bic || ''}
              onChange={(e) => setSettings({
                ...settings,
                bankDetails: {
                  ...settings.bankDetails,
                  bic: e.target.value.toUpperCase().replace(/\s/g, '')
                }
              })}
              placeholder="DEUTDEDBXXX"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bankName">Bank</Label>
            <Input
              id="bankName"
              value={settings.bankDetails?.bankName || ''}
              onChange={(e) => setSettings({
                ...settings,
                bankDetails: {
                  ...settings.bankDetails,
                  bankName: e.target.value
                }
              })}
              placeholder="Deutsche Bank"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-8 border-t pt-6">
        <Button onClick={handleSave} className="min-w-[120px]">
          Speichern
        </Button>
      </div>
    </div>
  );
}