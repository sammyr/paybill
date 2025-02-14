import { jsPDF } from 'jspdf';
import fs from 'fs';
import path from 'path';

// Pfade zu den TTF-Dateien
const openSansRegularPath = path.join(process.cwd(), 'src/fonts/OpenSans-Regular.ttf');
const openSansBoldPath = path.join(process.cwd(), 'src/fonts/OpenSans-Bold.ttf');

// Funktion zum Laden der Schriftarten
function loadFonts(): { regular: string; bold: string } {
  try {
    const regularFont = fs.readFileSync(openSansRegularPath);
    const boldFont = fs.readFileSync(openSansBoldPath);
    return {
      regular: regularFont.toString('base64'),
      bold: boldFont.toString('base64')
    };
  } catch (error) {
    console.error('Fehler beim Laden der Schriftartdateien:', error);
    throw new Error('Schriftarten konnten nicht geladen werden');
  }
}

// Funktion zum Registrieren der Schriftarten
export function registerFonts(pdf: jsPDF) {
  try {
    // Lade die Schriftarten
    const fonts = loadFonts();
    
    // Registriere Open Sans Regular
    pdf.addFileToVFS('OpenSans-Regular.ttf', fonts.regular);
    pdf.addFont('OpenSans-Regular.ttf', 'OpenSans', 'normal');
    
    // Registriere Open Sans Bold
    pdf.addFileToVFS('OpenSans-Bold.ttf', fonts.bold);
    pdf.addFont('OpenSans-Bold.ttf', 'OpenSans', 'bold');
    
    // Setze Open Sans als Standard
    pdf.setFont('OpenSans');
    
    console.log('Schriftarten erfolgreich geladen und registriert');
  } catch (error) {
    console.error('Fehler beim Registrieren der Schriftarten:', error);
    console.log('Verwende Helvetica als Fallback-Schriftart');
    // Fallback auf Helvetica
    pdf.setFont('helvetica');
  }
}
