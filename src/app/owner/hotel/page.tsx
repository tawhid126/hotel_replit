'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/Card';
import { Button } from '~/components/ui/Button';
import { Input } from '~/components/ui/Input';
import { ImageUpload } from '~/components/ui/ImageUpload';
import { api } from '~/utils/trpc';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';

export default function OwnerHotelPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [isEditing, setIsEditing] = useState(false);
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

  // Fetch owner's hotel
  const { data: hotels, isLoading, refetch } = api.hotel.getAll.useQuery({
    page: 1,
    limit: 1,
  });

  // Get the owner's hotel (filter by ownerId)
  const myHotel = hotels?.hotels?.find((h: any) => h.ownerId === session?.user?.id);

  // Initialize form when hotel data loads
  useEffect(() => {
    if (myHotel) {
      setFormData({
        name: myHotel.name,
        description: myHotel.description,
        address: myHotel.address,
        city: myHotel.city,
        country: myHotel.country || 'Bangladesh',
        latitude: myHotel.latitude.toString(),
        longitude: myHotel.longitude.toString(),
        facilities: myHotel.facilities?.join(', ') || '',
      });
      setImages(myHotel.images || []);
    }
  }, [myHotel]);

  const updateHotel = api.hotel.update.useMutation({
    onSuccess: () => {
      refetch();
      setIsEditing(false);
      alert('Hotel updated successfully!');
    },
    onError: (error) => {
      alert('Failed to update hotel: ' + error.message);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!myHotel) {
      alert('Hotel not found');
      return;
    }

    if (images.length === 0) {
      alert('Please upload at least one hotel image');
      return;
    }

    const facilitiesArray = formData.facilities
      .split(',')
      .map((f) => f.trim())
      .filter(Boolean);

    updateHotel.mutate({
      id: myHotel.id,
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

  if (!myHotel) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>No Hotel Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-gray-600">
              You don't have a hotel assigned yet. Please contact the administrator to set up your hotel.
            </p>
            <Link href="/owner" className="text-blue-600 hover:underline">
              Back to Dashboard
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">My Hotel</h1>
            <p className="mt-2 text-gray-600">Manage your hotel information</p>
          </div>
          {!isEditing && (
            <Button onClick={() => setIsEditing(true)}>
              <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Hotel
            </Button>
          )}
        </div>

        {!isEditing ? (
          // View Mode
          <div className="space-y-6">
            {/* Images Gallery */}
            <Card>
              <CardHeader>
                <CardTitle>Hotel Images</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                  {myHotel.images?.map((image: string, index: number) => (
                    <div key={index} className="relative aspect-video overflow-hidden rounded-lg">
                      <Image
                        src={image}
                        alt={`${myHotel.name} - ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                      {index === 0 && (
                        <div className="absolute left-2 top-2 rounded-md bg-blue-600 px-2 py-1 text-xs font-semibold text-white">
                          Cover Photo
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Basic Info */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Hotel Name</p>
                    <p className="text-lg font-semibold text-gray-900">{myHotel.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Description</p>
                    <p className="text-gray-700">{myHotel.description}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Rating</p>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-yellow-600">
                        ⭐ {myHotel.rating ? myHotel.rating.toFixed(1) : 'N/A'}
                      </span>
                      <span className="text-sm text-gray-600">
                        ({myHotel.totalReviews || 0} reviews)
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Location</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Address</p>
                    <p className="text-gray-900">{myHotel.address}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">City</p>
                      <p className="text-gray-900">{myHotel.city}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Country</p>
                      <p className="text-gray-900">{myHotel.country}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Latitude</p>
                      <p className="text-gray-900">{myHotel.latitude}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Longitude</p>
                      <p className="text-gray-900">{myHotel.longitude}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Facilities */}
            <Card>
              <CardHeader>
                <CardTitle>Facilities & Amenities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {myHotel.facilities?.map((facility: string) => (
                    <span
                      key={facility}
                      className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800"
                    >
                      {facility}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Total Bookings</p>
                    <p className="mt-2 text-3xl font-bold text-blue-600">
                      {myHotel._count?.bookings || 0}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Room Categories</p>
                    <p className="mt-2 text-3xl font-bold text-purple-600">
                      {myHotel._count?.roomCategories || 0}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Total Reviews</p>
                    <p className="mt-2 text-3xl font-bold text-green-600">
                      {myHotel.totalReviews || 0}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          // Edit Mode
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
                    placeholder="Describe your hotel..."
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
                  placeholder="123 Main Street"
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
                  folder={myHotel ? `hotels/${myHotel.id}` : 'hotels'}
                  showCompressionStats={true}
                />
                <p className="mt-2 text-sm text-gray-500">
                  Upload up to 10 images. First image will be the cover photo.
                </p>
              </CardContent>
            </Card>

            {/* Facilities */}
            <Card>
              <CardHeader>
                <CardTitle>Facilities & Amenities</CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  label="Facilities (comma-separated)"
                  value={formData.facilities}
                  onChange={(e) => setFormData({ ...formData, facilities: e.target.value })}
                  placeholder="WiFi, Parking, Pool, Gym, Restaurant"
                />
              </CardContent>
            </Card>

            {/* Submit Buttons */}
            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  // Reset form to original values
                  if (myHotel) {
                    setFormData({
                      name: myHotel.name,
                      description: myHotel.description,
                      address: myHotel.address,
                      city: myHotel.city,
                      country: myHotel.country || 'Bangladesh',
                      latitude: myHotel.latitude.toString(),
                      longitude: myHotel.longitude.toString(),
                      facilities: myHotel.facilities?.join(', ') || '',
                    });
                    setImages(myHotel.images || []);
                  }
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" isLoading={updateHotel.isLoading}>
                Save Changes
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
