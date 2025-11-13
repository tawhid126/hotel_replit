"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { api } from "~/utils/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import { StatCard, SimpleBarChart, SimpleLineChart, SimplePieChart } from "~/components/ui/Charts";
import { formatCurrency } from "~/lib/utils";

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Protect route - only admins
  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user.role !== "ADMIN") {
      router.push("/");
    }
  }, [session, status, router]);

  // Fetch dashboard stats
  const { data: stats, isLoading } = api.admin.getDashboardStats.useQuery(
    undefined,
    { enabled: session?.user.role === "ADMIN" }
  );

  // Fetch top hotels
  const { data: topHotels } = api.admin.getTopHotels.useQuery(
    { limit: 5 },
    { enabled: session?.user.role === "ADMIN" }
  );

  // Fetch top room categories
  const { data: topRooms } = api.admin.getTopRoomCategories.useQuery(
    { limit: 5 },
    { enabled: session?.user.role === "ADMIN" }
  );

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== "ADMIN") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Welcome back, {session.user.name}
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Hotels"
            value={stats?.totalHotels || 0}
            icon="🏨"
            trend={{ value: 12, isPositive: true }}
            color="blue"
          />
          <StatCard
            title="Total Users"
            value={stats?.totalUsers || 0}
            icon="👥"
            trend={{ value: 8, isPositive: true }}
            color="green"
          />
          <StatCard
            title="Total Bookings"
            value={stats?.totalBookings || 0}
            icon="📅"
            trend={{ value: 15, isPositive: true }}
            color="purple"
          />
          <StatCard
            title="Total Revenue"
            value={formatCurrency(stats?.totalRevenue || 0)}
            icon="💰"
            trend={{ value: 23, isPositive: true }}
            color="orange"
          />
        </div>

        {/* Analytics Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Monthly Revenue Chart */}
          <SimpleLineChart
            title="Monthly Revenue Trend"
            data={[
              { label: 'Jan', value: 85000 },
              { label: 'Feb', value: 92000 },
              { label: 'Mar', value: 78000 },
              { label: 'Apr', value: 105000 },
              { label: 'May', value: 98000 },
              { label: 'Jun', value: 112000 },
            ]}
            height={250}
          />

          {/* Top Hotels Performance - REAL DATA */}
          <SimpleBarChart
            title="Top Performing Hotels (by Revenue)"
            data={
              topHotels?.map((hotel) => ({
                label: hotel.name,
                value: hotel.totalRevenue,
                color: 'bg-blue-500',
              })) || []
            }
            height={250}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Top Room Categories - NEW */}
          <SimpleBarChart
            title="Top Room Categories (by Bookings)"
            data={
              topRooms?.map((room) => ({
                label: `${room.name} (${room.hotelName})`,
                value: room.bookingsCount,
                color: 'bg-green-500',
              })) || []
            }
            height={250}
          />

          {/* User Growth */}
          <SimpleBarChart
            title="User Growth (Last 6 Months)"
            data={[
              { label: 'Jan', value: 145, color: 'bg-purple-500' },
              { label: 'Feb', value: 168, color: 'bg-purple-500' },
              { label: 'Mar', value: 192, color: 'bg-purple-500' },
              { label: 'Apr', value: 215, color: 'bg-purple-500' },
              { label: 'May', value: 238, color: 'bg-purple-500' },
              { label: 'Jun', value: 265, color: 'bg-purple-500' },
            ]}
            height={250}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Payment Methods Distribution */}
          <SimplePieChart
            title="Payment Methods"
            data={[
              { label: 'bKash', value: 45, color: '#e91e63' },
              { label: 'Nagad', value: 30, color: '#ff9800' },
              { label: 'Bank Transfer', value: 25, color: '#2196f3' },
            ]}
            size={200}
          />

          {/* Booking Status */}
          <SimplePieChart
            title="Booking Status"
            data={[
              { label: 'Confirmed', value: 65, color: '#4caf50' },
              { label: 'Pending', value: 20, color: '#ff9800' },
              { label: 'Cancelled', value: 15, color: '#f44336' },
            ]}
            size={200}
          />

          {/* Hotel Distribution */}
          <SimplePieChart
            title="Hotel Status"
            data={[
              { label: 'Active', value: stats?.activeHotels || 0, color: '#4caf50' },
              { label: 'Inactive', value: (stats?.totalHotels || 0) - (stats?.activeHotels || 0), color: '#9e9e9e' },
            ]}
            size={200}
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => router.push("/admin/hotels")}
          >
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-100 rounded-lg p-3">
                  <svg
                    className="w-6 h-6 text-blue-600"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Manage Hotels
                  </h3>
                  <p className="text-sm text-gray-600">
                    Add, edit, or remove hotels
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => router.push("/admin/users")}
          >
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-100 rounded-lg p-3">
                  <svg
                    className="w-6 h-6 text-green-600"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Manage Users
                  </h3>
                  <p className="text-sm text-gray-600">
                    View and manage user accounts
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => router.push("/admin/reviews")}
          >
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-yellow-100 rounded-lg p-3">
                  <svg
                    className="w-6 h-6 text-yellow-600"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Moderate Reviews
                  </h3>
                  <p className="text-sm text-gray-600">
                    Approve or reject reviews
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Bookings */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.recentBookings && stats.recentBookings.length > 0 ? (
                <div className="space-y-4">
                  {stats.recentBookings.map((booking: any) => (
                    <div
                      key={booking.id}
                      className="flex items-center justify-between border-b border-gray-200 pb-3 last:border-0"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {booking.user.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {booking.roomCategory.hotel.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">
                          {formatCurrency(booking.totalPrice)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {booking.status}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  No recent bookings
                </p>
              )}
            </CardContent>
          </Card>

          {/* Pending Reviews */}
          <Card>
            <CardHeader>
              <CardTitle>Pending Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.pendingReviews && stats.pendingReviews.length > 0 ? (
                <div className="space-y-4">
                  {stats.pendingReviews.map((review: any) => (
                    <div
                      key={review.id}
                      className="flex items-start justify-between border-b border-gray-200 pb-3 last:border-0"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {review.user.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {review.hotel.name}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {review.comment.substring(0, 60)}...
                        </p>
                      </div>
                      <div className="flex items-center ml-4">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.rating
                                ? "text-yellow-400"
                                : "text-gray-300"
                            }`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                          </svg>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  No pending reviews
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
