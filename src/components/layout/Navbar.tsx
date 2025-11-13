"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { Button } from "~/components/ui/Button";

export function Navbar() {
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Prevent hydration mismatch by not rendering auth-dependent content during loading
  const isLoading = status === "loading";

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav 
      className={`
        sticky top-0 z-50 transition-all duration-500
        ${scrolled 
          ? "glass shadow-xl backdrop-blur-xl bg-white/80 dark:bg-gray-900/80" 
          : "bg-white/70 dark:bg-gray-900/70 backdrop-blur-md shadow-soft"
        }
      `}
    >
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-20">
          {/* Logo - Modern Gradient */}
          <Link 
            href="/" 
            className="flex items-center space-x-3 group"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>
              <div className="relative text-3xl font-bold bg-gradient-to-r from-primary-500 to-secondary-500 p-2 rounded-xl transform group-hover:scale-110 transition-transform duration-300">
                🏨
              </div>
            </div>
            <div className="hidden sm:block">
              <span className="text-2xl font-bold bg-gradient-to-r from-primary-600 via-secondary-600 to-accent-600 bg-clip-text text-transparent">
                StayComfort
              </span>
              <p className="text-xs text-gray-500 dark:text-gray-400 -mt-1">Your Perfect Stay</p>
            </div>
          </Link>

          {/* Desktop Navigation - Modern Links */}
          <div className="hidden md:flex items-center space-x-2">
            <Link 
              href="/" 
              className="px-4 py-2 text-gray-700 dark:text-gray-200 hover:text-primary-600 dark:hover:text-primary-400 font-medium rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all duration-300 relative group"
            >
              <span className="relative z-10">Home</span>
              <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary-500/0 to-primary-500/0 group-hover:from-primary-500/10 group-hover:to-secondary-500/10 transition-all duration-300"></span>
            </Link>
            <Link 
              href="/hotels" 
              className="px-4 py-2 text-gray-700 dark:text-gray-200 hover:text-primary-600 dark:hover:text-primary-400 font-medium rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all duration-300 relative group"
            >
              <span className="relative z-10">Hotels</span>
              <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary-500/0 to-primary-500/0 group-hover:from-primary-500/10 group-hover:to-secondary-500/10 transition-all duration-300"></span>
            </Link>
            
            {isLoading ? (
              <div className="flex items-center space-x-3">
                <div className="h-8 w-20 bg-gray-200 animate-pulse rounded"></div>
                <div className="h-8 w-20 bg-gray-200 animate-pulse rounded"></div>
              </div>
            ) : status === "authenticated" ? (
              <>
                {session.user.role === "ADMIN" && (
                  <Link href="/admin" className="text-gray-700 hover:text-blue-600 transition">
                    Admin Panel
                  </Link>
                )}
                {session.user.role === "HOTEL_OWNER" && (
                  <Link href="/owner" className="text-gray-700 hover:text-blue-600 transition">
                    My Hotel
                  </Link>
                )}
                {session.user.role === "CUSTOMER" && (
                  <Link href="/referrals" className="text-gray-700 hover:text-blue-600 transition flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Referrals
                  </Link>
                )}
                <Link href="/profile" className="text-gray-700 hover:text-blue-600 transition">
                  My Bookings
                </Link>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-600">
                    {session.user.name || session.user.email}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => signOut({ callbackUrl: "/" })}
                  >
                    Sign Out
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                {/* Admin/Owner Login Button */}
                <Link href="/auth/signin">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Admin/Owner
                  </Button>
                </Link>
                <Link href="/auth/signin">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button size="sm">Sign Up</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-gray-700"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="flex flex-col space-y-3">
              <Link href="/" className="text-gray-700 hover:text-blue-600 transition py-2">
                Home
              </Link>
              <Link href="/hotels" className="text-gray-700 hover:text-blue-600 transition py-2">
                Hotels
              </Link>
              
              {isLoading ? (
                <div className="space-y-2">
                  <div className="h-8 w-full bg-gray-200 animate-pulse rounded"></div>
                  <div className="h-8 w-full bg-gray-200 animate-pulse rounded"></div>
                </div>
              ) : status === "authenticated" ? (
                <>
                  {session.user.role === "ADMIN" && (
                    <Link href="/admin" className="text-gray-700 hover:text-blue-600 transition py-2">
                      Admin Panel
                    </Link>
                  )}
                  {session.user.role === "HOTEL_OWNER" && (
                    <Link href="/owner" className="text-gray-700 hover:text-blue-600 transition py-2">
                      My Hotel
                    </Link>
                  )}
                  <Link href="/profile" className="text-gray-700 hover:text-blue-600 transition py-2">
                    My Bookings
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="w-full"
                  >
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  {/* Admin/Owner Login Button - Mobile */}
                  <Link href="/auth/signin" className="w-full">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full text-purple-600 border-purple-600 hover:bg-purple-50"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      Admin/Owner Login
                    </Button>
                  </Link>
                  <Link href="/auth/signin" className="w-full">
                    <Button variant="ghost" size="sm" className="w-full">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/auth/signup" className="w-full">
                    <Button size="sm" className="w-full">
                      Sign Up
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
