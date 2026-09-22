import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script"; // 1. Added Next.js Script component
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PomoSync - Focus Timer & Task Sync",
  description: "Sync your Pomodoro focus sessions with Google Tasks.",
  manifest: "/manifest.webmanifest",
  verification: {
    google: "pygjydd1upcF3_vfr5xBMbt-B3-iHq2ICY50lheieho", // Your verified Search Console meta tag
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {  
  // 2. Paste your Google Analytics Measurement ID here
  const GA_MEASUREMENT_ID = "G-0XWZMT9TTH"; 

  return (
    <html lang="en">
      <head>
        {/* 3. Google Analytics gtag.js inserted into <head> */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}');
          `}
        </Script>
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-50 text-slate-900`}>
        {children}
      </body>
    </html>
  );
}