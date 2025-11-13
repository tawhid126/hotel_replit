"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/utils/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import { Button } from "~/components/ui/Button";
import { Input } from "~/components/ui/Input";
import { Modal } from "~/components/ui/Modal";
import { Badge } from "~/components/ui/Badge";

export default function AdminHotelsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState<any>(null);
  const [page, setPage] = useState(1);

  // Fetch hotels
  const { data, isLoading, refetch } = api.hotel.getAll.useQuery({
    skip: (page - 1) * 10,
    take: 10,
    search: searchQuery || undefined,
  });

  const hotels = data?.hotels || [];
  const totalPages = data?.total ? Math.ceil(data.total / 10) : 1;

  return (
    <div className="py-8 px-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Hotel Management</h1>
          <p className="text-gray-600 mt-1">
            Manage all hotels on the platform
          </p>
        </div>
        <Button onClick={() => router.push('/admin/hotels/add')}>
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M12 4v16m8-8H4"></path>
          </svg>
          Add Hotel
        </Button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <Input
          type="text"
          placeholder="Search hotels by name or city..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(1);
          }}
          className="max-w-md"
        />
      </div>

      {/* Hotels Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : hotels.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">No hotels found</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {hotels.map((hotel: any) => (
              <Card key={hotel.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{hotel.name}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        {hotel.city}, {hotel.address}
                      </p>
                    </div>
                    <Badge variant={hotel.active ? "success" : "default"}>
                      {hotel.active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Rating:</span>
                      <span className="font-medium">
                        ⭐ {hotel.avgRating?.toFixed(1) || "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Reviews:</span>
                      <span className="font-medium">{hotel.totalReviews}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Room Categories:</span>
                      <span className="font-medium">
                        {hotel._count?.roomCategories || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Total Bookings:</span>
                      <span className="font-medium">
                        {hotel._count?.bookings || 0}
                      </span>
                    </div>

                    {hotel.amenities && hotel.amenities.length > 0 && (
                      <div className="pt-2 border-t">
                        <p className="text-sm text-gray-600 mb-2">Amenities:</p>
                        <div className="flex flex-wrap gap-1">
                          {hotel.amenities.slice(0, 3).map((amenity: string) => (
                            <Badge key={amenity} variant="info">
                              {amenity}
                            </Badge>
                          ))}
                          {hotel.amenities.length > 3 && (
                            <Badge variant="default">
                              +{hotel.amenities.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 pt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => setSelectedHotel(hotel)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => window.open(`/hotels/${hotel.id}`, "_blank")}
                      >
                        View
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* Add/Edit Hotel Modal */}
      <AddHotelModal
        isOpen={isAddModalOpen || !!selectedHotel}
        onClose={() => {
          setIsAddModalOpen(false);
          setSelectedHotel(null);
        }}
        hotel={selectedHotel}
        onSuccess={() => {
          refetch();
          setIsAddModalOpen(false);
          setSelectedHotel(null);
        }}
      />
    </div>
  );
}

// Add/Edit Hotel Modal Component
function AddHotelModal({
  isOpen,
  onClose,
  hotel,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  hotel?: any;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: hotel?.name || "",
    description: hotel?.description || "",
    address: hotel?.address || "",
    city: hotel?.city || "",
    latitude: hotel?.latitude || "",
    longitude: hotel?.longitude || "",
    amenities: hotel?.amenities?.join(", ") || "",
    ownerId: hotel?.ownerId || "",
  });

  const createMutation = api.hotel.create.useMutation();
  const updateMutation = api.hotel.update.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const amenitiesArray = formData.amenities
      .split(",")
      .map((a: string) => a.trim())
      .filter(Boolean);

    try {
      if (hotel) {
        await updateMutation.mutateAsync({
          id: hotel.id,
          name: formData.name,
          description: formData.description,
          address: formData.address,
          city: formData.city,
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude),
          amenities: amenitiesArray,
        });
      } else {
        await createMutation.mutateAsync({
          name: formData.name,
          description: formData.description,
          address: formData.address,
          city: formData.city,
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude),
          amenities: amenitiesArray,
          ownerId: formData.ownerId,
        });
      }
      onSuccess();
    } catch (error) {
      console.error("Failed to save hotel:", error);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {hotel ? "Edit Hotel" : "Add New Hotel"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Hotel Name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              required
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Address"
              required
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
            />
            <Input
              label="City"
              required
              value={formData.city}
              onChange={(e) =>
                setFormData({ ...formData, city: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Latitude"
              type="number"
              step="any"
              required
              value={formData.latitude}
              onChange={(e) =>
                setFormData({ ...formData, latitude: e.target.value })
              }
            />
            <Input
              label="Longitude"
              type="number"
              step="any"
              required
              value={formData.longitude}
              onChange={(e) =>
                setFormData({ ...formData, longitude: e.target.value })
              }
            />
          </div>

          <Input
            label="Amenities (comma-separated)"
            placeholder="WiFi, Pool, Gym, Parking"
            value={formData.amenities}
            onChange={(e) =>
              setFormData({ ...formData, amenities: e.target.value })
            }
          />

          {!hotel && (
            <div>
              <Input
                label="Owner ID"
                required
                value={formData.ownerId}
                onChange={(e) =>
                  setFormData({ ...formData, ownerId: e.target.value })
                }
              />
              <p className="text-sm text-gray-600 mt-1">
                Enter the user ID of the hotel owner
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              isLoading={createMutation.isLoading || updateMutation.isLoading}
            >
              {hotel ? "Update Hotel" : "Create Hotel"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
