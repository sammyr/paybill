/**
 * @ai-protected-function
 * @description Diese Funktion enthält kritische Berechnungslogik für Rechnungsbeträge.
 * @warning KEINE ÄNDERUNGEN ERLAUBT! Diese Funktion wurde am 04.01.2025 finalisiert.
 * Jegliche Änderungen an Berechnungen oder Formaten könnten die Rechnungsstellung beschädigen.
 * @reason Die Berechnungslogik muss für steuerliche und buchhalterische Zwecke konsistent bleiben.
 */
export const calculateInvoiceTotals = (invoice: any) => {
  // Netto-Summe berechnen
  const netTotal = invoice.positions.reduce((sum: number, pos: any) => {
    return sum + (Number(pos.quantity || 0) * Number(pos.unitPrice || 0));
  }, 0);

  // Rabatt berechnen
  let discountAmount = invoice.discountAmount || 0;

  // Netto nach Rabatt
  const netAfterDiscount = netTotal - discountAmount;

  // MwSt pro Steuersatz berechnen
  const vatAmounts: { [key: string]: number } = {};
  invoice.positions.forEach((pos: any) => {
    const positionNet = Number(pos.quantity || 0) * Number(pos.unitPrice || 0);
    const vatRate = pos.taxRate || 19;
    
    // Anteiligen Rabatt für diese Position berechnen
    const positionDiscountRatio = positionNet / netTotal;
    const positionDiscount = discountAmount * positionDiscountRatio;
    const positionNetAfterDiscount = positionNet - positionDiscount;
    
    // MwSt für diese Position berechnen
    if (!vatAmounts[vatRate]) {
      vatAmounts[vatRate] = 0;
    }
    vatAmounts[vatRate] += positionNetAfterDiscount * (vatRate / 100);
  });

  // Runde MwSt-Beträge
  Object.keys(vatAmounts).forEach(rate => {
    vatAmounts[rate] = Number(vatAmounts[rate].toFixed(2));
  });
  
  // Gesamte MwSt
  const totalVat = Object.values(vatAmounts).reduce((sum: number, amount: number) => sum + amount, 0);

  // Brutto-Gesamtbetrag
  const grossTotal = netAfterDiscount + totalVat;

  return {
    netTotal: Number(netTotal.toFixed(2)),
    discountAmount: Number(discountAmount.toFixed(2)),
    netAfterDiscount: Number(netAfterDiscount.toFixed(2)),
    vatAmounts,
    totalVat: Number(totalVat.toFixed(2)),
    grossTotal: Number(grossTotal.toFixed(2))
  };
};
