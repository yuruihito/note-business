export type OfficeDeptKey = "cmo" | "cfo";

export const PERSONALITIES: Record<
  OfficeDeptKey,
  { trait: string; color: string; idleLines: string[] }
> = {
  cmo: {
    trait: "明るく好奇心旺盛なマーケター",
    color: "#2dd4bf",
    idleLines: [
      "新しいバズワード思いついたかも",
      "競合のnote、こっそりチェック中…",
      "このアイキャッチ画像、可愛くない?",
      "トレンド追うの楽しすぎる",
      "今日のコーヒー、豆から挽いた",
      "見出し、もう一声インパクト欲しいな",
    ],
  },
  cfo: {
    trait: "几帳面で堅実な経理担当",
    color: "#fb923c",
    idleLines: [
      "今月の数値、きっちり確認中",
      "電卓の電池そろそろ切れそう",
      "領収書は整理整頓が命",
      "端数が1円合わないの気になる…",
      "そろそろ月次締めの準備しないと",
      "静かな環境が一番集中できる",
    ],
  },
};

export function pickIdleLine(dept: OfficeDeptKey): string {
  const lines = PERSONALITIES[dept].idleLines;
  return lines[Math.floor(Math.random() * lines.length)];
}
