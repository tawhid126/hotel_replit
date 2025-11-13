'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/Card';
import { Button } from '~/components/ui/Button';
import { Input } from '~/components/ui/Input';
import { ImageUpload } from '~/components/ui/ImageUpload';
import { api } from '~/utils/trpc';

export default function AddHotelPage() {
  const router = useRouter();
  const [images, setImages] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    country: '',
    zipCode: '',
    latitude: '',
    longitude: '',
    phone: '',
    email: '',
    facilities: '',
    policies: '',
    checkInTime: '14:00',
    checkOutTime: '12:00',
    ownerId: '',
  });

  const createHotel = api.hotel.create.useMutation({
    onSuccess: () => {
      alert('Hotel created successfully!');
      router.push('/admin/hotels');
    },
    onError: (error) => {
      alert('Failed to create hotel: ' + error.message);
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

    const policiesArray = formData.policies
      .split('\n')
      .map((p) => p.trim())
      .filter(Boolean);

    createHotel.mutate({
      name: formData.name,
      description: formData.description,
      address: formData.address,
      city: formData.city,
      country: formData.country,
      latitude: parseFloat(formData.latitude),
      longitude: parseFloat(formData.longitude),
      images,
      facilities: facilitiesArray,
      ownerId: formData.ownerId,
    });
  };

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
          <h1 className="text-4xl font-bold text-gray-900">Add New Hotel</h1>
          <p className="mt-2 text-gray-600">Fill in the details to create a new hotel</p>
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

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+880 1234 567890"
                />
                <Input
                  label="Email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contact@hotel.com"
                />
              </div>

              <Input
                label="Owner ID"
                required
                value={formData.ownerId}
                onChange={(e) => setFormData({ ...formData, ownerId: e.target.value })}
                placeholder="User ID of the hotel owner"
              />
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

              <div className="grid grid-cols-3 gap-4">
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
                <Input
                  label="Zip Code"
                  required
                  value={formData.zipCode}
                  onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                  placeholder="1212"
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
                folder="hotels"
                showCompressionStats={true}
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

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Check-in Time"
                  type="time"
                  required
                  value={formData.checkInTime}
                  onChange={(e) => setFormData({ ...formData, checkInTime: e.target.value })}
                />
                <Input
                  label="Check-out Time"
                  type="time"
                  required
                  value={formData.checkOutTime}
                  onChange={(e) => setFormData({ ...formData, checkOutTime: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Policies */}
          <Card>
            <CardHeader>
              <CardTitle>Hotel Policies</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Policies (one per line)
                </label>
                <textarea
                  rows={6}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.policies}
                  onChange={(e) => setFormData({ ...formData, policies: e.target.value })}
                  placeholder="Pets are not allowed&#10;Smoking is prohibited in all rooms&#10;Valid ID required at check-in&#10;Minimum age to check-in is 18 years"
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
              isLoading={createHotel.isLoading}
            >
              Create Hotel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
