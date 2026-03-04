export const SHARE_TEMPLATES = {
    // 謎作成時（XShareModalへの自動遷移時など）
    CREATED_AUTO_SHARE: (title: string) =>
        `ナゾワン - １枚謎×勝者１人のリアルタイム謎解きバトル「nazo 1」に新しい謎を投稿しました！\nタイトル:「${title}」\n先着1名のみがクリアできる！下のリンクから挑戦してね👇\n\n#nazo1`,

    // 謎作成完了画面（手動シェアボタン）
    CREATED_MANUAL_SHARE: (title: string) =>
        `ナゾワン - １枚謎×勝者１人のリアルタイム謎解きバトル「nazo 1」に新しい謎を投稿しました！\nタイトル:「${title}」\n先着1名のみがクリアできる！下のリンクから挑戦してね👇\n\n#nazo1`,

    // 誰かが既に解いた謎のページ
    ALREADY_SOLVED: (title: string, solvedBy: string) =>
        `ナゾワン - １枚謎×勝者１人のリアルタイム謎解きバトル「nazo 1」の謎「${title}」は${solvedBy}さんに解かれました！\n  おめでとうございます🎉🎉\n #nazo1`,

    // 自分が最初に解いた時の祝福画面
    CONGRATULATIONS: (title: string, elapsedText?: string) =>
        elapsedText
            ? `ナゾワン - １枚謎×勝者１人のリアルタイム謎解きバトル「nazo 1」の謎「${title}」を投稿から${elapsedText}で最初に解きました！  おめでとうございます🎉🎉\n\n#nazo1\n`
            : `ナゾワン - １枚謎×勝者１人のリアルタイム謎解きバトル「nazo 1」の謎「${title}」を最初に解きました！  おめでとうございます🎉🎉\n\n#nazo1\n`,

    // 挑戦中でまだ誰にも解かれていない時
    CHALLENGING: (title: string, elapsedText?: string) =>
        elapsedText
            ? `ナゾワン - １枚謎×勝者１人のリアルタイム謎解きバトル「nazo 1」の謎「${title}」に挑戦中！\n投稿から${elapsedText}経ちましたが、まだ誰も解いてない…！下のリンクから挑戦してね👇\n\n#nazo1 `
            : `ナゾワン - １枚謎×勝者１人のリアルタイム謎解きバトル「nazo 1」の謎「${title}」に挑戦中！\nまだ誰も解いてない…！下のリンクから挑戦してね👇\n\n#nazo1 `
};
