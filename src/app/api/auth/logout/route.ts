import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    // Auth-Token-Cookie löschen
    cookies().delete('auth-token');

    return NextResponse.json({
      message: 'Erfolgreich abgemeldet'
    });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { message: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    );
  }
}
