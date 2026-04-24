import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Innovation SL Platform", template: "%s | Innovation SL" },
  description: "Ecosystem Intelligence Platform — Innovation Sierra Leone",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className="antialiased">
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "#2D1B69",
                color: "#fff",
                border: "1px solid #4A2FA0",
                borderRadius: "10px",
                fontSize: "13px",
              },
            }}
          />
        </body>
      </html>
    </ClerkProvider>
  );
}
