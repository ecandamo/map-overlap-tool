import type { Metadata } from "next";
import { IBM_Plex_Mono, Plus_Jakarta_Sans } from "next/font/google";
import Script from "next/script";

import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta-sans"
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-ibm-plex-mono"
});

export const metadata: Metadata = {
  title: "Map Overlap Tool",
  description: "Local-first MVP for overlapping API hotel contract destinations and client layover destinations."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {`
            try {
              var stored = window.localStorage.getItem("map-overlap-theme");
              var isDark = stored === "dark";
              document.documentElement.classList.toggle("dark", isDark);
              document.documentElement.style.colorScheme = isDark ? "dark" : "light";
            } catch (error) {
              document.documentElement.classList.remove("dark");
              document.documentElement.style.colorScheme = "light";
            }
          `}
        </Script>
      </head>
      <body className={`${plusJakartaSans.variable} ${ibmPlexMono.variable}`}>{children}</body>
    </html>
  );
}
