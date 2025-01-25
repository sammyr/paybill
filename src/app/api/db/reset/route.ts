import { NextResponse } from 'next/server';
import { resetDatabase } from '@/lib/server/db';

export async function POST() {
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
