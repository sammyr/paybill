const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('paybill.db');

db.get('SELECT number, discountType, discountValue FROM invoices WHERE number = ?', ['1002'], (err, row) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('Invoice data:', row);
  }
  db.close();
});
