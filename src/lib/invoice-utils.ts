/**
 * @fileoverview Zentrale Funktionen für die Rechnungsverarbeitung
 * @description Dieses Modul enthält alle Funktionen für die Berechnung und Formatierung von Rechnungen
 */

export interface InvoicePosition {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  totalNet?: number;
  totalGross?: number;
}

export interface Invoice {
  id?: string;
  number?: string;
  date?: string | Date;
  dueDate?: string | Date;
  recipient?: {
    name: string;
    street?: string;
    zip?: string;
    city?: string;
    country?: string;
    email?: string;
    phone?: string;
    taxId?: string;
  };
  positions: InvoicePosition[];
  discount?: {
    type: 'percentage' | 'fixed';
    value: number;
  };
  notes?: string;
  status?: string;
}

export interface InvoiceTotals {
  netTotal: number;
  discountAmount: number;
  netAfterDiscount: number;
  vatAmounts: { [key: string]: number };
  totalVat: number;
  grossTotal: number;
}

/**
 * Formatiert einen Betrag als Währung
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('de-DE', { 
    style: 'currency', 
    currency: 'EUR',
    minimumFractionDigits: 2
  }).format(value);
}

/**
 * Formatiert eine Zahl mit 2 Dezimalstellen
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

/**
 * Berechnet die Gesamtbeträge einer Position
 */
export function calculatePositionTotals(position: InvoicePosition): { totalNet: number; totalGross: number } {
  const quantity = position.quantity || 0;
  const unitPrice = position.unitPrice || 0;
  const taxRate = position.taxRate || 19;

  const totalNet = Number((quantity * unitPrice).toFixed(2));
  const totalGross = Number((totalNet * (1 + (taxRate / 100))).toFixed(2));

  return { totalNet, totalGross };
}

/**
 * Berechnet alle Summen einer Rechnung
 */
export function calculateInvoiceTotals(invoice: any) {
  // Debug: Eingangsdaten
  console.log('Berechne Summen für:', invoice);

  const positions = invoice.positions || [];
  
  // Netto-Gesamtbetrag berechnen
  const netTotal = positions.reduce((sum: number, pos: any) => {
    const quantity = pos.quantity ? parseFloat(pos.quantity.toString()) : 0;
    const price = pos.unitPrice ? parseFloat(pos.unitPrice.toString()) : 0;
    const positionTotal = quantity * price;

    // Debug: Position
    console.log('Position Berechnung:', {
      description: pos.description,
      quantity,
      unitPrice: price,
      total: positionTotal
    });

    return sum + positionTotal;
  }, 0);

  // MwSt berechnen (19%)
  const totalVat = netTotal * 0.19;
  const grossTotal = netTotal + totalVat;

  // Debug: Endergebnis
  console.log('Berechnete Summen:', {
    netTotal,
    totalVat,
    grossTotal
  });

  return {
    netTotal,
    totalVat,
    grossTotal,
    vatRate: 19,
    vatAmounts: {
      "19": totalVat // Füge vatAmounts für 19% hinzu
    }
  };
}

/**
 * Generiert eine PDF aus einer Rechnung
 */
export async function generateInvoicePDF(invoice: Invoice, settings: any) {
  const totals = calculateInvoiceTotals(invoice);
  // ... PDF-Generierung hier implementieren
  return { invoice, totals };
}
