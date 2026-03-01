import type { Metadata, Viewport } from "next";
import "./globals.css";
import Sidebar from "../components/Sidebar";
import GlobalSearch from "../components/GlobalSearch";

export const metadata: Metadata = {
  title: "Scout AI — VC Intelligence Platform",
  description: "Discover, enrich, and track high-signal companies with AI-powered intelligence.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Sidebar />
        <GlobalSearch />
        <main className="lg:ml-64 min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 py-4 pt-16 lg:pt-6 lg:px-6 lg:py-6">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
