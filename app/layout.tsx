import "./globals.css";
import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Our Family Finance",
  description: "A little clarity for your family’s future.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-PH">
      <body>{children}</body>
    </html>
  );
}
