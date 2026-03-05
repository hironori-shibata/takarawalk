import { Metadata } from "next";

type Props = {
    params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;

    // OGP メタデータは静的なデフォルトを使用。
    // サーバー側から Firestore にアクセスすると App Check トークンなしのリクエストが発生し、
    // Firebase 監視ツールで「未検証のリクエスト」としてカウントされてしまうため避ける。
    const title = "nazo 1 - 謎解き";
    const description = "先着1名のみがクリアできる謎解き共有バトル";
    const puzzleUrl = `${process.env.NEXT_PUBLIC_SITE_URL || ""}/puzzle/${id}`;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            type: "website",
            url: puzzleUrl,
        },
        twitter: {
            card: "summary",
            title,
            description,
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
