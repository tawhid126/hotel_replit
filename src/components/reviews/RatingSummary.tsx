'use client';

import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/Card';

interface RatingSummaryProps {
  averageRating: number;
  totalReviews: number;
  ratingDistribution?: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

export function RatingSummary({
  averageRating,
  totalReviews,
  ratingDistribution,
}: RatingSummaryProps) {
  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {Array.from({ length: 5 }, (_, i) => (
          <span
            key={i}
            className={`text-2xl ${
              i < Math.floor(rating) ? 'text-yellow-500' : 'text-gray-300'
            }`}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  const getRatingLabel = (rating: number) => {
    if (rating >= 4.5) return 'Excellent';
    if (rating >= 4.0) return 'Very Good';
    if (rating >= 3.0) return 'Good';
    if (rating >= 2.0) return 'Fair';
    return 'Poor';
  };

  const getPercentage = (count: number) => {
    if (!totalReviews) return 0;
    return (count / totalReviews) * 100;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Guest Reviews</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Overall Rating */}
        <div className="mb-6 flex items-center gap-6 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 p-6">
          <div className="text-center">
            <div className="text-5xl font-bold text-gray-900">
              {averageRating.toFixed(1)}
            </div>
            <div className="mt-1 text-sm text-gray-600">out of 5</div>
          </div>
          <div className="flex-1">
            {renderStars(averageRating)}
            <p className="mt-2 text-lg font-semibold text-gray-800">
              {getRatingLabel(averageRating)}
            </p>
            <p className="text-sm text-gray-600">
              Based on {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
            </p>
          </div>
        </div>

        {/* Rating Distribution */}
        {ratingDistribution && (
          <div className="space-y-2">
            <h4 className="mb-3 font-semibold text-gray-900">Rating Breakdown</h4>
            {[5, 4, 3, 2, 1].map((star) => {
              const count = ratingDistribution[star as keyof typeof ratingDistribution] || 0;
              const percentage = getPercentage(count);

              return (
                <div key={star} className="flex items-center gap-3">
                  <div className="flex w-20 items-center gap-1">
                    <span className="font-medium text-gray-700">{star}</span>
                    <span className="text-yellow-500">★</span>
                  </div>
                  <div className="h-3 flex-1 overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full rounded-full bg-yellow-500 transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="w-12 text-right text-sm text-gray-600">
                    {count}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Rating Legend */}
        <div className="mt-6 grid grid-cols-2 gap-3 rounded-lg bg-gray-50 p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {ratingDistribution
                ? ratingDistribution[5] + ratingDistribution[4]
                : 0}
            </div>
            <div className="text-xs text-gray-600">Positive</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {ratingDistribution
                ? ratingDistribution[3] + ratingDistribution[2] + ratingDistribution[1]
                : 0}
            </div>
            <div className="text-xs text-gray-600">Critical</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
