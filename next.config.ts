import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "firebasestorage.googleapis.com",
            },
        ],
    },
    // 一時的にセキュリティヘッダーを無効化（Firebase App Check の通信干渉を検証するため）
    // headers: async () => [
    //     {
    //         source: "/(.*)",
    //         headers: [
    //             { key: "X-Frame-Options", value: "DENY" },
    //             { key: "X-Content-Type-Options", value: "nosniff" },
    //             { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    //             { key: "Permissions-Policy", value: "camera=(self), microphone=()" },
    //         ],
    //     },
    // ],
};

export default nextConfig;
