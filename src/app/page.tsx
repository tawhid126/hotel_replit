"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "~/utils/trpc";
import { Button } from "~/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import { Badge } from "~/components/ui/Badge";
import { formatCurrency } from "~/lib/utils";
import { SeasonalOffersBanner } from "~/components/promotions/SeasonalOffersBanner";
import { OYOSearchBar } from "~/components/search/OYOSearchBar";

export default function HomePage() {
  const router = useRouter();

  // Fetch featured hotels (top rated)
  const { data: featuredData, isLoading: featuredLoading } = api.hotel.getAll.useQuery({
    take: 6,
    sortBy: "rating" as const,
    page: 1,
    limit: 6,
  });

  const featuredHotels = featuredData?.hotels || [];

  return (
    <div className="min-h-screen">
      {/* Seasonal Offers Banner */}
      <SeasonalOffersBanner />
      
      {/* Hero Section - OYO Style */}
      <section className="relative min-h-[600px] flex items-center overflow-x-hidden">
        {/* Animated Background - OYO Colors */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-600 via-orange-500 to-yellow-500"></div>
        
        {/* Overlay Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }}></div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-white/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>

        <div className="relative container mx-auto px-4 py-20">
          <div className="max-w-6xl mx-auto text-center">
            {/* Hero Text - OYO Style */}
            <div className="mb-8 space-y-2 animate-fade-in-up">
              <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight">
                Monsoon is here.
                <br />
                Where are you?
              </h1>
            </div>

            {/* OYO Search Bar */}
            <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <OYOSearchBar className="max-w-5xl mx-auto" />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: "🏨", value: "10,000+", label: "Hotels" },
              { icon: "🌍", value: "50+", label: "Countries" },
              { icon: "😊", value: "1M+", label: "Happy Guests" },
              { icon: "⭐", value: "4.8", label: "Average Rating" },
            ].map((stat, index) => (
              <div 
                key={index} 
                className="text-center group cursor-pointer animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="text-5xl mb-3 transform group-hover:scale-110 transition-transform duration-300">
                  {stat.icon}
                </div>
                <div className="text-3xl font-bold gradient-text-blue mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Destinations */}
      <section className="py-20 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Popular Destinations
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Explore the most sought-after travel destinations
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { name: "Dhaka", image: "🏙️", hotels: 150, gradient: "from-blue-500 to-cyan-500" },
              { name: "Chittagong", image: "🌊", hotels: 85, gradient: "from-cyan-500 to-teal-500" },
              { name: "Sylhet", image: "🏔️", hotels: 65, gradient: "from-teal-500 to-green-500" },
              { name: "Cox's Bazar", image: "🏖️", hotels: 120, gradient: "from-orange-500 to-red-500" },
              { name: "Khulna", image: "🌳", hotels: 45, gradient: "from-green-500 to-emerald-500" },
              { name: "Rajshahi", image: "🏛️", hotels: 40, gradient: "from-purple-500 to-pink-500" },
            ].map((city, index) => (
              <Link
                key={city.name}
                href={`/hotels?city=${city.name}`}
                className="group animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <Card variant="hover" className="h-full">
                  <CardContent className="p-6 text-center space-y-4">
                    <div className={`
                      w-20 h-20 mx-auto rounded-2xl 
                      bg-gradient-to-br ${city.gradient}
                      flex items-center justify-center
                      text-4xl shadow-lg
                      transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300
                    `}>
                      {city.image}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition">
                        {city.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {city.hotels} hotels
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Hotels */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-12 animate-fade-in-up">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-2">
                Featured Hotels
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Handpicked luxury stays for your perfect vacation
              </p>
            </div>
            <Link href="/hotels">
              <Button variant="outline" size="lg">
                View All
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Button>
            </Link>
          </div>

          {featuredLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="skeleton h-96 rounded-2xl"></div>
              ))}
            </div>
          ) : featuredHotels.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🏨</div>
              <p className="text-xl text-gray-500 dark:text-gray-400 mb-6">No hotels available yet</p>
              <Link href="/hotels">
                <Button variant="primary" size="lg">Browse All Hotels</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredHotels.map((hotel, index) => (
                <Link
                  key={hotel.id}
                  href={`/hotels/${hotel.id}`}
                  className="group animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <Card variant="hover" className="h-full overflow-hidden">
                    <div className="relative h-64 overflow-hidden bg-gray-200 dark:bg-gray-700">
                      {hotel.images?.[0] ? (
                        <img
                          src={hotel.images[0]}
                          alt={hotel.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-6xl">
                          🏨
                        </div>
                      )}
                      {hotel.discount && hotel.discount > 0 && (
                        <Badge className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 text-sm font-bold">
                          {hotel.discount}% OFF
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-6 space-y-3">
                      <div>
                        <h3 className="font-bold text-xl text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition mb-1">
                          {hotel.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                          </svg>
                          {hotel.location}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <svg
                              key={i}
                              className={`w-5 h-5 ${
                                i < Math.floor(hotel.rating || 0)
                                  ? "text-yellow-400"
                                  : "text-gray-300 dark:text-gray-600"
                              }`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                          {hotel.rating?.toFixed(1) || "New"}
                        </span>
                      </div>

                      <div className="flex items-end justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Starting from</p>
                          <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                            {formatCurrency(hotel.basePrice || 0)}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">per night</p>
                        </div>
                        <Button size="sm" variant="primary">
                          Book Now
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-br from-primary-600 via-secondary-600 to-accent-600 text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-white rounded-full blur-3xl"></div>
        </div>

        <div className="relative container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto animate-fade-in-up">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready for Your Next Adventure?
            </h2>
            <p className="text-xl mb-8 text-white/90">
              Join thousands of happy travelers. Book your perfect stay today and create unforgettable memories.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signup">
                <Button size="lg" variant="secondary" className="min-w-[200px]">
                  Sign Up Now
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Button>
              </Link>
              <Link href="/hotels">
                <Button size="lg" variant="outline" className="min-w-[200px] border-white text-white hover:bg-white hover:text-primary-600">
                  Browse Hotels
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
