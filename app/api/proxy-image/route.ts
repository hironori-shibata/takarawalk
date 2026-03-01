import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const url = req.nextUrl.searchParams.get("url");

    if (!url) {
        return new NextResponse("Missing url parameter", { status: 400 });
    }

    try {
        const response = await fetch(url);

        if (!response.ok) {
            return new NextResponse(`Failed to fetch image: ${response.status} ${response.statusText}`, { status: response.status });
        }

        const buffer = await response.arrayBuffer();
        const headers = new Headers();

        headers.set("Content-Type", response.headers.get("Content-Type") || "image/png");
        headers.set("Cache-Control", "public, max-age=86400"); // Cache for 1 day
        // Allow CORS for the proxy
        headers.set("Access-Control-Allow-Origin", "*");

        return new NextResponse(buffer, { headers });
    } catch (error) {
        console.error("Proxy error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
