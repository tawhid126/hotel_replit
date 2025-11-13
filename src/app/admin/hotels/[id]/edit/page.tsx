'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/Card';
import { Button } from '~/components/ui/Button';
import { Input } from '~/components/ui/Input';
import { ImageUpload } from '~/components/ui/ImageUpload';
import { api } from '~/utils/trpc';

export default function EditHotelPage() {
  const router = useRouter();
  const params = useParams();
  const hotelId = params.id as string;

  const [images, setImages] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    country: '',
    latitude: '',
    longitude: '',
    facilities: '',
  });

  // Fetch hotel data
  const { data: hotel, isLoading } = api.hotel.getById.useQuery({ id: hotelId });

  // Initialize form when hotel data loads
  useEffect(() => {
    if (hotel) {
      setFormData({
        name: hotel.name,
        description: hotel.description,
        address: hotel.address,
        city: hotel.city,
        country: hotel.country || 'Bangladesh',
        latitude: hotel.latitude.toString(),
        longitude: hotel.longitude.toString(),
        facilities: hotel.facilities?.join(', ') || '',
      });
      setImages(hotel.images || []);
    }
  }, [hotel]);

  const updateHotel = api.hotel.update.useMutation({
    onSuccess: () => {
      alert('Hotel updated successfully!');
      router.push('/admin/hotels');
    },
    onError: (error) => {
      alert('Failed to update hotel: ' + error.message);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (images.length === 0) {
      alert('Please upload at least one hotel image');
      return;
    }

    const facilitiesArray = formData.facilities
      .split(',')
      .map((f) => f.trim())
      .filter(Boolean);

    updateHotel.mutate({
      id: hotelId,
      name: formData.name,
      description: formData.description,
      address: formData.address,
      city: formData.city,
      country: formData.country,
      latitude: parseFloat(formData.latitude),
      longitude: parseFloat(formData.longitude),
      images,
      facilities: facilitiesArray,
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Hotel not found</h2>
          <Button onClick={() => router.push('/admin/hotels')} className="mt-4">
            Back to Hotels
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="mb-4 flex items-center text-gray-600 hover:text-gray-900"
          >
            <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Hotels
          </button>
          <h1 className="text-4xl font-bold text-gray-900">Edit Hotel</h1>
          <p className="mt-2 text-gray-600">Update hotel information</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Hotel Name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Grand Plaza Hotel"
              />

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Description <span className="text-red-600">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the hotel, its unique features, and what makes it special..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle>Location Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Address"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="123 Main Street, Gulshan"
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="City"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Dhaka"
                />
                <Input
                  label="Country"
                  required
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  placeholder="Bangladesh"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Latitude"
                  type="number"
                  step="any"
                  required
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                  placeholder="23.7808"
                />
                <Input
                  label="Longitude"
                  type="number"
                  step="any"
                  required
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                  placeholder="90.4203"
                />
              </div>
              <p className="text-sm text-gray-500">
                💡 Tip: Use Google Maps to find exact coordinates
              </p>
            </CardContent>
          </Card>

          {/* Hotel Images */}
          <Card>
            <CardHeader>
              <CardTitle>Hotel Images</CardTitle>
            </CardHeader>
            <CardContent>
              <ImageUpload
                value={images}
                onChange={setImages}
                maxImages={10}
              />
              <p className="mt-2 text-sm text-gray-500">
                Upload up to 10 images. First image will be the cover photo.
              </p>
            </CardContent>
          </Card>

          {/* Facilities & Amenities */}
          <Card>
            <CardHeader>
              <CardTitle>Facilities & Amenities</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Facilities (comma-separated)
                </label>
                <Input
                  value={formData.facilities}
                  onChange={(e) => setFormData({ ...formData, facilities: e.target.value })}
                  placeholder="WiFi, Parking, Pool, Gym, Restaurant, Room Service"
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Buttons */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              isLoading={updateHotel.isLoading}
            >
              Update Hotel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
