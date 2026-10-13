import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable?: { finalY: number };
  }
}

const PAGE_MARGIN = 14;
const BLUE = [29, 78, 216] as const;

function text(value: unknown): string {
  return value === null || value === undefined || value === '' ? '—' : String(value);
}

function amount(value: unknown): string {
  const parsed = Number(value);
  return `INR ${Number.isFinite(parsed) ? parsed.toFixed(2) : '0.00'}`;
}

function dateTime(value: string | Date | undefined, dateOnly = false): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    ...(dateOnly
      ? { day: '2-digit', month: 'short', year: 'numeric' }
      : { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
  }).format(date);
}

function setupDocument(title: string, subtitle: string): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  doc.setProperties({ title: `${title} - Sohom Enterprises`, subject: subtitle, author: 'Sohom Enterprises' });
  doc.setTextColor(...BLUE);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.text('Sohom Enterprises', PAGE_MARGIN, 17);
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(12);
  doc.text(title, PAGE_MARGIN, 25);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(subtitle, PAGE_MARGIN, 31);
  return doc;
}

function addPageFooter(doc: jsPDF, pageNumber: number, pageCount: number) {
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Sohom Enterprises  |  Page ${pageNumber} of ${pageCount}`, width - PAGE_MARGIN, height - 7, { align: 'right' });
}

function addSectionHeading(doc: jsPDF, heading: string, y: number) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text(heading, PAGE_MARGIN, y);
}

function addKeyValues(doc: jsPDF, rows: string[][], startY: number) {
  autoTable(doc, {
    startY,
    head: [['Detail', 'Information']],
    body: rows,
    theme: 'grid',
    margin: { left: PAGE_MARGIN, right: PAGE_MARGIN, bottom: 14 },
    styles: { font: 'helvetica', fontSize: 8, cellPadding: 2.2, overflow: 'linebreak', valign: 'top' },
    headStyles: { fillColor: [...BLUE], textColor: 255, fontStyle: 'bold' },
    columnStyles: { 0: { cellWidth: 42, fontStyle: 'bold' } },
    didDrawPage: (data) => addPageFooter(doc, data.pageNumber, doc.getNumberOfPages()),
  });
  if (!doc.lastAutoTable) throw new Error('Could not finish the PDF table layout.');
  return doc.lastAutoTable.finalY;
}

export interface CustomerOrderDocument {
  orderNumber: string;
  createdAt: string | Date;
  status: string;
  subtotal: number | string;
  discountAmount: number | string;
  shippingAmount: number | string;
  totalAmount: number | string;
  address?: {
    fullName?: string;
    phone?: string;
    addressLine1?: string;
    addressLine2?: string | null;
    landmark?: string | null;
    city?: string;
    state?: string;
    pincode?: string;
  } | null;
  items?: Array<{
    quantity: number;
    price: number | string;
    productNameSnapshot?: string | null;
    product?: { name?: string } | null;
  }>;
  payments?: Array<{
    provider?: string;
    providerPaymentId?: string | null;
    amount?: number | string;
    status: string;
    updatedAt?: string | Date;
    createdAt?: string | Date;
  }>;
}

export interface CustomerDocumentContact {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
}

export function buildCustomerOrderPdf(
  order: CustomerOrderDocument,
  contact: CustomerDocumentContact,
  kind: 'invoice' | 'payment-receipt',
): jsPDF {
  const payment = order.payments?.[0];
  if (kind === 'payment-receipt' && payment?.status !== 'COMPLETED') {
    throw new Error('A payment receipt is available only after payment is confirmed.');
  }

  const isReceipt = kind === 'payment-receipt';
  const doc = setupDocument(
    isReceipt ? 'Payment receipt' : 'Order invoice',
    `Order ${order.orderNumber}  |  ${dateTime(isReceipt ? payment?.updatedAt || payment?.createdAt : order.createdAt)}`,
  );
  const address = order.address;
  const addressText = [
    address?.addressLine1,
    address?.addressLine2,
    address?.landmark && `Landmark: ${address.landmark}`,
    [address?.city, address?.state, address?.pincode].filter(Boolean).join(', '),
  ].filter(Boolean).join(', ');

  let nextY = 38;
  if (isReceipt) {
    addSectionHeading(doc, 'Customer and payment', nextY);
    addKeyValues(doc, [
      ['Customer', text(address?.fullName || contact.name)],
      ['Phone', text(address?.phone || contact.phone)],
      ['Email', text(contact.email)],
      ['Order number', order.orderNumber],
      ['Payment status', 'RECEIVED AND CONFIRMED'],
      ['Payment method', payment?.provider === 'UPI_QR' ? 'UPI' : text(payment?.provider)],
      ['Payment reference', text(payment?.providerPaymentId)],
      ['Confirmed on', dateTime(payment?.updatedAt || payment?.createdAt)],
      ['Amount received', amount(payment?.amount ?? order.totalAmount)],
    ], nextY + 3);
  } else {
    addSectionHeading(doc, 'Customer and delivery address', nextY);
    nextY = addKeyValues(doc, [
      ['Customer', text(address?.fullName || contact.name)],
      ['Phone', text(address?.phone || contact.phone)],
      ['Email', text(contact.email)],
      ['Delivery address', addressText || '—'],
      ['Order status', text(order.status.replaceAll('_', ' '))],
    ], nextY + 3) + 9;
    addSectionHeading(doc, 'Order items', nextY);
    autoTable(doc, {
      startY: nextY + 3,
      head: [['Product', 'Quantity', 'Unit price', 'Line total']],
      body: (order.items || []).map((item) => [
        text(item.productNameSnapshot || item.product?.name || 'Product'),
        String(item.quantity),
        amount(item.price),
        amount(Number(item.price) * item.quantity),
      ]),
      theme: 'grid',
      margin: { left: PAGE_MARGIN, right: PAGE_MARGIN, bottom: 14 },
      styles: { font: 'helvetica', fontSize: 8, cellPadding: 2.2, overflow: 'linebreak' },
      headStyles: { fillColor: [...BLUE], textColor: 255, fontStyle: 'bold' },
      columnStyles: { 0: { cellWidth: 85 } },
      didDrawPage: (data) => addPageFooter(doc, data.pageNumber, doc.getNumberOfPages()),
    });
    if (!doc.lastAutoTable) throw new Error('Could not finish the invoice item table.');
    const totalsY = doc.lastAutoTable.finalY + 8;
    addKeyValues(doc, [
      ['Subtotal', amount(order.subtotal)],
      ['Discount', `- ${amount(order.discountAmount)}`],
      ['Shipping', amount(order.shippingAmount)],
      ['Total', amount(order.totalAmount)],
    ], totalsY);
  }

  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    addPageFooter(doc, page, pageCount);
  }
  return doc;
}

type AdminOrder = {
  orderNumber: string;
  createdAt: string | Date;
  status: string;
  subtotal: number | string;
  discountAmount: number | string;
  shippingAmount: number | string;
  totalAmount: number | string;
  trackingCode?: string | null;
  user?: { name?: string; email?: string; phone?: string | null } | null;
  address?: {
    fullName?: string; phone?: string; addressLine1?: string; addressLine2?: string | null;
    landmark?: string | null; city?: string; state?: string; pincode?: string;
  } | null;
  items?: Array<{ productNameSnapshot?: string; quantity: number; price: number | string }>;
  payments?: Array<{ provider?: string; status?: string; providerPaymentId?: string | null }>;
};

type AdminBooking = {
  bookingNumber: string;
  preferredDate: string | Date;
  preferredTimeSlot: string;
  status: string;
  appliance: string;
  problemDescription: string;
  customerNotes?: string | null;
  estimatedAmount: number | string;
  finalAmount?: number | string | null;
  user?: { name?: string; email?: string; phone?: string | null } | null;
  service?: { name?: string } | null;
  address?: {
    fullName?: string; phone?: string; addressLine1?: string; addressLine2?: string | null;
    landmark?: string | null; city?: string; state?: string; pincode?: string;
  } | null;
};

function addReportRecords<T>(
  doc: jsPDF,
  records: T[],
  sectionTitle: (record: T, index: number) => string,
  fields: (record: T) => string[][],
) {
  let y = 39;
  if (records.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text('No records for this period.', PAGE_MARGIN, y);
  }
  records.forEach((record, index) => {
    if (y > 245) {
      doc.addPage();
      y = 18;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...BLUE);
    doc.text(sectionTitle(record, index), PAGE_MARGIN, y);
    y = addKeyValues(doc, fields(record), y + 3) + 8;
  });
  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    addPageFooter(doc, page, pageCount);
  }
}

export function buildAdminBookingReportPdf(bookings: AdminBooking[], period: string): jsPDF {
  const doc = setupDocument('Service booking technician list', `Period: ${period}  |  Generated: ${dateTime(new Date())}`);
  addReportRecords(
    doc,
    bookings,
    (booking, index) => `${index + 1}. ${booking.bookingNumber}`,
    (booking) => {
      const address = booking.address;
      return [
        ['Visit date and time', `${dateTime(booking.preferredDate, true)}  |  ${text(booking.preferredTimeSlot)}`],
        ['Status', text(booking.status.replaceAll('_', ' '))],
        ['Customer', text(booking.user?.name || address?.fullName)],
        ['Phone / email', `${text(booking.user?.phone || address?.phone)}  |  ${text(booking.user?.email)}`],
        ['Service / appliance', `${text(booking.service?.name)}  |  ${text(booking.appliance)}`],
        ['Reported problem', text(booking.problemDescription)],
        ['Visit address', [
          address?.addressLine1, address?.addressLine2, address?.landmark,
          address?.city, address?.state, address?.pincode,
        ].filter(Boolean).join(', ') || '—'],
        ['Customer notes', text(booking.customerNotes)],
        ['Service fee', amount(booking.finalAmount ?? booking.estimatedAmount)],
      ];
    },
  );
  return doc;
}

export function buildAdminOrderReportPdf(orders: AdminOrder[], period: string): jsPDF {
  const doc = setupDocument('Order report', `Period: ${period}  |  Generated: ${dateTime(new Date())}`);
  addReportRecords(
    doc,
    orders,
    (order) => `${order.orderNumber}  |  ${dateTime(order.createdAt)}`,
    (order) => {
      const address = order.address;
      const payment = order.payments?.[0];
      return [
        ['Order status', text(order.status.replaceAll('_', ' '))],
        ['Customer', text(order.user?.name || address?.fullName)],
        ['Phone / email', `${text(order.user?.phone || address?.phone)}  |  ${text(order.user?.email)}`],
        ['Delivery address', [
          address?.addressLine1, address?.addressLine2, address?.landmark,
          address?.city, address?.state, address?.pincode,
        ].filter(Boolean).join(', ') || '—'],
        ['Items', (order.items || []).map((item) => `${text(item.productNameSnapshot)} x ${item.quantity} @ ${amount(item.price)}`).join('; ') || '—'],
        ['Subtotal / discount / shipping', `${amount(order.subtotal)} / ${amount(order.discountAmount)} / ${amount(order.shippingAmount)}`],
        ['Order total', amount(order.totalAmount)],
        ['Payment', `${text(payment?.provider)} - ${text(payment?.status)}${payment?.providerPaymentId ? ` (${payment.providerPaymentId})` : ''}`],
        ['Tracking code', text(order.trackingCode)],
      ];
    },
  );
  return doc;
}

function escapeAttribute(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character] || character);
}

export function openPdfPreview(doc: jsPDF, filename: string, reservedWindow?: Window | null): void {
  const previewWindow = reservedWindow || window.open('about:blank', '_blank');

  const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '-');
  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  const title = escapeAttribute(safeFilename);
  if (!previewWindow) {
    const overlay = document.createElement('div');
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', `${safeFilename} preview`);
    overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#e2e8f0;color:#0f172a;font:14px Arial,sans-serif;display:flex;flex-direction:column';

    const toolbar = document.createElement('header');
    toolbar.style.cssText = 'height:58px;flex:none;background:#fff;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:0 16px;box-shadow:0 1px 4px #0002';
    const name = document.createElement('strong');
    name.textContent = safeFilename;
    const actions = document.createElement('div');
    actions.style.cssText = 'display:flex;align-items:center;gap:12px';
    const save = document.createElement('a');
    save.href = pdfUrl;
    save.download = safeFilename;
    save.textContent = 'Save PDF to device';
    save.style.cssText = 'background:#1d4ed8;color:white;text-decoration:none;font-weight:bold;padding:10px 14px;border-radius:6px';
    const close = document.createElement('button');
    close.type = 'button';
    close.textContent = 'Close preview';
    close.style.cssText = 'background:#e2e8f0;border:0;padding:10px 14px;border-radius:6px;cursor:pointer';
    actions.append(save, close);
    toolbar.append(name, actions);

    const frame = document.createElement('iframe');
    frame.src = pdfUrl;
    frame.title = 'PDF preview';
    frame.style.cssText = 'width:100%;height:100%;border:0;flex:1';
    close.addEventListener('click', () => {
      overlay.remove();
      URL.revokeObjectURL(pdfUrl);
    });
    overlay.append(toolbar, frame);
    document.body.append(overlay);
    close.focus();
    return;
  }

  const previewHtml = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>
<style>*{box-sizing:border-box}body{margin:0;background:#e2e8f0;color:#0f172a;font:14px Arial,sans-serif}
header{height:58px;background:#fff;display:flex;align-items:center;justify-content:space-between;padding:0 16px;box-shadow:0 1px 4px #0002}
strong{font-size:14px}a{background:#1d4ed8;color:white;text-decoration:none;font-weight:bold;padding:10px 14px;border-radius:6px}
main{height:calc(100vh - 58px)}iframe{width:100%;height:100%;border:0}
</style></head><body><header><strong>${title}</strong><a href="${pdfUrl}" download="${title}">Save PDF to device</a></header>
<main><iframe src="${pdfUrl}" title="PDF preview"></iframe></main>
<script>const pdfUrl=${JSON.stringify(pdfUrl)};window.addEventListener('unload',()=>URL.revokeObjectURL(pdfUrl));window.addEventListener('load',()=>URL.revokeObjectURL(location.href));</script>
</body></html>`;

  const pageBlob = new Blob([previewHtml], { type: 'text/html;charset=utf-8' });
  const pageUrl = URL.createObjectURL(pageBlob);
  previewWindow.opener = null;
  previewWindow.location.replace(pageUrl);
}
