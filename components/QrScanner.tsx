"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { FiX } from "react-icons/fi";

interface QrScannerProps {
    onScan: (data: string) => void;
    onClose: () => void;
}

export default function QrScanner({ onScan, onClose }: QrScannerProps) {
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const isRunningRef = useRef(false);
    const isStartingRef = useRef(false);
    const onScanRef = useRef(onScan);
    const [error, setError] = useState<string | null>(null);

    onScanRef.current = onScan;

    const stopScanner = useCallback(async () => {
        if (scannerRef.current && isRunningRef.current) {
            isRunningRef.current = false;
            try {
                await scannerRef.current.stop();
            } catch {
                // Scanner might already be stopped
            }
        }
    }, []);

    useEffect(() => {
        // Prevent double-start (React StrictMode calls useEffect twice)
        if (isStartingRef.current) return;
        isStartingRef.current = true;

        const scannerId = "qr-scanner-" + Date.now();

        // Clear any leftover children from previous mount
        if (containerRef.current) {
            containerRef.current.innerHTML = "";
            const scannerDiv = document.createElement("div");
            scannerDiv.id = scannerId;
            containerRef.current.appendChild(scannerDiv);
        }

        const html5QrCode = new Html5Qrcode(scannerId);
        scannerRef.current = html5QrCode;

        html5QrCode
            .start(
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                },
                (decodedText) => {
                    if (!isRunningRef.current) return;
                    isRunningRef.current = false;
                    html5QrCode
                        .stop()
                        .then(() => {
                            onScanRef.current(decodedText);
                        })
                        .catch(() => {
                            // Still fire callback even if stop fails
                            onScanRef.current(decodedText);
                        });
                },
                () => {
                    // Ignore QR parse errors during scanning
                }
            )
            .then(() => {
                isRunningRef.current = true;
            })
            .catch((err: unknown) => {
                console.error("QR Scanner error:", err);
                setError("カメラを起動できませんでした。カメラへのアクセスを許可してください。");
            });

        return () => {
            isStartingRef.current = false;
            if (isRunningRef.current) {
                isRunningRef.current = false;
                html5QrCode.stop().catch(() => { });
            }
            // Clean up DOM
            if (containerRef.current) {
                containerRef.current.innerHTML = "";
            }
        };
    }, []);

    return (
        <div className="relative">
            <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-text-secondary">
                    QRコードをカメラに向けてください
                </span>
                <button
                    onClick={() => {
                        stopScanner();
                        onClose();
                    }}
                    className="p-1 text-text-muted hover:text-neon-pink transition-colors"
                >
                    <FiX size={20} />
                </button>
            </div>

            <div
                ref={containerRef}
                className="w-full overflow-hidden neon-border-pink rounded-sm"
            />

            {error && (
                <div className="mt-3 text-sm text-neon-pink p-3 bg-neon-pink/10 border border-neon-pink/30 rounded-sm">
                    {error}
                </div>
            )}
        </div>
    );
}
