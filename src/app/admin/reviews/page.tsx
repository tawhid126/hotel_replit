'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/Card';
import { Button } from '~/components/ui/Button';
import { Badge } from '~/components/ui/Badge';
import { Modal } from '~/components/ui/Modal';
import { api } from '~/utils/trpc';
import { formatDate } from '~/lib/utils';

export default function AdminReviewsPage() {
  const [statusFilter, setStatusFilter] = useState<boolean | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedReview, setSelectedReview] = useState<any>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const itemsPerPage = 10;

  // Fetch reviews using the review router
  const { data: reviewsData, isLoading, refetch } = api.review.getAll.useQuery({
    page: currentPage,
    limit: itemsPerPage,
    approved: statusFilter,
  });

  // Approve review mutation
  const approveReview = api.review.approve.useMutation({
    onSuccess: () => {
      refetch();
      alert('Review approved successfully');
    },
    onError: (error: any) => {
      alert('Failed to approve review: ' + error.message);
    },
  });

  // Delete review mutation
  const deleteReview = api.review.delete.useMutation({
    onSuccess: () => {
      refetch();
      setIsDeleteModalOpen(false);
      setSelectedReview(null);
      alert('Review deleted successfully');
    },
    onError: (error: any) => {
      alert('Failed to delete review: ' + error.message);
    },
  });

  const handleApprove = (reviewId: string) => {
    if (confirm('Are you sure you want to approve this review?')) {
      approveReview.mutate({ id: reviewId });
    }
  };

  const handleDelete = () => {
    if (!selectedReview) return;
    deleteReview.mutate({ id: selectedReview.id });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < rating ? 'text-yellow-500' : 'text-gray-300'}>
        ★
      </span>
    ));
  };

  const getStatusBadge = (isApproved: boolean) => {
    return isApproved ? (
      <Badge variant="success">Approved</Badge>
    ) : (
      <Badge variant="warning">Pending</Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  const reviews = reviewsData?.reviews || [];
  const totalPages = reviewsData?.pages || 1;

  // Calculate stats from reviews
  const totalReviews = reviewsData?.total || 0;
  const approvedCount = reviews.filter((r: any) => r.isApproved).length;
  const pendingCount = reviews.filter((r: any) => !r.isApproved).length;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Review Moderation</h1>
          <p className="mt-2 text-gray-600">Manage and moderate customer reviews</p>
        </div>

        {/* Stats Cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">Total Reviews</p>
                <p className="text-3xl font-bold text-gray-900">{totalReviews}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-3xl font-bold text-orange-600">{pendingCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">Approved</p>
                <p className="text-3xl font-bold text-green-600">{approvedCount}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex gap-2">
              <Button
                variant={statusFilter === undefined ? 'primary' : 'outline'}
                onClick={() => {
                  setStatusFilter(undefined);
                  setCurrentPage(1);
                }}
              >
                ALL
              </Button>
              <Button
                variant={statusFilter === false ? 'primary' : 'outline'}
                onClick={() => {
                  setStatusFilter(false);
                  setCurrentPage(1);
                }}
              >
                PENDING
              </Button>
              <Button
                variant={statusFilter === true ? 'primary' : 'outline'}
                onClick={() => {
                  setStatusFilter(true);
                  setCurrentPage(1);
                }}
              >
                APPROVED
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Reviews List */}
        <Card>
          <CardHeader>
            <CardTitle>Reviews ({reviews.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {reviews.length === 0 ? (
              <div className="py-12 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
                <p className="mt-4 text-gray-600">No reviews found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review: any) => (
                  <div key={review.id} className="rounded-lg border p-4">
                    {/* Review Header */}
                    <div className="mb-3 flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">{review.user?.name || 'Anonymous'}</h3>
                          <div className="flex text-lg">{renderStars(review.rating)}</div>
                          {getStatusBadge(review.isApproved)}
                        </div>
                        <p className="text-sm text-gray-600">
                          Hotel: <span className="font-medium">{review.hotel?.name}</span>
                        </p>
                        <p className="text-xs text-gray-500">{formatDate(review.createdAt)}</p>
                      </div>
                    </div>

                    {/* Review Content */}
                    {review.comment && (
                      <div className="mb-3">
                        <p className="text-gray-700">{review.comment}</p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      {!review.isApproved && (
                        <Button
                          size="sm"
                          onClick={() => handleApprove(review.id)}
                          disabled={approveReview.isLoading}
                        >
                          <svg className="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Approve
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => {
                          setSelectedReview(review);
                          setIsDeleteModalOpen(true);
                        }}
                      >
                        <svg className="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setSelectedReview(null);
          }}
          size="md"
        >
          <div className="p-6">
            <h2 className="mb-4 text-2xl font-bold text-gray-900">Delete Review</h2>
            <p className="mb-6 text-gray-600">
              Are you sure you want to delete this review? This action cannot be undone.
            </p>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setSelectedReview(null);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDelete}
                isLoading={deleteReview.isLoading}
                className="flex-1"
              >
                Delete Review
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
