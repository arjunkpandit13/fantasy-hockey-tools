import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Fantasy Hockey Tools - NHL Schedule",
  description:
    "Fantasy hockey NHL schedule dashboard with Sunday-Saturday fantasy weeks, off-night and back-to-back analysis, and streaming scores.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <SiteHeader />
        <main className="mx-auto max-w-[1400px] px-3 py-5 sm:px-5">{children}</main>
      </body>
    </html>
  );
}
