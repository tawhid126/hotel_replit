"use client";

import { useState } from "react";
import { api } from "~/utils/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import { Button } from "~/components/ui/Button";
import { Input } from "~/components/ui/Input";
import { Modal } from "~/components/ui/Modal";
import { Badge } from "~/components/ui/Badge";
import { formatDate } from "~/lib/utils";

type UserRole = "ADMIN" | "HOTEL_OWNER" | "CUSTOMER";

export default function AdminUsersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isCreateOwnerModalOpen, setIsCreateOwnerModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any>(null);

  // Fetch users
  const { data, isLoading, refetch } = api.admin.getUsers.useQuery({
    page,
    limit: 10,
    role: roleFilter || undefined,
  });

  const users = data?.users || [];
  const totalPages = data?.pages || 1;

  // Mutations
  const updateRoleMutation = api.admin.updateUserRole.useMutation({
    onSuccess: () => {
      refetch();
      setSelectedUser(null);
    },
  });

  const deleteUserMutation = api.admin.deleteUser.useMutation({
    onSuccess: () => {
      refetch();
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
    },
  });

  const handleUpdateRole = async (userId: string, newRole: UserRole) => {
    try {
      await updateRoleMutation.mutateAsync({ userId, role: newRole });
    } catch (error) {
      console.error("Failed to update user role:", error);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      await deleteUserMutation.mutateAsync({ userId: userToDelete.id });
    } catch (error) {
      console.error("Failed to delete user:", error);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "danger";
      case "HOTEL_OWNER":
        return "warning";
      case "CUSTOMER":
        return "info";
      default:
        return "default";
    }
  };

  return (
    <div className="py-8 px-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">Manage all users on the platform</p>
        </div>
        <Button onClick={() => setIsCreateOwnerModalOpen(true)}>
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
          Create Hotel Owner
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-4">
        <Input
          type="text"
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Roles</option>
          <option value="ADMIN">Admin</option>
          <option value="HOTEL_OWNER">Hotel Owner</option>
          <option value="CUSTOMER">Customer</option>
        </select>
      </div>

      {/* Users Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : users.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">No users found</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Activity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Joined
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users
                      .filter((user: any) =>
                        searchQuery
                          ? user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            user.email?.toLowerCase().includes(searchQuery.toLowerCase())
                          : true
                      )
                      .map((user: any) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {user.name || "N/A"}
                              </div>
                              <div className="text-sm text-gray-500">
                                {user.email}
                              </div>
                              {user.phone && (
                                <div className="text-xs text-gray-400">
                                  {user.phone}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant={getRoleBadgeVariant(user.role)}>
                              {user.role}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {user._count.bookings} bookings
                            </div>
                            <div className="text-sm text-gray-500">
                              {user._count.reviews} reviews
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(user.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedUser(user)}
                              >
                                Edit Role
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => {
                                  setUserToDelete(user);
                                  setIsDeleteModalOpen(true);
                                }}
                              >
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

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

      {/* Edit Role Modal */}
      {selectedUser && (
        <Modal
          isOpen={!!selectedUser}
          onClose={() => setSelectedUser(null)}
          size="md"
        >
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Update User Role
            </h2>
            <p className="text-gray-600 mb-6">
              Change role for <strong>{selectedUser.name || selectedUser.email}</strong>
            </p>

            <div className="space-y-3">
              {(["ADMIN", "HOTEL_OWNER", "CUSTOMER"] as UserRole[]).map((role) => (
                <button
                  key={role}
                  onClick={() => handleUpdateRole(selectedUser.id, role)}
                  disabled={updateRoleMutation.isLoading || selectedUser.role === role}
                  className={`w-full px-4 py-3 text-left rounded-lg border-2 transition-all ${
                    selectedUser.role === role
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200 hover:border-blue-300"
                  } ${updateRoleMutation.isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-900">{role}</div>
                      <div className="text-sm text-gray-500">
                        {role === "ADMIN" && "Full access to all features"}
                        {role === "HOTEL_OWNER" && "Can manage own hotels"}
                        {role === "CUSTOMER" && "Can book hotels and leave reviews"}
                      </div>
                    </div>
                    {selectedUser.role === role && (
                      <svg
                        className="w-6 h-6 text-blue-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-6">
              <Button
                variant="outline"
                onClick={() => setSelectedUser(null)}
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setUserToDelete(null);
        }}
        size="md"
      >
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Delete User</h2>
          <p className="text-gray-600 mb-6">
            Are you sure you want to delete{" "}
            <strong>{userToDelete?.name || userToDelete?.email}</strong>? This
            action cannot be undone.
          </p>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setUserToDelete(null);
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteUser}
              isLoading={deleteUserMutation.isLoading}
              className="flex-1"
            >
              Delete User
            </Button>
          </div>
        </div>
      </Modal>

      {/* Create Hotel Owner Modal */}
      <CreateOwnerModal
        isOpen={isCreateOwnerModalOpen}
        onClose={() => setIsCreateOwnerModalOpen(false)}
        onSuccess={() => {
          refetch();
          setIsCreateOwnerModalOpen(false);
        }}
      />
    </div>
  );
}

// Create Hotel Owner Modal Component
function CreateOwnerModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });

  const createOwnerMutation = api.admin.createUser.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createOwnerMutation.mutateAsync({
        ...formData,
        role: "HOTEL_OWNER" as UserRole,
      });
      onSuccess();
      setFormData({ name: "", email: "", phone: "", password: "" });
    } catch (error) {
      console.error("Failed to create hotel owner:", error);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Create Hotel Owner Account
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />

          <Input
            label="Email"
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />

          <Input
            label="Phone"
            type="tel"
            required
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />

          <Input
            label="Password"
            type="password"
            required
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
          />

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> The hotel owner will use this email and
              password to sign in and manage their hotels.
            </p>
          </div>

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
              isLoading={createOwnerMutation.isLoading}
            >
              Create Owner Account
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
