"use client";

import { useState } from "react";
import { api } from "~/utils/trpc";

interface AvailabilityUpdate {
  roomCategoryId: string;
  hotelId: string;
  availableRooms: number;
  totalRooms: number;
  timestamp: number;
}

interface UseRealtimeAvailabilityOptions {
  roomCategoryId?: string;
  hotelId?: string;
  enabled?: boolean;
}

export function useRealtimeAvailability({
  roomCategoryId,
  hotelId,
  enabled = true,
}: UseRealtimeAvailabilityOptions = {}) {
  const [availabilityMap, setAvailabilityMap] = useState<
    Map<string, AvailabilityUpdate>
  >(new Map());
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());

  // Subscribe to availability changes using tRPC subscription hook
  api.roomCategory.onAvailabilityChange.useSubscription(
    { roomCategoryId, hotelId },
    {
      enabled,
      onData: (data: AvailabilityUpdate) => {
        // Update the availability map
        setAvailabilityMap((prev) => {
          const newMap = new Map(prev);
          newMap.set(data.roomCategoryId, data);
          return newMap;
        });
        setLastUpdate(data.timestamp);
      },
      onError: (error) => {
        console.error("Real-time availability subscription error:", error);
      },
    }
  );

  // Helper function to get availability for a specific room category
  const getAvailability = (categoryId: string) => {
    return availabilityMap.get(categoryId);
  };

  // Helper function to check if rooms are available
  const isAvailable = (categoryId: string) => {
    const availability = availabilityMap.get(categoryId);
    return availability ? availability.availableRooms > 0 : true; // Default to true if no data
  };

  // Get all availability updates as array
  const allUpdates = Array.from(availabilityMap.values());

  return {
    availabilityMap,
    getAvailability,
    isAvailable,
    allUpdates,
    lastUpdate,
  };
}
