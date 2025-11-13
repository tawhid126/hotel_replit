import nodemailer from 'nodemailer';
import { env } from '~/env.js';

// Email transporter configuration
const createTransporter = () => {
  if (!env.EMAIL_SERVER_HOST) {
    console.warn('Email configuration not found. Emails will not be sent.');
    return null;
  }

  return nodemailer.createTransport({
    host: env.EMAIL_SERVER_HOST,
    port: parseInt(env.EMAIL_SERVER_PORT || '587'),
    secure: env.EMAIL_SERVER_PORT === '465', // true for 465, false for other ports
    auth: {
      user: env.EMAIL_SERVER_USER,
      pass: env.EMAIL_SERVER_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
};

// Email templates
export const emailTemplates = {
  bookingConfirmation: (data: {
    userName: string;
    hotelName: string;
    bookingId: string;
    checkInDate: string;
    checkOutDate: string;
    totalAmount: number;
    roomCategory: string;
    guests: number;
  }) => ({
    subject: `Booking Confirmation - ${data.hotelName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Booking Confirmation</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px; 
          }
          .header { 
            background: linear-gradient(135deg, #3b82f6, #1e40af); 
            color: white; 
            padding: 30px; 
            text-align: center; 
            border-radius: 8px 8px 0 0; 
          }
          .content { 
            background: #f8fafc; 
            padding: 30px; 
            border-radius: 0 0 8px 8px; 
          }
          .booking-details { 
            background: white; 
            padding: 20px; 
            border-radius: 8px; 
            margin: 20px 0; 
            border-left: 4px solid #3b82f6; 
          }
          .detail-row { 
            display: flex; 
            justify-content: space-between; 
            margin: 10px 0; 
            padding: 8px 0; 
            border-bottom: 1px solid #e2e8f0; 
          }
          .detail-label { 
            font-weight: bold; 
            color: #64748b; 
          }
          .detail-value { 
            color: #1e293b; 
          }
          .total-amount { 
            background: #ecfdf5; 
            color: #059669; 
            font-size: 18px; 
            font-weight: bold; 
            padding: 15px; 
            border-radius: 8px; 
            text-align: center; 
          }
          .footer { 
            margin-top: 30px; 
            padding: 20px; 
            background: #1e293b; 
            color: white; 
            text-align: center; 
            border-radius: 8px; 
          }
          .check-mark { 
            color: #10b981; 
            font-size: 48px; 
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="check-mark">✅</div>
          <h1>Booking Confirmed!</h1>
          <p>Your hotel reservation has been successfully confirmed</p>
        </div>
        
        <div class="content">
          <h2>Dear ${data.userName},</h2>
          <p>Thank you for choosing StayComfort! Your reservation at <strong>${data.hotelName}</strong> has been confirmed.</p>
          
          <div class="booking-details">
            <h3>📋 Booking Details</h3>
            <div class="detail-row">
              <span class="detail-label">Booking ID:</span>
              <span class="detail-value">${data.bookingId}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Hotel Name:</span>
              <span class="detail-value">${data.hotelName}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Room Category:</span>
              <span class="detail-value">${data.roomCategory}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Check-in Date:</span>
              <span class="detail-value">${new Date(data.checkInDate).toLocaleDateString()}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Check-out Date:</span>
              <span class="detail-value">${new Date(data.checkOutDate).toLocaleDateString()}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Number of Guests:</span>
              <span class="detail-value">${data.guests}</span>
            </div>
          </div>
          
          <div class="total-amount">
            💰 Total Amount: ৳${data.totalAmount.toLocaleString()}
          </div>
          
          <h3>📞 What to do next:</h3>
          <ul>
            <li>Present this email at check-in along with a valid ID</li>
            <li>Arrive at the hotel after 2:00 PM on your check-in date</li>
            <li>Contact the hotel directly for any special requests</li>
            <li>Keep your booking ID for reference</li>
          </ul>
          
          <p><strong>Important:</strong> Please arrive on time for your check-in. Late arrivals may result in cancellation.</p>
        </div>
        
        <div class="footer">
          <p>🏨 <strong>StayComfort</strong></p>
          <p>Thank you for choosing us for your stay!</p>
          <p>For support, contact us at support@staycomfort.com</p>
        </div>
      </body>
      </html>
    `,
    text: `
      Booking Confirmation - ${data.hotelName}
      
      Dear ${data.userName},
      
      Your booking has been confirmed!
      
      Booking Details:
      - Booking ID: ${data.bookingId}
      - Hotel: ${data.hotelName}
      - Room: ${data.roomCategory}
      - Check-in: ${new Date(data.checkInDate).toLocaleDateString()}
      - Check-out: ${new Date(data.checkOutDate).toLocaleDateString()}
      - Guests: ${data.guests}
      - Total Amount: ৳${data.totalAmount.toLocaleString()}
      
      What to do next:
      1. Present this email at check-in with valid ID
      2. Arrive after 2:00 PM on check-in date
      3. Contact hotel for special requests
      
      Thank you for choosing us!
    `,
  }),

  paymentReceipt: (data: {
    userName: string;
    hotelName: string;
    bookingId: string;
    paymentMethod: string;
    transactionId: string;
    amount: number;
    paymentDate: string;
  }) => ({
    subject: `Payment Receipt - Booking ${data.bookingId}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Payment Receipt</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px; 
          }
          .header { 
            background: linear-gradient(135deg, #10b981, #059669); 
            color: white; 
            padding: 30px; 
            text-align: center; 
            border-radius: 8px 8px 0 0; 
          }
          .content { 
            background: #f8fafc; 
            padding: 30px; 
            border-radius: 0 0 8px 8px; 
          }
          .receipt-details { 
            background: white; 
            padding: 20px; 
            border-radius: 8px; 
            margin: 20px 0; 
            border-left: 4px solid #10b981; 
          }
          .detail-row { 
            display: flex; 
            justify-content: space-between; 
            margin: 10px 0; 
            padding: 8px 0; 
            border-bottom: 1px solid #e2e8f0; 
          }
          .detail-label { 
            font-weight: bold; 
            color: #64748b; 
          }
          .detail-value { 
            color: #1e293b; 
          }
          .amount-paid { 
            background: #d1fae5; 
            color: #059669; 
            font-size: 20px; 
            font-weight: bold; 
            padding: 15px; 
            border-radius: 8px; 
            text-align: center; 
          }
          .footer { 
            margin-top: 30px; 
            padding: 20px; 
            background: #1e293b; 
            color: white; 
            text-align: center; 
            border-radius: 8px; 
          }
          .success-icon { 
            color: #10b981; 
            font-size: 48px; 
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="success-icon">💳</div>
          <h1>Payment Successful!</h1>
          <p>Your payment has been processed successfully</p>
        </div>
        
        <div class="content">
          <h2>Dear ${data.userName},</h2>
          <p>We have successfully received your payment for the booking at <strong>${data.hotelName}</strong>.</p>
          
          <div class="receipt-details">
            <h3>🧾 Payment Receipt</h3>
            <div class="detail-row">
              <span class="detail-label">Booking ID:</span>
              <span class="detail-value">${data.bookingId}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Hotel Name:</span>
              <span class="detail-value">${data.hotelName}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Payment Method:</span>
              <span class="detail-value">${data.paymentMethod}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Transaction ID:</span>
              <span class="detail-value">${data.transactionId}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Payment Date:</span>
              <span class="detail-value">${new Date(data.paymentDate).toLocaleString()}</span>
            </div>
          </div>
          
          <div class="amount-paid">
            ✅ Amount Paid: ৳${data.amount.toLocaleString()}
          </div>
          
          <h3>📄 Important Information:</h3>
          <ul>
            <li>Keep this receipt for your records</li>
            <li>Present this at check-in as proof of payment</li>
            <li>For any payment disputes, quote the transaction ID above</li>
            <li>Refunds (if applicable) will be processed to the same payment method</li>
          </ul>
          
          <p><strong>Note:</strong> This is an automated receipt. No signature is required.</p>
        </div>
        
        <div class="footer">
          <p>🏨 <strong>StayComfort</strong></p>
          <p>Thank you for your payment!</p>
          <p>For questions about this payment, contact us at billing@staycomfort.com</p>
        </div>
      </body>
      </html>
    `,
    text: `
      Payment Receipt - Booking ${data.bookingId}
      
      Dear ${data.userName},
      
      Your payment has been processed successfully!
      
      Payment Details:
      - Booking ID: ${data.bookingId}
      - Hotel: ${data.hotelName}
      - Payment Method: ${data.paymentMethod}
      - Transaction ID: ${data.transactionId}
      - Payment Date: ${new Date(data.paymentDate).toLocaleString()}
      - Amount Paid: ৳${data.amount.toLocaleString()}
      
      Keep this receipt for your records.
      
      Thank you for your payment!
    `,
  }),

  bookingCancellation: (data: {
    userName: string;
    hotelName: string;
    bookingId: string;
    cancellationDate: string;
    refundAmount?: number;
  }) => ({
    subject: `Booking Cancellation - ${data.hotelName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Booking Cancellation</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px; 
          }
          .header { 
            background: linear-gradient(135deg, #ef4444, #dc2626); 
            color: white; 
            padding: 30px; 
            text-align: center; 
            border-radius: 8px 8px 0 0; 
          }
          .content { 
            background: #f8fafc; 
            padding: 30px; 
            border-radius: 0 0 8px 8px; 
          }
          .cancellation-details { 
            background: white; 
            padding: 20px; 
            border-radius: 8px; 
            margin: 20px 0; 
            border-left: 4px solid #ef4444; 
          }
          .detail-row { 
            display: flex; 
            justify-content: space-between; 
            margin: 10px 0; 
            padding: 8px 0; 
            border-bottom: 1px solid #e2e8f0; 
          }
          .detail-label { 
            font-weight: bold; 
            color: #64748b; 
          }
          .detail-value { 
            color: #1e293b; 
          }
          .refund-info { 
            background: #fef3c7; 
            color: #92400e; 
            padding: 15px; 
            border-radius: 8px; 
            margin: 20px 0; 
          }
          .footer { 
            margin-top: 30px; 
            padding: 20px; 
            background: #1e293b; 
            color: white; 
            text-align: center; 
            border-radius: 8px; 
          }
          .cancel-icon { 
            color: #ef4444; 
            font-size: 48px; 
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="cancel-icon">❌</div>
          <h1>Booking Cancelled</h1>
          <p>Your booking cancellation has been processed</p>
        </div>
        
        <div class="content">
          <h2>Dear ${data.userName},</h2>
          <p>Your booking at <strong>${data.hotelName}</strong> has been successfully cancelled as requested.</p>
          
          <div class="cancellation-details">
            <h3>📋 Cancellation Details</h3>
            <div class="detail-row">
              <span class="detail-label">Booking ID:</span>
              <span class="detail-value">${data.bookingId}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Hotel Name:</span>
              <span class="detail-value">${data.hotelName}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Cancellation Date:</span>
              <span class="detail-value">${new Date(data.cancellationDate).toLocaleString()}</span>
            </div>
          </div>
          
          ${data.refundAmount ? `
            <div class="refund-info">
              <h3>💰 Refund Information</h3>
              <p><strong>Refund Amount:</strong> ৳${data.refundAmount.toLocaleString()}</p>
              <p>Your refund will be processed within 5-7 business days to your original payment method.</p>
            </div>
          ` : `
            <div class="refund-info">
              <h3>ℹ️ Refund Information</h3>
              <p>No refund is applicable for this cancellation based on the hotel's cancellation policy.</p>
            </div>
          `}
          
          <h3>📞 What happens next:</h3>
          <ul>
            <li>Your booking is now cancelled and the room is released</li>
            <li>You will not be charged for this booking</li>
            <li>Any applicable refunds will be processed automatically</li>
            <li>You can make a new booking anytime through our website</li>
          </ul>
          
          <p>We're sorry to see you cancel and hope to serve you again in the future!</p>
        </div>
        
        <div class="footer">
          <p>🏨 <strong>StayComfort</strong></p>
          <p>Thank you for using our service!</p>
          <p>For support, contact us at support@staycomfort.com</p>
        </div>
      </body>
      </html>
    `,
    text: `
      Booking Cancellation - ${data.hotelName}
      
      Dear ${data.userName},
      
      Your booking has been cancelled successfully.
      
      Cancellation Details:
      - Booking ID: ${data.bookingId}
      - Hotel: ${data.hotelName}
      - Cancellation Date: ${new Date(data.cancellationDate).toLocaleString()}
      ${data.refundAmount ? `- Refund Amount: ৳${data.refundAmount.toLocaleString()}` : '- No refund applicable'}
      
      What happens next:
      1. Booking is cancelled and room is released
      2. No charges will apply
      3. Refunds (if applicable) processed in 5-7 days
      
      Thank you for using our service!
    `,
  }),
};

// Main email service functions
export const emailService = {
  async sendEmail(to: string, subject: string, html: string, text?: string) {
    const transporter = createTransporter();
    
    if (!transporter) {
      console.log('Email not sent - no configuration found');
      return { success: false, error: 'Email configuration not found' };
    }

    try {
      const info = await transporter.sendMail({
        from: env.EMAIL_FROM || '"StayComfort" <noreply@staycomfort.com>',
        to,
        subject,
        html,
        text,
      });

      console.log('Email sent successfully:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending email:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  async sendBookingConfirmation(to: string, data: Parameters<typeof emailTemplates.bookingConfirmation>[0]) {
    const template = emailTemplates.bookingConfirmation(data);
    return this.sendEmail(to, template.subject, template.html, template.text);
  },

  async sendPaymentReceipt(to: string, data: Parameters<typeof emailTemplates.paymentReceipt>[0]) {
    const template = emailTemplates.paymentReceipt(data);
    return this.sendEmail(to, template.subject, template.html, template.text);
  },

  async sendCancellationNotice(to: string, data: Parameters<typeof emailTemplates.bookingCancellation>[0]) {
    const template = emailTemplates.bookingCancellation(data);
    return this.sendEmail(to, template.subject, template.html, template.text);
  },

  // Test email function for development
  async sendTestEmail(to: string) {
    const testTemplate = {
      subject: 'Test Email - StayComfort',
      html: `
        <h1>Test Email</h1>
        <p>This is a test email to verify the email service is working correctly.</p>
        <p>Sent at: ${new Date().toLocaleString()}</p>
      `,
      text: `Test Email - Hotel Booking System\n\nThis is a test email to verify the email service is working correctly.\n\nSent at: ${new Date().toLocaleString()}`,
    };

    return this.sendEmail(to, testTemplate.subject, testTemplate.html, testTemplate.text);
  },
};

export default emailService;