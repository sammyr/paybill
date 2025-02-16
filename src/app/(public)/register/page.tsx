'use client';

import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserPlus, Mail, Lock, User } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      password: formData.get('password'),
      confirmPassword: formData.get('confirmPassword'),
    };

    if (data.password !== data.confirmPassword) {
      setError('Die Passwörter stimmen nicht überein');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Registrierung fehlgeschlagen');
      }

      router.push('/login?registered=true');
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
              <UserPlus className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Registrierung</h1>
            <p className="text-gray-600 dark:text-gray-400 text-center">
              Erstellen Sie Ihr Konto und starten Sie mit der Rechnungserstellung
            </p>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <Input
                  id="name"
                  name="name"
                  placeholder="Max Mustermann"
                  required
                  className="pl-10"
                />
              </div>
            </div>

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

            <div className="space-y-2">
              <Label htmlFor="password">Passwort</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  className="pl-10"
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Registriere...' : 'Registrieren'}
            </Button>
          </form>

          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Bereits registriert?{' '}
              <Link href="/login" className="text-primary hover:underline">
                Jetzt anmelden
              </Link>
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
