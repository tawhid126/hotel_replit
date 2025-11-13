"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/utils/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import { Button } from "~/components/ui/Button";
import { Modal } from "~/components/ui/Modal";
import { RoomCategoryForm } from "~/components/hotel/RoomCategoryForm";
import { Badge } from "~/components/ui/Badge";

export default function HotelOwnerDashboard() {
  const router = useRouter();
  const [isAddRoomModalOpen, setIsAddRoomModalOpen] = useState(false);
  const [selectedRoomCategory, setSelectedRoomCategory] = useState<any>(null);

  // Fetch owner's hotel
  const { data: hotel, isLoading, refetch } = api.hotelOwner.getMyHotel.useQuery();
  const { data: stats } = api.hotelOwner.getDashboardStats.useQuery();

  // Mutations
  const createRoomCategory = api.hotelOwner.createRoomCategory.useMutation();
  const updateRoomCategory = api.hotelOwner.updateRoomCategory.useMutation();
  const deleteRoomCategory = api.hotelOwner.deleteRoomCategory.useMutation();

  const handleCreateRoomCategory = async (data: any) => {
    try {
      await createRoomCategory.mutateAsync(data);
      setIsAddRoomModalOpen(false);
      refetch();
    } catch (error) {
      console.error("Failed to create room category:", error);
    }
  };

  const handleUpdateRoomCategory = async (data: any) => {
    if (!selectedRoomCategory) return;
    
    try {
      await updateRoomCategory.mutateAsync({
        roomCategoryId: selectedRoomCategory.id,
        ...data,
      });
      setSelectedRoomCategory(null);
      refetch();
    } catch (error) {
      console.error("Failed to update room category:", error);
    }
  };

  const handleDeleteRoomCategory = async (roomCategoryId: string) => {
    if (!confirm("এই রুম ক্যাটাগরি মুছে ফেলতে চান? / Are you sure you want to delete this room category?")) {
      return;
    }

    try {
      await deleteRoomCategory.mutateAsync({ roomCategoryId });
      refetch();
    } catch (error) {
      console.error("Failed to delete room category:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="py-12 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              কোনো হোটেল পাওয়া যায়নি
            </h2>
            <p className="text-gray-600">
              আপনার অ্যাকাউন্টের সাথে কোনো হোটেল সংযুক্ত নেই।
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="py-8 px-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{hotel.name}</h1>
        <p className="text-gray-600 mt-1">
          {hotel.address}, {hotel.city}
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">মোট বুকিং</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stats.totalBookings}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  📅
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">সক্রিয় বুকিং</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stats.activeBookings}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  ✅
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">মোট আয়</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    ৳{stats.totalRevenue.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-full">
                  💰
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">রেটিং</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    ⭐ {stats.avgRating.toFixed(1)}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  ⭐
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <button
          onClick={() => router.push('/hotel-owner/rooms')}
          className="bg-white border-2 border-blue-600 text-blue-600 rounded-lg p-6 hover:bg-blue-50 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-lg">Manage Rooms</h3>
              <p className="text-sm text-gray-600">Add, edit room categories</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => router.push('/hotel-owner/rooms/add')}
          className="bg-white border-2 border-green-600 text-green-600 rounded-lg p-6 hover:bg-green-50 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-lg">Add Room Category</h3>
              <p className="text-sm text-gray-600">Create new room type</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => router.push('/hotel-owner/bookings')}
          className="bg-white border-2 border-purple-600 text-purple-600 rounded-lg p-6 hover:bg-purple-50 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-lg">View Bookings</h3>
              <p className="text-sm text-gray-600">Manage reservations</p>
            </div>
          </div>
        </button>
      </div>

      {/* Room Categories */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>রুম ক্যাটাগরি / Room Categories</CardTitle>
            <Button onClick={() => router.push('/hotel-owner/rooms')}>
              View All Rooms
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {hotel.roomCategories.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">
                এখনো কোনো রুম ক্যাটাগরি যোগ করা হয়নি
              </p>
              <Button onClick={() => setIsAddRoomModalOpen(true)}>
                প্রথম রুম ক্যাটাগরি যোগ করুন
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {hotel.roomCategories.map((category: any) => (
                <Card key={category.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{category.name}</CardTitle>
                        <p className="text-sm text-gray-600 mt-1">
                          {category.description}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Category Image */}
                    {category.images.length > 0 && (
                      <img
                        src={category.images[0]}
                        alt={category.name}
                        className="w-full h-40 object-cover rounded-md mb-4"
                      />
                    )}

                    {/* Details */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">সর্বোচ্চ অতিথি:</span>
                        <span className="font-medium">{category.maxGuests} জন</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">মোট রুম:</span>
                        <span className="font-medium">{category.totalRooms}টি</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">উপলব্ধ:</span>
                        <span className="font-medium">{category.availableRooms}টি</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">বুকিং:</span>
                        <span className="font-medium">{category._count.bookings}</span>
                      </div>
                    </div>

                    {/* Prices */}
                    <div className="border-t pt-3 mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">মূল্য তালিকা:</p>
                      <div className="space-y-1">
                        {category.prices.map((price: any) => (
                          <div key={price.id} className="flex justify-between text-sm">
                            <span className="text-gray-600">{price.guestCount} জন:</span>
                            <span className="font-medium">৳{price.price}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Amenities */}
                    {category.amenities.length > 0 && (
                      <div className="border-t pt-3 mb-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">সুবিধাসমূহ:</p>
                        <div className="flex flex-wrap gap-1">
                          {category.amenities.slice(0, 3).map((amenity: string) => (
                            <Badge key={amenity} variant="info">
                              {amenity}
                            </Badge>
                          ))}
                          {category.amenities.length > 3 && (
                            <Badge variant="default">
                              +{category.amenities.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-3 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => setSelectedRoomCategory(category)}
                      >
                        সম্পাদনা
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-red-600 hover:text-red-700"
                        onClick={() => handleDeleteRoomCategory(category.id)}
                      >
                        মুছুন
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Room Category Modal */}
      <Modal
        isOpen={isAddRoomModalOpen}
        onClose={() => setIsAddRoomModalOpen(false)}
        size="lg"
      >
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            নতুন রুম ক্যাটাগরি যোগ করুন
          </h2>
          <RoomCategoryForm
            onSubmit={handleCreateRoomCategory}
            onCancel={() => setIsAddRoomModalOpen(false)}
            isLoading={createRoomCategory.isLoading}
          />
        </div>
      </Modal>

      {/* Edit Room Category Modal */}
      <Modal
        isOpen={!!selectedRoomCategory}
        onClose={() => setSelectedRoomCategory(null)}
        size="lg"
      >
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            রুম ক্যাটাগরি সম্পাদনা করুন
          </h2>
          {selectedRoomCategory && (
            <RoomCategoryForm
              initialData={selectedRoomCategory}
              onSubmit={handleUpdateRoomCategory}
              onCancel={() => setSelectedRoomCategory(null)}
              isLoading={updateRoomCategory.isLoading}
            />
          )}
        </div>
      </Modal>
    </div>
  );
}
