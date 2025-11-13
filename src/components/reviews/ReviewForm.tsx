'use client';

import { useState } from 'react';
import { Button } from '~/components/ui/Button';
import { api } from '~/utils/trpc';

interface ReviewFormProps {
  hotelId: string;
  onSuccess?: () => void;
}

export function ReviewForm({ hotelId, onSuccess }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');

  const createReview = api.review.create.useMutation({
    onSuccess: () => {
      setRating(0);
      setComment('');
      onSuccess?.();
      alert('Review submitted successfully! It will be visible after admin approval.');
    },
    onError: (error) => {
      alert(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }

    createReview.mutate({
      hotelId,
      rating,
      comment: comment.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border bg-white p-6">
      <h3 className="mb-4 text-xl font-bold text-gray-900">Write a Review</h3>

      {/* Star Rating */}
      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Your Rating <span className="text-red-600">*</span>
        </label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="text-4xl transition-colors focus:outline-none"
            >
              <span
                className={
                  star <= (hoveredRating || rating)
                    ? 'text-yellow-500'
                    : 'text-gray-300'
                }
              >
                ★
              </span>
            </button>
          ))}
        </div>
        {rating > 0 && (
          <p className="mt-1 text-sm text-gray-600">
            {rating === 1 && 'Poor'}
            {rating === 2 && 'Fair'}
            {rating === 3 && 'Good'}
            {rating === 4 && 'Very Good'}
            {rating === 5 && 'Excellent'}
          </p>
        )}
      </div>

      {/* Comment */}
      <div className="mb-6">
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Your Review (Optional)
        </label>
        <textarea
          rows={4}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Share your experience at this hotel..."
          maxLength={500}
        />
        <p className="mt-1 text-xs text-gray-500">
          {comment.length}/500 characters
        </p>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full"
        isLoading={createReview.isLoading}
        disabled={rating === 0}
      >
        Submit Review
      </Button>

      <p className="mt-3 text-xs text-gray-500">
        Your review will be reviewed by our team before being published.
      </p>
    </form>
  );
}
