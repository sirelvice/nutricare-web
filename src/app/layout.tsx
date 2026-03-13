import "./globals.css";
import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import AuthProvider from "@/components/providers/SessionProvider";

export const metadata: Metadata = {
  metadataBase: new URL("https://nutricare.app"),
  title: {
    default: "NutriCare — Intelligent Nutrition Platform",
    template: "%s | NutriCare",
  },
  description:
    "AI-powered nutrition intelligence platform for individuals, clinics, and partners.",
  keywords: [
    "nutrition platform",
    "AI health",
    "BMI tracking",
    "diet analytics",
    "health dashboard",
  ],
  openGraph: {
    title: "NutriCare — Intelligent Nutrition Platform",
    description:
      "Unified nutrition intelligence powered by AI and clinical data.",
    url: "https://nutricare.app",
    siteName: "NutriCare",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NutriCare — Intelligent Nutrition Platform",
    description:
      "AI-powered nutrition analytics and health intelligence.",
    images: ["/og-image.png"],
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
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>

        <Analytics />
      </body>
    </html>
  );
}