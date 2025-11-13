import { GeistSans } from "geist/font/sans";
import { type Metadata, type Viewport } from "next";
import { Toaster } from "react-hot-toast";

import { TRPCReactProvider } from "~/utils/trpc";
import { Navbar } from "~/components/layout/Navbar";
import { Footer } from "~/components/layout/Footer";
import { ChatWidget } from "~/components/chat/ChatWidget";
import InstallPrompt from "~/components/pwa/InstallPrompt";
import NetworkStatus from "~/components/pwa/NetworkStatus";
import { SessionProvider } from "~/components/SessionProvider";
import { IdleTimeout } from "~/components/ui/IdleTimeout";
import "~/styles/globals.css";

export const metadata: Metadata = {
  title: "StayComfort - Find Your Perfect Stay",
  description: "Book luxury rooms and suites at the best prices worldwide with StayComfort",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${GeistSans.variable}`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="StayComfort" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <SessionProvider>
          <TRPCReactProvider>
            <Navbar />
            <main className="relative">{children}</main>
            <Footer />
            <ChatWidget />
            <InstallPrompt />
            <NetworkStatus />
            <IdleTimeout idleTimeMinutes={25} warningTimeSeconds={300} />
            <Toaster position="top-right" />
          </TRPCReactProvider>
        </SessionProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('SW registered: ', registration);
                    })
                    .catch(function(registrationError) {
                      console.log('SW registration failed: ', registrationError);
                    });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
