// Dynamic imports for better performance
import { v4 as uuidv4 } from 'uuid'

// Lazy load heavy libraries
const getQRCode = async () => {
  const QRCode = await import('qrcode')
  return QRCode.default
}

const getCrypto = async () => {
  const CryptoJS = await import('crypto-js')
  return CryptoJS.default
}

// Synchronous fallback for server-side compatibility
let CryptoJS: any = null
try {
  CryptoJS = require('crypto-js')
} catch (error) {
  // Will use dynamic import instead
}

const QR_SECRET = process.env.QR_ENCRYPTION_SECRET || 'evently-qr-secret-2024'

export interface TicketData {
  ticketId: string
  eventId: string
  bookingId: string
  userId: string
  ticketNumber: string
  ticketType: string
  eventDate: string
  validUntil?: string
}

export interface EncryptedTicketData {
  data: string
  signature: string
  timestamp: number
}

export function generateTicketNumber(eventId: string): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  const eventPrefix = eventId.substring(0, 4).toUpperCase()
  return `${eventPrefix}-${timestamp}-${random}`
}

// Synchronous version for backward compatibility
export function encryptTicketDataSync(ticketData: TicketData): string {
  if (!CryptoJS) {
    throw new Error('CryptoJS not available for synchronous encryption')
  }
  
  const dataString = JSON.stringify(ticketData)
  const encrypted = CryptoJS.AES.encrypt(dataString, QR_SECRET).toString()
  
  const signature = CryptoJS.HmacSHA256(dataString, QR_SECRET).toString()
  
  const encryptedData: EncryptedTicketData = {
    data: encrypted,
    signature,
    timestamp: Date.now()
  }
  
  return Buffer.from(JSON.stringify(encryptedData)).toString('base64')
}

// Async version for performance
export async function encryptTicketData(ticketData: TicketData): Promise<string> {
  try {
    // Try synchronous version first for compatibility
    if (CryptoJS) {
      return encryptTicketDataSync(ticketData)
    }
    
    // Fall back to dynamic import
    const CryptoJSModule = await getCrypto()
    const dataString = JSON.stringify(ticketData)
    const encrypted = CryptoJSModule.AES.encrypt(dataString, QR_SECRET).toString()
    
    const signature = CryptoJSModule.HmacSHA256(dataString, QR_SECRET).toString()
    
    const encryptedData: EncryptedTicketData = {
      data: encrypted,
      signature,
      timestamp: Date.now()
    }
    
    return Buffer.from(JSON.stringify(encryptedData)).toString('base64')
  } catch (error) {
    console.error('Error in encryptTicketData:', error)
    throw error
  }
}

// Synchronous version for backward compatibility
export function decryptTicketDataSync(encryptedString: string): TicketData | null {
  try {
    if (!CryptoJS) {
      throw new Error('CryptoJS not available for synchronous decryption')
    }
    
    const decoded = Buffer.from(encryptedString, 'base64').toString()
    const encryptedData: EncryptedTicketData = JSON.parse(decoded)
    
    const decrypted = CryptoJS.AES.decrypt(encryptedData.data, QR_SECRET)
    const dataString = decrypted.toString(CryptoJS.enc.Utf8)
    const ticketData: TicketData = JSON.parse(dataString)
    
    const expectedSignature = CryptoJS.HmacSHA256(dataString, QR_SECRET).toString()
    if (expectedSignature !== encryptedData.signature) {
      console.error('Invalid ticket signature')
      return null
    }
    
    const hoursSinceCreation = (Date.now() - encryptedData.timestamp) / (1000 * 60 * 60)
    if (hoursSinceCreation > 24 * 365) {
      console.error('Ticket QR code expired')
      return null
    }
    
    return ticketData
  } catch (error) {
    console.error('Error decrypting ticket data:', error)
    return null
  }
}

// Async version for performance
export async function decryptTicketData(encryptedString: string): Promise<TicketData | null> {
  try {
    // Try synchronous version first for compatibility
    if (CryptoJS) {
      return decryptTicketDataSync(encryptedString)
    }
    
    // Fall back to dynamic import
    const CryptoJSModule = await getCrypto()
    const decoded = Buffer.from(encryptedString, 'base64').toString()
    const encryptedData: EncryptedTicketData = JSON.parse(decoded)
    
    const decrypted = CryptoJSModule.AES.decrypt(encryptedData.data, QR_SECRET)
    const dataString = decrypted.toString(CryptoJSModule.enc.Utf8)
    const ticketData: TicketData = JSON.parse(dataString)
    
    const expectedSignature = CryptoJSModule.HmacSHA256(dataString, QR_SECRET).toString()
    if (expectedSignature !== encryptedData.signature) {
      console.error('Invalid ticket signature')
      return null
    }
    
    const hoursSinceCreation = (Date.now() - encryptedData.timestamp) / (1000 * 60 * 60)
    if (hoursSinceCreation > 24 * 365) {
      console.error('Ticket QR code expired')
      return null
    }
    
    return ticketData
  } catch (error) {
    console.error('Error decrypting ticket data:', error)
    return null
  }
}

export async function generateQRCode(ticketData: TicketData): Promise<string> {
  const QRCode = await getQRCode()
  const encryptedData = await encryptTicketData(ticketData)
  
  const validationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/tickets/validate?data=${encodeURIComponent(encryptedData)}`
  
  const qrOptions = {
    errorCorrectionLevel: 'H' as const,
    type: 'image/png' as const,
    quality: 0.92,
    margin: 1,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    },
    width: 512
  }
  
  try {
    const qrDataUrl = await QRCode.toDataURL(validationUrl, qrOptions)
    return qrDataUrl
  } catch (error) {
    console.error('Error generating QR code:', error)
    throw new Error('Failed to generate QR code')
  }
}

export async function generateTicketPDF(
  ticketData: TicketData,
  qrCodeDataUrl: string,
  eventDetails: {
    title: string
    venue: string
    date: string
    time: string
  }
): Promise<string> {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        @page { size: A4; margin: 0; }
        body { 
          margin: 0; 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: #333;
        }
        .ticket-container {
          max-width: 800px;
          margin: 50px auto;
          background: white;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        .ticket-header {
          background: linear-gradient(135deg, #ffde59 0%, #f5c842 100%);
          padding: 30px;
          text-align: center;
          color: #0b6d41;
        }
        .event-title {
          font-size: 32px;
          font-weight: bold;
          margin: 0;
        }
        .ticket-body {
          padding: 40px;
          display: flex;
          justify-content: space-between;
        }
        .event-details {
          flex: 1;
        }
        .detail-row {
          margin: 15px 0;
          font-size: 16px;
        }
        .detail-label {
          font-weight: bold;
          color: #666;
        }
        .qr-section {
          text-align: center;
          padding: 20px;
        }
        .qr-code {
          width: 200px;
          height: 200px;
          border: 4px solid #0b6d41;
          border-radius: 10px;
          padding: 10px;
        }
        .ticket-number {
          font-size: 14px;
          color: #666;
          margin-top: 10px;
          font-family: monospace;
        }
        .ticket-footer {
          background: #f7f7f7;
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #666;
        }
        .barcode {
          margin: 20px 0;
          height: 50px;
          background: repeating-linear-gradient(
            90deg,
            #000,
            #000 2px,
            #fff 2px,
            #fff 4px
          );
        }
      </style>
    </head>
    <body>
      <div class="ticket-container">
        <div class="ticket-header">
          <h1 class="event-title">${eventDetails.title}</h1>
          <p style="margin: 10px 0; font-size: 18px;">EVENT TICKET</p>
        </div>
        
        <div class="ticket-body">
          <div class="event-details">
            <div class="detail-row">
              <span class="detail-label">Date:</span> ${eventDetails.date}
            </div>
            <div class="detail-row">
              <span class="detail-label">Time:</span> ${eventDetails.time}
            </div>
            <div class="detail-row">
              <span class="detail-label">Venue:</span> ${eventDetails.venue}
            </div>
            <div class="detail-row">
              <span class="detail-label">Ticket Type:</span> ${ticketData.ticketType}
            </div>
            <div class="detail-row">
              <span class="detail-label">Ticket ID:</span> ${ticketData.ticketNumber}
            </div>
          </div>
          
          <div class="qr-section">
            <img src="${qrCodeDataUrl}" alt="QR Code" class="qr-code">
            <div class="ticket-number">${ticketData.ticketNumber}</div>
          </div>
        </div>
        
        <div class="barcode"></div>
        
        <div class="ticket-footer">
          <p>Please present this ticket at the venue entrance</p>
          <p>This ticket is non-transferable and valid for one-time use only</p>
          <p>© 2024 Evently - All Rights Reserved</p>
        </div>
      </div>
    </body>
    </html>
  `
  
  return htmlContent
}