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
                if (appCheck) {
                    appCheckReady = getToken(appCheck, false)
                        .then(() => {
                            console.log("App Check token fetched successfully.");
                        })
                        .catch((err) => {
                            console.error("❌ App Check initial token fetch failed! This is why Firestore/Storage is denying requests:", err);
                            throw err; // エラーを握りつぶさず、呼び出し元に伝播させる
                        });
                }
            } else {
                console.error("❌ NEXT_PUBLIC_RECAPTCHA_SITE_KEY is NOT set in the environment variables! App Check will not be initialized, causing all writes to fail.");
                appCheckReady = Promise.reject(new Error("Missing reCAPTCHA Site Key in environment variables."));
            }
        }

        // IMPORTANT: Initialize Auth, Firestore, and Storage AFTER App Check is initialized
        // This prevents a known SDK issue where services initialized before App Check
        // might cache a state where they don't attach tokens to their requests.
        auth = getAuth(app);
        db = getFirestore(app);
        storage = getStorage(app);
    } catch (error) {
        console.warn("Firebase initialization failed:", error);
    }
}

export { app, auth, db, storage, appCheck, appCheckReady, isConfigured };
