import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Broodjes Bestellen - VH Engineering",
    description: "Bestel je favoriete belegde broodjes voor donderdag!",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="nl">
            <body>{children}</body>
        </html>
    );
}
