import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { LiffProvider } from "@/components/LiffProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Groomer Mate",
    description: "Pet Groomer CRM",
    manifest: "/manifest.json",
};

export const viewport: Viewport = {
    themeColor: "#ffffff",
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const liffId = process.env.NEXT_PUBLIC_LIFF_ID || "";

    return (
        <html lang="zh-TW">
            <body className={inter.className}>
                <LiffProvider liffId={liffId}>
                    {children}
                </LiffProvider>
            </body>
        </html>
    );
}
