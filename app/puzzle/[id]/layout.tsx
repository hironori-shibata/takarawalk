import { Metadata } from "next";

// Helper function to fetch puzzle data using Firebase REST API
// This avoids using the client SDK on the server, which would trigger unverified App Check requests
async function fetchPuzzleRest(id: string) {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    if (!projectId) return null;

    try {
        const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/puzzles/${id}`;
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) return null;

        const data = await res.json();
        if (!data.fields) return null;

        // Extract fields from Firestore REST format
        return {
            title: data.fields.title?.stringValue,
            description: data.fields.description?.stringValue,
            creatorName: data.fields.creatorName?.stringValue,
            imageUrl: data.fields.imageUrl?.stringValue,
        };
    } catch {
        return null;
    }
}

type Props = {
    params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;

    let title = "nazo 1 - 謎解き";
    let description = "先着1名のみがクリアできる謎解き共有バトル";
    let imageUrl: string | undefined;

    try {
        const data = await fetchPuzzleRest(id);
        if (data) {
            title = `${data.title} | nazo 1`;
            description = data.description || `${data.creatorName}が投稿した謎解きに挑戦！先着1名のみがクリアできる。`;
            imageUrl = data.imageUrl;
        }
    } catch {
        // Use defaults on error
    }

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            type: "website",
            ...(imageUrl && {
                images: [{ url: imageUrl, width: 1200, height: 630 }],
            }),
        },
        twitter: {
            card: imageUrl ? "summary_large_image" : "summary",
            title,
            description,
            ...(imageUrl && { images: [imageUrl] }),
        },
    };
}

export default function PuzzleLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
