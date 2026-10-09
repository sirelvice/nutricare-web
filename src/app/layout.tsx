import "./globals.css";
import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import AuthProvider from "@/components/providers/SessionProvider";
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  icons: {
    icon: { url: "/brand/nutricare-mark.png?v=3", type: "image/png" },
    shortcut: "/brand/nutricare-mark.png?v=3",
    apple: "/brand/nutricare-mark.png?v=3",
  },
  metadataBase: new URL("https://nutricare-web-zeta.vercel.app"),
  title: {
    default: "NutriCare | Nutrition Planning and Tracking",
    template: "%s | NutriCare",
  },
  description:
    "Personal nutrition planning, weight tracking and practical guidance built around your goals.",
  keywords: [
    "nutrition platform",
    "nutrition planning",
    "BMI tracking",
    "diet analytics",
    "health dashboard",
  ],
  openGraph: {
    title: "NutriCare | Nutrition Planning and Tracking",
    description:
      "Bring your nutrition targets, weight history and progress together with clear explanations.",
    url: "https://nutricare-web-zeta.vercel.app",
    siteName: "NutriCare",
    images: [
      {
        url: "/marketing/nutricare-everyday-nutrition.webp",
        alt: "Everyday nutrition with NutriCare",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NutriCare | Nutrition Planning and Tracking",
    description:
      "Nutrition planning, weight tracking and clear guidance for your everyday routine.",
    images: [{
      url: "/marketing/nutricare-everyday-nutrition.webp",
      alt: "Everyday nutrition with NutriCare",
    }],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`} suppressHydrationWarning>
        <AuthProvider>
          {children}
        </AuthProvider>


        <Analytics />
      </body>
    </html>
  );
}