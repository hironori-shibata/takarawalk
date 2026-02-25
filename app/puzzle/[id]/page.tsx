"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import {
    doc,
    runTransaction,
    serverTimestamp,
    onSnapshot,
    updateDoc,
} from "firebase/firestore";
import { toDate, formatDateTime, formatElapsed } from "@/lib/timeUtils";
import { downloadQrImage } from "@/lib/qrImageUtils";
import QrScanner from "@/components/QrScanner";
import { QRCodeSVG } from "qrcode.react";
import {
    FiSend,
    FiCamera,
    FiCheck,
    FiX,
    FiMapPin,
    FiClock,
    FiEdit3,
    FiSave,
    FiDownload,
} from "react-icons/fi";
import { FaXTwitter } from "react-icons/fa6";

interface PuzzleData {
    title: string;
    description?: string;
    location?: string;
    imageUrl: string;
    answerType: "keyword" | "qrcode";
    answer: string;
    answers?: string[];
    creatorId: string;
    creatorName: string;
    solved: boolean;
    solvedBy: string | null;
    solvedByUid?: string | null;
    solvedAt: unknown;
    createdAt: unknown;
}

type ResultState =
    | null
    | { type: "correct"; solvedBy: string }
    | { type: "wrong" }
    | { type: "already_solved"; solvedBy: string }
    | { type: "cooldown"; remaining: number }
    | { type: "error"; message: string };

const RATE_LIMIT_MS = 3000; // 3-second cooldown between answers

function normalize(s: string): string {
    return s.toLowerCase().normalize("NFKC").replace(/\s+/g, "");
}

function PuzzleContent() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user } = useAuth();
    const puzzleId = params.id as string;

    const [puzzle, setPuzzle] = useState<PuzzleData | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [answer, setAnswer] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<ResultState>(null);
    const [showScanner, setShowScanner] = useState(false);
    const [playerName, setPlayerName] = useState("");
    const [nameSubmitted, setNameSubmitted] = useState(false);
    const [tokenProcessed, setTokenProcessed] = useState(false);
    const [elapsedText, setElapsedText] = useState("");

    // Honeypot — humans never fill this
    const [honeypot, setHoneypot] = useState("");

    // Rate limiting
    const lastSubmitTimeRef = useRef<number>(0);

    // Edit mode
    const [editing, setEditing] = useState(false);
    const [editTitle, setEditTitle] = useState("");
    const [editDescription, setEditDescription] = useState("");
    const [editLocation, setEditLocation] = useState("");
    const [saving, setSaving] = useState(false);

    // QR re-issue panel
    const [showQrPanel, setShowQrPanel] = useState(false);
    const [downloadingQr, setDownloadingQr] = useState(false);

    // Auto-fill name if logged in
    useEffect(() => {
        if (user?.displayName && !nameSubmitted) {
            setPlayerName(user.displayName);
            setNameSubmitted(true);
        }
    }, [user, nameSubmitted]);

    // Real-time listener
    useEffect(() => {
        if (!puzzleId || !db) return;
        const unsubscribe = onSnapshot(
            doc(db, "puzzles", puzzleId),
            (snap) => {
                if (snap.exists()) setPuzzle(snap.data() as PuzzleData);
                else setNotFound(true);
                setLoading(false);
            },
            () => { setNotFound(true); setLoading(false); }
        );
        return () => unsubscribe();
    }, [puzzleId]);

    // Elapsed time ticker
    useEffect(() => {
        if (!puzzle) return;
        const createdDate = toDate(puzzle.createdAt);
        if (!createdDate) return;
        if (puzzle.solved) {
            const solvedDate = toDate(puzzle.solvedAt);
            if (solvedDate) setElapsedText(formatElapsed(createdDate, solvedDate));
            return;
        }
        function tick() { setElapsedText(formatElapsed(createdDate!)); }
        tick();
        const interval = setInterval(tick, 60000);
        return () => clearInterval(interval);
    }, [puzzle]);

    const attemptSolve = useCallback(
        async (submittedAnswer: string) => {
            if (!puzzle || submitting || !db) return;
            if (!nameSubmitted || !playerName.trim()) return;

            // --- Bot countermeasures ---
            // 1. Honeypot
            if (honeypot) {
                setResult({ type: "wrong" });
                return;
            }
            // 2. Rate limit
            const now = Date.now();
            const timeSinceLast = now - lastSubmitTimeRef.current;
            if (lastSubmitTimeRef.current > 0 && timeSinceLast < RATE_LIMIT_MS) {
                const remaining = Math.ceil((RATE_LIMIT_MS - timeSinceLast) / 1000);
                setResult({ type: "cooldown", remaining });
                return;
            }
            lastSubmitTimeRef.current = now;
            // --- End bot countermeasures ---

            setSubmitting(true);
            setResult(null);

            try {
                const puzzleRef = doc(db, "puzzles", puzzleId);

                const isCorrect = await runTransaction(db, async (transaction) => {
                    const puzzleDoc = await transaction.get(puzzleRef);
                    if (!puzzleDoc.exists()) throw new Error("Puzzle not found");

                    const data = puzzleDoc.data() as PuzzleData;
                    if (data.solved) {
                        setResult({ type: "already_solved", solvedBy: data.solvedBy || "unknown" });
                        return false;
                    }

                    let correct = false;
                    if (data.answerType === "keyword") {
                        const answerList: string[] =
                            data.answers && data.answers.length > 0
                                ? data.answers
                                : data.answer ? [data.answer] : [];
                        correct = answerList.some(
                            (a) => normalize(submittedAnswer) === normalize(a)
                        );
                    } else {
                        correct =
                            submittedAnswer === data.answer ||
                            (data.answers ? data.answers.includes(submittedAnswer) : false);
                    }

                    if (correct) {
                        transaction.update(puzzleRef, {
                            solved: true,
                            solvedBy: playerName.trim(),
                            solvedByUid: user?.uid || null,
                            solvedAt: serverTimestamp(),
                        });
                        return true;
                    }
                    return false;
                });

                if (isCorrect) {
                    setResult({ type: "correct", solvedBy: playerName.trim() });
                } else if (!result) {
                    setResult({ type: "wrong" });
                }
            } catch (error) {
                console.error("Error submitting answer:", error);
                setResult({ type: "error", message: "エラーが発生しました" });
            } finally {
                setSubmitting(false);
            }
        },
        [puzzle, puzzleId, submitting, playerName, nameSubmitted, result, user, honeypot]
    );

    // Auto-process token from QR URL
    useEffect(() => {
        const token = searchParams.get("token");
        if (token && puzzle && nameSubmitted && !tokenProcessed && !puzzle.solved) {
            setTokenProcessed(true);
            attemptSolve(token);
        }
    }, [searchParams, puzzle, nameSubmitted, tokenProcessed, attemptSolve]);

    // Auto-trigger X share when redirected from create page with ?share=x
    useEffect(() => {
        if (searchParams.get("share") === "x" && puzzle && !loading) {
            const text = `🧩 TakaraWalkに新しい謎を投稿しました！「${puzzle.title}」\n先着1名のみがクリアできる！挑戦してね 👉`;
            const url = `${window.location.origin}/puzzle/${puzzleId}`;
            window.open(
                `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
                "_blank"
            );
            // Clean up URL
            router.replace(`/puzzle/${puzzleId}`);
        }
    }, [searchParams, puzzle, loading, puzzleId, router]);

    function handleKeywordSubmit(e: React.FormEvent) {
        e.preventDefault();
        attemptSolve(answer);
    }

    function handleQrScan(scannedData: string) {
        setShowScanner(false);
        try {
            const url = new URL(scannedData);
            const token = url.searchParams.get("token");
            if (token) {
                if (url.pathname.includes(puzzleId)) {
                    attemptSolve(token);
                } else {
                    router.push(scannedData);
                }
                return;
            }
        } catch { /* not a URL */ }
        attemptSolve(scannedData);
    }

    function shareOnX(text: string) {
        const url = `${window.location.origin}/puzzle/${puzzleId}`;
        window.open(
            `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
            "_blank"
        );
    }

    function startEditing() {
        if (!puzzle) return;
        setEditTitle(puzzle.title);
        setEditDescription(puzzle.description || "");
        setEditLocation(puzzle.location || "");
        setEditing(true);
    }

    async function handleSaveEdit() {
        if (!db || !puzzle) return;
        setSaving(true);
        try {
            await updateDoc(doc(db, "puzzles", puzzleId), {
                title: editTitle.trim(),
                description: editDescription.trim(),
                location: editLocation.trim(),
            });
            setEditing(false);
        } catch {
            alert("保存に失敗しました");
        } finally {
            setSaving(false);
        }
    }

    async function handleDownloadQr() {
        if (!puzzle) return;
        const qrUrl = `${window.location.origin}/puzzle/${puzzleId}?token=${puzzle.answer}`;
        setDownloadingQr(true);
        try {
            await downloadQrImage(qrUrl, puzzle.title);
        } finally {
            setDownloadingQr(false);
        }
    }

    const isCreator = user?.uid === puzzle?.creatorId;

    // ---------- Loading ----------
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[80vh]">
                <div className="neon-text-blue animate-pulse-neon font-[family-name:var(--font-orbitron)] text-xl">LOADING...</div>
            </div>
        );
    }

    // ---------- Not found ----------
    if (notFound || !puzzle) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center">
                <h1 className="font-[family-name:var(--font-orbitron)] text-3xl font-bold neon-text-pink mb-4">404</h1>
                <p className="text-text-secondary">この謎は存在しません</p>
            </div>
        );
    }

    const createdDate = toDate(puzzle.createdAt);
    const isQrType = puzzle.answerType === "qrcode";
    const qrUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/puzzle/${puzzleId}?token=${puzzle.answer}`;

    // ---------- Already solved (not by current session) ----------
    if (puzzle.solved && result?.type !== "correct") {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center">
                <div className="cyber-card max-w-lg w-full p-8">
                    <div className="text-5xl mb-4">🔒</div>
                    <h1 className="font-[family-name:var(--font-orbitron)] text-2xl font-bold neon-text-pink mb-2">SOLVED</h1>
                    <h2 className="text-lg text-text-primary mb-2">{puzzle.title}</h2>
                    {createdDate && <p className="text-xs text-text-muted mb-2">📅 {formatDateTime(createdDate)}</p>}
                    {elapsedText && (
                        <p className="text-xs text-neon-blue mb-4 flex items-center justify-center gap-1">
                            <FiClock size={12} />投稿から {elapsedText} で解決！
                        </p>
                    )}
                    <div className="neon-border-pink p-4 rounded-sm mb-6">
                        <p className="text-text-secondary text-sm mb-1">この謎は</p>
                        <p className="text-xl font-bold neon-text-pink">{puzzle.solvedBy}</p>
                        <p className="text-text-secondary text-sm mt-1">さんに解かれました</p>
                    </div>
                    <img src={puzzle.imageUrl} alt={puzzle.title} className="w-full max-h-[300px] object-contain rounded-sm opacity-50 mb-6" />
                    <button
                        onClick={() => shareOnX(`🔒 TakaraWalkの謎「${puzzle.title}」は${puzzle.solvedBy}さんに解かれました！\n次の挑戦者は誰だ？ 👉`)}
                        className="cyber-btn cyber-btn-pink flex items-center gap-2 mx-auto text-sm px-4 py-2"
                    >
                        <FaXTwitter size={16} />Xでシェアする
                    </button>
                </div>
            </div>
        );
    }

    // ---------- Congratulations ----------
    if (result?.type === "correct") {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center">
                <div className="cyber-card max-w-lg w-full p-8 neon-border">
                    <div className="text-6xl mb-4 animate-float">🏆</div>
                    <h1 className="font-[family-name:var(--font-orbitron)] text-3xl font-bold neon-text-blue mb-2">CONGRATULATIONS</h1>
                    <h2 className="text-lg text-text-primary mb-2">{puzzle.title}</h2>
                    <p className="text-text-secondary mb-6">あなたが最初の正解者です！</p>
                    <div className="neon-border p-4 rounded-sm mb-8">
                        <p className="text-sm text-text-muted mb-1">WINNER</p>
                        <p className="text-2xl font-bold neon-text-blue">{result.solvedBy}</p>
                    </div>
                    <button
                        onClick={() => shareOnX(`🏆 TakaraWalkの謎「${puzzle.title}」を最初に解きました！\n挑戦してみてね 👉`)}
                        className="cyber-btn cyber-btn-pink flex items-center gap-2 mx-auto text-lg px-6 py-3"
                    >
                        <FaXTwitter size={20} />Xでシェアする
                    </button>
                </div>
            </div>
        );
    }

    // ---------- Name input ----------
    if (!nameSubmitted) {
        return (
            <div className="max-w-2xl mx-auto px-6 py-12">
                <div className="cyber-card p-8 text-center">
                    <h1 className="font-[family-name:var(--font-orbitron)] text-2xl font-bold neon-text-blue mb-2">{puzzle.title}</h1>
                    <p className="text-text-secondary mb-8">挑戦する前に名前を入力してください</p>
                    <form
                        onSubmit={(e) => { e.preventDefault(); if (playerName.trim()) setNameSubmitted(true); }}
                        className="max-w-sm mx-auto space-y-4"
                    >
                        <input
                            type="text"
                            value={playerName}
                            onChange={(e) => setPlayerName(e.target.value)}
                            placeholder="あなたの名前..."
                            className="cyber-input text-center"
                            required
                            autoFocus
                        />
                        <button type="submit" disabled={!playerName.trim()} className="cyber-btn w-full">
                            謎に挑戦する
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    // ---------- Main puzzle view ----------
    return (
        <div className="max-w-2xl mx-auto px-6 py-12">
            {/* Header */}
            <div className="text-center mb-8">
                {editing ? (
                    <div className="text-left space-y-4 cyber-card p-6 mb-6">
                        <div>
                            <label className="block text-xs text-text-secondary mb-1 uppercase tracking-wider">タイトル</label>
                            <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="cyber-input" autoFocus />
                        </div>
                        <div>
                            <label className="block text-xs text-text-secondary mb-1 uppercase tracking-wider">概要</label>
                            <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className="cyber-input min-h-[80px] resize-y" rows={3} />
                        </div>
                        <div>
                            <label className="block text-xs text-text-secondary mb-1 uppercase tracking-wider">場所</label>
                            <input type="text" value={editLocation} onChange={(e) => setEditLocation(e.target.value)} className="cyber-input" />
                        </div>
                        <div className="flex gap-2 justify-end">
                            <button onClick={() => setEditing(false)} className="text-xs px-3 py-1.5 text-text-muted hover:text-text-primary transition-colors">キャンセル</button>
                            <button onClick={handleSaveEdit} disabled={saving || !editTitle.trim()} className="cyber-btn text-xs flex items-center gap-1 px-3 py-1.5">
                                {saving ? <div className="w-3 h-3 border-2 border-neon-blue border-t-transparent rounded-full animate-spin" /> : <FiSave size={12} />}
                                {saving ? "保存中..." : "保存"}
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="flex items-start justify-center gap-2">
                            <h1 className="font-[family-name:var(--font-orbitron)] text-2xl sm:text-3xl font-bold neon-text-blue mb-2">
                                {puzzle.title}
                            </h1>
                            {isCreator && !puzzle.solved && (
                                <button onClick={startEditing} className="mt-0.5 p-1.5 text-text-muted hover:text-neon-blue transition-colors">
                                    <FiEdit3 size={16} />
                                </button>
                            )}
                        </div>
                        <p className="text-sm text-text-muted mb-2">
                            出題者:{" "}
                            <Link href={`/user/${puzzle.creatorId}`} className="text-text-secondary hover:text-neon-blue transition-colors hover:underline underline-offset-2">
                                {puzzle.creatorName}
                            </Link>
                        </p>
                    </>
                )}

                <div className="flex items-center justify-center gap-4 flex-wrap">
                    {puzzle.location && (
                        <p className="text-sm text-text-secondary flex items-center gap-1">
                            <FiMapPin size={14} className="text-neon-pink" />{puzzle.location}
                        </p>
                    )}
                    {createdDate && <p className="text-xs text-text-muted">📅 {formatDateTime(createdDate)}</p>}
                </div>
                {elapsedText && !puzzle.solved && (
                    <p className="text-xs text-neon-yellow mt-2 flex items-center justify-center gap-1 animate-pulse-neon">
                        <FiClock size={12} />投稿から {elapsedText} 経過
                    </p>
                )}
                {puzzle.description && (
                    <div className="cyber-card mt-4 p-4 text-left">
                        <p className="text-sm text-text-secondary whitespace-pre-wrap">{puzzle.description}</p>
                    </div>
                )}
            </div>

            {/* Puzzle Image */}
            <div className="mb-8">
                <img src={puzzle.imageUrl} alt={puzzle.title} className="w-full max-h-[500px] object-contain neon-border rounded-sm" />
            </div>

            {/* Answer Section */}
            <div className="cyber-card p-6">
                {/* Honeypot — hidden from humans, check in attemptSolve */}
                <input
                    type="text"
                    name="website"
                    tabIndex={-1}
                    autoComplete="off"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                    aria-hidden="true"
                    style={{ display: "none" }}
                />

                {isQrType ? (
                    <div className="space-y-4">
                        <label className="block text-sm font-bold text-text-secondary uppercase tracking-wider">
                            QRコードをスキャン
                        </label>
                        {showScanner ? (
                            <QrScanner onScan={handleQrScan} onClose={() => setShowScanner(false)} />
                        ) : (
                            <button
                                onClick={() => setShowScanner(true)}
                                disabled={submitting}
                                className="cyber-btn cyber-btn-pink w-full flex items-center justify-center gap-2 py-4"
                            >
                                <FiCamera size={20} />カメラを起動してスキャン
                            </button>
                        )}
                    </div>
                ) : (
                    <form onSubmit={handleKeywordSubmit} className="space-y-4">
                        <label className="block text-sm font-bold text-text-secondary uppercase tracking-wider">
                            回答を入力
                        </label>
                        <div className="flex gap-3">
                            <input
                                type="text"
                                value={answer}
                                onChange={(e) => { setAnswer(e.target.value); setResult(null); }}
                                placeholder="キーワードを入力..."
                                className="cyber-input flex-1"
                                disabled={submitting}
                                autoFocus
                            />
                            <button
                                type="submit"
                                disabled={submitting || !answer.trim()}
                                className="cyber-btn flex items-center gap-2"
                            >
                                {submitting
                                    ? <div className="w-5 h-5 border-2 border-neon-blue border-t-transparent rounded-full animate-spin" />
                                    : <FiSend size={18} />}
                            </button>
                        </div>
                    </form>
                )}

                {/* Result feedback */}
                {result?.type === "wrong" && (
                    <div className="mt-4 flex items-center gap-2 text-neon-pink p-3 bg-neon-pink/10 border border-neon-pink/30 rounded-sm">
                        <FiX size={18} />不正解です。もう一度挑戦してください。
                    </div>
                )}
                {result?.type === "cooldown" && (
                    <div className="mt-4 flex items-center gap-2 text-neon-yellow p-3 bg-neon-yellow/10 border border-neon-yellow/30 rounded-sm">
                        <FiClock size={18} />{result.remaining}秒後に再度回答できます
                    </div>
                )}
                {result?.type === "already_solved" && (
                    <div className="mt-4 flex items-center gap-2 text-neon-yellow p-3 bg-neon-yellow/10 border border-neon-yellow/30 rounded-sm">
                        <FiCheck size={18} />この謎は <strong>{result.solvedBy}</strong> さんに解かれました。
                    </div>
                )}
                {result?.type === "error" && (
                    <div className="mt-4 flex items-center gap-2 text-neon-pink p-3 bg-neon-pink/10 border border-neon-pink/30 rounded-sm">
                        <FiX size={18} />{result.message}
                    </div>
                )}
            </div>

            {/* QR Re-issue panel — creator only, qrcode type */}
            {isCreator && isQrType && (
                <div className="mt-6 cyber-card p-5">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-bold text-text-secondary uppercase tracking-wider">
                            QRコード管理（作成者専用）
                        </span>
                        <button
                            onClick={() => setShowQrPanel((v) => !v)}
                            className="text-xs text-text-muted hover:text-neon-blue transition-colors"
                        >
                            {showQrPanel ? "非表示" : "表示"}
                        </button>
                    </div>
                    {showQrPanel && (
                        <div className="text-center">
                            <p className="text-xs text-text-muted mb-4">
                                QRコードを紛失した場合はこちらから再取得できます。
                            </p>
                            {/* Clickable QR */}
                            <button
                                onClick={handleDownloadQr}
                                disabled={downloadingQr}
                                title="クリックして画像を保存"
                                className="inline-block p-4 bg-white rounded-lg cursor-pointer hover:ring-2 hover:ring-neon-blue transition-all group relative mb-3"
                            >
                                <QRCodeSVG value={qrUrl} size={180} />
                                <span className="absolute inset-0 flex items-end justify-center pb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="bg-black/70 text-neon-blue text-xs px-2 py-1 rounded">
                                        {downloadingQr ? "生成中..." : "📥 画像を保存"}
                                    </span>
                                </span>
                            </button>
                            <div>
                                <button
                                    onClick={handleDownloadQr}
                                    disabled={downloadingQr}
                                    className="cyber-btn text-sm flex items-center gap-2 mx-auto"
                                >
                                    <FiDownload size={14} />
                                    {downloadingQr ? "生成中..." : "ロゴ付き画像を保存"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Footer */}
            <div className="mt-6 flex items-center justify-between">
                <span className="text-sm text-text-muted">
                    プレイヤー: <span className="text-neon-blue">{playerName}</span>
                </span>
                <button
                    onClick={() => shareOnX(`🧩 TakaraWalkの謎「${puzzle.title}」に挑戦中！\nまだ誰も解いてない…！ 👉`)}
                    className="text-xs text-text-muted hover:text-neon-pink transition-colors flex items-center gap-1"
                >
                    <FaXTwitter size={14} />Xでシェア
                </button>
            </div>
        </div>
    );
}

export default function PuzzlePage() {
    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center min-h-[80vh]">
                    <div className="neon-text-blue animate-pulse-neon font-[family-name:var(--font-orbitron)] text-xl">LOADING...</div>
                </div>
            }
        >
            <PuzzleContent />
        </Suspense>
    );
}
