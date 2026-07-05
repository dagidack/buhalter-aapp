import type { Metadata } from "next";
import { Toaster } from "sonner";
import { Dashboard } from "@/components/dashboard";
import "./globals.css";

export const metadata: Metadata = {
  title: "Yutunus — личный учёт",
  description: "Учёт расходов и загрузка чеков в Google Drive.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="antialiased">
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
