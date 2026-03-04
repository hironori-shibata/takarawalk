import { NextRequest, NextResponse } from "next/server";

// ホワイトリスト: 許可するホスト名
const ALLOWED_HOSTS = [
    "firebasestorage.googleapis.com",
];

function isAllowedUrl(urlString: string): boolean {
    try {
        const parsed = new URL(urlString);
        // HTTPS のみ許可
        if (parsed.protocol !== "https:") return false;
        // ホワイトリストチェック
        return ALLOWED_HOSTS.includes(parsed.hostname);
    } catch {
        return false;
    }
}

export async function GET(req: NextRequest) {
    const url = req.nextUrl.searchParams.get("url");

    if (!url) {
        return new NextResponse("Missing url parameter", { status: 400 });
    }

    // SSRF対策: ホワイトリストに含まれるURLのみ許可
    if (!isAllowedUrl(url)) {
        return new NextResponse("Forbidden: URL not allowed", { status: 403 });
    }

    try {
        const response = await fetch(url);

        if (!response.ok) {
            return new NextResponse(`Failed to fetch image: ${response.status}`, { status: response.status });
        }

        // レスポンスのContent-Typeが画像であることを検証
        const contentType = response.headers.get("Content-Type") || "";
        if (!contentType.startsWith("image/")) {
            return new NextResponse("Forbidden: Response is not an image", { status: 403 });
        }

        const buffer = await response.arrayBuffer();

        // レスポンスサイズ制限 (10MB)
        if (buffer.byteLength > 10 * 1024 * 1024) {
            return new NextResponse("Payload too large", { status: 413 });
        }

        const headers = new Headers();
        headers.set("Content-Type", contentType);
        headers.set("Cache-Control", "public, max-age=86400");
        headers.set("Access-Control-Allow-Origin", "*");

        return new NextResponse(buffer, { headers });
    } catch {
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
