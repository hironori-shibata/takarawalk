"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { db, storage } from "@/lib/firebase";
import {
    collection,
    query,
    where,
    orderBy,
    getDocs,
    doc,
    getDoc,
    setDoc,
    deleteDoc,
} from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { toDate, formatDateTime } from "@/lib/timeUtils";
import {
    FiCheck,
    FiClock,
    FiMapPin,
    FiEdit3,
    FiSave,
    FiExternalLink,
    FiTrash2,
    FiAlertTriangle,
} from "react-icons/fi";
import { FaXTwitter, FaInstagram, FaGithub } from "react-icons/fa6";

interface PuzzleItem {
    id: string;
    title: string;
    location?: string;
    imageUrl?: string;
    solved: boolean;
    solvedBy: string | null;
    createdAt: unknown;
    answerType: "keyword" | "qrcode";
}

interface SocialLinks {
    twitter?: string;
    instagram?: string;
    github?: string;
}

export default function UserProfilePage() {
    const params = useParams();
    const { user } = useAuth();
    const userId = params.id as string;
    const isOwnProfile = user?.uid === userId;

    const [createdPuzzles, setCreatedPuzzles] = useState<PuzzleItem[]>([]);
    const [solvedPuzzles, setSolvedPuzzles] = useState<PuzzleItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState<string>("");

    // Social links
    const [socialLinks, setSocialLinks] = useState<SocialLinks>({});
    const [editingSocial, setEditingSocial] = useState(false);
    const [editLinks, setEditLinks] = useState<SocialLinks>({});
    const [savingSocial, setSavingSocial] = useState(false);

    // Deletion
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    useEffect(() => {
        if (!userId || !db) return;

        async function fetchData() {
            try {
                // Fetch user profile
                const userDoc = await getDoc(doc(db!, "users", userId));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    if (userData.displayName) setUserName(userData.displayName);
                    if (userData.socialLinks) setSocialLinks(userData.socialLinks);
                }

                // Fetch created puzzles
                const createdQuery = query(
                    collection(db!, "puzzles"),
                    where("creatorId", "==", userId),
                    orderBy("createdAt", "desc")
                );
                const createdSnap = await getDocs(createdQuery);
                const created: PuzzleItem[] = [];
                createdSnap.forEach((d) => {
                    const data = d.data();
                    created.push({
                        id: d.id,
                        title: data.title,
                        location: data.location,
                        imageUrl: data.imageUrl,
                        solved: data.solved,
                        solvedBy: data.solvedBy,
                        createdAt: data.createdAt,
                        answerType: data.answerType,
                    });
                    if (!userName && data.creatorName) setUserName(data.creatorName);
                });
                setCreatedPuzzles(created);

                // Fetch solved puzzles — available for both own profile and self-viewing others' page
                // Shows for own profile only (isOwnProfile is checked in render, but we always fetch for logged-in viewing own page)
                const solvedQuery = query(
                    collection(db!, "puzzles"),
                    where("solvedByUid", "==", userId)
                );
                const solvedSnap = await getDocs(solvedQuery);
                const solved: PuzzleItem[] = [];
                solvedSnap.forEach((d) => {
                    const data = d.data();
                    solved.push({
                        id: d.id,
                        title: data.title,
                        location: data.location,
                        imageUrl: data.imageUrl,
                        solved: data.solved,
                        solvedBy: data.solvedBy,
                        createdAt: data.createdAt,
                        answerType: data.answerType,
                    });
                });
                setSolvedPuzzles(solved);
            } catch (error) {
                console.error("Error fetching user data:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]);

    async function handleSaveSocial() {
        if (!db || !isOwnProfile) return;
        setSavingSocial(true);
        try {
            await setDoc(
                doc(db, "users", userId),
                {
                    displayName: user?.displayName || userName,
                    socialLinks: {
                        twitter: editLinks.twitter?.trim() || "",
                        instagram: editLinks.instagram?.trim() || "",
                        github: editLinks.github?.trim() || "",
                    },
                },
                { merge: true }
            );
            setSocialLinks({ ...editLinks });
            setEditingSocial(false);
        } catch (error) {
            console.error("Error saving social links:", error);
            alert("保存に失敗しました");
        } finally {
            setSavingSocial(false);
        }
    }

    async function handleDeletePuzzle(puzzleId: string, imageUrl?: string) {
        if (!db || !isOwnProfile) return;
        try {
            await deleteDoc(doc(db, "puzzles", puzzleId));

            // Delete image from storage
            if (storage && imageUrl) {
                try {
                    await deleteObject(ref(storage, imageUrl));
                } catch {
                    // Image may not exist
                }
            }

            setCreatedPuzzles((prev) => prev.filter((p) => p.id !== puzzleId));
            setDeleteConfirm(null);
        } catch (error) {
            console.error("Error deleting puzzle:", error);
            alert("削除に失敗しました");
        }
    }

    function openEditSocial() {
        setEditLinks({ ...socialLinks });
        setEditingSocial(true);
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

    const hasSocialLinks = socialLinks.twitter || socialLinks.instagram || socialLinks.github;

    return (
        <div className="max-w-3xl mx-auto px-6 py-12">
            {/* Header */}
            <div className="text-center mb-8">
                <h1 className="font-[family-name:var(--font-orbitron)] text-3xl font-bold neon-text-blue mb-2">
                    {userName || "USER"}
                </h1>
                <div className="flex items-center justify-center gap-6 text-sm text-text-secondary">
                    <span>
                        作成: <span className="text-neon-blue font-bold">{createdPuzzles.length}</span> 件
                    </span>
                    {isOwnProfile && (
                        <span>
                            解決: <span className="text-neon-pink font-bold">{solvedPuzzles.length}</span> 件
                        </span>
                    )}
                </div>
            </div>

            {/* Social Links */}
            {(hasSocialLinks || isOwnProfile) && (
                <div className="cyber-card p-4 mb-8">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">SOCIAL LINKS</span>
                        {isOwnProfile && !editingSocial && (
                            <button
                                onClick={openEditSocial}
                                className="text-xs text-text-muted hover:text-neon-blue transition-colors flex items-center gap-1"
                            >
                                <FiEdit3 size={12} />編集
                            </button>
                        )}
                    </div>

                    {editingSocial ? (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <FaXTwitter size={16} className="text-text-muted flex-shrink-0" />
                                <input
                                    type="text"
                                    value={editLinks.twitter || ""}
                                    onChange={(e) => setEditLinks((p) => ({ ...p, twitter: e.target.value }))}
                                    placeholder="Xのユーザー名 (例: @username)"
                                    className="cyber-input text-sm"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <FaInstagram size={16} className="text-text-muted flex-shrink-0" />
                                <input
                                    type="text"
                                    value={editLinks.instagram || ""}
                                    onChange={(e) => setEditLinks((p) => ({ ...p, instagram: e.target.value }))}
                                    placeholder="Instagramのユーザー名"
                                    className="cyber-input text-sm"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <FaGithub size={16} className="text-text-muted flex-shrink-0" />
                                <input
                                    type="text"
                                    value={editLinks.github || ""}
                                    onChange={(e) => setEditLinks((p) => ({ ...p, github: e.target.value }))}
                                    placeholder="GitHubのユーザー名"
                                    className="cyber-input text-sm"
                                />
                            </div>
                            <div className="flex gap-2 justify-end">
                                <button onClick={() => setEditingSocial(false)} className="text-xs px-3 py-1 text-text-muted hover:text-text-primary transition-colors">
                                    キャンセル
                                </button>
                                <button onClick={handleSaveSocial} disabled={savingSocial} className="cyber-btn text-xs flex items-center gap-1">
                                    <FiSave size={12} />
                                    {savingSocial ? "保存中..." : "保存"}
                                </button>
                            </div>
                        </div>
                    ) : hasSocialLinks ? (
                        <div className="flex items-center gap-4 flex-wrap">
                            {socialLinks.twitter && (
                                <a href={`https://x.com/${socialLinks.twitter.replace(/^@/, "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-neon-blue transition-colors">
                                    <FaXTwitter size={16} />{socialLinks.twitter}<FiExternalLink size={10} />
                                </a>
                            )}
                            {socialLinks.instagram && (
                                <a href={`https://instagram.com/${socialLinks.instagram.replace(/^@/, "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-neon-pink transition-colors">
                                    <FaInstagram size={16} />{socialLinks.instagram}<FiExternalLink size={10} />
                                </a>
                            )}
                            {socialLinks.github && (
                                <a href={`https://github.com/${socialLinks.github}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-neon-green transition-colors">
                                    <FaGithub size={16} />{socialLinks.github}<FiExternalLink size={10} />
                                </a>
                            )}
                        </div>
                    ) : (
                        <p className="text-xs text-text-muted">ソーシャルリンクが設定されていません</p>
                    )}
                </div>
            )}

            {/* Created Puzzles */}
            <section className="mb-12">
                <h2 className="font-[family-name:var(--font-orbitron)] text-xl font-bold neon-text-blue mb-6 flex items-center gap-2">
                    <FiClock size={20} />作成した謎
                </h2>
                {createdPuzzles.length === 0 ? (
                    <p className="text-text-muted text-center py-8">まだ謎を作成していません</p>
                ) : (
                    <div className="space-y-3">
                        {createdPuzzles.map((p) => (
                            <PuzzleCard
                                key={p.id}
                                puzzle={p}
                                showDelete={isOwnProfile}
                                deleteConfirm={deleteConfirm}
                                onDeleteRequest={(id) => setDeleteConfirm(id)}
                                onDeleteConfirm={handleDeletePuzzle}
                                onDeleteCancel={() => setDeleteConfirm(null)}
                            />
                        ))}
                    </div>
                )}
            </section>

            {/* Solved Puzzles (own profile only) */}
            {isOwnProfile && (
                <section>
                    <h2 className="font-[family-name:var(--font-orbitron)] text-xl font-bold neon-text-pink mb-6 flex items-center gap-2">
                        <FiCheck size={20} />解いた謎
                    </h2>
                    {solvedPuzzles.length === 0 ? (
                        <p className="text-text-muted text-center py-8">まだ謎を解いていません</p>
                    ) : (
                        <div className="space-y-3">
                            {solvedPuzzles.map((p) => (
                                <PuzzleCard
                                    key={p.id}
                                    puzzle={p}
                                    showDelete={false}
                                    deleteConfirm={null}
                                    onDeleteRequest={() => { }}
                                    onDeleteConfirm={async () => { }}
                                    onDeleteCancel={() => { }}
                                />
                            ))}
                        </div>
                    )}
                </section>
            )}
        </div>
    );
}

interface PuzzleCardProps {
    puzzle: PuzzleItem;
    showDelete: boolean;
    deleteConfirm: string | null;
    onDeleteRequest: (id: string) => void;
    onDeleteConfirm: (id: string, imageUrl?: string) => Promise<void>;
    onDeleteCancel: () => void;
}

function PuzzleCard({
    puzzle,
    showDelete,
    deleteConfirm,
    onDeleteRequest,
    onDeleteConfirm,
    onDeleteCancel,
}: PuzzleCardProps) {
    const createdDate = toDate(puzzle.createdAt);
    const isConfirming = deleteConfirm === puzzle.id;

    return (
        <div className="cyber-card p-4 flex items-center justify-between group">
            <Link href={`/puzzle/${puzzle.id}`} className="flex-1 min-w-0 block">
                <h3 className="font-bold text-text-primary truncate group-hover:text-neon-blue transition-colors">
                    {puzzle.title}
                </h3>
                <div className="flex items-center gap-3 mt-1">
                    {puzzle.location && (
                        <span className="text-xs text-text-muted flex items-center gap-1">
                            <FiMapPin size={12} />{puzzle.location}
                        </span>
                    )}
                    {createdDate && (
                        <span className="text-xs text-text-muted">{formatDateTime(createdDate)}</span>
                    )}
                </div>
            </Link>

            <div className="ml-4 flex items-center gap-2 flex-shrink-0">
                {/* Solved badge */}
                {puzzle.solved ? (
                    <span className="text-xs px-2 py-1 bg-neon-pink/10 text-neon-pink border border-neon-pink/30 rounded-sm">
                        解決済み
                    </span>
                ) : (
                    <span className="text-xs px-2 py-1 bg-neon-blue/10 text-neon-blue border border-neon-blue/30 rounded-sm">
                        未解決
                    </span>
                )}

                {/* Delete */}
                {showDelete && (
                    isConfirming ? (
                        <div className="flex items-center gap-1">
                            {puzzle.solved && (
                                <FiAlertTriangle size={12} className="text-neon-yellow" title="解決済みです" />
                            )}
                            <button
                                onClick={() => onDeleteConfirm(puzzle.id, puzzle.imageUrl)}
                                className="text-xs px-2 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-sm hover:bg-red-500/40 transition-colors"
                            >
                                削除
                            </button>
                            <button
                                onClick={onDeleteCancel}
                                className="text-xs px-2 py-1 text-text-muted hover:text-text-primary transition-colors"
                            >
                                戻る
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => onDeleteRequest(puzzle.id)}
                            className="p-1.5 text-text-muted hover:text-neon-pink transition-colors opacity-0 group-hover:opacity-100"
                            title="削除"
                        >
                            <FiTrash2 size={14} />
                        </button>
                    )
                )}
            </div>
        </div>
    );
}
