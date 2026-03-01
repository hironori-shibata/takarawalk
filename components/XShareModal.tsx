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
    const [watermarkedBlob, setWatermarkedBlob] = useState<Blob | null>(null);
    const [watermarkedUrl, setWatermarkedUrl] = useState<string | null>(null);

    useEffect(() => {
        // Check if Web Share API with files is supported AND if it's a mobile device.
        // On desktop, the native share menu often lacks X/Instagram, so we prefer our custom flow.
        const isMobile = typeof navigator !== "undefined" && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        if (isMobile && typeof navigator.share === "function" && typeof navigator.canShare === "function") {
            setCanUseWebShare(true);
        }

        if (isOpen) {
            setStep(1);
            setImageCopied(false);
            setUrlCopied(false);
            setDownloading(false);
            setWatermarkedBlob(null);
            setWatermarkedUrl(null);

            let isMounted = true;
            generateWatermarkedImage(imageUrl)
                .then(blob => {
                    if (isMounted) {
                        setWatermarkedBlob(blob);
                        setWatermarkedUrl(URL.createObjectURL(blob));
                    }
                })
                .catch(console.error);

            return () => { isMounted = false; };
        }
    }, [isOpen, imageUrl]);

    if (!isOpen) return null;

    // --- Actions ---

    async function handleWebShare() {
        if (!watermarkedBlob) return;
        try {
            const file = new File([watermarkedBlob], "takarawalk.png", { type: "image/png" });

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

    async function handleCopyAndOpenX() {
        if (!watermarkedBlob) return;
        setDownloading(true);
        let success = false;
        try {
            await navigator.clipboard.write([
                new ClipboardItem({ "image/png": watermarkedBlob }),
            ]);
            setImageCopied(true);
            success = true;
            setTimeout(() => setImageCopied(false), 3000);
        } catch (error) {
        } finally {
            setDownloading(false);
        }

        if (success) {
            const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
            window.open(url, "_blank");
        }
    }

    async function handleDownloadImage() {
        if (!watermarkedBlob) return;
        setDownloading(true);
        try {
            const blobUrl = URL.createObjectURL(watermarkedBlob);
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
                                <FiShare2 /> SHARE ON SNS
                            </h2>
                            <p className="text-sm text-text-secondary mt-2">
                                リンク付き投稿は<strong className="text-neon-pink">SNSで表示されにくい</strong>ため、<br />
                                まずは<strong className="text-neon-blue">画像とテキストのみ</strong>で投稿しましょう！<br />
                                共有後、<strong className="text-neon-pink">元の画面に戻って</strong>、リンクをコピーして<strong className="text-neon-pink">リプライなどで投稿</strong>しましょう！
                            </p>
                        </div>

                        {/* Image Preview */}
                        <div className="mb-4 relative rounded overflow-hidden border border-cyber-border bg-cyber-bg p-2 flex justify-center">
                            {watermarkedUrl ? (
                                <img src={watermarkedUrl} alt="Puzzle with Watermark" className="max-h-32 object-contain" />
                            ) : (
                                <div className="h-32 flex items-center justify-center text-text-muted text-sm">
                                    画像を準備中...
                                </div>
                            )}
                        </div>

                        {/* Share Actions */}
                        <div className="space-y-4">
                            {canUseWebShare ? (
                                <button
                                    onClick={handleWebShare}
                                    disabled={!watermarkedBlob}
                                    className="cyber-btn w-full flex items-center justify-center gap-2"
                                >
                                    <FiShare2 size={18} />
                                    画像付きでシェアする
                                </button>
                            ) : (
                                <div className="space-y-3">
                                    <button
                                        onClick={handleCopyAndOpenX}
                                        disabled={downloading || !watermarkedBlob}
                                        className="cyber-btn cyber-btn-pink w-full flex items-center justify-center gap-2"
                                    >
                                        {imageCopied ? <FiCheck size={18} className="text-neon-green" /> : <FaXTwitter size={18} />}
                                        {downloading ? "準備中..." : imageCopied ? "コピー完了・Xを開きました" : "画像付きでXを開く"}
                                    </button>
                                    <p className="text-xs text-text-muted text-center">
                                        <strong className="text-neon-blue">自動的に画像がコピー</strong>されXが開きます。<br />
                                        Xが開いたら、<strong className="text-neon-pink">画像を貼り付け（Ctrl+V など）</strong>してください。
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Skip to Step 2 if user already shared or just copy URL directly */}
                        <div className="mt-6 flex flex-col gap-3">
                            <button
                                onClick={handleCopyUrl}
                                className="cyber-btn bg-cyber-surface-light border-cyber-border text-text-primary hover:text-neon-blue w-full flex items-center justify-center gap-2"
                            >
                                {urlCopied ? <FiCheck size={18} className="text-neon-green" /> : <FiCopy size={18} />}
                                {urlCopied ? "URLをコピーしました！" : "パズルのURLを直接コピー"}
                            </button>
                            <div className="flex justify-end">
                                <button
                                    onClick={() => setStep(2)}
                                    className="text-xs text-text-muted hover:text-text-primary flex items-center gap-1 transition-colors"
                                >
                                    <strong className="text-neon-blue">投稿できた？次へ(リンクの貼り方) </strong><FiArrowRight size={18} />
                                </button>
                            </div>
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

// Custom text watermark synthesis to replace local image file requirement
async function generateWatermarkedImage(url: string): Promise<Blob> {
    const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl);
    if (!response.ok) throw new Error("Network response was not ok");
    const blob = await response.blob();

    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
            // Calculate responsive font size and positions
            const targetWidth = img.width * 0.4;
            const fontSize = Math.max(20, Math.floor(targetWidth / 7));

            // Add margin for the watermark
            const paddingSide = Math.max(16, img.width * 0.03);
            const paddingBottom = fontSize + paddingSide * 2;

            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height + paddingBottom;
            const ctx = canvas.getContext("2d");
            if (!ctx) {
                reject(new Error("Canvas context is null"));
                return;
            }

            // Draw background for the new margin area (black)
            ctx.fillStyle = "#0a0a0f"; // taking --color-cyber-bg
            ctx.fillRect(0, img.height, canvas.width, paddingBottom);

            // Draw original image
            ctx.drawImage(img, 0, 0);

            // Extract font family safely
            const tempEl = document.createElement("span");
            tempEl.style.fontFamily = "var(--font-orbitron)";
            document.body.appendChild(tempEl);
            const fontFamily = getComputedStyle(tempEl).fontFamily || '"Orbitron", sans-serif';
            document.body.removeChild(tempEl);

            ctx.font = `900 ${fontSize}px ${fontFamily}`;
            ctx.textBaseline = "middle";

            const startX = paddingSide;
            // Center text inside the new bottom margin
            const startY = img.height + (paddingBottom / 2);

            const takaraText = "TAKARA";
            const walkText = "WALK";

            // Draw TAKARA (Neon Cyan)
            ctx.fillStyle = "#00f0ff";
            ctx.shadowColor = "rgba(0, 240, 255, 0.8)";
            ctx.shadowBlur = fontSize * 0.2;
            ctx.fillText(takaraText, startX, startY);
            // Double draw for stronger glow
            ctx.shadowBlur = fontSize * 0.4;
            ctx.fillText(takaraText, startX, startY);

            const takaraWidth = ctx.measureText(takaraText).width;

            // Draw WALK (Neon Pink)
            ctx.fillStyle = "#ff00e5";
            ctx.shadowColor = "rgba(255, 0, 229, 0.8)";
            ctx.shadowBlur = fontSize * 0.2;
            ctx.fillText(walkText, startX + takaraWidth, startY);
            // Double draw for stronger glow
            ctx.shadowBlur = fontSize * 0.4;
            ctx.fillText(walkText, startX + takaraWidth, startY);

            // Always output PNG to support transparent and clipboard api
            canvas.toBlob((b) => {
                if (b) resolve(b);
                else reject(new Error("Canvas toBlob failed"));
            }, "image/png");
        };
        img.onerror = () => reject(new Error("Failed to load image for watermark"));
        img.src = URL.createObjectURL(blob);
    });
}
