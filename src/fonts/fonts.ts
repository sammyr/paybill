import { jsPDF } from 'jspdf';
import fs from 'fs';
import path from 'path';

// Pfad zur TTF-Datei
const openSansPath = path.join(process.cwd(), 'src/fonts/OpenSans-Regular.ttf');

// Funktion zum Laden der Schriftart
function loadFont(): string {
  try {
    const fontFile = fs.readFileSync(openSansPath);
    return fontFile.toString('base64');
  } catch (error) {
    console.error('Fehler beim Laden der Schriftartdatei:', error);
    throw new Error('Schriftart konnte nicht geladen werden');
  }
}

// Funktion zum Registrieren der Schriftart
export function registerFonts(pdf: jsPDF) {
  try {
    // Lade die Schriftart
    const openSansBase64 = loadFont();
    
    // Registriere Open Sans
    pdf.addFileToVFS('OpenSans-Regular.ttf', openSansBase64);
    pdf.addFont('OpenSans-Regular.ttf', 'OpenSans', 'normal');
    
    // Setze Open Sans als Standard
    pdf.setFont('OpenSans');
    
    console.log('Schriftart erfolgreich geladen und registriert');
  } catch (error) {
    console.error('Fehler beim Registrieren der Schriftart:', error);
    console.log('Verwende Helvetica als Fallback-Schriftart');
    // Fallback auf Helvetica
    pdf.setFont('helvetica');
  }
}
