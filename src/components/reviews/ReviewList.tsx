'use client';

import { Card, CardContent } from '~/components/ui/Card';
import { Badge } from '~/components/ui/Badge';
import { formatDate } from '~/lib/utils';
import Image from 'next/image';

interface ReviewListProps {
  reviews: any[];
  isLoading?: boolean;
}

export function ReviewList({ reviews, isLoading }: ReviewListProps) {
  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {Array.from({ length: 5 }, (_, i) => (
          <span
            key={i}
            className={`text-xl ${i < rating ? 'text-yellow-500' : 'text-gray-300'}`}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  const getRatingLabel = (rating: number) => {
    if (rating === 5) return 'Excellent';
    if (rating === 4) return 'Very Good';
    if (rating === 3) return 'Good';
    if (rating === 2) return 'Fair';
    return 'Poor';
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex gap-4">
                <div className="h-12 w-12 rounded-full bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/4 rounded bg-gray-200" />
                  <div className="h-4 w-1/2 rounded bg-gray-200" />
                  <div className="h-16 w-full rounded bg-gray-200" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
            />
          </svg>
          <p className="mt-4 text-gray-600">No reviews yet</p>
          <p className="mt-1 text-sm text-gray-500">
            Be the first to review this hotel
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <Card key={review.id} className="overflow-hidden">
          <CardContent className="p-6">
            <div className="flex gap-4">
              {/* User Avatar */}
              <div className="flex-shrink-0">
                {review.user?.image ? (
                  <Image
                    src={review.user.image}
                    alt={review.user.name || 'User'}
                    width={48}
                    height={48}
                    className="rounded-full"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                    <span className="text-lg font-semibold">
                      {review.user?.name?.[0] || 'U'}
                    </span>
                  </div>
                )}
              </div>

              {/* Review Content */}
              <div className="flex-1">
                {/* Header */}
                <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {review.user?.name || 'Anonymous'}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {formatDate(review.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {renderStars(review.rating)}
                    <Badge variant="info">
                      {getRatingLabel(review.rating)}
                    </Badge>
                  </div>
                </div>

                {/* Rating Number */}
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-2xl font-bold text-yellow-600">
                    {review.rating}.0
                  </span>
                  <span className="text-sm text-gray-600">
                    / 5.0
                  </span>
                </div>

                {/* Comment */}
                {review.comment && (
                  <div className="rounded-lg bg-gray-50 p-4">
                    <p className="text-gray-700">{review.comment}</p>
                  </div>
                )}

                {/* Verified Stay Badge */}
                <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                  <svg
                    className="h-4 w-4 text-green-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="font-medium text-green-700">
                    Verified Stay
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
