import { redirect } from "next/navigation";
import { getServerAuthSession } from "~/server/auth";

export default async function HotelOwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerAuthSession();

  if (!session) {
    redirect("/auth/signin");
  }

  if (session.user.role !== "HOTEL_OWNER") {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hotel Owner Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-8">
              <h1 className="text-xl font-bold text-gray-900">
                🏨 Hotel Owner Dashboard
              </h1>
              {/* Navigation Links */}
              <div className="hidden md:flex items-center gap-4">
                <a
                  href="/hotel-owner/dashboard"
                  className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                >
                  Dashboard
                </a>
                <a
                  href="/hotel-owner/rooms"
                  className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                >
                  Rooms
                </a>
                <a
                  href="/hotel-owner/bookings"
                  className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                >
                  Bookings
                </a>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {session.user.name || session.user.email}
              </span>
              <a
                href="/api/auth/signout"
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Logout
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main>{children}</main>
    </div>
  );
}
