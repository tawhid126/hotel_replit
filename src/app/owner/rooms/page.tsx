"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/utils/trpc";
import { Button } from "~/components/ui/Button";
import { Input } from "~/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import { Modal } from "~/components/ui/Modal";
import { Badge } from "~/components/ui/Badge";
import { ImageUpload } from "~/components/ui/ImageUpload";
import { toast, toastMessages } from "~/components/ui/Toast";
import { RoomListSkeleton } from "~/components/ui/Skeleton";

interface PriceEntry {
  guestCount: number;
  pricePerNight: number;
}

export default function OwnerRoomsPage() {
  const router = useRouter();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    basePrice: "",
    maxGuests: "",
    totalRooms: "",
    amenities: "",
    images: [] as string[],
    prices: [
      { guestCount: 1, pricePerNight: 0 },
      { guestCount: 2, pricePerNight: 0 },
    ] as PriceEntry[],
  });

  // Fetch owner's hotel
  const { data: hotel, isLoading: hotelLoading } = api.hotelOwner.getMyHotel.useQuery();

  // Fetch rooms
  const { data: rooms, isLoading: roomsLoading, refetch } = api.roomCategory.getByHotel.useQuery(
    { hotelId: hotel?.id || "" },
    { enabled: !!hotel?.id }
  );

  // Mutations
  const createRoom = api.roomCategory.create.useMutation({
    onSuccess: () => {
      toastMessages.roomCreated();
      resetForm();
      setShowAddModal(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create room");
    },
  });

  const updateRoom = api.roomCategory.update.useMutation({
    onSuccess: () => {
      toastMessages.roomUpdated();
      resetForm();
      setEditingRoom(null);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update room");
    },
  });

  const deleteRoom = api.roomCategory.delete.useMutation({
    onSuccess: () => {
      toast.success("Room category deleted");
      setShowDeleteConfirm(null);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete room");
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      basePrice: "",
      maxGuests: "",
      totalRooms: "",
      amenities: "",
      images: [],
      prices: [
        { guestCount: 1, pricePerNight: 0 },
        { guestCount: 2, pricePerNight: 0 },
      ],
    });
  };

  const handleEdit = (room: any) => {
    setEditingRoom(room);
    setFormData({
      name: room.name,
      description: room.description || "",
      basePrice: room.basePrice?.toString() || "",
      maxGuests: room.maxGuests?.toString() || "",
      totalRooms: room.totalRooms?.toString() || "",
      amenities: room.amenities?.join(", ") || "",
      images: room.images || [],
      prices: room.prices?.map((p: any) => ({
        guestCount: p.guestCount,
        pricePerNight: p.pricePerNight,
      })) || [],
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!hotel?.id) {
      toast.error("No hotel found. Please create a hotel first.");
      return;
    }

    const amenitiesArray = formData.amenities
      .split(",")
      .map((a) => a.trim())
      .filter((a) => a.length > 0);

    const data = {
      hotelId: hotel.id,
      name: formData.name,
      description: formData.description || undefined,
      basePrice: parseFloat(formData.basePrice),
      maxGuests: parseInt(formData.maxGuests),
      totalRooms: parseInt(formData.totalRooms),
      amenities: amenitiesArray,
      images: formData.images,
      prices: formData.prices.filter((p) => p.pricePerNight > 0),
    };

    if (editingRoom) {
      updateRoom.mutate({ id: editingRoom.id, ...data });
    } else {
      createRoom.mutate(data);
    }
  };

  const handleAddPriceEntry = () => {
    const maxGuests = parseInt(formData.maxGuests) || 2;
    const currentMaxGuestCount = Math.max(...formData.prices.map((p) => p.guestCount), 0);
    
    if (currentMaxGuestCount >= maxGuests) {
      toast.error(`Maximum ${maxGuests} guests allowed`);
      return;
    }

    setFormData({
      ...formData,
      prices: [
        ...formData.prices,
        { guestCount: currentMaxGuestCount + 1, pricePerNight: 0 },
      ],
    });
  };

  const handleRemovePriceEntry = (index: number) => {
    setFormData({
      ...formData,
      prices: formData.prices.filter((_, i) => i !== index),
    });
  };

  const handlePriceChange = (index: number, field: "guestCount" | "pricePerNight", value: string) => {
    const newPrices = [...formData.prices];
    const currentPrice = newPrices[index]!;
    newPrices[index] = {
      guestCount: field === "guestCount" ? (parseInt(value) || 0) : currentPrice.guestCount,
      pricePerNight: field === "pricePerNight" ? (parseFloat(value) || 0) : currentPrice.pricePerNight,
    };
    setFormData({ ...formData, prices: newPrices });
  };

  if (hotelLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <Card>
            <CardContent className="py-16 text-center">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                No Hotel Found
              </h2>
              <p className="text-gray-600 mb-6">
                You need to create a hotel before adding room categories.
              </p>
              <Button onClick={() => router.push("/owner/hotel")}>
                Create Hotel
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Room Categories</h1>
            <p className="text-gray-600 mt-1">
              Manage room types for {hotel.name}
            </p>
          </div>
          <Button onClick={() => setShowAddModal(true)}>
            ➕ Add Room Category
          </Button>
        </div>

        {/* Rooms List */}
        {roomsLoading ? (
          <RoomListSkeleton count={3} />
        ) : rooms && rooms.length > 0 ? (
          <div className="space-y-6">
            {rooms.map((room) => (
              <Card key={room.id}>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Room Images */}
                    <div className="md:col-span-1">
                      {room.images && room.images.length > 0 ? (
                        <img
                          src={room.images[0]}
                          alt={room.name}
                          className="w-full h-48 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                          <span className="text-gray-400">No image</span>
                        </div>
                      )}
                    </div>

                    {/* Room Details */}
                    <div className="md:col-span-3 space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900">
                            {room.name}
                          </h3>
                          <p className="text-gray-600 mt-1">{room.description}</p>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(room)}
                          >
                            ✏️ Edit
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => setShowDeleteConfirm(room.id)}
                          >
                            🗑️ Delete
                          </Button>
                        </div>
                      </div>

                      {/* Room Info Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Base Price</p>
                          <p className="font-semibold">৳{Math.min(...room.prices.map(p => p.price)).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Max Guests</p>
                          <p className="font-semibold">{room.maxGuests} persons</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Total Rooms</p>
                          <p className="font-semibold">{room.totalRooms} rooms</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Available</p>
                          <p className="font-semibold text-green-600">
                            {room.availableRooms} rooms
                          </p>
                        </div>
                      </div>

                      {/* Dynamic Pricing */}
                      {room.prices && room.prices.length > 0 && (
                        <div>
                          <p className="text-sm text-gray-500 mb-2">Dynamic Pricing</p>
                          <div className="flex flex-wrap gap-2">
                            {room.prices.map((price: any, idx: number) => (
                              <Badge key={idx} variant="default">
                                {price.guestCount} {price.guestCount === 1 ? "guest" : "guests"}: ৳
                                {price.pricePerNight.toLocaleString()}/night
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Amenities */}
                      {room.amenities && room.amenities.length > 0 && (
                        <div>
                          <p className="text-sm text-gray-500 mb-2">Amenities</p>
                          <div className="flex flex-wrap gap-2">
                            {room.amenities.map((amenity: string, idx: number) => (
                              <Badge key={idx} variant="info">
                                {amenity}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-16 text-center">
              <p className="text-gray-500 mb-4">No room categories yet</p>
              <Button onClick={() => setShowAddModal(true)}>
                Add First Room Category
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Add/Edit Modal */}
        <Modal
          isOpen={showAddModal || !!editingRoom}
          onClose={() => {
            setShowAddModal(false);
            setEditingRoom(null);
            resetForm();
          }}
          title={editingRoom ? "Edit Room Category" : "Add Room Category"}
          size="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Room Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Room Category Name *
              </label>
              <Input
                type="text"
                placeholder="e.g., Deluxe Suite, Standard Room"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                rows={3}
                placeholder="Describe the room features..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Grid: Base Price, Max Guests, Total Rooms */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Base Price (৳) *
                </label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="2000"
                  value={formData.basePrice}
                  onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Guests *
                </label>
                <Input
                  type="number"
                  min="1"
                  placeholder="2"
                  value={formData.maxGuests}
                  onChange={(e) => setFormData({ ...formData, maxGuests: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Rooms *
                </label>
                <Input
                  type="number"
                  min="1"
                  placeholder="10"
                  value={formData.totalRooms}
                  onChange={(e) => setFormData({ ...formData, totalRooms: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Dynamic Pricing */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Dynamic Pricing (per guest count)
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddPriceEntry}
                >
                  ➕ Add Price
                </Button>
              </div>

              <div className="space-y-3">
                {formData.prices.map((price, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="flex-1">
                      <Input
                        type="number"
                        min="1"
                        placeholder="Guest count"
                        value={price.guestCount}
                        onChange={(e) => handlePriceChange(index, "guestCount", e.target.value)}
                      />
                    </div>
                    <div className="flex-1">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Price per night"
                        value={price.pricePerNight}
                        onChange={(e) => handlePriceChange(index, "pricePerNight", e.target.value)}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => handleRemovePriceEntry(index)}
                      disabled={formData.prices.length === 1}
                    >
                      🗑️
                    </Button>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Set different prices based on number of guests
              </p>
            </div>

            {/* Amenities */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amenities (comma-separated)
              </label>
              <Input
                type="text"
                placeholder="WiFi, TV, Mini Bar, Air Conditioning"
                value={formData.amenities}
                onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
              />
            </div>

            {/* Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Room Images
              </label>
              <ImageUpload
                value={formData.images}
                onChange={(urls) => setFormData({ ...formData, images: urls })}
                maxImages={5}
                folder={`rooms/${hotel.id}/${formData.name.toLowerCase().replace(/\s+/g, "-")}`}
                showCompressionStats={true}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingRoom(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createRoom.isLoading || updateRoom.isLoading}
              >
                {createRoom.isLoading || updateRoom.isLoading
                  ? "Saving..."
                  : editingRoom
                  ? "Update Room"
                  : "Add Room"}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <Modal
            isOpen={true}
            onClose={() => setShowDeleteConfirm(null)}
            title="Delete Room Category"
            size="sm"
          >
            <div className="space-y-4">
              <p className="text-gray-600">
                Are you sure you want to delete this room category? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  onClick={() => deleteRoom.mutate({ id: showDeleteConfirm })}
                  disabled={deleteRoom.isLoading}
                >
                  {deleteRoom.isLoading ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
}
