"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { auth, db, appCheckReady, isConfigured } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    isLoginModalOpen: boolean;
    openLoginModal: () => void;
    closeLoginModal: () => void;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    isLoginModalOpen: false,
    openLoginModal: () => { },
    closeLoginModal: () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

    const openLoginModal = () => setIsLoginModalOpen(true);
    const closeLoginModal = () => setIsLoginModalOpen(false);

    useEffect(() => {
        if (!isConfigured || !auth) {
            setLoading(false);
            return;
        }
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                try {
                    await signInAnonymously(auth!);
                } catch (e) {
                    console.error("Anonymous sign-in failed:", e);
                    setLoading(false);
                }
                return;
            }
            setUser(user);
            setLoading(false);
            // 通常ログインユーザーのみ users ドキュメントを upsert
            if (!user.isAnonymous && db) {
                try {
                    // App Check トークンが SDK にキャッシュされるのを待ってから書き込む
                    await appCheckReady;
                    await setDoc(
                        doc(db, "users", user.uid),
                        {
                            displayName: user.displayName || "匿名",
                            photoURL: user.photoURL || "",
                            lastLoginAt: serverTimestamp(),
                        },
                        { merge: true }
                    );
                } catch (e) {
                    console.error("Failed to upsert user doc:", e);
                }
            }
        });
        return () => unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, isLoginModalOpen, openLoginModal, closeLoginModal }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
