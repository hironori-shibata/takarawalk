"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { signInWithGoogle } from "@/lib/auth";
import { db, storage } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { QRCodeSVG } from "qrcode.react";
import { resizeImageToTarget } from "@/lib/imageUtils";
import { downloadQrImage } from "@/lib/qrImageUtils";
import { FiUpload, FiCheck, FiCopy, FiImage, FiPlus, FiX, FiDownload, FiShare2 } from "react-icons/fi";
import { SHARE_TEMPLATES } from "@/lib/shareTemplates";
import XShareModal from "@/components/XShareModal";

function generateToken(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < 32; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

const MAX_ANSWERS = 10;
const MAX_RAW_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB (raw, before compression)
const MAX_COMPRESSED_SIZE_BYTES = 500 * 1024;      // 500 kB (after compression, fallback limit)

export default function CreatePage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [location, setLocation] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageError, setImageError] = useState<string | null>(null);
    const [answerType, setAnswerType] = useState<"keyword" | "qrcode">("keyword");
    const [answers, setAnswers] = useState<string[]>([""]);
    const [qrToken] = useState(() => generateToken());
    const [submitting, setSubmitting] = useState(false);
    const [createdUrl, setCreatedUrl] = useState<string | null>(null);
    const [createdId, setCreatedId] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [downloadingQr, setDownloadingQr] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);

    if (loading) {
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
                <h1 className="font-[family-name:var(--font-orbitron)] text-2xl font-bold neon-text-blue mb-4">
                    ACCESS DENIED
                </h1>
                <p className="text-text-secondary mb-8">
                    謎を作成するにはログインが必要です
                </p>
                <button onClick={() => signInWithGoogle()} className="cyber-btn">
                    Googleでログイン
                </button>
            </div>
        );
    }

    function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setImageError(null);

        if (file.size > MAX_RAW_FILE_SIZE_BYTES) {
            setImageError("画像は10MB以下にしてください。");
            e.target.value = "";
            return;
        }

        setImageFile(file);
        const reader = new FileReader();
        reader.onload = (ev) => setImagePreview(ev.target?.result as string);
        reader.readAsDataURL(file);
    }

    function updateAnswer(index: number, value: string) {
        setAnswers((prev) => prev.map((a, i) => (i === index ? value : a)));
    }

    function addAnswer() {
        if (answers.length < MAX_ANSWERS) setAnswers((prev) => [...prev, ""]);
    }

    function removeAnswer(index: number) {
        if (answers.length <= 1) return;
        setAnswers((prev) => prev.filter((_, i) => i !== index));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!imageFile || !title.trim()) return;

        const trimmedAnswers = answers.map((a) => a.trim()).filter(Boolean);
        if (answerType === "keyword" && trimmedAnswers.length === 0) return;

        setSubmitting(true);
        try {
            // Resize image client-side before upload (~1MB target)
            const uploadFile = await resizeImageToTarget(imageFile);

            // Check compressed size
            if (uploadFile.size > MAX_COMPRESSED_SIZE_BYTES) {
                setImageError("圧縮後のサイズが500kBを超えています。より小さい画像をお試しください。");
                setSubmitting(false);
                return;
            }

            const imageRef = ref(storage!, `puzzles/${Date.now()}_${uploadFile.name}`);
            await uploadBytes(imageRef, uploadFile);
            const imageUrl = await getDownloadURL(imageRef);

            const finalAnswers = answerType === "keyword" ? trimmedAnswers : [qrToken];

            const docRef = await addDoc(collection(db!, "puzzles"), {
                title: title.trim(),
                description: description.trim(),
                location: location.trim(),
                imageUrl,
                answerType,
                answer: finalAnswers[0],
                answers: finalAnswers,
                creatorId: user!.uid,
                creatorName: user!.displayName || "匿名",
                solved: false,
                solvedBy: null,
                solvedByUid: null,
                solvedAt: null,
                createdAt: serverTimestamp(),
            });

            const url = `${window.location.origin}/puzzle/${docRef.id}`;
            setCreatedUrl(url);
            setCreatedId(docRef.id);
        } catch (error) {
            console.error("Error creating puzzle:", error);
            alert("エラーが発生しました。もう一度お試しください。");
        } finally {
            setSubmitting(false);
        }
    }

    function copyUrl() {
        if (!createdUrl) return;
        navigator.clipboard.writeText(createdUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    async function handleDownloadQr() {
        const qrUrl = `${window.location.origin}/puzzle/${createdId}?token=${qrToken}`;
        setDownloadingQr(true);
        try {
            await downloadQrImage(qrUrl, title.trim());
        } finally {
            setDownloadingQr(false);
        }
    }

    const qrCodeUrl = createdId
        ? `${window.location.origin}/puzzle/${createdId}?token=${qrToken}`
        : qrToken;

    const hasValidAnswers =
        answerType === "qrcode" || answers.some((a) => a.trim().length > 0);

    // ---------- Success screen ----------
    if (createdUrl) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center">
                <div className="cyber-card max-w-lg w-full p-8">
                    <div className="text-4xl mb-4">🎉</div>
                    <h1 className="font-[family-name:var(--font-orbitron)] text-2xl font-bold neon-text-blue mb-2">
                        PUZZLE CREATED
                    </h1>
                    <p className="text-text-secondary mb-6">
                        謎が作成されました！リンクを共有して挑戦者を待ちましょう。
                    </p>

                    <div className="flex items-center gap-2 mb-6">
                        <input
                            type="text"
                            value={createdUrl}
                            readOnly
                            className="cyber-input text-sm text-neon-blue"
                        />
                        <button
                            onClick={copyUrl}
                            className="cyber-btn flex items-center gap-1 whitespace-nowrap"
                        >
                            {copied ? <FiCheck size={16} /> : <FiCopy size={16} />}
                            {copied ? "コピー済み" : "コピー"}
                        </button>
                    </div>

                    {answerType === "qrcode" && (
                        <div className="mb-6">
                            <p className="text-sm text-text-secondary mb-3">
                                以下のQRコードを印刷して謎の現場に設置してください。
                                <br />
                                <span className="text-xs text-text-muted">
                                    スキャンするとパズルページに直接移動し、自動回答されます。
                                </span>
                            </p>
                            {/* Clickable QR — click to download branded image */}
                            <button
                                onClick={handleDownloadQr}
                                disabled={downloadingQr}
                                title="クリックして画像を保存"
                                className="inline-block p-4 bg-white rounded-lg cursor-pointer hover:ring-2 hover:ring-neon-blue transition-all group relative"
                            >
                                <QRCodeSVG value={qrCodeUrl} size={200} />
                                <span className="absolute inset-0 flex items-end justify-center pb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="bg-black/70 text-neon-blue text-xs px-2 py-1 rounded">
                                        {downloadingQr ? "生成中..." : "📥 画像を保存"}
                                    </span>
                                </span>
                            </button>
                            <p className="text-xs text-text-muted mt-2">
                                クリックするとロゴ付き画像を保存できます
                            </p>
                        </div>
                    )}

                    <div className="flex gap-3 justify-center flex-wrap">
                        <button
                            onClick={() => setShowShareModal(true)}
                            className="cyber-btn cyber-btn-pink flex items-center gap-2"
                        >
                            <FiShare2 size={16} />
                            SNSでシェアする
                        </button>
                        {answerType === "qrcode" && (
                            <button
                                onClick={handleDownloadQr}
                                disabled={downloadingQr}
                                className="cyber-btn flex items-center gap-2"
                            >
                                <FiDownload size={16} />
                                QR画像を保存
                            </button>
                        )}
                        <button
                            onClick={() => router.push(`/puzzle/${createdId}`)}
                            className="cyber-btn"
                        >
                            謎を確認
                        </button>
                        <button
                            onClick={() => {
                                setCreatedUrl(null);
                                setCreatedId(null);
                                setTitle("");
                                setDescription("");
                                setLocation("");
                                setImageFile(null);
                                setImagePreview(null);
                                setAnswers([""]);
                            }}
                            className="cyber-btn cyber-btn-pink"
                        >
                            もう1つ作る
                        </button>
                    </div>
                </div>

                {createdId && (
                    <XShareModal
                        isOpen={showShareModal}
                        onClose={() => setShowShareModal(false)}
                        shareText={SHARE_TEMPLATES.CREATED_MANUAL_SHARE(title)}
                        puzzleUrl={createdUrl || ""}
                        imageUrl={imagePreview || ""}
                    />
                )}
            </div>
        );
    }

    // ---------- Create form ----------
    return (
        <div className="max-w-2xl mx-auto px-6 py-12">
            <h1 className="font-[family-name:var(--font-orbitron)] text-3xl font-bold neon-text-blue mb-2 text-center">
                CREATE PUZZLE
            </h1>
            <p className="text-text-secondary text-center mb-10">
                1枚の画像で謎を作成しましょう
            </p>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Title */}
                <div>
                    <label className="block text-sm font-bold text-text-secondary mb-2 uppercase tracking-wider">
                        タイトル
                    </label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="謎解きのタイトルを入力..."
                        className="cyber-input"
                        required
                    />
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-bold text-text-secondary mb-2 uppercase tracking-wider">
                        概要
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="謎の説明やヒントを入力...（任意）"
                        className="cyber-input min-h-[120px] resize-y"
                        rows={4}
                    />
                </div>

                {/* Location */}
                <div>
                    <label className="block text-sm font-bold text-text-secondary mb-2 uppercase tracking-wider">
                        場所
                    </label>
                    <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="大まかな場所を入力（例：渋谷駅周辺）...（任意）"
                        className="cyber-input"
                    />
                </div>

                {/* Image Upload */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-bold text-text-secondary uppercase tracking-wider">
                            謎の画像
                        </label>
                        <span className="text-xs text-text-muted">圧縮後500kB以内</span>
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                    />
                    {imageError && (
                        <p className="text-neon-pink text-sm mb-2">{imageError}</p>
                    )}
                    {imagePreview ? (
                        <div className="relative group">
                            <img
                                src={imagePreview}
                                alt="Preview"
                                className="w-full max-h-[400px] object-contain neon-border rounded-sm"
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <span className="cyber-btn">画像を変更</span>
                            </button>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full h-48 flex flex-col items-center justify-center gap-3 border-2 border-dashed border-cyber-border hover:border-neon-blue transition-colors cursor-pointer bg-cyber-surface"
                        >
                            <FiImage size={40} className="text-text-muted" />
                            <span className="text-text-muted">
                                クリックして画像を選択
                            </span>
                        </button>
                    )}
                    {/* <p className="text-xs text-text-muted mt-1">
                        アップロード前に自動でリサイズ（約1MB以下）されます。
                    </p> */}
                </div>

                {/* Answer Type */}
                <div>
                    <label className="block text-sm font-bold text-text-secondary mb-3 uppercase tracking-wider">
                        回答方式
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            type="button"
                            onClick={() => setAnswerType("keyword")}
                            className={`cyber-card text-center p-4 cursor-pointer transition-all ${answerType === "keyword" ? "neon-border" : ""}`}
                        >
                            <div className="text-2xl mb-2">⌨️</div>
                            <div className="font-bold text-sm">キーワード入力</div>
                            <div className="text-xs text-text-muted mt-1">テキストで回答</div>
                        </button>
                        <button
                            type="button"
                            onClick={() => setAnswerType("qrcode")}
                            className={`cyber-card text-center p-4 cursor-pointer transition-all ${answerType === "qrcode" ? "neon-border-pink" : ""}`}
                        >
                            <div className="text-2xl mb-2">📱</div>
                            <div className="font-bold text-sm">QRコード</div>
                            <div className="text-xs text-text-muted mt-1">スキャンで即回答</div>
                        </button>
                    </div>
                </div>

                {/* Keyword answers */}
                {answerType === "keyword" && (
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-bold text-text-secondary uppercase tracking-wider">
                                正解キーワード
                            </label>
                            <span className="text-xs text-text-muted">
                                {answers.length}/{MAX_ANSWERS}
                            </span>
                        </div>
                        <p className="text-xs text-text-muted mb-3">
                            大文字・小文字・全半角・スペースの違いは無視されます。複数登録すると、いずれかに一致すれば正解です。
                        </p>
                        <div className="space-y-2">
                            {answers.map((ans, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={ans}
                                        onChange={(e) => updateAnswer(i, e.target.value)}
                                        placeholder={i === 0 ? "正解キーワードを入力..." : `別の正解（${i + 1}）`}
                                        className="cyber-input flex-1"
                                    />
                                    {answers.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeAnswer(i)}
                                            className="p-2 text-text-muted hover:text-neon-pink transition-colors flex-shrink-0"
                                        >
                                            <FiX size={16} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        {answers.length < MAX_ANSWERS && (
                            <button
                                type="button"
                                onClick={addAnswer}
                                className="mt-3 flex items-center gap-1.5 text-sm text-text-muted hover:text-neon-blue transition-colors"
                            >
                                <FiPlus size={14} />
                                別の正解を追加
                            </button>
                        )}
                    </div>
                )}

                {/* QR Code mode info */}
                {answerType === "qrcode" && (
                    <div className="cyber-card text-center p-4">
                        <p className="text-sm text-text-secondary mb-2">
                            作成後にURL付きQRコードが生成されます。印刷して答えが示す現場に設置してください。
                        </p>
                        <p className="text-xs text-text-muted">
                            QRコードがスキャンされると自動的にパズルページへ遷移し、クリアとなります。
                        </p>
                    </div>
                )}

                {/* Submit */}
                <button
                    type="submit"
                    disabled={submitting || !imageFile || !title.trim() || !hasValidAnswers}
                    className="cyber-btn w-full text-lg py-4 flex items-center justify-center gap-2"
                >
                    {submitting ? (
                        <>
                            <div className="w-5 h-5 border-2 border-neon-blue border-t-transparent rounded-full animate-spin" />
                            アップロード中...
                        </>
                    ) : (
                        <>
                            <FiUpload size={20} />
                            謎を作成する
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}
