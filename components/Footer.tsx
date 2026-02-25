import Link from "next/link";

export default function Footer() {
    return (
        <footer className="relative z-10 border-t border-cyber-border bg-cyber-surface/60 backdrop-blur-sm mt-auto">
            <div className="max-w-4xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-xs text-text-muted font-[family-name:var(--font-orbitron)] tracking-wider">
                    © 2026 <span className="neon-text-blue">TAKARA</span><span className="neon-text-pink">WALK</span>
                </p>
                <nav className="flex items-center gap-6">
                    <Link
                        href="/terms"
                        className="text-xs text-text-muted hover:text-neon-blue transition-colors"
                    >
                        利用規約
                    </Link>
                    <Link
                        href="/privacy"
                        className="text-xs text-text-muted hover:text-neon-pink transition-colors"
                    >
                        プライバシーポリシー
                    </Link>
                </nav>
            </div>
        </footer>
    );
}
