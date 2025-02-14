export function formatDate(date: string | Date | undefined): string {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

export function formatCurrency(amount: number | undefined): string {
  if (amount === undefined || amount === null) return '0,00 €';
  
  // Debug: Währungsformatierung
  console.log('Formatiere Währung:', {
    input: amount,
    type: typeof amount
  });

  try {
    return amount.toLocaleString('de-DE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) + ' €';
  } catch (error) {
    console.error('Fehler bei der Währungsformatierung:', error);
    return '0,00 €';
  }
}

export function calculateTotals(positions: any[]) {
  // Debug: Positionen für Summenberechnung
  console.log('Berechne Summen für Positionen:', positions);

  const netTotal = positions.reduce((sum, pos) => {
    const quantity = pos.quantity ? parseFloat(pos.quantity.toString()) : 0;
    const price = pos.price ? parseFloat(pos.price.toString()) : 0;
    const positionTotal = quantity * price;

    // Debug: Position Summenberechnung
    console.log('Position Summe:', {
      quantity,
      price,
      total: positionTotal
    });

    return sum + positionTotal;
  }, 0);

  const totalVat = netTotal * 0.19;
  const grossTotal = netTotal + totalVat;

  // Debug: Gesamtsummen
  console.log('Berechnete Gesamtsummen:', {
    netTotal,
    totalVat,
    grossTotal
  });

  return {
    netTotal,
    totalVat,
    grossTotal
  };
}
