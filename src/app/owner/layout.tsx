'use client';

import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Redirect if not owner
  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (status === 'unauthenticated' || (session?.user && session.user.role !== 'HOTEL_OWNER')) {
    router.push('/signin');
    return null;
  }

  const navItems = [
    { name: 'Dashboard', path: '/owner', icon: '📊' },
    { name: 'My Hotel', path: '/owner/hotel', icon: '🏨' },
    { name: 'Room Categories', path: '/owner/rooms', icon: '🛏️' },
    { name: 'Bookings', path: '/owner/bookings', icon: '📅' },
    { name: 'Reviews', path: '/owner/reviews', icon: '⭐' },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar - Desktop */}
      <aside className="hidden w-64 flex-col bg-gray-900 text-white md:flex">
        <div className="flex h-16 items-center justify-center border-b border-gray-800">
          <h1 className="text-xl font-bold">Owner Panel</h1>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-gray-800 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600">
              {session?.user?.name?.charAt(0).toUpperCase() || 'O'}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{session?.user?.name}</p>
              <p className="text-xs text-gray-400">Hotel Owner</p>
            </div>
          </div>
          <Link
            href="/api/auth/signout"
            className="mt-3 flex w-full items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium hover:bg-red-700"
          >
            Sign Out
          </Link>
        </div>
      </aside>

      {/* Mobile Menu Button */}
      <div className="fixed top-0 z-50 flex w-full items-center justify-between bg-gray-900 p-4 md:hidden">
        <h1 className="text-lg font-bold text-white">Owner Panel</h1>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="text-white"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {isMobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-gray-900 md:hidden">
          <div className="flex h-16 items-center justify-between px-4">
            <h1 className="text-lg font-bold text-white">Owner Panel</h1>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-white"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <nav className="space-y-1 p-4">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 rounded-lg px-4 py-3 text-white hover:bg-gray-800"
              >
                <span className="text-xl">{item.icon}</span>
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="hidden h-16 items-center justify-between border-b bg-white px-8 md:flex">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {navItems.find((item) => item.path === pathname)?.name || 'Owner Panel'}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">
              View Website
            </Link>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm text-white">
                {session?.user?.name?.charAt(0).toUpperCase() || 'O'}
              </div>
              <span className="text-sm font-medium text-gray-700">{session?.user?.name}</span>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto bg-gray-50 pt-16 md:pt-0">
          {children}
        </main>
      </div>
    </div>
  );
}
