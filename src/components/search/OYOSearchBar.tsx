"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface OYOSearchBarProps {
  className?: string;
}

export function OYOSearchBar({ className = "" }: OYOSearchBarProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("Around Me");
  const [checkInDate, setCheckInDate] = useState<Date | null>(null);
  const [checkOutDate, setCheckOutDate] = useState<Date | null>(null);
  const [rooms, setRooms] = useState(1);
  const [guests, setGuests] = useState(1);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showRoomGuestPicker, setShowRoomGuestPicker] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [activeTab, setActiveTab] = useState<"rooms" | "guests">("rooms");
  const [roomConfigs, setRoomConfigs] = useState<number[]>([1]);
  
  const datePickerRef = useRef<HTMLDivElement>(null);
  const roomGuestPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Don't set default dates - let user choose their dates
    // const today = new Date();
    // const tomorrow = new Date(today);
    // tomorrow.setDate(tomorrow.getDate() + 1);
    // setCheckInDate(today);
    // setCheckOutDate(tomorrow);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false);
      }
      if (roomGuestPickerRef.current && !roomGuestPickerRef.current.contains(event.target as Node)) {
        setShowRoomGuestPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const total = roomConfigs.reduce((sum, count) => sum + count, 0);
    setGuests(total);
    setRooms(roomConfigs.length);
  }, [roomConfigs]);

  const getNearMe = () => {
    if (navigator.geolocation) {
      toast.promise(
        new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              setSearchQuery("Around Me");
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

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // Validate dates are selected
    if (!checkInDate || !checkOutDate) {
      toast.error("Please select check-in and check-out dates");
      return;
    }
    
    if (checkOutDate <= checkInDate) {
      toast.error("Check-out date must be after check-in date");
      return;
    }
    
    const params = new URLSearchParams();
    if (searchQuery && searchQuery !== "Around Me") params.set("search", searchQuery);
    if (rooms) params.set("rooms", rooms.toString());
    if (guests) params.set("guests", guests.toString());
    params.set("checkIn", checkInDate.toISOString().split('T')[0]!);
    params.set("checkOut", checkOutDate.toISOString().split('T')[0]!);
    if (coords) {
      params.set("lat", String(coords.lat));
      params.set("lng", String(coords.lng));
    }
    
    router.push(`/hotels?${params.toString()}`);
  };

  const formatDateRange = () => {
    if (!checkInDate || !checkOutDate) return "Select dates";
    const options: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' };
    const checkIn = checkInDate.toLocaleDateString('en-US', options);
    const checkOut = checkOutDate.toLocaleDateString('en-US', options);
    return `${checkIn} – ${checkOut}`;
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    // Adjust for Monday start (0 = Sunday, we want Monday = 0)
    let startingDayOfWeek = firstDay.getDay() - 1;
    if (startingDayOfWeek < 0) startingDayOfWeek = 6;
    
    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const renderCalendar = (monthOffset: number) => {
    const date = new Date(currentMonth);
    date.setMonth(date.getMonth() + monthOffset);
    const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(date);
    
    const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const days = [];
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="h-10"></div>);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month, day);
      const isSelected = (checkInDate && currentDate.toDateString() === checkInDate.toDateString()) ||
                        (checkOutDate && currentDate.toDateString() === checkOutDate.toDateString());
      const isInRange = checkInDate && checkOutDate && 
                       currentDate > checkInDate && currentDate < checkOutDate;
      const isToday = currentDate.toDateString() === new Date().toDateString();
      const isPast = currentDate < new Date(new Date().setHours(0, 0, 0, 0));
      
      days.push(
        <button
          key={day}
          type="button"
          disabled={isPast}
          onClick={() => {
            if (!checkInDate || (checkInDate && checkOutDate)) {
              setCheckInDate(currentDate);
              setCheckOutDate(null);
            } else if (currentDate > checkInDate) {
              setCheckOutDate(currentDate);
            } else {
              setCheckInDate(currentDate);
              setCheckOutDate(null);
            }
          }}
          className={`h-10 flex items-center justify-center text-sm rounded transition-colors
            ${isPast ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-gray-100'}
            ${isSelected ? 'bg-red-500 text-white hover:bg-red-600' : ''}
            ${isInRange ? 'bg-red-50' : ''}
            ${isToday && !isSelected ? 'font-bold text-red-500' : ''}
          `}
        >
          {day}
        </button>
      );
    }
    
    return (
      <div className="flex-1 min-w-[280px]">
        <div className="font-semibold text-center mb-3 text-gray-900">{monthName}</div>
        <div className="grid grid-cols-7 gap-1 mb-2 text-xs font-medium text-gray-600">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
            <div key={day} className="text-center">{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days}
        </div>
      </div>
    );
  };

  const addRoom = () => {
    if (roomConfigs.length < 10) {
      setRoomConfigs([...roomConfigs, 1]);
    }
  };

  const deleteRoom = (index: number) => {
    if (roomConfigs.length > 1) {
      const newConfigs = roomConfigs.filter((_, i) => i !== index);
      setRoomConfigs(newConfigs);
    }
  };

  const updateRoomGuests = (index: number, delta: number) => {
    const newConfigs = [...roomConfigs];
    newConfigs[index] = Math.max(1, Math.min(10, (newConfigs[index] ?? 1) + delta));
    setRoomConfigs(newConfigs);
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="bg-white rounded-lg shadow-lg overflow-visible">
        <form onSubmit={handleSearch} className="flex items-stretch">
          {/* Location Input - 34% width */}
          <div className="relative px-4 py-3 border-r border-gray-200" style={{ width: '34%' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by city, hotel..."
              className="w-full text-sm text-gray-900 placeholder-gray-400 border-none outline-none bg-transparent pr-16"
            />
            <button
              type="button"
              onClick={getNearMe}
              className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="hidden sm:inline">Near me</span>
            </button>
          </div>

          {/* Date Range - 27% width */}
          <div className="relative border-r border-gray-200" style={{ width: '27%' }} ref={datePickerRef}>
            <button
              type="button"
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="w-full px-4 py-3 text-sm text-gray-900 hover:bg-gray-50 transition-colors whitespace-nowrap h-full text-left"
            >
              {formatDateRange()}
            </button>
            
            {showDatePicker && (
              <>
                {/* Backdrop to close calendar */}
                <div 
                  className="fixed inset-0 z-40"
                  onClick={() => setShowDatePicker(false)}
                />
                {/* Calendar Dropdown */}
                <div 
                  className="absolute top-full left-0 mt-2 bg-white shadow-2xl rounded-lg border border-gray-200 p-6 z-50"
                  style={{ minWidth: '650px' }}
                >
                  {/* Month Navigation */}
                  <div className="flex items-center justify-between mb-4">
                    <button
                      type="button"
                      onClick={() => {
                        const newMonth = new Date(currentMonth);
                        newMonth.setMonth(newMonth.getMonth() - 1);
                        // Don't allow going to past months
                        const today = new Date();
                        if (newMonth >= new Date(today.getFullYear(), today.getMonth(), 1)) {
                          setCurrentMonth(newMonth);
                        }
                      }}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <div className="text-sm font-medium text-gray-600">
                      Select your check-in and check-out dates
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const newMonth = new Date(currentMonth);
                        newMonth.setMonth(newMonth.getMonth() + 1);
                        setCurrentMonth(newMonth);
                      }}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="flex gap-8">
                    {renderCalendar(0)}
                    {renderCalendar(1)}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Rooms & Guests - 24% width */}
          <div className="relative border-r border-gray-200" style={{ width: '24%' }} ref={roomGuestPickerRef}>
            <button
              type="button"
              onClick={() => setShowRoomGuestPicker(!showRoomGuestPicker)}
              className="w-full px-4 py-3 text-sm text-gray-900 hover:bg-gray-50 transition-colors whitespace-nowrap h-full text-left"
            >
              {rooms} Room{rooms > 1 ? 's' : ''}, {guests} Guest{guests > 1 ? 's' : ''}
            </button>

            {showRoomGuestPicker && (
              <>
                {/* Backdrop to close picker */}
                <div 
                  className="fixed inset-0 z-40"
                  onClick={() => setShowRoomGuestPicker(false)}
                />
                {/* Room & Guest Picker Dropdown */}
                <div className="absolute top-full right-0 mt-2 w-80 bg-white shadow-2xl rounded-lg border border-gray-200 z-50 overflow-hidden">
                  {/* Tabs */}
                  <div className="flex border-b border-gray-200">
                    <button
                      type="button"
                      onClick={() => setActiveTab("rooms")}
                      className={`flex-1 py-3 text-sm font-medium transition-colors ${
                        activeTab === "rooms" 
                          ? "bg-gray-50 text-gray-900 border-b-2 border-green-600" 
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      Rooms
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("guests")}
                      className={`flex-1 py-3 text-sm font-medium transition-colors ${
                        activeTab === "guests" 
                          ? "bg-gray-50 text-gray-900 border-b-2 border-green-600" 
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      Guests
                    </button>
                  </div>

                  {/* Content */}
                  <div className="p-4 max-h-80 overflow-y-auto">
                    {roomConfigs.map((guestCount, index) => (
                      <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                        <span className="text-sm font-medium text-gray-900">Room {index + 1}</span>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => updateRoomGuests(index, -1)}
                            disabled={guestCount <= 1}
                            className="w-8 h-8 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-gray-700 font-bold"
                          >
                            −
                          </button>
                          <span className="w-8 text-center font-medium">{guestCount}</span>
                          <button
                            type="button"
                            onClick={() => updateRoomGuests(index, 1)}
                            disabled={guestCount >= 10}
                            className="w-8 h-8 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-gray-700 font-bold"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="flex border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => deleteRoom(roomConfigs.length - 1)}
                      disabled={roomConfigs.length <= 1}
                      className="flex-1 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      Delete Room
                    </button>
                    <div className="w-px bg-gray-200"></div>
                    <button
                      type="button"
                      onClick={addRoom}
                      disabled={roomConfigs.length >= 10}
                      className="flex-1 py-3 text-sm font-medium text-green-600 hover:bg-green-50 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      Add Room
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Search Button - 15% width */}
          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white font-semibold text-sm transition-colors rounded-r-lg"
            style={{ width: '15%', minWidth: '80px' }}
          >
            Search
          </button>
        </form>
      </div>
    </div>
  );
}
