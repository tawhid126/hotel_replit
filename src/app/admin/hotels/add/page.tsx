'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '~/utils/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/Card';
import { Button } from '~/components/ui/Button';
import { Input } from '~/components/ui/Input';
import { ImageUpload } from '~/components/ui/ImageUpload';
import { RoomCategoryForm } from '~/components/hotel/RoomCategoryForm';
import { Modal } from '~/components/ui/Modal';
import toast from 'react-hot-toast';

type Step = 'hotel-info' | 'credentials' | 'room-categories';

export default function AddHotelPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>('hotel-info');
  const [createdHotelId, setCreatedHotelId] = useState<string | null>(null);
  const [ownerCredentials, setOwnerCredentials] = useState<{
    email: string;
    password: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    country: 'Bangladesh',
    latitude: 23.8103, // Default Dhaka
    longitude: 90.4125,
    images: [] as string[],
    facilities: [] as string[],
    ownerName: '',
    ownerEmail: '',
    ownerPhone: '',
  });

  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);

  const availableFacilities = [
    'WiFi',
    'Parking',
    'Swimming Pool',
    'Gym',
    'Restaurant',
    'Room Service',
    'Air Conditioning',
    'Spa',
    'Bar',
    'Conference Room',
    'Laundry',
    '24/7 Reception',
  ];

  const createHotelMutation = api.admin.createHotel.useMutation({
    onSuccess: (data) => {
      toast.success('Hotel created successfully!');
      setCreatedHotelId(data.hotel.id);
      setOwnerCredentials(data.ownerCredentials);
      setCurrentStep('credentials');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create hotel');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.ownerName || !formData.ownerEmail) {
      toast.error('Please fill all required fields');
      return;
    }

    if (formData.images.length === 0) {
      toast.error('Please upload at least one hotel image');
      return;
    }

    createHotelMutation.mutate({
      ...formData,
      facilities: selectedFacilities,
    });
  };

  const handleFacilityToggle = (facility: string) => {
    setSelectedFacilities((prev) =>
      prev.includes(facility)
        ? prev.filter((f) => f !== facility)
        : [...prev, facility]
    );
  };

  if (currentStep === 'credentials' && ownerCredentials) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto max-w-2xl px-4">
          <Card className="border-2 border-green-500">
            <CardHeader className="bg-green-50">
              <CardTitle className="flex items-center gap-2 text-green-700">
                <span className="text-2xl">✅</span>
                Hotel Created Successfully! (Step 1/2)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {/* Warning Message */}
              <div className="rounded-lg bg-red-50 border-2 border-red-500 p-4">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">⚠️</span>
                  <div>
                    <h3 className="font-bold text-red-900 text-lg mb-2">
                      IMPORTANT: Save These Credentials!
                    </h3>
                    <p className="text-red-800 text-sm">
                      এই credentials শুধুমাত্র এক বার দেখানো হচ্ছে। Hotel owner কে এই তথ্য দিয়ে দিন।
                      এটি আর কখনো দেখাবে না!
                    </p>
                  </div>
                </div>
              </div>

              {/* Credentials Display */}
              <div className="space-y-4">
                <div className="bg-blue-50 rounded-lg p-6 border-2 border-blue-300">
                  <h4 className="font-bold text-blue-900 mb-4 text-lg">
                    🔐 Hotel Owner Login Credentials
                  </h4>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address (লগইন ID)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={ownerCredentials.email}
                          readOnly
                          className="flex-1 px-4 py-3 bg-white border-2 border-blue-300 rounded-lg font-mono text-lg"
                        />
                        <Button
                          onClick={() => {
                            navigator.clipboard.writeText(ownerCredentials.email);
                            toast.success('Email copied!');
                          }}
                          className="bg-blue-600"
                        >
                          Copy
                        </Button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Password (পাসওয়ার্ড)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={ownerCredentials.password}
                          readOnly
                          className="flex-1 px-4 py-3 bg-white border-2 border-blue-300 rounded-lg font-mono text-lg"
                        />
                        <Button
                          onClick={() => {
                            navigator.clipboard.writeText(ownerCredentials.password);
                            toast.success('Password copied!');
                          }}
                          className="bg-blue-600"
                        >
                          Copy
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Instructions */}
                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-300">
                  <h5 className="font-semibold text-yellow-900 mb-2">
                    📝 Hotel Owner কে যা বলবেন:
                  </h5>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-yellow-800">
                    <li>
                      Login page এ যান: <code className="bg-yellow-100 px-2 py-1 rounded">/auth/signin</code>
                    </li>
                    <li>উপরের Email এবং Password দিয়ে login করুন</li>
                    <li>Login করার পর আপনার hotel dashboard দেখতে পাবেন</li>
                    <li>এখান থেকে room categories add করতে পারবেন</li>
                    <li>প্রথম login এর পর password change করে নিন (Settings থেকে)</li>
                  </ol>
                </div>

                {/* Copy All Button */}
                <Button
                  onClick={() => {
                    const text = `Hotel Owner Login Credentials\n\nEmail: ${ownerCredentials.email}\nPassword: ${ownerCredentials.password}\n\nLogin URL: ${window.location.origin}/auth/signin`;
                    navigator.clipboard.writeText(text);
                    toast.success('All credentials copied!');
                  }}
                  className="w-full bg-green-600 text-white text-lg py-3"
                >
                  📋 Copy All Information
                </Button>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => router.push('/admin/hotels')}
                    className="flex-1 bg-gray-600"
                  >
                    Finish & View All Hotels
                  </Button>
                  <Button
                    onClick={() => setCurrentStep('room-categories')}
                    className="flex-1 bg-blue-600"
                  >
                    Next: Add Room Categories →
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Step 3: Add Room Categories
  if (currentStep === 'room-categories' && createdHotelId) {
    return <AddRoomCategoriesStep hotelId={createdHotelId} onComplete={() => router.push('/admin/hotels')} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto max-w-4xl px-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Add New Hotel</CardTitle>
            <p className="text-gray-600 mt-2">
              নতুন hotel add করুন এবং automatic hotel owner account তৈরি হবে
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Hotel Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  🏨 Hotel Information
                </h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hotel Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Hotel Paradise"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Hotel সম্পর্কে বিস্তারিত লিখুন..."
                    required
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Full address"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="e.g., Dhaka"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Latitude
                    </label>
                    <Input
                      type="number"
                      step="any"
                      value={formData.latitude}
                      onChange={(e) =>
                        setFormData({ ...formData, latitude: parseFloat(e.target.value) })
                      }
                      placeholder="23.8103"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Longitude
                    </label>
                    <Input
                      type="number"
                      step="any"
                      value={formData.longitude}
                      onChange={(e) =>
                        setFormData({ ...formData, longitude: parseFloat(e.target.value) })
                      }
                      placeholder="90.4125"
                    />
                  </div>
                </div>
              </div>

              {/* Hotel Images */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  📸 Hotel Images
                </h3>
                <ImageUpload
                  value={formData.images}
                  onChange={(images) => setFormData({ ...formData, images })}
                  folder="hotels"
                />
              </div>

              {/* Facilities */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  ✨ Hotel Facilities
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {availableFacilities.map((facility) => (
                    <label
                      key={facility}
                      className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedFacilities.includes(facility)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedFacilities.includes(facility)}
                        onChange={() => handleFacilityToggle(facility)}
                        className="rounded text-blue-600"
                      />
                      <span className="text-sm font-medium">{facility}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Owner Information */}
              <div className="space-y-4 bg-yellow-50 p-6 rounded-lg border-2 border-yellow-300">
                <h3 className="text-lg font-semibold text-gray-900 border-b border-yellow-300 pb-2">
                  👤 Hotel Owner Information
                </h3>
                <p className="text-sm text-yellow-800">
                  System automatically একটি secure password তৈরি করবে এবং owner কে credentials দেখাবে
                </p>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Owner Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    value={formData.ownerName}
                    onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                    placeholder="Owner এর নাম"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Owner Email (Login ID) <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="email"
                      value={formData.ownerEmail}
                      onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
                      placeholder="owner@example.com"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Owner Phone (Optional)
                    </label>
                    <Input
                      type="tel"
                      value={formData.ownerPhone}
                      onChange={(e) => setFormData({ ...formData, ownerPhone: e.target.value })}
                      placeholder="+880 1XXX-XXXXXX"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  onClick={() => router.back()}
                  variant="outline"
                  className="flex-1"
                  disabled={createHotelMutation.isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white"
                  isLoading={createHotelMutation.isLoading}
                  disabled={createHotelMutation.isLoading}
                >
                  {createHotelMutation.isLoading ? 'Creating...' : 'Create Hotel & Owner Account'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Component for adding room categories after hotel creation
function AddRoomCategoriesStep({ hotelId, onComplete }: { hotelId: string; onComplete: () => void }) {
  const [roomCategories, setRoomCategories] = useState<any[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);

  const { data: categories, refetch } = api.admin.getRoomCategories.useQuery({ hotelId });
  const createRoomCategory = api.admin.createRoomCategory.useMutation();
  const updateRoomCategory = api.admin.updateRoomCategory.useMutation();
  const deleteRoomCategory = api.admin.deleteRoomCategory.useMutation();

  const handleCreateCategory = async (data: any) => {
    try {
      await createRoomCategory.mutateAsync({
        hotelId,
        ...data,
      });
      toast.success('Room category added!');
      setIsAddModalOpen(false);
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create room category');
    }
  };

  const handleUpdateCategory = async (data: any) => {
    if (!selectedCategory) return;
    
    try {
      await updateRoomCategory.mutateAsync({
        roomCategoryId: selectedCategory.id,
        ...data,
      });
      toast.success('Room category updated!');
      setSelectedCategory(null);
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update room category');
    }
  };

  const handleDeleteCategory = async (roomCategoryId: string) => {
    if (!confirm('Delete this room category?')) return;

    try {
      await deleteRoomCategory.mutateAsync({ roomCategoryId });
      toast.success('Room category deleted!');
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete room category');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto max-w-6xl px-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Add Room Categories (Step 2/2)</CardTitle>
                <p className="text-gray-600 mt-2">
                  রুম ক্যাটাগরি যোগ করুন (Budget, Luxury, President, etc.)
                </p>
              </div>
              <Button onClick={() => setIsAddModalOpen(true)}>
                + Add Room Category
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {categories && categories.length === 0 ? (
              <div className="text-center py-12 bg-blue-50 rounded-lg">
                <p className="text-gray-600 mb-4">
                  এখনো কোনো রুম ক্যাটাগরি যোগ করা হয়নি।
                </p>
                <Button onClick={() => setIsAddModalOpen(true)}>
                  Add First Room Category
                </Button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                  {categories?.map((category: any) => (
                    <Card key={category.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <CardTitle className="text-lg">{category.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Max Guests:</span>
                            <span className="font-medium">{category.maxGuests}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Total Rooms:</span>
                            <span className="font-medium">{category.totalRooms}</span>
                          </div>
                        </div>

                        <div className="border-t pt-3 mb-4">
                          <p className="text-sm font-medium mb-2">Prices:</p>
                          {category.prices.map((price: any) => (
                            <div key={price.id} className="flex justify-between text-sm">
                              <span>{price.guestCount} person(s):</span>
                              <span className="font-medium">৳{price.price}</span>
                            </div>
                          ))}
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => setSelectedCategory(category)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 text-red-600"
                            onClick={() => handleDeleteCategory(category.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setIsAddModalOpen(true)}
                  >
                    + Add More Categories
                  </Button>
                  <Button
                    onClick={onComplete}
                    className="bg-green-600"
                  >
                    Finish & View All Hotels
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Add Category Modal */}
        <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} size="lg">
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">Add Room Category</h2>
            <RoomCategoryForm
              onSubmit={handleCreateCategory}
              onCancel={() => setIsAddModalOpen(false)}
              isLoading={createRoomCategory.isLoading}
            />
          </div>
        </Modal>

        {/* Edit Category Modal */}
        <Modal isOpen={!!selectedCategory} onClose={() => setSelectedCategory(null)} size="lg">
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">Edit Room Category</h2>
            {selectedCategory && (
              <RoomCategoryForm
                initialData={selectedCategory}
                onSubmit={handleUpdateCategory}
                onCancel={() => setSelectedCategory(null)}
                isLoading={updateRoomCategory.isLoading}
              />
            )}
          </div>
        </Modal>
      </div>
    </div>
  );
}
