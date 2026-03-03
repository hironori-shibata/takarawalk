"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    resetPassword,
} from "@/lib/auth";
import { FiX, FiMail, FiLock, FiUser, FiArrowRight } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
    const { user } = useAuth();
    const [isSignUp, setIsSignUp] = useState(false);
    const [isResetMode, setIsResetMode] = useState(false);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [displayName, setDisplayName] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    if (!isOpen || user) return null;

    const resetState = () => {
        setError(null);
        setMessage(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        resetState();
        setLoading(true);

        try {
            if (isResetMode) {
                await resetPassword(email);
                setMessage("パスワード再設定のメールを送信しました。");
            } else if (isSignUp) {
                await signUpWithEmail(email, password, displayName);
                onClose();
            } else {
                await signInWithEmail(email, password);
                onClose();
            }
        } catch (err: any) {
            console.error(err);
            if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
                setError("メールアドレスまたはパスワードが間違っています。");
            } else if (err.code === "auth/email-already-in-use") {
                setError("このメールアドレスは既に登録されています。");
            } else if (err.code === "auth/weak-password") {
                setError("パスワードは6文字以上で設定してください。");
            } else {
                setError("エラーが発生しました。もう一度お試しください。");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        resetState();
        try {
            await signInWithGoogle();
            onClose();
        } catch (err) {
            setError("Googleのログインに失敗しました。");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="cyber-card relative w-full max-w-md p-6 overflow-hidden">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-text-muted hover:text-neon-pink transition-colors"
                >
                    <FiX size={24} />
                </button>

                <h2 className="font-[family-name:var(--font-orbitron)] text-2xl font-bold text-center neon-text-blue mb-6">
                    {isResetMode ? "RESET PASSWORD" : isSignUp ? "SIGN UP" : "LOGIN"}
                </h2>

                {!isResetMode && (
                    <div className="flex gap-2 mb-6 p-1 bg-cyber-surface rounded-lg neon-border">
                        <button
                            onClick={() => { setIsSignUp(false); resetState(); }}
                            className={`flex-1 py-2 text-sm font-bold transition-colors ${!isSignUp ? "bg-neon-blue/20 text-neon-blue rounded" : "text-text-muted hover:text-text-primary"}`}
                        >
                            ログイン
                        </button>
                        <button
                            onClick={() => { setIsSignUp(true); resetState(); }}
                            className={`flex-1 py-2 text-sm font-bold transition-colors ${isSignUp ? "bg-neon-blue/20 text-neon-blue rounded" : "text-text-muted hover:text-text-primary"}`}
                        >
                            新規登録
                        </button>
                    </div>
                )}

                {error && <div className="mb-4 p-3 bg-neon-pink/10 border border-neon-pink text-neon-pink text-sm rounded">{error}</div>}
                {message && <div className="mb-4 p-3 bg-neon-green/10 border border-neon-green text-neon-green text-sm rounded">{message}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {isSignUp && !isResetMode && (
                        <div>
                            <label className="block text-xs font-bold text-text-secondary mb-1">ユーザー名</label>
                            <div className="relative">
                                <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                                <input
                                    type="text"
                                    required
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    className="cyber-input pl-10 w-full"
                                    placeholder="名無し"
                                />
                            </div>
                        </div>
                    )}
                    <div>
                        <label className="block text-xs font-bold text-text-secondary mb-1">メールアドレス</label>
                        <div className="relative">
                            <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="cyber-input pl-10 w-full"
                                placeholder="example@nazo1.com"
                            />
                        </div>
                    </div>
                    {!isResetMode && (
                        <div>
                            <label className="block text-xs font-bold text-text-secondary mb-1">パスワード</label>
                            <div className="relative">
                                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="cyber-input pl-10 w-full"
                                    placeholder="6文字以上"
                                />
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="cyber-btn w-full mt-2 py-3 flex items-center justify-center gap-2"
                    >
                        {loading ? "処理中..." : (isResetMode ? "送信" : isSignUp ? "登録する" : "ログインする")}
                        <FiArrowRight />
                    </button>
                </form>

                <div className="mt-4 text-center">
                    {isResetMode ? (
                        <button onClick={() => { setIsResetMode(false); resetState(); }} className="text-sm text-neon-blue hover:underline">
                            ログイン画面に戻る
                        </button>
                    ) : (
                        <button onClick={() => { setIsResetMode(true); resetState(); }} className="text-sm text-text-muted hover:text-neon-pink transition-colors">
                            パスワードを忘れた場合はこちら
                        </button>
                    )}
                </div>

                <div className="my-6 border-b border-cyber-border relative relative">
                    <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#0a0a0f] px-2 text-xs text-text-muted">OR</span>
                </div>

                <button
                    onClick={handleGoogleSignIn}
                    className="w-full relative group border border-cyber-border hover:border-neon-blue bg-cyber-surface hover:bg-neon-blue/5 transition-all text-white p-3 flex items-center justify-center gap-3 rounded-sm"
                >
                    <div className="bg-white p-0.5 rounded-full"><FcGoogle size={20} /></div>
                    <span className="font-bold relative z-10 group-hover:text-neon-blue transition-colors">Googleでログイン</span>
                </button>
            </div>
        </div>
    );
}
