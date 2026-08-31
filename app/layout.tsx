import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hotel AI Assistant",
  description: "Minimal foundation for the Hotel AI Assistant project.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
