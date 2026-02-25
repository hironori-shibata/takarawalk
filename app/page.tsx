"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { signInWithGoogle } from "@/lib/auth";
import { db } from "@/lib/firebase";
import {
    collection,
    query,
    orderBy,
    limit,
    getDocs,
    startAfter,
    where,
    QueryDocumentSnapshot,
    DocumentData,
} from "firebase/firestore";
import { toDate, formatDateTime, formatElapsed } from "@/lib/timeUtils";
import { FiZap, FiLock, FiShare2, FiArrowRight, FiMapPin, FiClock, FiChevronDown } from "react-icons/fi";

interface RecentPuzzle {
    id: string;
    title: string;
    location?: string;
    creatorId: string;
    creatorName: string;
    solved: boolean;
    solvedBy: string | null;
    createdAt: unknown;
    solvedAt: unknown;
}

const PAGE_SIZE = 5;

export default function HomePage() {
    const { user } = useAuth();
    const [puzzles, setPuzzles] = useState<RecentPuzzle[]>([]);
    const [hasMore, setHasMore] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [unsolvedOnly, setUnsolvedOnly] = useState(false);
    const lastDocRef = useRef<QueryDocumentSnapshot<DocumentData> | null>(null);
    const [, setTick] = useState(0); // for elapsed time re-render

    const fetchPuzzles = useCallback(
        async (append: boolean) => {
            if (!db) return;
            if (append) setLoadingMore(true);

            try {
                const constraints = [
                    collection(db, "puzzles"),
                ];

                // Build query
                let q;
                if (unsolvedOnly) {
                    if (append && lastDocRef.current) {
                        q = query(
                            collection(db, "puzzles"),
                            where("solved", "==", false),
                            orderBy("createdAt", "desc"),
                            startAfter(lastDocRef.current),
                            limit(PAGE_SIZE)
                        );
                    } else {
                        q = query(
                            collection(db, "puzzles"),
                            where("solved", "==", false),
                            orderBy("createdAt", "desc"),
                            limit(PAGE_SIZE)
                        );
                    }
                } else {
                    if (append && lastDocRef.current) {
                        q = query(
                            collection(db, "puzzles"),
                            orderBy("createdAt", "desc"),
                            startAfter(lastDocRef.current),
                            limit(PAGE_SIZE)
                        );
                    } else {
                        q = query(
                            collection(db, "puzzles"),
                            orderBy("createdAt", "desc"),
                            limit(PAGE_SIZE)
                        );
                    }
                }

                const snap = await getDocs(q);
                const newPuzzles: RecentPuzzle[] = [];
                snap.forEach((docSnap) => {
                    const d = docSnap.data();
                    newPuzzles.push({
                        id: docSnap.id,
                        title: d.title,
                        location: d.location,
                        creatorId: d.creatorId,
                        creatorName: d.creatorName,
                        solved: d.solved,
                        solvedBy: d.solvedBy,
                        createdAt: d.createdAt,
                        solvedAt: d.solvedAt,
                    });
                });

                if (snap.docs.length > 0) {
                    lastDocRef.current = snap.docs[snap.docs.length - 1];
                }

                setHasMore(snap.docs.length >= PAGE_SIZE);

                if (append) {
                    setPuzzles((prev) => [...prev, ...newPuzzles]);
                } else {
                    setPuzzles(newPuzzles);
                }
            } catch (error) {
                console.error("Error fetching puzzles:", error);
            } finally {
                setLoadingMore(false);
            }
        },
        [unsolvedOnly]
    );

    // Initial fetch + re-fetch when filter changes
    useEffect(() => {
        lastDocRef.current = null;
        fetchPuzzles(false);
    }, [fetchPuzzles]);

    // Elapsed time ticker (update every minute)
    useEffect(() => {
        const interval = setInterval(() => setTick((t) => t + 1), 60000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="relative">
            {/* Hero Section */}
            <section className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-6 text-center">
                {/* Decorative elements */}
                <div className="absolute top-20 left-10 w-32 h-32 bg-neon-blue/5 rounded-full blur-3xl animate-pulse-neon" />
                <div className="absolute bottom-20 right-10 w-40 h-40 bg-neon-pink/5 rounded-full blur-3xl animate-pulse-neon" />

                <div className="animate-float mb-8">
                    <div className="relative">
                        <h1 className="font-[family-name:var(--font-orbitron)] text-5xl sm:text-7xl font-black tracking-wider">
                            <span className="neon-text-blue">TAKARA</span>
                            <span className="neon-text-pink">WALK</span>
                        </h1>
                        <div className="mt-2 h-[2px] bg-gradient-to-r from-transparent via-neon-blue to-transparent" />
                    </div>
                </div>

                <p className="text-xl sm:text-2xl text-text-secondary mb-4 max-w-2xl">
                    先着<span className="neon-text-blue font-bold text-3xl mx-1">1</span>名のみがクリアできる
                </p>
                <p className="text-lg text-text-muted mb-12 max-w-xl">
                    謎解き共有バトルプラットフォーム
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                    {user ? (
                        <Link href="/create" className="cyber-btn text-lg px-8 py-4 flex items-center gap-2">
                            <FiZap size={20} />
                            謎を作成する
                            <FiArrowRight size={18} />
                        </Link>
                    ) : (
                        <button
                            onClick={() => signInWithGoogle()}
                            className="cyber-btn text-lg px-8 py-4 flex items-center gap-2"
                        >
                            <FiZap size={20} />
                            ログインして始める
                            <FiArrowRight size={18} />
                        </button>
                    )}
                </div>
            </section>

            {/* Recent Puzzles Section */}
            <section className="px-6 py-20 max-w-4xl mx-auto">
                <h2 className="font-[family-name:var(--font-orbitron)] text-2xl sm:text-3xl font-bold text-center neon-text-pink mb-8">
                    RECENT PUZZLES
                </h2>

                {/* Filter toggle */}
                <div className="flex items-center justify-end mb-6">
                    <label className="flex items-center gap-2 cursor-pointer group">
                        <span className="text-xs text-text-muted group-hover:text-text-secondary transition-colors">
                            未解決のみ
                        </span>
                        <button
                            role="switch"
                            aria-checked={unsolvedOnly}
                            onClick={() => setUnsolvedOnly((v) => !v)}
                            className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${unsolvedOnly
                                ? "bg-neon-green/40 border border-neon-green/60"
                                : "bg-cyber-surface border border-cyber-border"
                                }`}
                        >
                            <span
                                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-transform duration-200 ${unsolvedOnly
                                    ? "translate-x-5 bg-neon-green shadow-[0_0_6px_rgba(0,255,136,0.5)]"
                                    : "translate-x-0 bg-text-muted"
                                    }`}
                            />
                        </button>
                    </label>
                </div>

                {puzzles.length === 0 ? (
                    <p className="text-text-muted text-center py-8">
                        {unsolvedOnly ? "未解決の投稿がありません" : "投稿がありません"}
                    </p>
                ) : (
                    <div className="space-y-3">
                        {puzzles.map((p) => (
                            <PuzzleCard key={p.id} puzzle={p} />
                        ))}
                    </div>
                )}

                {/* Load more button */}
                {hasMore && (
                    <div className="text-center mt-8">
                        <button
                            onClick={() => fetchPuzzles(true)}
                            disabled={loadingMore}
                            className="cyber-btn cyber-btn-pink flex items-center gap-2 mx-auto"
                        >
                            {loadingMore ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-neon-pink border-t-transparent rounded-full animate-spin" />
                                    読み込み中...
                                </>
                            ) : (
                                <>
                                    <FiChevronDown size={16} />
                                    もっと見る
                                </>
                            )}
                        </button>
                    </div>
                )}
            </section>

            {/* Features Section */}
            <section className="px-6 py-20 max-w-5xl mx-auto">
                <h2 className="font-[family-name:var(--font-orbitron)] text-2xl sm:text-3xl font-bold text-center neon-text-blue mb-16">
                    HOW IT WORKS
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <FeatureCard
                        icon={<FiZap className="text-neon-blue" size={32} />}
                        title="謎を投稿"
                        description="1枚の画像で謎を作成。キーワードまたはQRコードで回答方式を選べます。"
                        color="blue"
                    />
                    <FeatureCard
                        icon={<FiShare2 className="text-neon-pink" size={32} />}
                        title="リンクを共有"
                        description="生成された共有リンクで誰でも挑戦可能。ログイン不要で即座にプレイ。"
                        color="pink"
                    />
                    <FeatureCard
                        icon={<FiLock className="text-neon-green" size={32} />}
                        title="先着1名"
                        description="最初に正解した1名のみが勝者。リアルタイムで競い合う緊張感。"
                        color="green"
                    />
                </div>
            </section>
        </div>
    );
}

function PuzzleCard({ puzzle }: { puzzle: RecentPuzzle }) {
    const createdDate = toDate(puzzle.createdAt);
    const solvedDate = toDate(puzzle.solvedAt);

    let elapsed = "";
    if (createdDate) {
        if (puzzle.solved && solvedDate) {
            elapsed = formatElapsed(createdDate, solvedDate) + "で解決";
        } else if (!puzzle.solved) {
            elapsed = formatElapsed(createdDate) + "経過";
        }
    }

    return (
        <Link
            href={`/puzzle/${puzzle.id}`}
            className="cyber-card flex items-center justify-between p-4 group block hover:border-neon-blue transition-colors"
        >
            <div className="flex-1 min-w-0">
                <p className="font-bold text-text-primary truncate group-hover:text-neon-blue transition-colors">
                    {puzzle.title}
                </p>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="text-xs text-text-muted">
                        by{" "}
                        <Link
                            href={`/user/${puzzle.creatorId}`}
                            className="hover:text-neon-blue transition-colors"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {puzzle.creatorName}
                        </Link>
                    </span>
                    {puzzle.location && (
                        <span className="text-xs text-text-muted flex items-center gap-1">
                            <FiMapPin size={10} />
                            {puzzle.location}
                        </span>
                    )}
                    {createdDate && (
                        <span className="text-xs text-text-muted">
                            {formatDateTime(createdDate)}
                        </span>
                    )}
                    {elapsed && (
                        <span className="text-xs text-text-muted flex items-center gap-1">
                            <FiClock size={10} />
                            {elapsed}
                        </span>
                    )}
                </div>
            </div>
            <div className="ml-4 flex-shrink-0">
                {puzzle.solved ? (
                    <span className="text-xs px-2 py-1 bg-neon-pink/10 text-neon-pink border border-neon-pink/30 rounded-sm">
                        🔒 {puzzle.solvedBy}
                    </span>
                ) : (
                    <span className="text-xs px-2 py-1 bg-neon-green/10 text-neon-green border border-neon-green/30 rounded-sm animate-pulse-neon">
                        挑戦可能
                    </span>
                )}
            </div>
        </Link>
    );
}

function FeatureCard({
    icon,
    title,
    description,
    color,
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
    color: "blue" | "pink" | "green";
}) {
    const borderColor = {
        blue: "hover:border-neon-blue hover:shadow-[0_0_15px_rgba(0,240,255,0.15)]",
        pink: "hover:border-neon-pink hover:shadow-[0_0_15px_rgba(255,0,229,0.15)]",
        green: "hover:border-neon-green hover:shadow-[0_0_15px_rgba(0,255,136,0.15)]",
    }[color];

    return (
        <div
            className={`cyber-card flex flex-col items-center text-center p-8 transition-all duration-300 ${borderColor}`}
        >
            <div className="mb-4">{icon}</div>
            <h3 className="font-[family-name:var(--font-orbitron)] text-lg font-bold mb-3">{title}</h3>
            <p className="text-text-secondary text-sm leading-relaxed">{description}</p>
        </div>
    );
}
