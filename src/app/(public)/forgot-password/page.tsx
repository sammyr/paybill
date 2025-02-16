'use client';

import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from 'next/link';
import { KeyRound, Mail, ArrowLeft, CheckCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Passwort-Reset fehlgeschlagen');
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Ein Fehler ist aufgetreten');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 bg-white dark:bg-gray-800 shadow-xl rounded-xl">
        <div className="flex flex-col space-y-6">
          <div className="flex flex-col items-center space-y-2 mb-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <KeyRound className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Passwort vergessen?</h1>
            <p className="text-gray-600 dark:text-gray-400 text-center">
              Geben Sie Ihre E-Mail-Adresse ein und wir senden Ihnen einen Link zum Zurücksetzen Ihres Passworts
            </p>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {success ? (
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-green-800 dark:text-green-200 font-medium">E-Mail wurde versendet</h3>
                  <p className="text-green-700 dark:text-green-300 text-sm mt-1">
                    Wir haben Ihnen einen Link zum Zurücksetzen Ihres Passworts zugesendet. 
                    Bitte überprüfen Sie Ihren Posteingang und gegebenenfalls den Spam-Ordner.
                  </p>
                </div>
              </div>
              <Button asChild variant="outline" className="w-full">
                <Link href="/login">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Zurück zum Login
                </Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-Mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="name@firma.de"
                    required
                    className="pl-10"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Sende...' : 'Link zum Zurücksetzen senden'}
              </Button>

              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Passwort wieder eingefallen?{' '}
                  <Link href="/login" className="text-primary hover:underline">
                    Zurück zum Login
                  </Link>
                </p>
              </div>
            </form>
          )}
        </div>
      </Card>
    </div>
  );
}
