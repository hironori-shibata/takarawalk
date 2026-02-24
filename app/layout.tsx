import type { Metadata } from "next";
import { Orbitron, Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";

const orbitron = Orbitron({
    subsets: ["latin"],
    variable: "--font-orbitron",
    display: "swap",
});

const notoSansJP = Noto_Sans_JP({
    subsets: ["latin"],
    variable: "--font-noto",
    display: "swap",
});

export const metadata: Metadata = {
    title: "TakaraWalk — 先着1名の謎解きバトル",
    description:
        "先着1名のみがクリアできる謎解き共有Webアプリ。問題作成者が1枚絵の謎を投稿し、最初に解いたユーザーだけが勝者になります。",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ja" className={`${orbitron.variable} ${notoSansJP.variable}`}>
            <body className="font-[family-name:var(--font-noto)]">
                <AuthProvider>
                    <div className="grid-overlay" />
                    <div className="scanline" />
                    <Navbar />
                    <main className="relative z-10 min-h-screen pt-16">
                        {children}
                    </main>
                </AuthProvider>
            </body>
        </html>
    );
}
