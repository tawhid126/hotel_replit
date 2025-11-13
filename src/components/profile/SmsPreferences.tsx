"use client";

import { useState } from "react";
import { api } from "~/utils/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import { Button } from "~/components/ui/Button";
import toast from "react-hot-toast";
import { validatePhoneNumber, formatPhoneNumber } from "~/lib/sms";

interface SmsPreferencesProps {
  initialPhone?: string | null;
  initialSmsEnabled?: boolean;
}

export function SmsPreferences({ initialPhone, initialSmsEnabled = true }: SmsPreferencesProps) {
  const [phone, setPhone] = useState(initialPhone || "");
  const [smsEnabled, setSmsEnabled] = useState(initialSmsEnabled);
  const [isEditing, setIsEditing] = useState(false);

  const updateProfile = api.user.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("SMS preferences updated successfully!");
      setIsEditing(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update preferences");
    },
  });

  const handleSave = () => {
    // Validate phone if provided
    if (phone && !validatePhoneNumber(phone)) {
      toast.error("Please enter a valid Bangladesh phone number (e.g., 01712345678)");
      return;
    }

    updateProfile.mutate({
      phone: phone || undefined,
      smsEnabled,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <svg
            className="h-5 w-5 text-blue-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
          SMS Notifications
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg bg-blue-50 p-4">
          <p className="text-sm text-gray-700">
            📱 Receive instant SMS updates about your bookings, payments, and special offers
          </p>
        </div>

        {/* Phone Number */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Phone Number
          </label>
          {isEditing ? (
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="01712345678"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
            />
          ) : (
            <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-2">
              <span className="text-gray-900">
                {phone ? formatPhoneNumber(phone) : "No phone number"}
              </span>
              <Button
                onClick={() => setIsEditing(true)}
                variant="ghost"
                size="sm"
                className="text-blue-600 hover:text-blue-700"
              >
                Edit
              </Button>
            </div>
          )}
          <p className="text-xs text-gray-500">
            Format: 01XXXXXXXXX (Bangladesh)
          </p>
        </div>

        {/* SMS Toggle */}
        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
          <div>
            <h4 className="font-medium text-gray-900">Enable SMS Notifications</h4>
            <p className="text-sm text-gray-500">
              Receive booking confirmations, payment updates, and reminders
            </p>
          </div>
          <button
            onClick={() => setSmsEnabled(!smsEnabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              smsEnabled ? "bg-blue-600" : "bg-gray-300"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                smsEnabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {/* Notification Types */}
        {smsEnabled && phone && (
          <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <h4 className="font-medium text-gray-900">You will receive SMS for:</h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                Booking confirmations
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                Payment receipts
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                Booking cancellations
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                Check-in reminders
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                Special offers & promotions
              </li>
            </ul>
          </div>
        )}

        {/* Save Button */}
        {(isEditing || smsEnabled !== initialSmsEnabled) && (
          <div className="flex gap-3">
            <Button
              onClick={handleSave}
              disabled={updateProfile.isLoading}
              className="flex-1 bg-blue-600 text-white hover:bg-blue-700"
            >
              {updateProfile.isLoading ? "Saving..." : "Save Preferences"}
            </Button>
            {isEditing && (
              <Button
                onClick={() => {
                  setPhone(initialPhone || "");
                  setSmsEnabled(initialSmsEnabled);
                  setIsEditing(false);
                }}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            )}
          </div>
        )}

        {/* Info Box */}
        {!phone && (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <p className="text-sm text-yellow-800">
              ⚠️ Add your phone number to receive SMS notifications
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
