"use client";

import { useState, useEffect } from "react";
import { api } from "~/utils/trpc";
import { Card } from "~/components/ui/Card";
import { Button } from "~/components/ui/Button";

export function SeasonalOffersBanner() {
  const [isVisible, setIsVisible] = useState(true);
  // Use the new public endpoint for active coupons
  const { data: couponsData } = api.coupon.getActive.useQuery();

  const activeCoupons = couponsData?.coupons || [];

  // Get the best offer (highest discount)
  const bestOffer = activeCoupons?.reduce((best: any, current: any) => {
    if (!best) return current;
    
    const currentDiscount = current.isPercentage 
      ? current.discount 
      : current.discount;
    
    const bestDiscount = best.isPercentage 
      ? best.discount 
      : best.discount;
    
    return currentDiscount > bestDiscount ? current : best;
  }, activeCoupons[0]);

  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Don't show banner if dismissed or no active offers
  if (!isVisible || !bestOffer) return null;

  return (
    <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white py-4 px-4 relative">
      <div className="container mx-auto max-w-6xl">
        <div className="flex items-center justify-between gap-4">
          {/* Banner Content */}
          <div className="flex-1 flex items-center gap-6">
            {/* Discount Badge */}
            <div className="hidden md:flex items-center justify-center bg-white text-purple-600 rounded-full w-20 h-20 flex-shrink-0">
              <div className="text-center">
                <p className="text-2xl font-bold leading-none">
                  {bestOffer.isPercentage ? `${bestOffer.discount}%` : `৳${bestOffer.discount}`}
                </p>
                <p className="text-xs font-semibold">OFF</p>
              </div>
            </div>

            {/* Offer Details */}
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-1">
                {bestOffer.description || "Special Offer Available!"}
              </h3>
              <p className="text-sm opacity-90 mb-2">
                {bestOffer.minAmount 
                  ? `On bookings above ৳${bestOffer.minAmount}` 
                  : "On all bookings"}
                {bestOffer.isPercentage && bestOffer.maxDiscount 
                  ? ` • Max discount ৳${bestOffer.maxDiscount}` 
                  : ""}
              </p>
              
              {/* Coupon Code */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="inline-flex items-center gap-2 bg-white bg-opacity-20 backdrop-blur-sm rounded-lg px-3 py-1.5">
                  <span className="text-xs font-medium opacity-80">Code:</span>
                  <span className="font-bold text-lg tracking-wider">{bestOffer.code}</span>
                </div>
                
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleCopyCode(bestOffer.code)}
                  className="text-white border border-white hover:bg-white hover:text-purple-600 transition-colors"
                >
                  {copiedCode === bestOffer.code ? (
                    <span className="flex items-center gap-1">
                      <span>✓</span>
                      <span>Copied!</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <span>📋</span>
                      <span>Copy Code</span>
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* More Offers & Close Button */}
          <div className="flex items-center gap-2">
            {activeCoupons && activeCoupons.length > 1 && (
              <div className="hidden lg:block text-sm opacity-90">
                +{activeCoupons.length - 1} more {activeCoupons.length === 2 ? "offer" : "offers"}
              </div>
            )}
            
            <button
              onClick={() => setIsVisible(false)}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
              aria-label="Close banner"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Discount Badge */}
        <div className="md:hidden flex justify-center mt-3">
          <div className="inline-flex items-center justify-center bg-white text-purple-600 rounded-full px-4 py-2">
            <p className="text-lg font-bold">
              {bestOffer.isPercentage ? `${bestOffer.discount}%` : `৳${bestOffer.discount}`} OFF
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
