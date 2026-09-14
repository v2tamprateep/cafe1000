import type { Metadata } from "next";
import { normalizeBasePath } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cafe 1000 - Every little number counts",
  description:
    "Good food, great company, and one shared collection. Track dining receipt numbers from 000 to 999 with your team.",
  icons: { icon: { url: `${normalizeBasePath(process.env.CAFE_BASE_PATH)}/dining-icon.svg`, type: "image/svg+xml" } },
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
