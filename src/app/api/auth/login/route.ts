import { NextResponse } from 'next/server';
import { sign } from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Testbenutzer für die Entwicklung
const TEST_USER = {
  id: '1',
  email: 'test@example.com',
  password: 'test123',
  name: 'Test User'
};

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // Einfache Überprüfung mit Testbenutzer
    if (email !== TEST_USER.email || password !== TEST_USER.password) {
      return NextResponse.json(
        { message: 'E-Mail oder Passwort ist falsch' },
        { status: 401 }
      );
    }

    // JWT Token erstellen
    const token = sign(
      { 
        userId: TEST_USER.id,
        email: TEST_USER.email
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Token als HTTP-Only Cookie setzen
    cookies().set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 // 24 Stunden
    });

    return NextResponse.json({
      message: 'Erfolgreich angemeldet',
      user: {
        id: TEST_USER.id,
        email: TEST_USER.email,
        name: TEST_USER.name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    );
  }
}
