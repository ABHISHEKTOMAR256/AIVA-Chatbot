import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AIVA — Hostel Helpdesk AI",
  description:
    "Your AI-Powered Hostel Assistant. Get instant help with complaints, lost items, and more.",
  keywords: ["hostel", "helpdesk", "AI", "assistant", "complaints", "lost and found"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased text-gray-900 bg-gray-50">{children}</body>
    </html>
  );
}
