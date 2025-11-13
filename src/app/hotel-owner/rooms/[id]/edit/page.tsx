'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '~/utils/trpc';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { ImageUpload } from '~/components/ui/ImageUpload';

interface PriceRow {
  guestCount: number;
  price: number;
}

export default function EditRoomCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const roomCategoryId = params.id as string;

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [maxGuests, setMaxGuests] = useState(2);
  const [totalRooms, setTotalRooms] = useState(1);
  const [images, setImages] = useState<string[]>([]);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [amenityInput, setAmenityInput] = useState('');
  const [prices, setPrices] = useState<PriceRow[]>([
    { guestCount: 1, price: 0 },
  ]);

  // Fetch hotel data
  const { data: hotel, isLoading } = api.hotelOwner.getMyHotel.useQuery();

  // Find the category from hotel data
  const category = hotel?.roomCategories?.find(c => c.id === roomCategoryId);

  // Load existing data into form
  useEffect(() => {
    if (category) {
      setName(category.name);
      setDescription(category.description || '');
      setMaxGuests(category.maxGuests);
      setTotalRooms(category.totalRooms);
      setImages(category.images || []);
      setAmenities(category.amenities || []);
      
      if (category.prices && category.prices.length > 0) {
        setPrices(
          category.prices.map(p => ({
            guestCount: p.guestCount,
            price: p.price,
          }))
        );
      }
    }
  }, [category]);

  // Update mutation
  const updateMutation = api.hotelOwner.updateRoomCategory.useMutation({
    onSuccess: () => {
      toast.success('Room category updated successfully!');
      router.push('/hotel-owner/rooms');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update room category');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!name.trim()) {
      toast.error('Please enter room category name');
      return;
    }

    if (maxGuests < 1) {
      toast.error('Max guests must be at least 1');
      return;
    }

    if (totalRooms < 1) {
      toast.error('Total rooms must be at least 1');
      return;
    }

    // Validate prices
    const validPrices = prices.filter(p => p.price > 0);
    if (validPrices.length === 0) {
      toast.error('Please add at least one price');
      return;
    }

    // Check for duplicate guest counts
    const guestCounts = validPrices.map(p => p.guestCount);
    const uniqueCounts = new Set(guestCounts);
    if (guestCounts.length !== uniqueCounts.size) {
      toast.error('Duplicate guest counts found. Each guest count should be unique.');
      return;
    }

    updateMutation.mutate({
      roomCategoryId,
      name: name.trim(),
      description: description.trim() || undefined,
      maxGuests,
      totalRooms,
      images,
      amenities,
      prices: validPrices,
    });
  };

  const addPriceRow = () => {
    const maxCount = prices.length > 0 ? Math.max(...prices.map(p => p.guestCount)) : 0;
    setPrices([...prices, { guestCount: maxCount + 1, price: 0 }]);
  };

  const removePriceRow = (index: number) => {
    if (prices.length > 1) {
      setPrices(prices.filter((_, i) => i !== index));
    }
  };

  const updatePrice = (index: number, field: keyof PriceRow, value: number) => {
    const newPrices = [...prices];
    newPrices[index] = { ...newPrices[index]!, [field]: value };
    setPrices(newPrices);
  };

  const addAmenity = () => {
    if (amenityInput.trim() && !amenities.includes(amenityInput.trim())) {
      setAmenities([...amenities, amenityInput.trim()]);
      setAmenityInput('');
    }
  };

  const removeAmenity = (amenity: string) => {
    setAmenities(amenities.filter(a => a !== amenity));
  };

  // Common amenities for quick add
  const commonAmenities = [
    'Wi-Fi', 'AC', 'TV', 'Mini Bar', 'Room Service',
    'Balcony', 'Sea View', 'City View', 'Attached Bathroom',
    'Hot Water', 'Toiletries', 'Hair Dryer', 'Safe Box'
  ];

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="text-gray-600">Loading room category...</p>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Room category not found.</p>
          <Link
            href="/hotel-owner/rooms"
            className="mt-4 inline-block text-blue-600 hover:underline"
          >
            Back to Rooms
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Edit Room Category</h1>
          <p className="mt-1 text-sm text-gray-600">
            Update room category details, pricing and amenities
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Basic Information</h2>
            
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Budget Room, Luxury Suite, Presidential Suite"
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the room category, its features, and what makes it special..."
                  rows={4}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Max Guests and Total Rooms */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="maxGuests" className="block text-sm font-medium text-gray-700">
                    Max Guests <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="maxGuests"
                    value={maxGuests}
                    onChange={(e) => setMaxGuests(parseInt(e.target.value) || 1)}
                    min="1"
                    max="10"
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="totalRooms" className="block text-sm font-medium text-gray-700">
                    Total Rooms <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="totalRooms"
                    value={totalRooms}
                    onChange={(e) => setTotalRooms(parseInt(e.target.value) || 1)}
                    min="1"
                    max="100"
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Current available: {category.availableRooms} rooms
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Matrix */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Pricing by Guest Count</h2>
                <p className="text-sm text-gray-600">Set different prices based on number of guests</p>
              </div>
              <button
                type="button"
                onClick={addPriceRow}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Add Price
              </button>
            </div>

            <div className="space-y-3">
              {prices.map((price, index) => (
                <div key={index} className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-700">Guest Count</label>
                    <input
                      type="number"
                      value={price.guestCount}
                      onChange={(e) => updatePrice(index, 'guestCount', parseInt(e.target.value) || 1)}
                      min="1"
                      max={maxGuests}
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-700">Price (BDT)</label>
                    <input
                      type="number"
                      value={price.price}
                      onChange={(e) => updatePrice(index, 'price', parseInt(e.target.value) || 0)}
                      min="0"
                      step="100"
                      placeholder="2500"
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  {prices.length > 1 && (
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => removePriceRow(index)}
                        className="rounded-lg border border-red-300 bg-white p-2 text-red-600 hover:bg-red-50"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Example */}
            <div className="mt-4 rounded-lg bg-blue-50 p-3">
              <p className="text-xs font-medium text-blue-900">💡 Example:</p>
              <p className="text-xs text-blue-700">
                1 person = ৳2,500 | 2 persons = ৳2,999 | 3 persons = ৳3,500
              </p>
            </div>
          </div>

          {/* Amenities */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Amenities</h2>

            {/* Quick Add */}
            <div className="mb-4">
              <p className="mb-2 text-sm font-medium text-gray-700">Quick Add:</p>
              <div className="flex flex-wrap gap-2">
                {commonAmenities.map((amenity) => (
                  <button
                    key={amenity}
                    type="button"
                    onClick={() => {
                      if (!amenities.includes(amenity)) {
                        setAmenities([...amenities, amenity]);
                      }
                    }}
                    disabled={amenities.includes(amenity)}
                    className="rounded-full border border-gray-300 bg-white px-3 py-1 text-xs hover:bg-gray-50 disabled:opacity-50"
                  >
                    {amenity}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Add */}
            <div className="flex gap-2">
              <input
                type="text"
                value={amenityInput}
                onChange={(e) => setAmenityInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAmenity())}
                placeholder="Add custom amenity..."
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={addAmenity}
                className="rounded-lg bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
              >
                Add
              </button>
            </div>

            {/* Selected Amenities */}
            {amenities.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-sm font-medium text-gray-700">Selected Amenities:</p>
                <div className="flex flex-wrap gap-2">
                  {amenities.map((amenity) => (
                    <span
                      key={amenity}
                      className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800"
                    >
                      {amenity}
                      <button
                        type="button"
                        onClick={() => removeAmenity(amenity)}
                        className="ml-1 hover:text-blue-600"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Images */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Room Images</h2>
            <p className="mb-4 text-sm text-gray-600">
              Upload high-quality images of this room category
            </p>
            <ImageUpload
              value={images}
              onChange={setImages}
              maxImages={10}
              folder="room-categories"
              showCompressionStats
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={updateMutation.isLoading}
              className="flex-1 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {updateMutation.isLoading ? 'Updating...' : 'Update Room Category'}
            </button>
            <Link
              href="/hotel-owner/rooms"
              className="flex-1 rounded-lg border border-gray-300 bg-white px-6 py-3 text-center text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
