import { getDatabase } from './src/lib/db';

async function checkInvoice() {
  const db = getDatabase();
  try {
    const invoices = await db.listInvoices();
    const invoice = invoices.find(inv => inv.number === '1002');
    console.log('Invoice data:', {
      number: invoice?.number,
      discountType: invoice?.discount?.type,
      discountValue: invoice?.discount?.value
    });
  } catch (error) {
    console.error('Error:', error);
  }
}

checkInvoice();
