/**
 * SMS Service using Twilio
 * Sends booking confirmations, payment receipts, and other notifications via SMS
 */

import twilio from 'twilio';

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

let twilioClient: ReturnType<typeof twilio> | null = null;

if (accountSid && authToken) {
  twilioClient = twilio(accountSid, authToken);
}

/**
 * Send SMS via Twilio
 */
async function sendSMS(to: string, message: string): Promise<boolean> {
  if (!twilioClient || !fromNumber) {
    console.warn('Twilio not configured. SMS not sent:', { to, message });
    return false;
  }

  try {
    // Format phone number (ensure it has country code)
    const formattedPhone = to.startsWith('+') ? to : `+88${to}`;

    const result = await twilioClient.messages.create({
      body: message,
      from: fromNumber,
      to: formattedPhone,
    });

    console.log('SMS sent successfully:', result.sid);
    return true;
  } catch (error) {
    console.error('Failed to send SMS:', error);
    return false;
  }
}

/**
 * Send booking confirmation SMS
 */
export async function sendBookingConfirmationSMS(
  phone: string,
  userName: string,
  hotelName: string,
  bookingId: string,
  checkIn: Date,
  checkOut: Date,
  totalPrice: number,
  smsEnabled = true
): Promise<boolean> {
  if (!smsEnabled) return false;
  
  const message = `Hi ${userName}! Your booking at ${hotelName} is confirmed.
Booking ID: ${bookingId.slice(0, 8).toUpperCase()}
Check-in: ${new Date(checkIn).toLocaleDateString()}
Check-out: ${new Date(checkOut).toLocaleDateString()}
Total: ৳${totalPrice.toLocaleString()}
Thank you for choosing StayComfort!`;

  return sendSMS(phone, message);
}

/**
 * Send payment success SMS
 */
export async function sendPaymentSuccessSMS(
  phone: string,
  userName: string,
  amount: number,
  transactionId: string,
  bookingId: string,
  smsEnabled = true
): Promise<boolean> {
  if (!smsEnabled) return false;
  
  const message = `Hi ${userName}! Payment received successfully.
Amount: ৳${amount.toLocaleString()}
Transaction ID: ${transactionId}
Booking ID: ${bookingId.slice(0, 8).toUpperCase()}
Your booking is now confirmed!`;

  return sendSMS(phone, message);
}

/**
 * Send booking cancellation SMS
 */
export async function sendBookingCancellationSMS(
  phone: string,
  userName: string,
  hotelName: string,
  bookingId: string,
  refundAmount?: number
): Promise<boolean> {
  let message = `Hi ${userName}! Your booking at ${hotelName} has been cancelled.
Booking ID: ${bookingId.slice(0, 8).toUpperCase()}`;

  if (refundAmount && refundAmount > 0) {
    message += `\nRefund of ৳${refundAmount.toLocaleString()} will be processed within 5-7 business days.`;
  }

  message += '\nWe hope to serve you again soon!';

  return sendSMS(phone, message);
}

/**
 * Send OTP for verification
 */
export async function sendOTPSMS(
  phone: string,
  otp: string
): Promise<boolean> {
  const message = `Your StayComfort verification code is: ${otp}
This code will expire in 10 minutes.
Do not share this code with anyone.`;

  return sendSMS(phone, message);
}

/**
 * Send payment reminder SMS
 */
export async function sendPaymentReminderSMS(
  phone: string,
  userName: string,
  bookingId: string,
  amount: number,
  dueDate: Date
): Promise<boolean> {
  const message = `Hi ${userName}! Payment reminder for your booking.
Booking ID: ${bookingId.slice(0, 8).toUpperCase()}
Amount Due: ৳${amount.toLocaleString()}
Due Date: ${new Date(dueDate).toLocaleDateString()}
Please complete payment to confirm your booking.`;

  return sendSMS(phone, message);
}

/**
 * Send check-in reminder SMS
 */
export async function sendCheckInReminderSMS(
  phone: string,
  userName: string,
  hotelName: string,
  checkInDate: Date,
  bookingId: string
): Promise<boolean> {
  const message = `Hi ${userName}! Reminder: Your check-in at ${hotelName} is tomorrow.
Date: ${new Date(checkInDate).toLocaleDateString()}
Booking ID: ${bookingId.slice(0, 8).toUpperCase()}
Have a great stay!`;

  return sendSMS(phone, message);
}

/**
 * Send promotional SMS
 */
export async function sendPromotionalSMS(
  phone: string,
  userName: string,
  promoCode: string,
  discount: number,
  validUntil: Date
): Promise<boolean> {
  const message = `Hi ${userName}! Special offer for you! 🎉
Use code ${promoCode} to get ${discount}% off on your next booking.
Valid until: ${new Date(validUntil).toLocaleDateString()}
Book now at StayComfort!`;

  return sendSMS(phone, message);
}

/**
 * Send bulk SMS (for admin/marketing)
 */
export async function sendBulkSMS(
  phoneNumbers: string[],
  message: string
): Promise<{ sent: number; failed: number }> {
  const results = await Promise.allSettled(
    phoneNumbers.map((phone) => sendSMS(phone, message))
  );

  const sent = results.filter((r) => r.status === 'fulfilled' && r.value === true).length;
  const failed = results.length - sent;

  return { sent, failed };
}

/**
 * Validate phone number format
 */
export function validatePhoneNumber(phone: string): boolean {
  // Bangladesh phone number validation
  const phoneRegex = /^(\+?880)?1[3-9]\d{8}$/;
  const cleanPhone = phone.replace(/[\s-]/g, '');
  return phoneRegex.test(cleanPhone);
}

/**
 * Format phone number for display
 */
export function formatPhoneNumber(phone: string): string {
  const cleanPhone = phone.replace(/[\s-]/g, '');
  
  if (cleanPhone.startsWith('+880')) {
    return `+880 ${cleanPhone.slice(4, 7)}-${cleanPhone.slice(7)}`;
  } else if (cleanPhone.startsWith('880')) {
    return `+880 ${cleanPhone.slice(3, 6)}-${cleanPhone.slice(6)}`;
  } else if (cleanPhone.startsWith('01')) {
    return `+880 ${cleanPhone.slice(1, 4)}-${cleanPhone.slice(4)}`;
  }
  
  return phone;
}
