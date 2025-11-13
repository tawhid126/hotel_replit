"use client";

import { Toaster, toast as hotToast } from "react-hot-toast";

// Toast Provider Component
export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: "#fff",
          color: "#363636",
          padding: "16px",
          borderRadius: "8px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        },
        success: {
          iconTheme: {
            primary: "#10b981",
            secondary: "#fff",
          },
          style: {
            border: "1px solid #10b981",
          },
        },
        error: {
          iconTheme: {
            primary: "#ef4444",
            secondary: "#fff",
          },
          style: {
            border: "1px solid #ef4444",
          },
        },
      }}
    />
  );
}

// Custom Toast Utilities
export const toast = {
  success: (message: string, options?: { duration?: number }) => {
    hotToast.success(message, {
      duration: options?.duration,
      icon: "✅",
    });
  },

  error: (message: string, options?: { duration?: number }) => {
    hotToast.error(message, {
      duration: options?.duration,
      icon: "❌",
    });
  },

  loading: (message: string) => {
    return hotToast.loading(message, {
      icon: "⏳",
    });
  },

  promise: <T,>(
    promise: Promise<T>,
    {
      loading,
      success,
      error,
    }: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((err: Error) => string);
    }
  ) => {
    return hotToast.promise(promise, {
      loading,
      success,
      error,
    });
  },

  custom: (message: string, icon?: string) => {
    hotToast(message, {
      icon: icon || "ℹ️",
    });
  },

  dismiss: (toastId?: string) => {
    hotToast.dismiss(toastId);
  },
};

// Predefined Toast Messages
export const toastMessages = {
  // Auth
  loginSuccess: () => toast.success("Successfully signed in!"),
  loginError: () => toast.error("Invalid email or password"),
  logoutSuccess: () => toast.success("Successfully signed out!"),
  signupSuccess: () => toast.success("Account created successfully!"),
  signupError: () => toast.error("Failed to create account"),

  // Booking
  bookingSuccess: () => toast.success("Booking confirmed! 🎉"),
  bookingError: () => toast.error("Failed to create booking"),
  bookingCancelled: () => toast.success("Booking cancelled successfully"),
  bookingCancelError: () => toast.error("Failed to cancel booking"),

  // Payment
  paymentSuccess: () => toast.success("Payment completed successfully! 💳"),
  paymentError: () => toast.error("Payment failed. Please try again."),
  paymentPending: () => toast.loading("Processing payment..."),

  // Review
  reviewSubmitted: () => toast.success("Thank you for your review! ⭐"),
  reviewError: () => toast.error("Failed to submit review"),
  reviewUpdated: () => toast.success("Review updated successfully"),
  reviewDeleted: () => toast.success("Review deleted"),

  // Hotel Management (Owner/Admin)
  hotelCreated: () => toast.success("Hotel created successfully!"),
  hotelUpdated: () => toast.success("Hotel updated successfully!"),
  hotelDeleted: () => toast.success("Hotel deleted"),
  hotelError: () => toast.error("Failed to save hotel"),

  // Room Management
  roomCreated: () => toast.success("Room category created!"),
  roomUpdated: () => toast.success("Room updated successfully!"),
  roomDeleted: () => toast.success("Room deleted"),
  roomError: () => toast.error("Failed to save room"),

  // Image Upload
  imageUploadSuccess: () => toast.success("Image uploaded successfully!"),
  imageUploadError: () => toast.error("Failed to upload image"),
  imageDeleteSuccess: () => toast.success("Image deleted"),
  imageDeleteError: () => toast.error("Failed to delete image"),

  // Form Validation
  requiredFields: () => toast.error("Please fill all required fields"),
  invalidEmail: () => toast.error("Invalid email address"),
  passwordMismatch: () => toast.error("Passwords do not match"),
  passwordTooShort: () => toast.error("Password must be at least 6 characters"),

  // Generic
  success: (message: string) => toast.success(message),
  error: (message: string) => toast.error(message),
  info: (message: string) => toast.custom(message, "ℹ️"),
  warning: (message: string) => toast.custom(message, "⚠️"),
  loading: (message: string) => toast.loading(message),

  // Network
  networkError: () => toast.error("Network error. Please check your connection."),
  serverError: () => toast.error("Server error. Please try again later."),
  
  // Copy to Clipboard
  copied: () => toast.success("Copied to clipboard!"),
  
  // Favorites/Wishlist
  addedToFavorites: () => toast.success("Added to favorites! ❤️"),
  removedFromFavorites: () => toast.success("Removed from favorites"),
};

// Example Usage:
/*
import { toast, toastMessages } from "~/components/ui/Toast";

// Simple usage
toast.success("Operation successful!");
toast.error("Something went wrong");
toast.loading("Processing...");

// Using predefined messages
toastMessages.loginSuccess();
toastMessages.bookingSuccess();

// Promise toast
toast.promise(
  fetchData(),
  {
    loading: "Loading data...",
    success: "Data loaded!",
    error: "Failed to load data",
  }
);

// Custom toast
toast.custom("Custom message", "🎉");

// Dismiss toast
const toastId = toast.loading("Please wait...");
setTimeout(() => toast.dismiss(toastId), 2000);
*/
