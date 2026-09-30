import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { ToastProvider } from "@/app/components/Toast";

export const metadata: Metadata = {
  title: "Splitpay — One payment. Everyone gets their share.",
  description:
    "Splitpay is the payment-distribution layer for collaborative work. Create a Pool, add collaborators, agree on splits, and let Splitpay handle the rest.",
  keywords: ["payment distribution", "split payments", "collaborators", "pools"],
  openGraph: {
    title: "Splitpay — One payment. Everyone gets their share.",
    description:
      "Create a Pool, add collaborators, agree on splits. Splitpay records allocations automatically.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <ToastProvider>
          {children}
        </ToastProvider>
        <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
      </body>
    </html>
  );
}

