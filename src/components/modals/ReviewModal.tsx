"use client";

import { useState } from "react";
import { Button } from "~/components/ui/Button";
import { Modal } from "~/components/ui/Modal";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  hotelName: string;
  bookingId: string;
  onSubmit: (review: {
    rating: number;
    comment: string;
    cleanliness: number;
    service: number;
    location: number;
    value: number;
  }) => Promise<void>;
}

export function ReviewModal({
  isOpen,
  onClose,
  hotelName,
  bookingId,
  onSubmit,
}: ReviewModalProps) {
  const [overallRating, setOverallRating] = useState(0);
  const [cleanliness, setCleanliness] = useState(0);
  const [service, setService] = useState(0);
  const [location, setLocation] = useState(0);
  const [value, setValue] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoveredRating, setHoveredRating] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (overallRating === 0) {
      alert("Please provide an overall rating");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        rating: overallRating,
        comment,
        cleanliness,
        service,
        location,
        value,
      });
      // Reset form
      setOverallRating(0);
      setCleanliness(0);
      setService(0);
      setLocation(0);
      setValue(0);
      setComment("");
      onClose();
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("Failed to submit review. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const StarRating = ({
    rating,
    onRate,
    label,
  }: {
    rating: number;
    onRate: (rating: number) => void;
    label: string;
  }) => {
    const [hovered, setHovered] = useState(0);

    return (
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <div className="flex items-center space-x-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onRate(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              className="focus:outline-none transition-transform hover:scale-110"
            >
              <svg
                className={`w-8 h-8 ${
                  star <= (hovered || rating)
                    ? "text-yellow-400 fill-current"
                    : "text-gray-300"
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                />
              </svg>
            </button>
          ))}
          <span className="ml-2 text-sm text-gray-600">
            {rating > 0 ? `${rating}/5` : "Not rated"}
          </span>
        </div>
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Write a Review"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Hotel Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600">You stayed at</p>
          <p className="text-lg font-semibold text-gray-900">{hotelName}</p>
          <p className="text-xs text-gray-500 mt-1">Booking ID: {bookingId}</p>
        </div>

        {/* Overall Rating */}
        <div className="space-y-2">
          <StarRating
            rating={overallRating}
            onRate={setOverallRating}
            label="Overall Rating *"
          />
        </div>

        {/* Detailed Ratings */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-900">
            Rate specific aspects (optional)
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StarRating
              rating={cleanliness}
              onRate={setCleanliness}
              label="Cleanliness"
            />
            <StarRating
              rating={service}
              onRate={setService}
              label="Service"
            />
            <StarRating
              rating={location}
              onRate={setLocation}
              label="Location"
            />
            <StarRating
              rating={value}
              onRate={setValue}
              label="Value for Money"
            />
          </div>
        </div>

        {/* Comment */}
        <div className="space-y-2">
          <label htmlFor="comment" className="text-sm font-medium text-gray-700">
            Your Review
          </label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={5}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Share your experience with this hotel..."
          />
          <p className="text-xs text-gray-500">
            {comment.length} / 500 characters
          </p>
        </div>

        {/* Guidelines */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm font-semibold text-blue-900 mb-2">Review Guidelines</p>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• Be specific about your experience</li>
            <li>• Keep it relevant and respectful</li>
            <li>• Avoid personal information</li>
            <li>• Focus on the hotel and service quality</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            type="submit"
            disabled={isSubmitting || overallRating === 0}
            className="flex-1"
          >
            {isSubmitting ? "Submitting..." : "Submit Review"}
          </Button>
          <Button
            type="button"
            onClick={onClose}
            variant="outline"
            disabled={isSubmitting}
            className="flex-1"
          >
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
}
