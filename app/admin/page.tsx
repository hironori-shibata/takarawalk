"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { signInWithGoogle } from "@/lib/auth";
import { db, storage } from "@/lib/firebase";
import {
    collection,
    query,
    orderBy,
    getDocs,
    deleteDoc,
    doc,
    where,
} from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { FiTrash2, FiAlertTriangle, FiUser, FiFileText, FiExternalLink } from "react-icons/fi";

interface PuzzleItem {
    id: string;
    title: string;
    imageUrl: string;
    creatorId: string;
    creatorName: string;
    solved: boolean;
    solvedBy: string | null;
    answerType: string;
}

interface UserSummary {
    uid: string;
    name: string;
    puzzleCount: number;
}

export default function AdminPage() {
    const { user, loading: authLoading } = useAuth();
    const adminUid = process.env.NEXT_PUBLIC_ADMIN_UID;
    const isAdmin = user && adminUid && user.uid === adminUid;

    const [puzzles, setPuzzles] = useState<PuzzleItem[]>([]);
    const [users, setUsers] = useState<UserSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<"puzzles" | "users">("puzzles");
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    useEffect(() => {
        if (!isAdmin || !db) return;

        async function fetchData() {
            try {
                // Fetch all puzzles
                const puzzlesQuery = query(
                    collection(db!, "puzzles"),
                    orderBy("createdAt", "desc")
                );
                const puzzlesSnap = await getDocs(puzzlesQuery);
                const puzzleList: PuzzleItem[] = [];
                const puzzleCountMap = new Map<string, number>();

                puzzlesSnap.forEach((docSnap) => {
                    const data = docSnap.data();
                    puzzleList.push({
                        id: docSnap.id,
                        title: data.title,
                        imageUrl: data.imageUrl,
                        creatorId: data.creatorId,
                        creatorName: data.creatorName,
                        solved: data.solved,
                        solvedBy: data.solvedBy,
                        answerType: data.answerType,
                    });

                    // Count puzzles per user
                    const uid = data.creatorId;
                    puzzleCountMap.set(uid, (puzzleCountMap.get(uid) || 0) + 1);
                });

                // Fetch all users from users collection
                const usersSnap = await getDocs(collection(db!, "users"));
                const userMap = new Map<string, UserSummary>();
                usersSnap.forEach((docSnap) => {
                    const data = docSnap.data();
                    userMap.set(docSnap.id, {
                        uid: docSnap.id,
                        name: data.displayName || "匿名",
                        puzzleCount: puzzleCountMap.get(docSnap.id) || 0,
                    });
                });

                // Also include users who posted puzzles but may not have a users doc
                puzzleList.forEach((p) => {
                    if (!userMap.has(p.creatorId)) {
                        userMap.set(p.creatorId, {
                            uid: p.creatorId,
                            name: p.creatorName,
                            puzzleCount: puzzleCountMap.get(p.creatorId) || 0,
                        });
                    }
                });

                setPuzzles(puzzleList);
                setUsers(Array.from(userMap.values()));
            } catch (error) {
                console.error("Error fetching admin data:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [isAdmin]);

    async function handleDeletePuzzle(puzzleId: string, imageUrl: string) {
        if (!db) return;
        try {
            await deleteDoc(doc(db, "puzzles", puzzleId));

            // Try to delete image from storage
            if (storage && imageUrl) {
                try {
                    const imageRef = ref(storage, imageUrl);
                    await deleteObject(imageRef);
                } catch {
                    // Image might not exist or URL format different
                }
            }

            // Update puzzles list
            setPuzzles((prev) => prev.filter((p) => p.id !== puzzleId));

            // Update user puzzle count (decrement but keep user in list)
            const deletedPuzzle = puzzles.find((p) => p.id === puzzleId);
            if (deletedPuzzle) {
                setUsers((prev) =>
                    prev.map((u) =>
                        u.uid === deletedPuzzle.creatorId
                            ? { ...u, puzzleCount: Math.max(0, u.puzzleCount - 1) }
                            : u
                    )
                );
            }

            setDeleteConfirm(null);
        } catch (error) {
            console.error("Error deleting puzzle:", error);
            alert("削除に失敗しました");
        }
    }

    async function handleDeleteUser(uid: string) {
        if (!db) return;
        try {
            // Delete all puzzles by this user
            const userPuzzlesQuery = query(
                collection(db, "puzzles"),
                where("creatorId", "==", uid)
            );
            const snap = await getDocs(userPuzzlesQuery);
            const deletePromises = snap.docs.map((docSnap) => {
                const data = docSnap.data();
                // Delete image
                if (storage && data.imageUrl) {
                    try {
                        const imageRef = ref(storage, data.imageUrl);
                        deleteObject(imageRef).catch(() => { });
                    } catch {
                        // ignore
                    }
                }
                return deleteDoc(doc(db!, "puzzles", docSnap.id));
            });
            await Promise.all(deletePromises);

            setPuzzles((prev) => prev.filter((p) => p.creatorId !== uid));
            setUsers((prev) => prev.filter((u) => u.uid !== uid));
            setDeleteConfirm(null);
        } catch (error) {
            console.error("Error deleting user data:", error);
            alert("削除に失敗しました");
        }
    }

    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-[80vh]">
                <div className="neon-text-blue animate-pulse-neon font-[family-name:var(--font-orbitron)] text-xl">
                    LOADING...
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center">
                <h1 className="font-[family-name:var(--font-orbitron)] text-2xl font-bold neon-text-pink mb-4">
                    ACCESS DENIED
                </h1>
                <p className="text-text-secondary mb-8">ログインが必要です</p>
                <button onClick={() => signInWithGoogle()} className="cyber-btn">
                    Googleでログイン
                </button>
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center">
                <h1 className="font-[family-name:var(--font-orbitron)] text-2xl font-bold neon-text-pink mb-4">
                    ACCESS DENIED
                </h1>
                <p className="text-text-secondary">管理者権限がありません</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[80vh]">
                <div className="neon-text-blue animate-pulse-neon font-[family-name:var(--font-orbitron)] text-xl">
                    LOADING...
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-6 py-12">
            <h1 className="font-[family-name:var(--font-orbitron)] text-3xl font-bold neon-text-blue mb-2 text-center">
                ADMIN PANEL
            </h1>
            <p className="text-text-secondary text-center mb-8">
                投稿とユーザーの管理
            </p>

            {/* Tabs */}
            <div className="flex gap-2 mb-8">
                <button
                    onClick={() => setTab("puzzles")}
                    className={`cyber-btn flex items-center gap-2 ${tab === "puzzles" ? "" : "opacity-50"
                        }`}
                >
                    <FiFileText size={16} />
                    投稿 ({puzzles.length})
                </button>
                <button
                    onClick={() => setTab("users")}
                    className={`cyber-btn cyber-btn-pink flex items-center gap-2 ${tab === "users" ? "" : "opacity-50"
                        }`}
                >
                    <FiUser size={16} />
                    ユーザー ({users.length})
                </button>
            </div>

            {/* Puzzles Tab */}
            {tab === "puzzles" && (
                <div className="space-y-3">
                    {puzzles.length === 0 ? (
                        <p className="text-text-muted text-center py-8">投稿がありません</p>
                    ) : (
                        puzzles.map((p) => (
                            <div
                                key={p.id}
                                className="cyber-card flex items-center justify-between p-4"
                            >
                                <div className="flex-1 min-w-0">
                                    <Link href={`/puzzle/${p.id}`} className="font-bold text-text-primary truncate block hover:text-neon-blue transition-colors">
                                        {p.title}
                                        <FiExternalLink size={12} className="inline ml-1 opacity-50" />
                                    </Link>
                                    <p className="text-xs text-text-muted mt-1">
                                        by{" "}
                                        <Link href={`/user/${p.creatorId}`} className="hover:text-neon-blue transition-colors">
                                            {p.creatorName}
                                        </Link>
                                        {" "}• {p.answerType} •{" "}
                                        {p.solved ? `解決済み (${p.solvedBy})` : "未解決"}
                                    </p>
                                </div>
                                <div className="ml-4 flex-shrink-0">
                                    {deleteConfirm === `puzzle-${p.id}` ? (
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() =>
                                                    handleDeletePuzzle(p.id, p.imageUrl)
                                                }
                                                className="text-xs px-2 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-sm hover:bg-red-500/40 transition-colors"
                                            >
                                                確定
                                            </button>
                                            <button
                                                onClick={() => setDeleteConfirm(null)}
                                                className="text-xs px-2 py-1 text-text-muted hover:text-text-primary transition-colors"
                                            >
                                                戻る
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() =>
                                                setDeleteConfirm(`puzzle-${p.id}`)
                                            }
                                            className="p-2 text-text-muted hover:text-neon-pink transition-colors"
                                            title="削除"
                                        >
                                            <FiTrash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Users Tab */}
            {tab === "users" && (
                <div className="space-y-3">
                    {users.length === 0 ? (
                        <p className="text-text-muted text-center py-8">
                            ユーザーがいません
                        </p>
                    ) : (
                        users.map((u) => (
                            <div
                                key={u.uid}
                                className="cyber-card flex items-center justify-between p-4"
                            >
                                <div className="flex-1 min-w-0">
                                    <Link href={`/user/${u.uid}`} className="font-bold text-text-primary truncate block hover:text-neon-blue transition-colors">
                                        {u.name}
                                        <FiExternalLink size={12} className="inline ml-1 opacity-50" />
                                    </Link>
                                    <p className="text-xs text-text-muted mt-1">
                                        投稿: {u.puzzleCount} 件 • UID: {u.uid.slice(0, 12)}...
                                    </p>
                                </div>
                                <div className="ml-4 flex-shrink-0">
                                    {u.uid === adminUid ? (
                                        <span className="text-xs text-neon-yellow">管理者</span>
                                    ) : deleteConfirm === `user-${u.uid}` ? (
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-1 text-xs text-red-400 mr-2">
                                                <FiAlertTriangle size={12} />
                                                全投稿も削除
                                            </div>
                                            <button
                                                onClick={() => handleDeleteUser(u.uid)}
                                                className="text-xs px-2 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-sm hover:bg-red-500/40 transition-colors"
                                            >
                                                確定
                                            </button>
                                            <button
                                                onClick={() => setDeleteConfirm(null)}
                                                className="text-xs px-2 py-1 text-text-muted hover:text-text-primary transition-colors"
                                            >
                                                戻る
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() =>
                                                setDeleteConfirm(`user-${u.uid}`)
                                            }
                                            className="p-2 text-text-muted hover:text-neon-pink transition-colors"
                                            title="ユーザーと全投稿を削除"
                                        >
                                            <FiTrash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
