"use client";

import { useState } from "react";
import { Button } from "~/components/ui/Button";
import { Input } from "~/components/ui/Input";
import { ImageUpload } from "~/components/ui/ImageUpload";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";

interface PriceVariant {
  guestCount: number;
  price: number;
}

interface RoomCategoryFormData {
  name: string;
  description: string;
  maxGuests: number;
  totalRooms: number;
  amenities: string[];
  images: string[];
  prices: PriceVariant[];
}

interface RoomCategoryFormProps {
  initialData?: Partial<RoomCategoryFormData>;
  onSubmit: (data: RoomCategoryFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function RoomCategoryForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: RoomCategoryFormProps) {
  const [formData, setFormData] = useState<RoomCategoryFormData>({
    name: initialData?.name || "",
    description: initialData?.description || "",
    maxGuests: initialData?.maxGuests || 2,
    totalRooms: initialData?.totalRooms || 1,
    amenities: initialData?.amenities || [],
    images: initialData?.images || [],
    prices: initialData?.prices || [{ guestCount: 1, price: 0 }],
  });

  const [amenityInput, setAmenityInput] = useState("");

  const handleAddAmenity = () => {
    if (amenityInput.trim()) {
      setFormData({
        ...formData,
        amenities: [...formData.amenities, amenityInput.trim()],
      });
      setAmenityInput("");
    }
  };

  const handleRemoveAmenity = (index: number) => {
    setFormData({
      ...formData,
      amenities: formData.amenities.filter((_, i) => i !== index),
    });
  };

  const handleAddPriceVariant = () => {
    const nextGuestCount = Math.max(...formData.prices.map(p => p.guestCount), 0) + 1;
    setFormData({
      ...formData,
      prices: [...formData.prices, { guestCount: nextGuestCount, price: 0 }],
    });
  };

  const handleRemovePriceVariant = (index: number) => {
    if (formData.prices.length > 1) {
      setFormData({
        ...formData,
        prices: formData.prices.filter((_, i) => i !== index),
      });
    }
  };

  const handlePriceChange = (index: number, field: keyof PriceVariant, value: number) => {
    const updatedPrices = [...formData.prices];
    updatedPrices[index] = { ...updatedPrices[index]!, [field]: value };
    setFormData({ ...formData, prices: updatedPrices });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>বেসিক তথ্য / Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="রুম ক্যাটাগরি নাম / Room Category Name"
            placeholder="e.g., Budget, Luxury, President"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              বর্ণনা / Description
            </label>
            <textarea
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="রুম সম্পর্কে বিস্তারিত লিখুন..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="সর্বোচ্চ অতিথি / Maximum Guests"
              type="number"
              min="1"
              required
              value={formData.maxGuests}
              onChange={(e) =>
                setFormData({ ...formData, maxGuests: parseInt(e.target.value) })
              }
            />

            <Input
              label="মোট রুম সংখ্যা / Total Rooms"
              type="number"
              min="1"
              required
              value={formData.totalRooms}
              onChange={(e) =>
                setFormData({ ...formData, totalRooms: parseInt(e.target.value) })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Dynamic Pricing */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>মূল্য নির্ধারণ / Pricing (BDT)</CardTitle>
            <Button
              type="button"
              size="sm"
              onClick={handleAddPriceVariant}
            >
              + মূল্য যোগ করুন / Add Price
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {formData.prices.map((price, index) => (
            <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-md">
              <div className="flex-1">
                <Input
                  label="অতিথি সংখ্যা / Guest Count"
                  type="number"
                  min="1"
                  required
                  value={price.guestCount}
                  onChange={(e) =>
                    handlePriceChange(index, "guestCount", parseInt(e.target.value))
                  }
                />
              </div>
              <div className="flex-1">
                <Input
                  label="মূল্য (BDT) / Price (BDT)"
                  type="number"
                  min="0"
                  required
                  value={price.price}
                  onChange={(e) =>
                    handlePriceChange(index, "price", parseFloat(e.target.value))
                  }
                />
              </div>
              {formData.prices.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemovePriceVariant(index)}
                  className="mt-6"
                >
                  ✕
                </Button>
              )}
            </div>
          ))}
          <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md">
            💡 <strong>টিপস:</strong> প্রতিটি অতিথি সংখ্যার জন্য আলাদা মূল্য নির্ধারণ করুন।
            যেমন: ১ জন → ২৫০০ টাকা, ২ জন → ২৯৯৯ টাকা, ৩ জন → ৩৫০০ টাকা।
          </div>
        </CardContent>
      </Card>

      {/* Amenities */}
      <Card>
        <CardHeader>
          <CardTitle>সুবিধাসমূহ / Amenities</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="সুবিধা যোগ করুন (যেমন: WiFi, AC, TV)"
              value={amenityInput}
              onChange={(e) => setAmenityInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddAmenity();
                }
              }}
            />
            <Button type="button" onClick={handleAddAmenity}>
              যোগ করুন
            </Button>
          </div>

          {formData.amenities.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.amenities.map((amenity, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                >
                  {amenity}
                  <button
                    type="button"
                    onClick={() => handleRemoveAmenity(index)}
                    className="hover:text-blue-600"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Images */}
      <Card>
        <CardHeader>
          <CardTitle>রুমের ছবি / Room Images</CardTitle>
        </CardHeader>
        <CardContent>
          <ImageUpload
            value={formData.images}
            onChange={(images) => setFormData({ ...formData, images })}
            folder="room-categories"
          />
          <p className="text-sm text-gray-600 mt-2">
            এই ক্যাটাগরির রুমের ছবি আপলোড করুন (সর্বোচ্চ ১০টি)
          </p>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1"
          disabled={isLoading}
        >
          বাতিল করুন / Cancel
        </Button>
        <Button
          type="submit"
          className="flex-1"
          isLoading={isLoading}
        >
          সংরক্ষণ করুন / Save
        </Button>
      </div>
    </form>
  );
}
