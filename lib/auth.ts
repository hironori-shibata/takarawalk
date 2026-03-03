import { auth } from "./firebase";
import {
    signInWithPopup,
    GoogleAuthProvider,
    signOut as firebaseSignOut,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
    updateProfile,
} from "firebase/auth";

const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogle() {
    if (!auth) {
        alert("Firebaseが設定されていません。.env.localにFirebase設定を記入してください。");
        return null;
    }
    try {
        const result = await signInWithPopup(auth, googleProvider);
        return result.user;
    } catch (error) {
        console.error("Google sign-in error:", error);
        throw error;
    }
}

export async function signOut() {
    if (!auth) return;
    try {
        await firebaseSignOut(auth);
    } catch (error) {
        console.error("Sign-out error:", error);
        throw error;
    }
}

export async function signInWithEmail(email: string, password: string) {
    if (!auth) {
        alert("Firebaseが設定されていません。");
        return null;
    }
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
}

export async function signUpWithEmail(email: string, password: string, displayName: string) {
    if (!auth) {
        alert("Firebaseが設定されていません。");
        return null;
    }
    const result = await createUserWithEmailAndPassword(auth, email, password);
    if (result.user && displayName) {
        await updateProfile(result.user, { displayName });
    }
    return result.user;
}

export async function resetPassword(email: string) {
    if (!auth) {
        alert("Firebaseが設定されていません。");
        return;
    }
    await sendPasswordResetEmail(auth, email);
}
