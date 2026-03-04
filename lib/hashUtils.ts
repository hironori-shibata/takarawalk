/**
 * ソルト付き SHA-256 ハッシュ
 * salt に puzzleId を渡すことで、同じキーワードでも異なるハッシュになり
 * 辞書攻撃・レインボーテーブル攻撃を困難にする
 */
export async function hashAnswer(text: string, salt: string = ""): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(salt + text);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function normalizeAnswer(s: string): string {
    return s.toLowerCase().normalize("NFKC").replace(/\s+/g, "");
}
