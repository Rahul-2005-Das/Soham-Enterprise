import QRCode from 'qrcode';

export interface UpiPaymentDetails {
  vpa: string; // payee UPI VPA, e.g. "sohamenterprises@okhdfcbank"
  payeeName: string;
  amount?: number; // Omit to let the customer enter the final amount in their UPI app.
  transactionNote: string; // typically the order number
}

/**
 * Builds a standard "upi://pay" deep link. Any UPI app (GPay, PhonePe, Paytm,
 * BHIM, etc.) can open this directly, or a customer can scan the QR rendering
 * of it with their banking app.
 */
export function buildUpiUri({ vpa, payeeName, amount, transactionNote }: UpiPaymentDetails): string {
  const params = new URLSearchParams({
    pa: vpa,
    pn: payeeName,
    cu: 'INR',
    tn: transactionNote,
  });
  if (amount !== undefined) params.set('am', amount.toFixed(2));
  return `upi://pay?${params.toString()}`;
}

/**
 * Renders the UPI URI as a QR code PNG data URL for display in an <img>.
 */
export async function generateUpiQrDataUrl(details: UpiPaymentDetails): Promise<string> {
  const uri = buildUpiUri(details);
  return QRCode.toDataURL(uri, {
    width: 320,
    margin: 1,
    color: { dark: '#0f172a', light: '#ffffff' },
  });
}
