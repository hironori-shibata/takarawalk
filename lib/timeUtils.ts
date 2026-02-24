import { Timestamp } from "firebase/firestore";

/**
 * Firestore Timestamp or serverTimestamp() result to Date.
 */
export function toDate(ts: unknown): Date | null {
    if (!ts) return null;
    if (ts instanceof Timestamp) return ts.toDate();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof (ts as any)?.toDate === "function") return (ts as any).toDate();
    if (ts instanceof Date) return ts;
    return null;
}

/**
 * Format elapsed time between two dates.
 * If `to` is omitted, uses current time.
 * Returns a string like "2日3時間12分" or "3分".
 */
export function formatElapsed(from: Date, to?: Date): string {
    const diff = (to || new Date()).getTime() - from.getTime();
    if (diff < 0) return "0分";

    const totalMinutes = Math.floor(diff / 60000);
    const minutes = totalMinutes % 60;
    const totalHours = Math.floor(totalMinutes / 60);
    const hours = totalHours % 24;
    const days = Math.floor(totalHours / 24);

    const parts: string[] = [];
    if (days > 0) parts.push(`${days}日`);
    if (hours > 0) parts.push(`${hours}時間`);
    parts.push(`${minutes}分`);

    return parts.join("");
}

/**
 * Format a Date as "YYYY/MM/DD HH:mm"
 */
export function formatDateTime(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    const h = String(date.getHours()).padStart(2, "0");
    const min = String(date.getMinutes()).padStart(2, "0");
    return `${y}/${m}/${d} ${h}:${min}`;
}
