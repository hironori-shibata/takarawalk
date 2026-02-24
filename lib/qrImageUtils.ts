/**
 * lib/qrImageUtils.ts
 * Generates a branded QR code image (PNG) and triggers a browser download.
 * Uses the `qrcode` npm package to get a data URL, then composes it on Canvas
 * with a logo text and congratulatory message.
 */
import QRCode from "qrcode";

const CANVAS_W = 560;
const CANVAS_H = 680;
const QR_SIZE = 360;
const BG_COLOR = "#0a0a1a";
const ACCENT_COLOR = "#00f0ff";
const PINK_COLOR = "#ff00e5";
const TEXT_COLOR = "#e0e0e0";

export async function downloadQrImage(
    qrUrl: string,
    puzzleTitle: string
): Promise<void> {
    // 1. Generate QR code as data URL (white module on white bg — we'll place on dark)
    const qrDataUrl = await QRCode.toDataURL(qrUrl, {
        width: QR_SIZE,
        margin: 1,
        color: {
            dark: "#000000",
            light: "#ffffff",
        },
        errorCorrectionLevel: "M",
    });

    // 2. Build canvas
    const canvas = document.createElement("canvas");
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Background
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Top neon border lines
    ctx.strokeStyle = ACCENT_COLOR;
    ctx.lineWidth = 2;
    ctx.shadowColor = ACCENT_COLOR;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(20, 16); ctx.lineTo(CANVAS_W - 20, 16);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(20, CANVAS_H - 16); ctx.lineTo(CANVAS_W - 20, CANVAS_H - 16);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Logo text: "TAKARAWALK"
    ctx.fillStyle = ACCENT_COLOR;
    ctx.shadowColor = ACCENT_COLOR;
    ctx.shadowBlur = 14;
    ctx.font = "bold 28px Courier New, monospace";
    ctx.textAlign = "center";
    ctx.fillText("TAKARAWALK", CANVAS_W / 2, 56);
    ctx.shadowBlur = 0;

    // Congratulatory sub-line
    ctx.fillStyle = PINK_COLOR;
    ctx.shadowColor = PINK_COLOR;
    ctx.shadowBlur = 10;
    ctx.font = "16px Courier New, monospace";
    ctx.fillText("🏆  発見おめでとう！  🏆", CANVAS_W / 2, 86);
    ctx.shadowBlur = 0;

    // Separator line
    ctx.strokeStyle = "#333355";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(40, 106); ctx.lineTo(CANVAS_W - 40, 106);
    ctx.stroke();

    // QR Code image — white rounded-corner box
    const qrImg = new Image();
    await new Promise<void>((res) => {
        qrImg.onload = () => res();
        qrImg.src = qrDataUrl;
    });
    const qrX = (CANVAS_W - QR_SIZE) / 2;
    const qrY = 122;
    // White rounded box
    const pad = 12;
    roundRect(ctx, qrX - pad, qrY - pad, QR_SIZE + pad * 2, QR_SIZE + pad * 2, 12, "#ffffff");
    ctx.drawImage(qrImg, qrX, qrY, QR_SIZE, QR_SIZE);

    // Puzzle title
    ctx.fillStyle = TEXT_COLOR;
    ctx.font = "bold 18px Courier New, monospace";
    ctx.textAlign = "center";
    const titleY = qrY + QR_SIZE + pad * 2 + 28;
    // Truncate title if too long
    const maxTitleWidth = CANVAS_W - 60;
    let displayTitle = puzzleTitle;
    while (ctx.measureText(`「${displayTitle}」`).width > maxTitleWidth && displayTitle.length > 5) {
        displayTitle = displayTitle.slice(0, -2) + "…";
    }
    ctx.fillText(`「${displayTitle}」`, CANVAS_W / 2, titleY);

    // Instruction
    ctx.fillStyle = "#888899";
    ctx.font = "13px Courier New, monospace";
    ctx.fillText("QRコードをスキャンしてクリアを報告しよう！", CANVAS_W / 2, titleY + 28);

    // Bottom URL hint
    ctx.fillStyle = "#555566";
    ctx.font = "11px Courier New, monospace";
    ctx.fillText("takarawalk.vercel.app", CANVAS_W / 2, CANVAS_H - 30);

    // 3. Download
    const link = document.createElement("a");
    link.download = `takarawalk-qr-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
}

function roundRect(
    ctx: CanvasRenderingContext2D,
    x: number, y: number,
    w: number, h: number,
    r: number,
    fillColor: string
): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fillStyle = fillColor;
    ctx.fill();
}
