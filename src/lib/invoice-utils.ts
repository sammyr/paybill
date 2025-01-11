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
export function calculateInvoiceTotals(invoice: Invoice): InvoiceTotals {
  // Netto-Summe berechnen (Zwischensumme)
  const netTotal = invoice.positions.reduce((sum, pos) => {
    const { totalNet } = calculatePositionTotals(pos);
    return sum + totalNet;
  }, 0);

  // Rabatt berechnen
  let discountAmount = 0;
  if (invoice.discount && typeof invoice.discount.value === 'number' && invoice.discount.value > 0) {
    if (invoice.discount.type === 'percentage') {
      discountAmount = netTotal * (invoice.discount.value / 100);
    } else {
      discountAmount = invoice.discount.value;
    }
    // Debug-Ausgabe für Rabattberechnung
    console.log('Rabattberechnung:', {
      type: invoice.discount.type,
      value: invoice.discount.value,
      netTotal,
      discountAmount
    });
  }

  // Netto nach Rabatt
  const netAfterDiscount = netTotal - discountAmount;

  // MwSt pro Satz berechnen
  const vatAmounts = invoice.positions.reduce((acc, pos) => {
    const { totalNet } = calculatePositionTotals(pos);
    if (totalNet === 0) return acc;

    // Anteiligen Rabatt für diese Position berechnen
    const positionDiscountRatio = totalNet / netTotal;
    const positionDiscount = discountAmount * positionDiscountRatio;
    const positionNetAfterDiscount = totalNet - positionDiscount;
    
    const vatRate = parseFloat(String(pos.taxRate)) || 19;
    const key = vatRate.toString();
    if (!acc[key]) {
      acc[key] = 0;
    }
    acc[key] += positionNetAfterDiscount * (vatRate / 100);
    return acc;
  }, {} as { [key: string]: number });

  // Gesamte MwSt
  const totalVat = Object.values(vatAmounts).reduce((sum, amount) => sum + (amount || 0), 0);

  // Brutto-Summe
  const grossTotal = netAfterDiscount + totalVat;

  return {
    netTotal: Number(netTotal.toFixed(2)),
    discountAmount: Number(discountAmount.toFixed(2)),
    netAfterDiscount: Number(netAfterDiscount.toFixed(2)),
    vatAmounts: Object.fromEntries(
      Object.entries(vatAmounts).map(([rate, amount]) => [rate, Number(amount.toFixed(2))])
    ),
    totalVat: Number(totalVat.toFixed(2)),
    grossTotal: Number(grossTotal.toFixed(2))
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
