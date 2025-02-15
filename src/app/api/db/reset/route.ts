import { NextResponse } from 'next/server';
import { resetDatabase } from '@/lib/server/db';

export async function POST() {
  if (typeof window === 'undefined') {
    return NextResponse.json(
      { success: false, message: 'Diese Aktion ist nur im Browser verfügbar' },
      { status: 400 }
    );
  }

  try {
    const result = resetDatabase();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Fehler beim Zurücksetzen der Datenbank:', error);
    return NextResponse.json(
      { success: false, message: 'Fehler beim Zurücksetzen der Datenbank' },
      { status: 500 }
    );
  }
}
