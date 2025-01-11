/**
 * @ai-protected-function
 * @description Diese Funktion enthält kritische Berechnungslogik für Rechnungsbeträge.
 * @warning KEINE ÄNDERUNGEN ERLAUBT! Diese Funktion wurde am 04.01.2025 finalisiert.
 * Jegliche Änderungen an Berechnungen oder Formaten könnten die Rechnungsstellung beschädigen.
 * @reason Die Berechnungslogik muss für steuerliche und buchhalterische Zwecke konsistent bleiben.
 */
export function calculateInvoiceTotals(invoice: any) {
  // Netto-Summe berechnen (Zwischensumme)
  const netTotal = invoice.positions.reduce((sum: number, pos: any) => {
    const posTotal = (pos.quantity || 0) * (pos.unitPrice || 0);
    return sum + posTotal;
  }, 0);

  // Rabatt berechnen
  let discountAmount = 0;
  if (invoice.discount && invoice.discountValue) {
    if (invoice.discountType === 'percentage') {
      discountAmount = netTotal * (parseFloat(String(invoice.discountValue)) / 100);
    } else {
      discountAmount = parseFloat(String(invoice.discountValue));
    }
  }

  // Netto nach Rabatt
  const netAfterDiscount = netTotal - discountAmount;

  // MwSt pro Satz berechnen
  const vatAmounts = invoice.positions.reduce((acc: any, pos: any) => {
    const positionNet = (pos.quantity || 0) * (pos.unitPrice || 0);
    if (positionNet === 0) return acc;

    // Anteiligen Rabatt für diese Position berechnen
    const positionDiscountRatio = positionNet / netTotal;
    const positionDiscount = discountAmount * positionDiscountRatio;
    const positionNetAfterDiscount = positionNet - positionDiscount;
    
    const vatRate = parseFloat(String(pos.taxRate)) || 19;
    const key = vatRate.toString();
    if (!acc[key]) {
      acc[key] = 0;
    }
    acc[key] += positionNetAfterDiscount * (vatRate / 100);
    return acc;
  }, {});

  // Gesamte MwSt
  const totalVat = Object.values(vatAmounts).reduce((sum: number, amount: number) => sum + (amount || 0), 0);

  // Brutto-Summe
  const grossTotal = netAfterDiscount + totalVat;

  return {
    netTotal: Number(netTotal.toFixed(2)),
    discountAmount: Number(discountAmount.toFixed(2)),
    netAfterDiscount: Number(netAfterDiscount.toFixed(2)),
    vatAmounts: Object.fromEntries(
      Object.entries(vatAmounts).map(([rate, amount]) => [rate, Number((amount as number).toFixed(2))])
    ),
    totalVat: Number(totalVat.toFixed(2)),
    grossTotal: Number(grossTotal.toFixed(2))
  };
}
