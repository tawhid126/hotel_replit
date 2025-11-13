"use client";

import { useState } from "react";
import { api } from "~/utils/trpc";
import { Button } from "~/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import { Input } from "~/components/ui/Input";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

type CouponFormData = {
  code: string;
  description: string;
  discount: number;
  isPercentage: boolean;
  minAmount: number | null;
  maxDiscount: number | null;
  validFrom: string;
  validTo: string;
  usageLimit: number | null;
};

export default function AdminCouponsPage() {
  const router = useRouter();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<string | null>(null);
  const [formData, setFormData] = useState<CouponFormData>({
    code: "",
    description: "",
    discount: 0,
    isPercentage: true,
    minAmount: null,
    maxDiscount: null,
    validFrom: new Date().toISOString().split("T")[0]!,
    validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]!,
    usageLimit: null,
  });

  // Fetch all coupons
  const { data: couponsData, isLoading, refetch } = api.coupon.getAll.useQuery({
    page: 1,
    limit: 100,
  });

  const coupons = couponsData?.coupons || [];

  // Create coupon mutation
  const createCoupon = api.coupon.create.useMutation({
    onSuccess: async () => {
      toast.success("Coupon created successfully!");
      await refetch();
      resetForm();
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Failed to create coupon");
    },
  });

  // Update coupon mutation
  const updateCoupon = api.coupon.update.useMutation({
    onSuccess: async () => {
      toast.success("Coupon updated successfully!");
      await refetch();
      resetForm();
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Failed to update coupon");
    },
  });

  // Delete coupon mutation
  const deleteCoupon = api.coupon.delete.useMutation({
    onSuccess: async () => {
      toast.success("Coupon deleted successfully!");
      await refetch();
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Failed to delete coupon");
    },
  });

  const resetForm = () => {
    setFormData({
      code: "",
      description: "",
      discount: 0,
      isPercentage: true,
      minAmount: null,
      maxDiscount: null,
      validFrom: new Date().toISOString().split("T")[0]!,
      validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]!,
      usageLimit: null,
    });
    setShowCreateForm(false);
    setEditingCoupon(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.code.trim()) {
      toast.error("Coupon code is required");
      return;
    }

    if (formData.discount <= 0) {
      toast.error("Discount must be greater than 0");
      return;
    }

    if (formData.isPercentage && formData.discount > 100) {
      toast.error("Percentage discount cannot exceed 100%");
      return;
    }

    const validFrom = new Date(formData.validFrom);
    const validTo = new Date(formData.validTo);

    if (validTo <= validFrom) {
      toast.error("Valid to date must be after valid from date");
      return;
    }

    if (editingCoupon) {
      // Update existing coupon
      await updateCoupon.mutateAsync({
        id: editingCoupon,
        description: formData.description || undefined,
        discount: formData.discount,
        isPercentage: formData.isPercentage,
        minAmount: formData.minAmount || undefined,
        maxDiscount: formData.maxDiscount || undefined,
        validFrom,
        validTo,
        usageLimit: formData.usageLimit || undefined,
      });
    } else {
      // Create new coupon
      await createCoupon.mutateAsync({
        code: formData.code.toUpperCase(),
        description: formData.description || undefined,
        discount: formData.discount,
        isPercentage: formData.isPercentage,
        minAmount: formData.minAmount || undefined,
        maxDiscount: formData.maxDiscount || undefined,
        validFrom,
        validTo,
        usageLimit: formData.usageLimit || undefined,
      });
    }
  };

  const handleEdit = (coupon: typeof coupons[number]) => {
    setFormData({
      code: coupon.code,
      description: coupon.description || "",
      discount: coupon.discount,
      isPercentage: coupon.isPercentage,
      minAmount: coupon.minAmount,
      maxDiscount: coupon.maxDiscount,
      validFrom: new Date(coupon.validFrom).toISOString().split("T")[0]!,
      validTo: new Date(coupon.validTo).toISOString().split("T")[0]!,
      usageLimit: coupon.usageLimit,
    });
    setEditingCoupon(coupon.id);
    setShowCreateForm(true);
  };

  const handleDelete = async (id: string, code: string) => {
    if (confirm(`Are you sure you want to delete coupon "${code}"?`)) {
      await deleteCoupon.mutateAsync({ id });
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading coupons...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Coupon Management</h1>
            <p className="text-gray-600 mt-2">Create and manage discount coupons</p>
          </div>
          <Button
            onClick={() => {
              if (showCreateForm) {
                resetForm();
              } else {
                setShowCreateForm(true);
              }
            }}
            variant={showCreateForm ? "outline" : "primary"}
          >
            {showCreateForm ? "Cancel" : "Create New Coupon"}
          </Button>
        </div>

        {/* Create/Edit Form */}
        {showCreateForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>{editingCoupon ? "Edit Coupon" : "Create New Coupon"}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Coupon Code */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Coupon Code *
                    </label>
                    <Input
                      type="text"
                      value={formData.code}
                      onChange={(e) =>
                        setFormData({ ...formData, code: e.target.value.toUpperCase() })
                      }
                      placeholder="e.g., SUMMER2024"
                      required
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <Input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="e.g., Summer Sale Discount"
                    />
                  </div>

                  {/* Discount Amount */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Discount Amount *
                    </label>
                    <Input
                      type="number"
                      value={formData.discount}
                      onChange={(e) =>
                        setFormData({ ...formData, discount: parseFloat(e.target.value) })
                      }
                      placeholder="e.g., 20"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>

                  {/* Discount Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Discount Type *
                    </label>
                    <select
                      value={formData.isPercentage ? "percentage" : "fixed"}
                      onChange={(e) =>
                        setFormData({ ...formData, isPercentage: e.target.value === "percentage" })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount (৳)</option>
                    </select>
                  </div>

                  {/* Min Amount */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Purchase Amount (৳)
                    </label>
                    <Input
                      type="number"
                      value={formData.minAmount || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          minAmount: e.target.value ? parseFloat(e.target.value) : null,
                        })
                      }
                      placeholder="e.g., 1000"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  {/* Max Discount (only for percentage) */}
                  {formData.isPercentage && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Maximum Discount Amount (৳)
                      </label>
                      <Input
                        type="number"
                        value={formData.maxDiscount || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            maxDiscount: e.target.value ? parseFloat(e.target.value) : null,
                          })
                        }
                        placeholder="e.g., 500"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  )}

                  {/* Valid From */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Valid From *
                    </label>
                    <Input
                      type="date"
                      value={formData.validFrom}
                      onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                      required
                    />
                  </div>

                  {/* Valid To */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Valid To *
                    </label>
                    <Input
                      type="date"
                      value={formData.validTo}
                      onChange={(e) => setFormData({ ...formData, validTo: e.target.value })}
                      required
                    />
                  </div>

                  {/* Usage Limit */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Usage Limit
                    </label>
                    <Input
                      type="number"
                      value={formData.usageLimit || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          usageLimit: e.target.value ? parseInt(e.target.value) : null,
                        })
                      }
                      placeholder="Unlimited if empty"
                      min="1"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex gap-3">
                  <Button
                    type="submit"
                    disabled={createCoupon.isPending || updateCoupon.isPending}
                  >
                    {createCoupon.isPending || updateCoupon.isPending
                      ? "Saving..."
                      : editingCoupon
                        ? "Update Coupon"
                        : "Create Coupon"}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Coupons List */}
        <Card>
          <CardHeader>
            <CardTitle>All Coupons ({coupons?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {!coupons || coupons.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No coupons found. Create your first coupon!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Code</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Discount</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Valid Period</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Usage</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coupons.map((coupon: any) => {
                      const now = new Date();
                      const isActive =
                        coupon.isActive &&
                        now >= new Date(coupon.validFrom) &&
                        now <= new Date(coupon.validTo) &&
                        (!coupon.usageLimit || coupon.usedCount < coupon.usageLimit);

                      return (
                        <tr key={coupon.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-semibold text-gray-900">{coupon.code}</p>
                              {coupon.description && (
                                <p className="text-sm text-gray-500">{coupon.description}</p>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-semibold text-blue-600">
                                {coupon.isPercentage
                                  ? `${coupon.discount}%`
                                  : `৳${coupon.discount}`}
                              </p>
                              {coupon.minAmount && (
                                <p className="text-xs text-gray-500">Min: ৳{coupon.minAmount}</p>
                              )}
                              {coupon.isPercentage && coupon.maxDiscount && (
                                <p className="text-xs text-gray-500">
                                  Max: ৳{coupon.maxDiscount}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <p className="text-sm text-gray-600">
                              {formatDate(coupon.validFrom)}
                            </p>
                            <p className="text-sm text-gray-600">to {formatDate(coupon.validTo)}</p>
                          </td>
                          <td className="py-3 px-4">
                            <p className="text-sm text-gray-600">
                              {coupon.usedCount} / {coupon.usageLimit || "∞"}
                            </p>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                isActive
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(coupon)}
                              >
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => handleDelete(coupon.id, coupon.code)}
                                disabled={deleteCoupon.isPending}
                              >
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
