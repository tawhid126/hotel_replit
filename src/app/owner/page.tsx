'use client';

import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/Card';
import { Badge } from '~/components/ui/Badge';
import { api } from '~/utils/trpc';
import { formatCurrency, formatDate } from '~/lib/utils';
import Link from 'next/link';
import { SimpleLineChart } from '~/components/ui/Charts';

export default function OwnerDashboard() {
  // Fetch owner's hotel data
  const { data: hotel, isLoading: hotelLoading } = api.hotel.getMyHotel.useQuery();

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = api.hotel.getOwnerStats.useQuery();

  // Fetch occupancy rate
  const { data: occupancy } = api.hotel.getOccupancyRate.useQuery();

  // Fetch monthly revenue
  const { data: monthlyRevenue } = api.hotel.getMonthlyRevenue.useQuery({ months: 6 });

  // Fetch recent bookings
  const { data: recentBookings } = api.booking.getMyHotelBookings.useQuery({
    page: 1,
    limit: 5,
  });

  if (hotelLoading || statsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>No Hotel Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-gray-600">
              You don't have a hotel registered yet. Please contact the administrator to set up your hotel.
            </p>
            <Link href="/profile" className="text-blue-600 hover:underline">
              Go to Profile
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Welcome Back!</h1>
          <p className="mt-2 text-gray-600">Here's what's happening with {hotel.name}</p>
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">{stats?.totalBookings || 0}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                  <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                <span className="text-green-600">+{stats?.thisMonthBookings || 0}</span> this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">
                    {formatCurrency(stats?.totalRevenue || 0)}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                <span className="text-green-600">{formatCurrency(stats?.thisMonthRevenue || 0)}</span> this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Room Categories</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">{stats?.totalRoomCategories || 0}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                  <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                {stats?.availableRooms || 0} rooms available
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Average Rating</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">
                    {hotel.rating ? hotel.rating.toFixed(1) : 'N/A'}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
                  <svg className="h-6 w-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                {hotel.totalReviews || 0} reviews
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Occupancy Rate & Monthly Revenue Charts */}
        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Occupancy Rate */}
          <Card>
            <CardHeader>
              <CardTitle>Current Occupancy Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-5xl font-bold text-blue-600">
                      {occupancy?.occupancyRate || 0}%
                    </p>
                    <p className="mt-2 text-sm text-gray-600">Room Occupancy</p>
                  </div>
                  <div className="text-right">
                    <div className="rounded-full bg-blue-100 p-4">
                      <svg className="h-10 w-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Total Rooms</span>
                    <span className="font-semibold text-gray-900">{occupancy?.totalRooms || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Occupied Rooms</span>
                    <span className="font-semibold text-green-600">{occupancy?.occupiedRooms || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Available Rooms</span>
                    <span className="font-semibold text-blue-600">{occupancy?.availableRooms || 0}</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="relative pt-1">
                  <div className="flex h-4 overflow-hidden rounded-full bg-gray-200">
                    <div
                      style={{ width: `${occupancy?.occupancyRate || 0}%` }}
                      className="flex flex-col justify-center whitespace-nowrap bg-gradient-to-r from-blue-500 to-blue-600 text-center text-xs text-white shadow-none transition-all duration-500"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Revenue Chart */}
          <SimpleLineChart
            title="Monthly Revenue Trend (Last 6 Months)"
            data={
              monthlyRevenue?.map((item) => ({
                label: item.month,
                value: item.amount,
              })) || []
            }
            height={250}
          />
        </div>

        {/* Hotel Overview & Recent Bookings */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Hotel Quick Info */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Hotel Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-600">Hotel Name</p>
                  <p className="text-lg font-semibold text-gray-900">{hotel.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Location</p>
                  <p className="text-sm text-gray-700">{hotel.city}, {hotel.country}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Address</p>
                  <p className="text-sm text-gray-700">{hotel.address}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Facilities</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {hotel.facilities?.slice(0, 4).map((facility) => (
                      <Badge key={facility} variant="info" size="sm">
                        {facility}
                      </Badge>
                    ))}
                    {hotel.facilities && hotel.facilities.length > 4 && (
                      <Badge variant="default" size="sm">
                        +{hotel.facilities.length - 4}
                      </Badge>
                    )}
                  </div>
                </div>
                <Link href="/owner/hotel">
                  <button className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                    Manage Hotel
                  </button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Recent Bookings */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Bookings</CardTitle>
                <Link href="/owner/bookings" className="text-sm text-blue-600 hover:underline">
                  View All
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {!recentBookings || recentBookings.bookings.length === 0 ? (
                <div className="py-8 text-center text-gray-500">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="mt-2">No bookings yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentBookings.bookings.map((booking: any) => (
                    <div key={booking.id} className="rounded-lg border p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-900">{booking.user?.name || 'Guest'}</p>
                            <Badge variant={booking.status === 'CONFIRMED' ? 'success' : 'warning'}>
                              {booking.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">{booking.roomCategory?.name}</p>
                          <p className="text-xs text-gray-500">
                            {formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">{formatCurrency(booking.totalPrice)}</p>
                          <p className="text-xs text-gray-500">{booking.numberOfGuests} guests</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <Link href="/owner/rooms">
                <button className="flex w-full items-center gap-3 rounded-lg border-2 border-gray-200 p-4 transition-colors hover:border-blue-500 hover:bg-blue-50">
                  <span className="text-2xl">🛏️</span>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">Add Room</p>
                    <p className="text-xs text-gray-600">Create new category</p>
                  </div>
                </button>
              </Link>
              <Link href="/owner/hotel">
                <button className="flex w-full items-center gap-3 rounded-lg border-2 border-gray-200 p-4 transition-colors hover:border-blue-500 hover:bg-blue-50">
                  <span className="text-2xl">✏️</span>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">Edit Hotel</p>
                    <p className="text-xs text-gray-600">Update details</p>
                  </div>
                </button>
              </Link>
              <Link href="/owner/bookings">
                <button className="flex w-full items-center gap-3 rounded-lg border-2 border-gray-200 p-4 transition-colors hover:border-blue-500 hover:bg-blue-50">
                  <span className="text-2xl">📅</span>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">View Bookings</p>
                    <p className="text-xs text-gray-600">Manage reservations</p>
                  </div>
                </button>
              </Link>
              <Link href="/owner/reviews">
                <button className="flex w-full items-center gap-3 rounded-lg border-2 border-gray-200 p-4 transition-colors hover:border-blue-500 hover:bg-blue-50">
                  <span className="text-2xl">⭐</span>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">Reviews</p>
                    <p className="text-xs text-gray-600">Check feedback</p>
                  </div>
                </button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
