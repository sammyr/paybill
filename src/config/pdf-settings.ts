// PDF-Einstellungen für das Layout
export const pdfSettings = {
  // Logo-Einstellungen (Maße in mm, A4 = 210x297mm)
  logo: {
    width: 120,    // ~384px auf A4
    height: 25,    // ~66px auf A4
    x: 45,         // Zentriert auf der Seite
    y: 20
  },
  
  // QR-Code-Einstellungen
  qrCode: {
    width: 30,
    height: 30,
    x: 160,        // Rechts ausgerichtet
    y: 20
  },
  
  // Schriftgrößen
  fontSize: {
    small: 8,      // Fußzeile
    normal: 11,    // Standardtext
    large: 14      // Überschriften
  },
  
  // Farben
  colors: {
    text: '#000000',
    gray: '#666666'
  },
  
  // Abstände
  spacing: {
    lineHeight: 15,
    tableRowHeight: 25,
    contentTop: 70    // Abstand nach Logo für Inhalt
  },
  
  // Seitenränder
  margins: {
    left: 20,
    right: 20,
    top: 20,
    bottom: 20
  },
  
  // Spalten-Positionen (von links)
  columns: {
    position: 20,      // Pos.
    description: 40,   // Beschreibung
    quantity: 120,     // Menge
    unitPrice: 140,    // Einzelpreis
    total: 170        // Gesamtpreis
  },
  
  // Empfänger-Block
  recipient: {
    x: 20,
    y: 45,
    lineHeight: 5
  },
  
  // Rechnungsinfo-Block (rechts)
  invoiceInfo: {
    x: 120,
    y: 45,
    lineHeight: 5
  }
} as const;
