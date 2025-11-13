import nodemailer from 'nodemailer';
import { jsPDF } from 'jspdf';
import { uploadPDFToStorage } from './firebase-storage';

// Create reusable transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    },
  });
};

// Generate Invoice PDF as Buffer
export function generateInvoicePDFBuffer(booking: any, payment: any, user: any): Buffer {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(55, 119, 255);
  doc.text('HOTEL BOOKING SYSTEM', pageWidth / 2, 30, { align: 'center' });
  
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text('Payment Invoice', pageWidth / 2, 45, { align: 'center' });
  
  // Invoice details
  doc.setFontSize(10);
  doc.text(`Invoice Date: ${new Date().toLocaleDateString()}`, 20, 65);
  doc.text(`Transaction ID: ${payment.transactionId || payment.id}`, 20, 75);
  doc.text(`Invoice Number: INV-${payment.id.substring(0, 8).toUpperCase()}`, 20, 85);
  
  // Line
  doc.line(20, 95, pageWidth - 20, 95);
  
  // Customer info
  doc.setFontSize(12);
  doc.text('Bill To:', 20, 110);
  doc.setFontSize(10);
  doc.text(`${user.name || 'Customer'}`, 20, 120);
  doc.text(`${user.email}`, 20, 130);
  if (user.phone) {
    doc.text(`${user.phone}`, 20, 140);
  }
  
  // Booking info
  doc.setFontSize(12);
  doc.text('Booking Details:', 20, 160);
  doc.setFontSize(10);
  doc.text(`Hotel: ${booking.hotel?.name || 'N/A'}`, 20, 170);
  doc.text(`Room: ${booking.roomCategory?.name || 'N/A'}`, 20, 180);
  doc.text(`Check-in: ${booking.checkIn ? new Date(booking.checkIn).toLocaleDateString() : 'N/A'}`, 20, 190);
  doc.text(`Check-out: ${booking.checkOut ? new Date(booking.checkOut).toLocaleDateString() : 'N/A'}`, 20, 200);
  doc.text(`Guests: ${booking.guestCount || 1}`, 20, 210);
  
  // Payment details
  doc.setFontSize(12);
  doc.text('Payment Information:', 20, 230);
  doc.setFontSize(10);
  doc.text(`Payment Method: ${payment.method}`, 20, 240);
  doc.text(`Payment Date: ${new Date(payment.createdAt).toLocaleDateString()}`, 20, 250);
  doc.text(`Status: ${payment.status}`, 20, 260);
  
  // Amount
  doc.setFontSize(14);
  doc.setTextColor(34, 197, 94);
  doc.text(`Total Amount: BDT ${payment.amount.toLocaleString()}`, 20, 280);
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  doc.text('This is a computer-generated invoice. No signature required.', pageWidth / 2, 290, { align: 'center' });
  doc.text('For support, contact us at support@hotelbooking.com', pageWidth / 2, 297, { align: 'center' });
  
  // Convert to buffer
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  return pdfBuffer;
}

// Generate and upload invoice PDF to cloud storage
export async function generateAndUploadInvoicePDF(
  booking: any,
  payment: any,
  user: any
): Promise<string> {
  try {
    const pdfBuffer = generateInvoicePDFBuffer(booking, payment, user);
    const filename = `invoice-${payment.id}.pdf`;
    const pdfUrl = await uploadPDFToStorage(pdfBuffer, filename, 'invoices');
    return pdfUrl;
  } catch (error) {
    console.error('Error generating and uploading invoice PDF:', error);
    throw error;
  }
}

// Send booking confirmation email
export async function sendBookingConfirmation(
  email: string,
  booking: any,
  user: any
) {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"Hotel Booking System" <${process.env.EMAIL_FROM || process.env.EMAIL_SERVER_USER}>`,
      to: email,
      subject: `Booking Confirmation - ${booking.hotel?.name}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #3B82F6; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .booking-details { background-color: white; padding: 15px; margin: 15px 0; border-radius: 8px; }
            .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
            .label { font-weight: bold; color: #666; }
            .value { color: #333; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            .button { background-color: #3B82F6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏨 Booking Confirmed!</h1>
            </div>
            
            <div class="content">
              <p>Dear ${user.name || 'Customer'},</p>
              <p>Thank you for your booking! Your reservation has been confirmed.</p>
              
              <div class="booking-details">
                <h3 style="margin-top: 0; color: #3B82F6;">Booking Details</h3>
                
                <div class="detail-row">
                  <span class="label">Booking ID:</span>
                  <span class="value">${booking.id}</span>
                </div>
                
                <div class="detail-row">
                  <span class="label">Hotel:</span>
                  <span class="value">${booking.hotel?.name || 'N/A'}</span>
                </div>
                
                <div class="detail-row">
                  <span class="label">Room:</span>
                  <span class="value">${booking.roomCategory?.name || 'N/A'}</span>
                </div>
                
                <div class="detail-row">
                  <span class="label">Check-in:</span>
                  <span class="value">${booking.checkIn ? new Date(booking.checkIn).toLocaleDateString() : 'N/A'}</span>
                </div>
                
                <div class="detail-row">
                  <span class="label">Check-out:</span>
                  <span class="value">${booking.checkOut ? new Date(booking.checkOut).toLocaleDateString() : 'N/A'}</span>
                </div>
                
                <div class="detail-row">
                  <span class="label">Guests:</span>
                  <span class="value">${booking.guestCount || 1}</span>
                </div>
                
                <div class="detail-row">
                  <span class="label">Total Amount:</span>
                  <span class="value" style="font-weight: bold; color: #10B981;">BDT ${booking.totalPrice?.toLocaleString()}</span>
                </div>
              </div>
              
              <p style="margin-top: 20px;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/bookings/${booking.id}" class="button">
                  View Booking Details
                </a>
              </p>
              
              <p style="margin-top: 20px; color: #666; font-size: 14px;">
                If you have any questions or need to make changes to your booking, please contact us at 
                <a href="mailto:support@hotelbooking.com">support@hotelbooking.com</a>
              </p>
            </div>
            
            <div class="footer">
              <p>© ${new Date().getFullYear()} Hotel Booking System. All rights reserved.</p>
              <p>This is an automated email. Please do not reply directly to this message.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Booking confirmation email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending booking confirmation email:', error);
    return { success: false, error };
  }
}

// Send invoice email with PDF attachment
export async function sendInvoiceEmail(
  email: string,
  booking: any,
  payment: any,
  user: any
) {
  try {
    const transporter = createTransporter();
    const pdfBuffer = generateInvoicePDFBuffer(booking, payment, user);

    const mailOptions = {
      from: `"Hotel Booking System" <${process.env.EMAIL_FROM || process.env.EMAIL_SERVER_USER}>`,
      to: email,
      subject: `Payment Invoice - Booking ${booking.id.substring(0, 8)}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #10B981; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .invoice-details { background-color: white; padding: 15px; margin: 15px 0; border-radius: 8px; }
            .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
            .label { font-weight: bold; color: #666; }
            .value { color: #333; }
            .total-row { background-color: #F0FDF4; padding: 15px; margin-top: 10px; border-radius: 5px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Payment Successful!</h1>
            </div>
            
            <div class="content">
              <p>Dear ${user.name || 'Customer'},</p>
              <p>Thank you for your payment! Your booking is now confirmed.</p>
              
              <div class="invoice-details">
                <h3 style="margin-top: 0; color: #10B981;">Payment Details</h3>
                
                <div class="detail-row">
                  <span class="label">Transaction ID:</span>
                  <span class="value">${payment.transactionId || payment.id.substring(0, 12)}</span>
                </div>
                
                <div class="detail-row">
                  <span class="label">Payment Method:</span>
                  <span class="value">${payment.method}</span>
                </div>
                
                <div class="detail-row">
                  <span class="label">Payment Date:</span>
                  <span class="value">${new Date(payment.createdAt).toLocaleDateString()}</span>
                </div>
                
                <div class="detail-row">
                  <span class="label">Status:</span>
                  <span class="value" style="color: #10B981; font-weight: bold;">${payment.status}</span>
                </div>
                
                <div class="total-row">
                  <div style="display: flex; justify-content: space-between; font-size: 18px;">
                    <span style="font-weight: bold;">Total Paid:</span>
                    <span style="font-weight: bold; color: #10B981;">BDT ${payment.amount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              
              <p style="margin-top: 20px; padding: 15px; background-color: #DBEAFE; border-left: 4px solid #3B82F6; border-radius: 4px;">
                📎 Your payment invoice is attached to this email as a PDF file.
              </p>
              
              <p style="margin-top: 20px; color: #666; font-size: 14px;">
                If you have any questions about your payment or booking, please contact us at 
                <a href="mailto:support@hotelbooking.com">support@hotelbooking.com</a>
              </p>
            </div>
            
            <div class="footer">
              <p>© ${new Date().getFullYear()} Hotel Booking System. All rights reserved.</p>
              <p>This is an automated email. Please do not reply directly to this message.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      attachments: [
        {
          filename: `invoice-${payment.id.substring(0, 8)}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Invoice email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending invoice email:', error);
    return { success: false, error };
  }
}

// Send cancellation email
export async function sendCancellationEmail(
  email: string,
  booking: any,
  user: any
) {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"Hotel Booking System" <${process.env.EMAIL_FROM || process.env.EMAIL_SERVER_USER}>`,
      to: email,
      subject: `Booking Cancelled - ${booking.id.substring(0, 8)}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #EF4444; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .details { background-color: white; padding: 15px; margin: 15px 0; border-radius: 8px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>❌ Booking Cancelled</h1>
            </div>
            
            <div class="content">
              <p>Dear ${user.name || 'Customer'},</p>
              <p>Your booking has been cancelled as requested.</p>
              
              <div class="details">
                <h3 style="margin-top: 0;">Cancelled Booking</h3>
                <p><strong>Booking ID:</strong> ${booking.id}</p>
                <p><strong>Hotel:</strong> ${booking.hotel?.name || 'N/A'}</p>
                <p><strong>Room:</strong> ${booking.roomCategory?.name || 'N/A'}</p>
              </div>
              
              <p style="margin-top: 20px; padding: 15px; background-color: #FEF3C7; border-left: 4px solid #F59E0B; border-radius: 4px;">
                💡 If you paid for this booking, your refund will be processed within 7-10 business days.
              </p>
              
              <p style="margin-top: 20px; color: #666; font-size: 14px;">
                If you have any questions, please contact us at 
                <a href="mailto:support@hotelbooking.com">support@hotelbooking.com</a>
              </p>
            </div>
            
            <div class="footer">
              <p>© ${new Date().getFullYear()} Hotel Booking System. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Cancellation email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending cancellation email:', error);
    return { success: false, error };
  }
}
