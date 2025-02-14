// !!! WICHTIG: Diese Datei ist essentiell für die PDF-Generierung und darf nicht gelöscht werden !!!
// !!! Sie enthält die Logik für die Erstellung der PDF-Dokumente mit allen Einstellungen !!!

import { jsPDF } from 'jspdf';
import { registerFonts } from '../fonts/fonts';

// PDF-Einstellungen
export const pdfSettings = {
  minMargin: 20,
  maxWidth: 170,
  lineHeight: 1.2
};

interface TextBlock {
  text: string | string[];
  x: number;
  y: number;
  fontSize?: number;
  fontWeight?: string | number;
  color?: string;
  textAlign?: string;
  maxWidth?: number;
  lineHeight?: number;
}

interface ImageBlock {
  type: 'image';
  imageData: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface LineBlock {
  type: 'line';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  lineWidth?: number;
  color?: string;
}

type ContentBlock = TextBlock | ImageBlock | LineBlock;

interface PDFOptions {
  content: ContentBlock[];
  orientation?: 'portrait' | 'landscape';
  width?: number;
  height?: number;
}

function applyTextStyle(pdf: jsPDF, block: TextBlock) {
  pdf.setFontSize(block.fontSize || 11);
  if (block.fontWeight === 'bold' || block.fontWeight === 600) {
    pdf.setFont('OpenSans', 'bold');
  } else {
    pdf.setFont('OpenSans', 'normal');
  }
  if (block.color) {
    pdf.setTextColor(block.color);
  }
}

export async function generatePDF(options: PDFOptions): Promise<Buffer> {
  const pdf = new jsPDF({
    orientation: options.orientation || 'portrait',
    unit: 'mm',
    format: [options.width || 210, options.height || 297]
  });

  // Registriere die Schriftarten
  registerFonts(pdf);

  for (const block of options.content) {
    if ('type' in block) {
      if (block.type === 'image') {
        try {
          pdf.addImage(
            block.imageData,
            'PNG',
            block.x,
            block.y,
            block.width,
            block.height
          );
        } catch (error) {
          console.error('Fehler beim Hinzufügen des Bildes:', error);
        }
      } else if (block.type === 'line') {
        if (block.color) {
          pdf.setDrawColor(block.color);
        }
        pdf.setLineWidth(block.lineWidth || 0.1);
        pdf.line(block.x1, block.y1, block.x2, block.y2);
      }
    } else {
      // Text Block
      applyTextStyle(pdf, block);
      
      if (Array.isArray(block.text)) {
        const lineHeight = block.lineHeight || 1.2;
        block.text.forEach((line, index) => {
          const yPos = block.y + (index * (block.fontSize || 11) * lineHeight);
          if (block.textAlign === 'right' && block.maxWidth) {
            pdf.text(line, block.x + block.maxWidth, yPos, { align: 'right' });
          } else {
            pdf.text(line, block.x, yPos);
          }
        });
      } else {
        if (block.textAlign === 'right' && block.maxWidth) {
          pdf.text(block.text, block.x + block.maxWidth, block.y, { align: 'right' });
        } else {
          pdf.text(block.text, block.x, block.y);
        }
      }
    }
  }

  return Buffer.from(pdf.output('arraybuffer'));
}
