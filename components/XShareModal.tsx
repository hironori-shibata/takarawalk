"use client";

import { useState, useEffect } from "react";
import { FiX, FiCopy, FiCheck, FiDownload, FiShare2, FiArrowRight } from "react-icons/fi";
import { FaXTwitter } from "react-icons/fa6";

interface XShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    shareText: string;
    puzzleUrl: string;
    imageUrl: string;
}

export default function XShareModal({
    isOpen,
    onClose,
    shareText,
    puzzleUrl,
    imageUrl,
}: XShareModalProps) {
    const [step, setStep] = useState<1 | 2>(1);
    const [imageCopied, setImageCopied] = useState(false);
    const [urlCopied, setUrlCopied] = useState(false);
    const [canUseWebShare, setCanUseWebShare] = useState(false);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        // Check if Web Share API with files is supported
        if (typeof navigator !== "undefined" && typeof navigator.share === "function" && typeof navigator.canShare === "function") {
            setCanUseWebShare(true);
        }

        if (isOpen) {
            setStep(1);
            setImageCopied(false);
            setUrlCopied(false);
            setDownloading(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    // --- Helpers ---

    async function fetchImageBlob(url: string) {
        // Use proxy to bypass CORS when fetching from Firebase Storage
        const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(url)}`;
        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error("Network response was not ok");
        return await response.blob();
    }

    async function convertToPngBlob(blob: Blob): Promise<Blob> {
        // If it's already png, just return it
        if (blob.type === "image/png") return blob;

        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.onload = () => {
                const canvas = document.createElement("canvas");
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext("2d");
                if (!ctx) {
                    reject(new Error("Canvas context is null"));
                    return;
                }
                ctx.drawImage(img, 0, 0);
                canvas.toBlob((b) => {
                    if (b) resolve(b);
                    else reject(new Error("Canvas toBlob failed"));
                }, "image/png");
            };
            img.onerror = () => reject(new Error("Failed to load image for conversion"));
            img.src = URL.createObjectURL(blob);
        });
    }

    // --- Actions ---

    async function handleWebShare() {
        try {
            const blob = await fetchImageBlob(imageUrl);
            const file = new File([blob], "takarawalk.png", { type: blob.type });

            if (navigator.canShare?.({ files: [file] })) {
                await navigator.share({
                    text: shareText,
                    files: [file]
                });
                // After typical web share, we can move to step 2 for users to reply if they want
                setStep(2);
            } else {
                alert("お使いのブラウザは画像付き共有に対応していません。");
            }
        } catch (error) {
            console.error("Web share error:", error);
            // Ignore AbortError which happens when user cancels the share sheet
            if ((error as any).name !== "AbortError") {
                alert("共有に失敗しました。");
            }
        }
    }

    async function handleCopyImage() {
        setDownloading(true);
        try {
            const blob = await fetchImageBlob(imageUrl);
            const pngBlob = await convertToPngBlob(blob);

            await navigator.clipboard.write([
                new ClipboardItem({ "image/png": pngBlob }),
            ]);
            setImageCopied(true);
            setTimeout(() => setImageCopied(false), 3000);
        } catch (error) {
            console.error("Clipboard copy error:", error);
            // Fallback to direct download
            handleDownloadImage();
            alert("画像のコピーに失敗したため、画像をダウンロードしました。");
        } finally {
            setDownloading(false);
        }
    }

    async function handleDownloadImage() {
        setDownloading(true);
        try {
            const blob = await fetchImageBlob(imageUrl);
            const blobUrl = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = blobUrl;
            a.download = "takarawalk-puzzle.png";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(blobUrl);
            setImageCopied(true);
            setTimeout(() => setImageCopied(false), 3000);
        } catch (error) {
            console.error("Download error:", error);
            alert("画像の取得に失敗しました。");
        } finally {
            setDownloading(false);
        }
    }

    function handleOpenX() {
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
        window.open(url, "_blank");
        // Don't auto-advance in case they close it, wait for user to click next
    }

    function handleCopyUrl() {
        navigator.clipboard.writeText(puzzleUrl);
        setUrlCopied(true);
        setTimeout(() => setUrlCopied(false), 3000);
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="cyber-card w-full max-w-md animate-float" style={{ animation: "none", transform: "scale(1)" }}>
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-text-muted hover:text-neon-pink transition-colors"
                >
                    <FiX size={24} />
                </button>

                {step === 1 ? (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="text-center mb-6">
                            <h2 className="font-[family-name:var(--font-orbitron)] text-xl font-bold neon-text-blue flex items-center justify-center gap-2">
                                <FaXTwitter /> SHARE ON X
                            </h2>
                            <p className="text-sm text-text-secondary mt-2">
                                リンク付き投稿は<strong className="text-neon-pink">Xで表示されにくい</strong>ため、<br />
                                まずは<strong className="text-neon-pink">画像とテキストのみ</strong>で投稿しましょう！<br />
                                その後、リンクを<strong className="text-neon-pink">リプライで投稿</strong>しましょう！
                            </p>
                        </div>

                        {/* Image Preview */}
                        <div className="mb-4 relative rounded overflow-hidden border border-cyber-border bg-cyber-bg p-2 flex justify-center">
                            <img src={imageUrl} alt="Puzzle" className="max-h-32 object-contain" />
                        </div>

                        {/* Share Actions */}
                        <div className="space-y-4">
                            {canUseWebShare ? (
                                <button
                                    onClick={handleWebShare}
                                    className="cyber-btn w-full flex items-center justify-center gap-2"
                                >
                                    <FiShare2 size={18} />
                                    画像付きでシェアする
                                </button>
                            ) : (
                                <div className="space-y-3">
                                    <button
                                        onClick={handleCopyImage}
                                        disabled={downloading}
                                        className="cyber-btn w-full flex items-center justify-center gap-2 bg-cyber-surface-light border-cyber-border text-text-primary hover:text-neon-blue"
                                    >
                                        {imageCopied ? <FiCheck size={18} className="text-neon-green" /> : <FiCopy size={18} />}
                                        {downloading ? "準備中..." : imageCopied ? "コピー完了（または保存完了）" : "① 画像をクリップボードにコピー"}
                                    </button>

                                    <button
                                        onClick={handleOpenX}
                                        className="cyber-btn cyber-btn-pink w-full flex items-center justify-center gap-2"
                                    >
                                        <FaXTwitter size={18} />
                                        ② Xを開く（テキストのみ）
                                    </button>
                                    <p className="text-xs text-text-muted text-center">
                                        Xが開いたら、先ほどコピーした画像を<br />
                                        貼り付け（Ctrl+V / 長押し）してください。
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Skip to Step 2 if user already shared */}
                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => setStep(2)}
                                className="text-xs text-text-muted hover:text-text-primary flex items-center gap-1 transition-colors"
                            >
                                <strong className="text-neon-blue">投稿できた？次へ(リンクを共有！) </strong><FiArrowRight size={18} />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="text-center mb-6">
                            <h2 className="font-[family-name:var(--font-orbitron)] text-xl font-bold neon-text-pink flex items-center justify-center gap-2">
                                <FiShare2 /> NEXT STEP
                            </h2>
                            <p className="text-sm text-text-secondary mt-2">
                                自分のツイートに<strong className="text-neon-blue">リプライとして</strong><br />
                                リンクを貼りましょう！
                            </p>
                        </div>

                        <div className="bg-cyber-bg border border-cyber-border rounded p-4 mb-6">
                            <p className="text-sm text-text-muted mb-2 font-bold text-center">クリップボードにコピーするURL:</p>
                            <div className="flex items-center justify-center bg-cyber-surface-light p-2 rounded text-xs text-neon-blue break-all">
                                {puzzleUrl}
                            </div>
                        </div>

                        <button
                            onClick={handleCopyUrl}
                            className="cyber-btn w-full flex items-center justify-center gap-2 mb-4"
                        >
                            {urlCopied ? <FiCheck size={18} className="text-neon-green" /> : <FiCopy size={18} />}
                            {urlCopied ? "コピーしました！" : "リプライ用URLをコピー"}
                        </button>

                        <div className="text-center">
                            <button
                                onClick={onClose}
                                className="cyber-btn cyber-btn-pink w-full"
                            >
                                完了
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
