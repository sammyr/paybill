import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';

// Schriftarten registrieren
Font.register({
  family: 'Inter',
  src: '/fonts/Inter-Regular.ttf'
});

Font.register({
  family: 'InterBold',
  src: '/fonts/Inter-Bold.ttf'
});

// Styles für das PDF
const styles = StyleSheet.create({
  page: {
    padding: '20mm',
    fontFamily: 'Inter',
    fontSize: 10,
  },
  header: {
    marginBottom: 40,
  },
  logo: {
    width: 200,
    marginBottom: 20,
    alignSelf: 'flex-end',
  },
  senderLine: {
    fontSize: 8,
    marginBottom: 20,
    color: '#666',
  },
  recipientSection: {
    marginBottom: 40,
  },
  invoiceInfoSection: {
    marginBottom: 20,
  },
  table: {
    marginTop: 20,
    marginBottom: 30,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    paddingBottom: 5,
    marginBottom: 10,
    fontFamily: 'InterBold',
  },
  tableRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  description: { width: '40%' },
  quantity: { width: '15%', textAlign: 'right' },
  price: { width: '15%', textAlign: 'right' },
  vat: { width: '15%', textAlign: 'right' },
  amount: { width: '15%', textAlign: 'right' },
  totalsSection: {
    marginTop: 30,
    alignItems: 'flex-end',
  },
  totalRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  totalLabel: {
    width: 100,
  },
  totalAmount: {
    width: 80,
    textAlign: 'right',
  },
  bold: {
    fontFamily: 'InterBold',
  },
  notes: {
    marginTop: 40,
    fontSize: 9,
  },
  footer: {
    position: 'absolute',
    bottom: '20mm',
    left: '20mm',
    right: '20mm',
    fontSize: 8,
    color: '#666',
  },
});

// Funktion zur Formatierung von Währungsbeträgen
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
};

// Funktion zur Formatierung von Datumsangaben
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('de-DE');
};

export const InvoicePDFTemplate = ({ invoice, settings }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header mit Logo */}
      <View style={styles.header}>
        {settings.logo && (
          <Image src={settings.logo} style={styles.logo} />
        )}
        <Text style={styles.senderLine}>
          {settings.companyName} - {settings.street} - {settings.zip} {settings.city}
        </Text>
      </View>

      {/* Empfänger */}
      <View style={styles.recipientSection}>
        <Text>{invoice.recipient.name}</Text>
        <Text>{invoice.recipient.street}</Text>
        <Text>{invoice.recipient.zip} {invoice.recipient.city}</Text>
        {invoice.recipient.country && (
          <Text>{invoice.recipient.country}</Text>
        )}
      </View>

      {/* Rechnungsinformationen */}
      <View style={styles.invoiceInfoSection}>
        <Text style={styles.bold}>Rechnung Nr. {invoice.number}</Text>
        <Text>Datum: {formatDate(invoice.date)}</Text>
        <Text>Fällig bis: {formatDate(invoice.dueDate)}</Text>
      </View>

      {/* Rechnungspositionen */}
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={styles.description}>Beschreibung</Text>
          <Text style={styles.quantity}>Menge</Text>
          <Text style={styles.price}>Einzelpreis</Text>
          <Text style={styles.vat}>MwSt.</Text>
          <Text style={styles.amount}>Gesamt</Text>
        </View>

        {invoice.positions.map((position, index) => (
          <View key={index} style={styles.tableRow}>
            <Text style={styles.description}>{position.description}</Text>
            <Text style={styles.quantity}>{position.quantity}</Text>
            <Text style={styles.price}>{formatCurrency(position.unitPrice)}</Text>
            <Text style={styles.vat}>{position.taxRate}%</Text>
            <Text style={styles.amount}>{formatCurrency(position.amount)}</Text>
          </View>
        ))}
      </View>

      {/* Summen */}
      <View style={styles.totalsSection}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Netto:</Text>
          <Text style={styles.totalAmount}>{formatCurrency(invoice.totalNet)}</Text>
        </View>

        {Object.entries(invoice.vatAmounts || {}).map(([rate, amount]) => (
          <View key={rate} style={styles.totalRow}>
            <Text style={styles.totalLabel}>MwSt. {rate}%:</Text>
            <Text style={styles.totalAmount}>{formatCurrency(amount)}</Text>
          </View>
        ))}

        {invoice.discountAmount > 0 && (
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Rabatt:</Text>
            <Text style={styles.totalAmount}>-{formatCurrency(invoice.discountAmount)}</Text>
          </View>
        )}

        <View style={[styles.totalRow, styles.bold]}>
          <Text style={styles.totalLabel}>Gesamtbetrag:</Text>
          <Text style={styles.totalAmount}>{formatCurrency(invoice.totalGross)}</Text>
        </View>
      </View>

      {/* Notizen */}
      {invoice.notes && (
        <View style={styles.notes}>
          <Text>{invoice.notes}</Text>
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Text>
          {settings.companyName} | {settings.street} | {settings.zip} {settings.city} | 
          Steuernummer: {settings.taxId} | Ust-IdNr: {settings.vatId}
        </Text>
        <Text>
          Bankverbindung: {settings.bankName} | IBAN: {settings.iban} | BIC: {settings.bic}
        </Text>
      </View>
    </Page>
  </Document>
);
