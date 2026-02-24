import { Metadata } from "next";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

type Props = {
    params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;

    let title = "TakaraWalk - 謎解き";
    let description = "先着1名のみがクリアできる謎解き共有バトル";
    let imageUrl: string | undefined;

    try {
        if (db) {
            const puzzleSnap = await getDoc(doc(db, "puzzles", id));
            if (puzzleSnap.exists()) {
                const data = puzzleSnap.data();
                title = `${data.title} | TakaraWalk`;
                description = data.description || `${data.creatorName}が投稿した謎解きに挑戦！先着1名のみがクリアできる。`;
                imageUrl = data.imageUrl;
            }
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
