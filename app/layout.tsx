import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kment Punding",
  description: "카페24 펀딩/예약 판매 앱",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
