"use client";

import { Button } from "~/components/ui/Button";
import { Modal } from "~/components/ui/Modal";

interface BookingConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: {
    hotelName: string;
    roomCategory: string;
    checkIn: string;
    checkOut: string;
    guests: number;
    totalPrice: number;
    bookingId: string;
  };
  onViewBooking?: () => void;
}

export function BookingConfirmationModal({
  isOpen,
  onClose,
  booking,
  onViewBooking,
}: BookingConfirmationModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Booking Confirmed! 🎉"
      size="lg"
    >
      <div className="space-y-6">
        {/* Success Icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
            <svg
              className="w-12 h-12 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>

        {/* Confirmation Message */}
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Your booking has been confirmed!
          </h3>
          <p className="text-gray-600">
            A confirmation email has been sent to your email address.
          </p>
        </div>

        {/* Booking Details */}
        <div className="bg-gray-50 rounded-lg p-6 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Booking ID</p>
              <p className="font-mono font-semibold text-gray-900">{booking.bookingId}</p>
            </div>
            <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              Confirmed
            </div>
          </div>

          <div className="border-t pt-4 space-y-3">
            <div>
              <p className="text-sm text-gray-500">Hotel</p>
              <p className="font-semibold text-gray-900">{booking.hotelName}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Room Category</p>
              <p className="font-semibold text-gray-900">{booking.roomCategory}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Check-in</p>
                <p className="font-semibold text-gray-900">
                  {new Date(booking.checkIn).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Check-out</p>
                <p className="font-semibold text-gray-900">
                  {new Date(booking.checkOut).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-500">Guests</p>
              <p className="font-semibold text-gray-900">{booking.guests} {booking.guests === 1 ? 'Guest' : 'Guests'}</p>
            </div>

            <div className="border-t pt-3">
              <div className="flex justify-between items-center">
                <p className="text-lg font-semibold text-gray-900">Total Price</p>
                <p className="text-2xl font-bold text-blue-600">৳{booking.totalPrice.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Important Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="font-semibold text-blue-900 mb-1">Important Information</p>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Please arrive at the hotel by 2:00 PM on check-in day</li>
                <li>• Valid ID proof is required at check-in</li>
                <li>• Check-out time is 11:00 AM</li>
                <li>• Free cancellation up to 24 hours before check-in</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          {onViewBooking && (
            <Button
              onClick={onViewBooking}
              className="flex-1"
            >
              View Booking Details
            </Button>
          )}
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1"
          >
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
