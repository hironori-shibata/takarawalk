import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { initializeAppCheck, ReCaptchaEnterpriseProvider, AppCheck, getToken } from "firebase/app-check";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let appCheck: AppCheck | null = null;

const isConfigured = !!firebaseConfig.apiKey && firebaseConfig.apiKey !== "your_api_key_here";

/**
 * App Check トークンが最初に取得されるまで待機する Promise。
 * Firebase SDK はトークンがキャッシュされる前にリクエストを送信するとトークンなしで送る仕様のため、
 * すべての Firestore / Storage 操作の前にこの Promise を await する必要がある。
 * サーバーサイド（SSR）では即座に resolve される（App Check はクライアントのみ）。
 */
let appCheckReady: Promise<void> = Promise.resolve();

if (isConfigured) {
    try {
        app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

        // App Check — クライアント側かつサイトキーが提供されている場合のみ初期化
        if (typeof window !== "undefined") {
            const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
            if (siteKey) {
                // Next.js の HMR 等での二重初期化を防ぎ、インスタンスを再利用
                if (!(window as any).__appCheckInstance) {
                    (window as any).__appCheckInstance = initializeAppCheck(app, {
                        provider: new ReCaptchaEnterpriseProvider(siteKey),
                        isTokenAutoRefreshEnabled: true,
                    });
                }
                appCheck = (window as any).__appCheckInstance;

                // 初期化直後にトークン取得を開始し、完了するまで appCheckReady で待機可能にする。
                // この getToken の完了により SDK 内部のトークンキャッシュが確実に埋まり、
                // 以降のリクエストにトークンが付与されることを保証する。
                if (appCheck) {
                    appCheckReady = getToken(appCheck, false)
                        .then(() => {
                            // トークン取得成功 — 以降の SDK リクエストはトークン付きになる
                        })
                        .catch((err) => {
                            console.warn("App Check initial token fetch failed:", err);
                            // 失敗してもアプリは継続（ルールで弾かれる可能性はある）
                        });
                }
            }
        }

        auth = getAuth(app);
        db = getFirestore(app);
        storage = getStorage(app);
    } catch (error) {
        console.warn("Firebase initialization failed:", error);
    }
}

export { app, auth, db, storage, appCheck, appCheckReady, isConfigured };
