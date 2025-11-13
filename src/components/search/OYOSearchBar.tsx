"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface OYOSearchBarProps {
  className?: string;
}

export function OYOSearchBar({ className = "" }: OYOSearchBarProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [checkInDate, setCheckInDate] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");
  const [rooms, setRooms] = useState(1);
  const [guests, setGuests] = useState(2);
  const [showGuestDropdown, setShowGuestDropdown] = useState(false);
  const [showCheckInCalendar, setShowCheckInCalendar] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  
  // Per-room guest tracking
  const [roomGuests, setRoomGuests] = useState<number[]>([2]); // Start with 1 room, 2 guests
  
  const guestDropdownRef = useRef<HTMLDivElement>(null);

  // Auto-set dates (today and tomorrow)
  useEffect(() => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayStr = today.toISOString().split('T')[0];
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    if (todayStr) setCheckInDate(todayStr);
    if (tomorrowStr) setCheckOutDate(tomorrowStr);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Close guest dropdown
      if (guestDropdownRef.current && !guestDropdownRef.current.contains(target)) {
        setShowGuestDropdown(false);
      }
      
      // Close date picker when clicking outside
      if (showCheckInCalendar && !target.closest('.date-picker-popup') && !target.closest('.date-toggle-btn')) {
        setShowCheckInCalendar(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCheckInCalendar]);

  // Update total guests when roomGuests changes
  useEffect(() => {
    const total = roomGuests.reduce((sum, count) => sum + count, 0);
    setGuests(total);
    setRooms(roomGuests.length);
  }, [roomGuests]);

  const addRoom = () => {
    if (roomGuests.length < 10) {
      setRoomGuests([...roomGuests, 1]);
    }
  };

  const deleteRoom = () => {
    if (roomGuests.length > 1) {
      setRoomGuests(roomGuests.slice(0, -1));
    }
  };

  const updateRoomGuests = (roomIndex: number, count: number) => {
    const updated = [...roomGuests];
    updated[roomIndex] = Math.max(1, Math.min(10, count));
    setRoomGuests(updated);
  };

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    // Basic validation: check-out must be after check-in when both selected
    if (checkInDate && checkOutDate) {
      const inD = new Date(checkInDate);
      const outD = new Date(checkOutDate);
      if (outD <= inD) {
        toast.error("Check-out date must be after check-in date");
        return;
      }
    }
    
    const params = new URLSearchParams();
    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery) params.set("search", trimmedQuery);
    if (rooms) params.set("rooms", rooms.toString());
    if (guests) params.set("guests", guests.toString());
    if (checkInDate) params.set("checkIn", checkInDate);
    if (checkOutDate) params.set("checkOut", checkOutDate);
    if (coords) {
      params.set("lat", String(coords.lat));
      params.set("lng", String(coords.lng));
    }
    
    router.push(`/hotels?${params.toString()}`);
  };

  // Removed unused formatDate helper to avoid lint warnings

  const formatInputDate = (date: Date) => date.toISOString().split('T')[0];
  const getMinCheckoutDate = () => {
    if (checkInDate) {
      const d = new Date(checkInDate);
      d.setDate(d.getDate() + 1);
      return formatInputDate(d);
    }
    return formatInputDate(new Date());
  };

  const getNearMe = () => {
    if (navigator.geolocation) {
      toast.promise(
        new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              setSearchQuery("Near me");
              setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
              resolve("Location detected");
            },
            (error) => reject(error)
          );
        }),
        {
          loading: 'Getting your location...',
          success: 'Location detected!',
          error: 'Could not get location',
        }
      );
    } else {
      toast.error('Geolocation is not supported by your browser');
    }
  };

  const getDateRangeSummary = () => {
    if (!checkInDate || !checkOutDate) return "";
    const inDate = new Date(checkInDate);
    const outDate = new Date(checkOutDate);
    const inStr = inDate.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
    const outStr = outDate.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
    return `${inStr} – ${outStr}`;
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
        <form onSubmit={handleSearch} className="flex items-center" role="search" aria-label="Search hotels">
          {/* Location Input with Near me pill */}
          <div className="flex-1 relative px-5 py-4 border-r border-gray-200">
            <input
              type="text"
              placeholder="Search by city, hotel, or neighborhood"
              id="location-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-base text-gray-900 placeholder-gray-400 border-none outline-none bg-transparent pr-28"
            />
            <button
              type="button"
              onClick={getNearMe}
              className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 transition-all"
              title="Use my current location"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Near me</span>
            </button>
          </div>

          {/* Date Range - Combined */}
          <div className="relative border-r border-gray-200">
            <button
              type="button"
              onClick={() => setShowCheckInCalendar(!showCheckInCalendar)}
              className="date-toggle-btn flex items-center gap-2 px-6 py-4 hover:bg-gray-50 transition-colors min-w-[220px]"
            >
              <span className="text-base text-gray-900 whitespace-nowrap font-normal">
                {getDateRangeSummary() || "Select dates"}
              </span>
            </button>
            
            {/* Date picker popup on click */}
            {showCheckInCalendar && (
              <div className="date-picker-popup absolute top-full left-0 mt-2 bg-white shadow-xl rounded-lg border border-gray-200 p-4 z-[9999] min-w-[300px]">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Check-in</label>
                    <input
                      type="date"
                      value={checkInDate}
                      onChange={(e) => setCheckInDate(e.target.value)}
                      min={formatInputDate(new Date())}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Check-out</label>
                    <input
                      type="date"
                      value={checkOutDate}
                      onChange={(e) => setCheckOutDate(e.target.value)}
                      min={getMinCheckoutDate()}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCheckInCalendar(false)}
                    className="w-full py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md text-sm transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Rooms & Guests */}
          <div className="relative border-r border-gray-200" ref={guestDropdownRef}>
            <button
              type="button"
              onClick={() => setShowGuestDropdown(!showGuestDropdown)}
              className="px-6 py-4 text-base text-gray-900 hover:bg-gray-50 transition-colors whitespace-nowrap font-normal"
              aria-haspopup="dialog"
              aria-expanded={showGuestDropdown}
              aria-controls="rooms-guests-dropdown"
            >
              {rooms} Room{rooms > 1 ? 's' : ''}, {guests} Guest{guests > 1 ? 's' : ''}
            </button>

            {/* Dropdown - OYO Style */}
            {showGuestDropdown && (
              <div id="rooms-guests-dropdown" className="absolute z-[9999] top-full right-0 mt-2 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden" role="dialog" aria-label="Select rooms and guests">
                {/* Header */}
                <div className="flex border-b border-gray-200 bg-gray-50">
                  <div className="flex-1 text-center py-3 font-semibold text-gray-900 border-r border-gray-200">Rooms</div>
                  <div className="flex-1 text-center py-3 font-semibold text-gray-900">Guests</div>
                </div>

                {/* Room List */}
                <div className="max-h-80 overflow-y-auto">
                  {roomGuests.map((guestCount, index) => (
                    <div key={index} className="flex items-center border-b border-gray-100 py-4 px-4 hover:bg-gray-50">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">Room {index + 1}</p>
                      </div>
                      <div className="flex-1 flex items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={() => updateRoomGuests(index, guestCount - 1)}
                          disabled={guestCount <= 1}
                          className="w-8 h-8 rounded border border-gray-300 hover:bg-gray-100 text-gray-700 font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                          −
                        </button>
                        <span className="w-8 text-center font-semibold text-lg">{guestCount}</span>
                        <button
                          type="button"
                          onClick={() => updateRoomGuests(index, guestCount + 1)}
                          disabled={guestCount >= 10}
                          className="w-8 h-8 rounded border border-gray-300 hover:bg-gray-100 text-gray-700 font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer Actions */}
                <div className="flex border-t border-gray-200 bg-gray-50">
                  <button
                    type="button"
                    onClick={deleteRoom}
                    disabled={roomGuests.length <= 1}
                    className="flex-1 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Delete Room
                  </button>
                  <div className="w-px bg-gray-200"></div>
                  <button
                    type="button"
                    onClick={addRoom}
                    disabled={roomGuests.length >= 10}
                    className="flex-1 py-3 text-sm font-medium text-green-600 hover:bg-green-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Add Room
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Search Button - Full Green */}
          <button
            type="submit"
            className="flex-1 min-w-[140px] py-4 bg-green-600 hover:bg-green-700 text-white font-bold text-lg transition-all rounded-r-xl"
          >
            Search
          </button>
        </form>
      </div>
    </div>
  );
}

