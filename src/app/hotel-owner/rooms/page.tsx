'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '~/utils/trpc';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';

export default function RoomsManagementPage() {
  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Fetch hotel with room categories
  const { data: hotel, isLoading, refetch } = api.hotelOwner.getMyHotel.useQuery();

  // Delete mutation
  const deleteMutation = api.hotelOwner.deleteRoomCategory.useMutation({
    onSuccess: () => {
      toast.success('Room category deleted successfully!');
      setDeleteId(null);
      void refetch();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete room category');
    },
  });

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this room category? This action cannot be undone.')) {
      deleteMutation.mutate({ roomCategoryId: id });
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="text-gray-600">Loading room categories...</p>
        </div>
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">No hotel found for your account.</p>
          <p className="mt-2 text-sm text-gray-600">Please contact administrator.</p>
        </div>
      </div>
    );
  }

  const roomCategories = hotel.roomCategories || [];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Room Categories</h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage room categories for {hotel.name}
            </p>
          </div>
          <Link
            href="/hotel-owner/rooms/add"
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="mr-2 h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Room Category
          </Link>
        </div>

        {/* Room Categories List */}
        {roomCategories.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-gray-300 bg-white p-12 text-center">
            <svg
              className="mx-auto h-16 w-16 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No room categories yet</h3>
            <p className="mt-2 text-sm text-gray-600">
              Get started by adding your first room category.
            </p>
            <Link
              href="/hotel-owner/rooms/add"
              className="mt-6 inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              Add Room Category
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {roomCategories.map((category) => (
              <div
                key={category.id}
                className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                {/* Category Image */}
                <div className="relative h-48 bg-gray-200">
                  {category.images && category.images.length > 0 ? (
                    <Image
                      src={category.images[0]!}
                      alt={category.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <svg
                        className="h-16 w-16 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  )}
                  {/* Image Count Badge */}
                  {category.images && category.images.length > 0 && (
                    <div className="absolute right-2 top-2 rounded-full bg-black bg-opacity-60 px-2 py-1 text-xs font-medium text-white">
                      {category.images.length} {category.images.length === 1 ? 'image' : 'images'}
                    </div>
                  )}
                </div>

                {/* Category Info */}
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                  {category.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-gray-600">{category.description}</p>
                  )}

                  {/* Stats */}
                  <div className="mt-4 grid grid-cols-2 gap-4 border-t pt-4">
                    <div>
                      <p className="text-xs text-gray-500">Max Guests</p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">
                        {category.maxGuests} persons
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Total Rooms</p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">
                        {category.totalRooms} rooms
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Available</p>
                      <p className="mt-1 text-sm font-semibold text-green-600">
                        {category.availableRooms} rooms
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Price From</p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">
                        ৳{category.prices[0]?.price.toLocaleString() || 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Amenities */}
                  {category.amenities && category.amenities.length > 0 && (
                    <div className="mt-4 border-t pt-4">
                      <p className="text-xs text-gray-500">Amenities</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {category.amenities.slice(0, 3).map((amenity, idx) => (
                          <span
                            key={idx}
                            className="rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-700"
                          >
                            {amenity}
                          </span>
                        ))}
                        {category.amenities.length > 3 && (
                          <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                            +{category.amenities.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-4 flex gap-2 border-t pt-4">
                    <Link
                      href={`/hotel-owner/rooms/${category.id}/edit`}
                      className="flex-1 rounded-lg border border-blue-600 bg-white px-4 py-2 text-center text-sm font-medium text-blue-600 hover:bg-blue-50"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(category.id)}
                      disabled={deleteMutation.isLoading && deleteId === category.id}
                      className="flex-1 rounded-lg border border-red-600 bg-white px-4 py-2 text-center text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      {deleteMutation.isLoading && deleteId === category.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Back Button */}
        <div className="mt-8">
          <Link
            href="/hotel-owner/dashboard"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="mr-2 h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
