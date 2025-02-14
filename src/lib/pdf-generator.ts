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
  font?: string;
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
  try {
    // Validiere Eingabeparameter
    if (!pdf || !block) {
      throw new Error('Ungültige Parameter für applyTextStyle');
    }

    pdf.setFontSize(block.fontSize || 11);
    if (block.fontWeight === 'bold' || block.fontWeight === 600) {
      pdf.setFont('OpenSans', 'bold');
    } else {
      pdf.setFont('OpenSans', 'normal');
    }
    if (block.color) {
      pdf.setTextColor(block.color);
    }
  } catch (error) {
    console.error('Fehler beim Anwenden des Textstils:', error);
    throw error;
  }
}

export async function generatePDF({ content }: PDFOptions): Promise<Buffer> {
  try {
    console.log('Starte PDF-Generierung...');
    
    // Validiere Eingabeparameter
    if (!content || !Array.isArray(content)) {
      throw new Error('Ungültige PDF-Inhalte');
    }

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    console.log('PDF-Instanz erstellt');

    for (const block of content) {
      try {
        if (!block) {
          console.warn('Überspringe ungültigen Block');
          continue;
        }

        if (block.type === 'image') {
          console.log('Verarbeite Bild:', { x: block.x, y: block.y, width: block.width, height: block.height });
          pdf.addImage(
            block.imageData,
            'PNG',
            Number(block.x),
            Number(block.y),
            Number(block.width),
            Number(block.height)
          );
        } else if (block.type === 'line') {
          console.log('Zeichne Linie:', { x1: block.x1, y1: block.y1, x2: block.x2, y2: block.y2 });
          pdf.setLineWidth(block.lineWidth || 0.1);
          pdf.line(
            Number(block.x1),
            Number(block.y1),
            Number(block.x2),
            Number(block.y2)
          );
        } else {
          try {
            console.log('Verarbeite Text:', {
              text: block.text,
              x: block.x,
              y: block.y,
              align: block.textAlign,
              font: block.font,
              fontSize: block.fontSize
            });

            applyTextStyle(pdf, block);
            
            if (Array.isArray(block.text)) {
              const lineHeight = block.lineHeight || 1.2;
              block.text.forEach((line, index) => {
                try {
                  const textContent = String(line || '').trim();
                  if (!textContent) {
                    console.warn('Überspringe leere Textzeile');
                    return;
                  }

                  const yPos = Number(block.y) + (index * (block.fontSize || 11) * lineHeight);
                  let xPos = Number(block.x);

                  if (block.textAlign === 'right') {
                    const textWidth = pdf.getTextWidth(textContent);
                    xPos = block.maxWidth ? xPos + Number(block.maxWidth) - textWidth : xPos;
                  } else if (block.textAlign === 'center' && block.maxWidth) {
                    const textWidth = pdf.getTextWidth(textContent);
                    xPos = xPos + (Number(block.maxWidth) - textWidth) / 2;
                  }

                  console.log('Schreibe Textzeile:', {
                    text: textContent,
                    x: xPos,
                    y: yPos,
                    align: block.textAlign
                  });

                  pdf.text(textContent, xPos, yPos);
                } catch (lineError) {
                  console.error('Fehler beim Schreiben einer Textzeile:', lineError);
                  throw lineError;
                }
              });
            } else {
              try {
                const textContent = String(block.text || '').trim();
                if (!textContent) {
                  console.warn('Überspringe leeren Text');
                  return;
                }

                let xPos = Number(block.x);
                const yPos = Number(block.y);

                if (block.textAlign === 'right') {
                  const textWidth = pdf.getTextWidth(textContent);
                  xPos = block.maxWidth ? xPos + Number(block.maxWidth) - textWidth : xPos;
                } else if (block.textAlign === 'center' && block.maxWidth) {
                  const textWidth = pdf.getTextWidth(textContent);
                  xPos = xPos + (Number(block.maxWidth) - textWidth) / 2;
                }

                console.log('Schreibe Text:', {
                  text: textContent,
                  x: xPos,
                  y: yPos,
                  align: block.textAlign
                });

                pdf.text(textContent, xPos, yPos);
              } catch (textError) {
                console.error('Fehler beim Schreiben des Texts:', textError);
                throw textError;
              }
            }
          } catch (blockError) {
            console.error('Fehler bei der Verarbeitung des Text-Blocks:', blockError);
            throw blockError;
          }
        }
      } catch (blockError) {
        console.error('Fehler bei der Verarbeitung eines Blocks:', blockError);
        throw blockError;
      }
    }

    console.log('PDF-Generierung abgeschlossen');
    return Buffer.from(pdf.output('arraybuffer'));
  } catch (error) {
    console.error('Fehler bei der PDF-Generierung:', error);
    throw error;
  }
}
