"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { signInWithGoogle, signOut } from "@/lib/auth";
import { FiLogIn, FiLogOut, FiPlus, FiShield } from "react-icons/fi";

export default function Navbar() {
    const { user, loading } = useAuth();

    const adminUid = process.env.NEXT_PUBLIC_ADMIN_UID;
    const isAdmin = user && adminUid && user.uid === adminUid;

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-3 bg-cyber-surface/80 backdrop-blur-md border-b border-cyber-border">
            <Link href="/" className="flex items-center gap-2 group">
                <span className="font-[family-name:var(--font-orbitron)] text-xl font-bold neon-text-blue tracking-wider group-hover:animate-glitch">
                    TAKARA
                </span>
                <span className="font-[family-name:var(--font-orbitron)] text-xl font-bold neon-text-pink tracking-wider">
                    WALK
                </span>
            </Link>

            <div className="flex items-center gap-4">
                {!loading && (
                    <>
                        {user ? (
                            <>
                                <Link
                                    href="/create"
                                    className="cyber-btn flex items-center gap-2 text-sm"
                                >
                                    <FiPlus size={16} />
                                    <span className="hidden sm:inline">謎を作る</span>
                                </Link>
                                {isAdmin && (
                                    <Link
                                        href="/admin"
                                        className="p-2 text-neon-yellow hover:text-neon-pink transition-colors"
                                        title="管理者画面"
                                    >
                                        <FiShield size={18} />
                                    </Link>
                                )}
                                <div className="flex items-center gap-3">
                                    <Link
                                        href={`/user/${user.uid}`}
                                        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                                    >
                                        {user.photoURL && (
                                            <img
                                                src={user.photoURL}
                                                alt="avatar"
                                                className="w-8 h-8 rounded-full border border-neon-blue"
                                            />
                                        )}
                                        <span className="text-sm text-text-secondary hidden sm:inline hover:text-neon-blue transition-colors">
                                            {user.displayName}
                                        </span>
                                    </Link>
                                    <button
                                        onClick={() => signOut()}
                                        className="p-2 text-text-muted hover:text-neon-pink transition-colors"
                                        title="ログアウト"
                                    >
                                        <FiLogOut size={18} />
                                    </button>
                                </div>
                            </>
                        ) : (
                            <button
                                onClick={() => signInWithGoogle()}
                                className="cyber-btn flex items-center gap-2 text-sm"
                            >
                                <FiLogIn size={16} />
                                <span>ログイン</span>
                            </button>
                        )}
                    </>
                )}
            </div>
        </nav>
    );
}
