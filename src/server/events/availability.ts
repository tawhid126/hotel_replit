import { EventEmitter } from 'events';

// Event emitter for real-time updates
export const availabilityEmitter = new EventEmitter();

// Event types
export const AVAILABILITY_EVENTS = {
  ROOM_UPDATED: 'room:updated',
  BOOKING_CREATED: 'booking:created',
  BOOKING_CANCELLED: 'booking:cancelled',
} as const;

// Type for availability update
export interface AvailabilityUpdate {
  roomCategoryId: string;
  hotelId: string;
  availableRooms: number;
  totalRooms: number;
  timestamp: number;
}

// Helper function to emit availability update
export function emitAvailabilityUpdate(data: AvailabilityUpdate) {
  availabilityEmitter.emit(AVAILABILITY_EVENTS.ROOM_UPDATED, data);
}

// Helper function to emit booking created
export function emitBookingCreated(data: AvailabilityUpdate) {
  availabilityEmitter.emit(AVAILABILITY_EVENTS.BOOKING_CREATED, data);
}

// Helper function to emit booking cancelled
export function emitBookingCancelled(data: AvailabilityUpdate) {
  availabilityEmitter.emit(AVAILABILITY_EVENTS.BOOKING_CANCELLED, data);
}
