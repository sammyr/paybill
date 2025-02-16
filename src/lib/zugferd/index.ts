import { DOMImplementation, XMLSerializer } from '@xmldom/xmldom';

interface Recipient {
  name: string;
  street: string;
  zip: string;
  city: string;
  country: string;
  email?: string;
  phone?: string;
  taxId?: string;
}

interface Invoice {
  id: string;
  date: string;
  dueDate: string;
  number: string;
  status: string;
  recipient: Recipient;
  positions: any[];
  notes?: string;
  netTotal: number;
  totalVat: number;
  grossTotal: number;
}

export function createZugferdXml(invoice: Invoice, settings: any) {
  // Debug-Ausgabe der eingehenden Daten
  console.log('ZUGFeRD XML Generierung - Eingangsdaten:', {
    invoice: {
      recipient: invoice?.recipient,
      number: invoice?.number
    },
    settings: {
      companyName: settings?.companyName
    }
  });

  if (!invoice || !settings) {
    throw new Error('Keine Rechnungs- oder Einstellungsdaten vorhanden');
  }

  // Validiere Pflichtfelder
  if (!invoice.recipient?.name) {
    console.log('Fehlender Käufername:', invoice.recipient);
    throw new Error('Käufername ist ein Pflichtfeld und darf nicht leer sein');
  }

  // Erstelle XML Dokument
  const doc = new DOMImplementation().createDocument(null, null, null);
  
  // Root-Element mit korrekten Namespaces
  const root = doc.createElement('rsm:CrossIndustryInvoice');
  root.setAttribute('xmlns:xsi', 'http://www.w3.org/2001/XMLSchema-instance');
  root.setAttribute('xmlns:ram', 'urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100');
  root.setAttribute('xmlns:rsm', 'urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100');
  root.setAttribute('xmlns:udt', 'urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100');
  root.setAttribute('xmlns:qdt', 'urn:un:unece:uncefact:data:standard:QualifiedDataType:100');
  doc.appendChild(root);

  // ExchangedDocumentContext
  const exchangedDocumentContext = doc.createElement('rsm:ExchangedDocumentContext');
  root.appendChild(exchangedDocumentContext);

  const businessProcessSpecifiedDocumentContextParameter = doc.createElement('ram:BusinessProcessSpecifiedDocumentContextParameter');
  const id = doc.createElement('ram:ID');
  id.textContent = 'urn:factur-x.eu:1p0:minimum';
  businessProcessSpecifiedDocumentContextParameter.appendChild(id);
  exchangedDocumentContext.appendChild(businessProcessSpecifiedDocumentContextParameter);

  const guidelineSpecifiedDocumentContextParameter = doc.createElement('ram:GuidelineSpecifiedDocumentContextParameter');
  const guidelineId = doc.createElement('ram:ID');
  guidelineId.textContent = 'urn:cen.eu:en16931:2017#compliant#urn:factur-x.eu:1p0:minimum';
  guidelineSpecifiedDocumentContextParameter.appendChild(guidelineId);
  exchangedDocumentContext.appendChild(guidelineSpecifiedDocumentContextParameter);

  // ExchangedDocument
  const exchangedDocument = doc.createElement('rsm:ExchangedDocument');
  const docId = doc.createElement('ram:ID');
  docId.textContent = invoice.number?.toString() || '';
  exchangedDocument.appendChild(docId);

  const docType = doc.createElement('ram:TypeCode');
  docType.textContent = '380'; // Commercial Invoice
  exchangedDocument.appendChild(docType);

  const issueDate = doc.createElement('ram:IssueDateTime');
  const dateElement = doc.createElement('udt:DateTimeString');
  dateElement.setAttribute('format', '102'); // YYYYMMDD
  dateElement.textContent = (invoice.date || '').replace(/-/g, '');
  issueDate.appendChild(dateElement);
  exchangedDocument.appendChild(issueDate);
  root.appendChild(exchangedDocument);

  // SupplyChainTradeTransaction
  const supplyChainTradeTransaction = doc.createElement('rsm:SupplyChainTradeTransaction');

  // ApplicableHeaderTradeAgreement
  const tradeAgreement = doc.createElement('ram:ApplicableHeaderTradeAgreement');
  
  // Seller Party
  const sellerTradeParty = doc.createElement('ram:SellerTradeParty');
  const sellerName = doc.createElement('ram:Name');
  sellerName.textContent = settings.companyName || '';
  sellerTradeParty.appendChild(sellerName);

  // Seller Address in korrekter Reihenfolge
  const sellerAddress = doc.createElement('ram:PostalTradeAddress');
  
  // Straße und Hausnummer getrennt
  const sellerStreetName = doc.createElement('ram:StreetName');
  sellerStreetName.textContent = settings.street?.split(' ').slice(0, -1).join(' ') || '';
  sellerAddress.appendChild(sellerStreetName);
  
  const sellerBuildingNumber = doc.createElement('ram:BuildingNumber');
  sellerBuildingNumber.textContent = settings.street?.split(' ').slice(-1)[0] || '';
  sellerAddress.appendChild(sellerBuildingNumber);
  
  const sellerCityName = doc.createElement('ram:CityName');
  sellerCityName.textContent = settings.city || '';
  sellerAddress.appendChild(sellerCityName);
  
  const sellerPostcode = doc.createElement('ram:PostcodeCode');
  sellerPostcode.textContent = settings.zipCode || '';
  sellerAddress.appendChild(sellerPostcode);
  
  const sellerCountryId = doc.createElement('ram:CountryID');
  sellerCountryId.textContent = 'DE';
  sellerAddress.appendChild(sellerCountryId);
  
  sellerTradeParty.appendChild(sellerAddress);

  // Pflichtfeld: Kontaktinformationen
  const sellerContact = doc.createElement('ram:DefinedTradeContact');
  const sellerContactName = doc.createElement('ram:PersonName');
  sellerContactName.textContent = settings.contactPerson || settings.companyName || '';
  const sellerContactTel = doc.createElement('ram:TelephoneUniversalCommunication');
  const sellerContactTelNumber = doc.createElement('ram:CompleteNumber');
  sellerContactTelNumber.textContent = settings.phone || '';
  sellerContactTel.appendChild(sellerContactTelNumber);
  const sellerContactEmail = doc.createElement('ram:EmailURIUniversalCommunication');
  const sellerContactEmailUri = doc.createElement('ram:URIID');
  sellerContactEmailUri.textContent = settings.email || '';
  sellerContactEmail.appendChild(sellerContactEmailUri);
  
  sellerContact.appendChild(sellerContactName);
  sellerContact.appendChild(sellerContactTel);
  sellerContact.appendChild(sellerContactEmail);
  sellerTradeParty.appendChild(sellerContact);

  // Seller Tax Registration
  if (settings.vatId) {
    const sellerTaxReg = doc.createElement('ram:SpecifiedTaxRegistration');
    const sellerTaxRegId = doc.createElement('ram:ID');
    sellerTaxRegId.setAttribute('schemeID', 'VA');
    sellerTaxRegId.textContent = settings.vatId;
    sellerTaxReg.appendChild(sellerTaxRegId);
    sellerTradeParty.appendChild(sellerTaxReg);
  }

  tradeAgreement.appendChild(sellerTradeParty);

  // Buyer Party
  const buyerTradeParty = doc.createElement('ram:BuyerTradeParty');
  const buyerName = doc.createElement('ram:Name');
  const customer = invoice.recipient;
  const buyerCompanyName = customer.name;
  if (!buyerCompanyName) {
    throw new Error('Käufername ist ein Pflichtfeld und darf nicht leer sein');
  }
  buyerName.textContent = buyerCompanyName;
  buyerTradeParty.appendChild(buyerName);

  // Buyer Address in korrekter Reihenfolge
  const buyerAddress = doc.createElement('ram:PostalTradeAddress');
  
  // Straße und Hausnummer getrennt
  const buyerStreetName = doc.createElement('ram:StreetName');
  const street = customer.street;
  const streetParts = street.split(' ');
  const buyerStreet = streetParts.slice(0, -1).join(' ');
  if (!buyerStreet) {
    throw new Error('Straße ist ein Pflichtfeld und darf nicht leer sein');
  }
  buyerStreetName.textContent = buyerStreet;
  buyerAddress.appendChild(buyerStreetName);
  
  const buyerBuildingNumber = doc.createElement('ram:BuildingNumber');
  buyerBuildingNumber.textContent = streetParts.slice(-1)[0] || '';
  buyerAddress.appendChild(buyerBuildingNumber);
  
  const buyerCityName = doc.createElement('ram:CityName');
  if (!customer.city) {
    throw new Error('Stadt ist ein Pflichtfeld und darf nicht leer sein');
  }
  buyerCityName.textContent = customer.city;
  buyerAddress.appendChild(buyerCityName);
  
  const buyerPostcode = doc.createElement('ram:PostcodeCode');
  if (!customer.zip) {
    throw new Error('Postleitzahl ist ein Pflichtfeld und darf nicht leer sein');
  }
  buyerPostcode.textContent = customer.zip;
  buyerAddress.appendChild(buyerPostcode);
  
  const buyerCountryId = doc.createElement('ram:CountryID');
  buyerCountryId.textContent = 'DE';
  buyerAddress.appendChild(buyerCountryId);
  
  buyerTradeParty.appendChild(buyerAddress);

  // Pflichtfeld: Kontaktinformationen
  const buyerContact = doc.createElement('ram:DefinedTradeContact');
  const buyerContactName = doc.createElement('ram:PersonName');
  buyerContactName.textContent = customer.name;
  const buyerContactTel = doc.createElement('ram:TelephoneUniversalCommunication');
  const buyerContactTelNumber = doc.createElement('ram:CompleteNumber');
  buyerContactTelNumber.textContent = customer.phone || '';
  buyerContactTel.appendChild(buyerContactTelNumber);
  const buyerContactEmail = doc.createElement('ram:EmailURIUniversalCommunication');
  const buyerContactEmailUri = doc.createElement('ram:URIID');
  buyerContactEmailUri.textContent = customer.email || '';
  buyerContactEmail.appendChild(buyerContactEmailUri);
  
  buyerContact.appendChild(buyerContactName);
  buyerContact.appendChild(buyerContactTel);
  buyerContact.appendChild(buyerContactEmail);
  buyerTradeParty.appendChild(buyerContact);

  // Buyer Tax Registration
  if (customer.taxId) {
    const buyerTaxReg = doc.createElement('ram:SpecifiedTaxRegistration');
    const buyerTaxRegId = doc.createElement('ram:ID');
    buyerTaxRegId.setAttribute('schemeID', 'VA');
    buyerTaxRegId.textContent = customer.taxId;
    buyerTaxReg.appendChild(buyerTaxRegId);
    buyerTradeParty.appendChild(buyerTaxReg);
  }

  tradeAgreement.appendChild(buyerTradeParty);

  // BuyerReference (Pflichtfeld)
  const buyerReference = doc.createElement('ram:BuyerReference');
  buyerReference.textContent = invoice.number?.toString() || 'UNKNOWN';
  tradeAgreement.appendChild(buyerReference);

  supplyChainTradeTransaction.appendChild(tradeAgreement);

  // ApplicableHeaderTradeDelivery
  const tradeDelivery = doc.createElement('ram:ApplicableHeaderTradeDelivery');
  
  // Lieferdatum
  const actualDelivery = doc.createElement('ram:ActualDeliverySupplyChainEvent');
  const deliveryDate = doc.createElement('ram:OccurrenceDateTime');
  const deliveryDateString = doc.createElement('udt:DateTimeString');
  deliveryDateString.setAttribute('format', '102');
  deliveryDateString.textContent = (invoice.date || '').replace(/-/g, '');
  deliveryDate.appendChild(deliveryDateString);
  actualDelivery.appendChild(deliveryDate);
  tradeDelivery.appendChild(actualDelivery);

  supplyChainTradeTransaction.appendChild(tradeDelivery);

  // ApplicableHeaderTradeSettlement
  const tradeSettlement = doc.createElement('ram:ApplicableHeaderTradeSettlement');
  
  // Währung
  const invoiceCurrency = doc.createElement('ram:InvoiceCurrencyCode');
  invoiceCurrency.textContent = 'EUR';
  tradeSettlement.appendChild(invoiceCurrency);

  // Zahlungsbedingungen
  const paymentTerms = doc.createElement('ram:SpecifiedTradePaymentTerms');
  const description = doc.createElement('ram:Description');
  description.textContent = invoice.notes || 'Zahlbar innerhalb von 14 Tagen';
  paymentTerms.appendChild(description);

  // Fälligkeitsdatum
  if (invoice.dueDate) {
    const dueDate = doc.createElement('ram:DueDateDateTime');
    const dueDateString = doc.createElement('udt:DateTimeString');
    dueDateString.setAttribute('format', '102');
    dueDateString.textContent = invoice.dueDate.replace(/-/g, '');
    dueDate.appendChild(dueDateString);
    paymentTerms.appendChild(dueDate);
  }
  tradeSettlement.appendChild(paymentTerms);

  // Steuerinformationen
  const tradeTax = doc.createElement('ram:ApplicableTradeTax');
  const calculatedAmount = doc.createElement('ram:CalculatedAmount');
  calculatedAmount.textContent = (invoice.totalVat || 0).toFixed(2);
  const basisAmount = doc.createElement('ram:BasisAmount');
  basisAmount.textContent = (invoice.netTotal || 0).toFixed(2);
  const categoryCode = doc.createElement('ram:CategoryCode');
  categoryCode.textContent = 'S'; // Standard rate
  const typeCode = doc.createElement('ram:TypeCode');
  typeCode.textContent = 'VAT';
  const rateApplicablePercent = doc.createElement('ram:RateApplicablePercent');
  rateApplicablePercent.textContent = '19';

  tradeTax.appendChild(calculatedAmount);
  tradeTax.appendChild(basisAmount);
  tradeTax.appendChild(categoryCode);
  tradeTax.appendChild(typeCode);
  tradeTax.appendChild(rateApplicablePercent);
  tradeSettlement.appendChild(tradeTax);

  // Gesamtbeträge
  const monetarySummation = doc.createElement('ram:SpecifiedTradeSettlementHeaderMonetarySummation');
  
  // Nettobetrag (Pflichtfeld)
  const lineTotalAmount = doc.createElement('ram:LineTotalAmount');
  lineTotalAmount.textContent = (invoice.netTotal || 0).toFixed(2);
  monetarySummation.appendChild(lineTotalAmount);

  // Steuerbasis
  const taxBasisTotal = doc.createElement('ram:TaxBasisTotalAmount');
  taxBasisTotal.textContent = (invoice.netTotal || 0).toFixed(2);
  monetarySummation.appendChild(taxBasisTotal);

  // Steuerbetrag
  const taxTotal = doc.createElement('ram:TaxTotalAmount');
  taxTotal.textContent = (invoice.totalVat || 0).toFixed(2);
  monetarySummation.appendChild(taxTotal);

  // Gesamtbetrag
  const grandTotal = doc.createElement('ram:GrandTotalAmount');
  grandTotal.textContent = (invoice.grossTotal || 0).toFixed(2);
  monetarySummation.appendChild(grandTotal);

  // Zu zahlender Betrag (Pflichtfeld)
  const duePayableAmount = doc.createElement('ram:DuePayableAmount');
  duePayableAmount.textContent = (invoice.grossTotal || 0).toFixed(2);
  monetarySummation.appendChild(duePayableAmount);

  tradeSettlement.appendChild(monetarySummation);
  supplyChainTradeTransaction.appendChild(tradeSettlement);

  root.appendChild(supplyChainTradeTransaction);

  const serializer = new XMLSerializer();
  return serializer.serializeToString(doc);
}
