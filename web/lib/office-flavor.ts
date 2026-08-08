export type OfficeDeptKey = "cmo" | "cfo" | "secretary";

export const ROLE_LABELS: Record<"cmo" | "cfo" | "ceo" | "secretary", string> = {
  cmo: "マーケティング責任者",
  cfo: "経理財務責任者",
  ceo: "代表",
  secretary: "秘書",
};

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
      "そのアイデア、いただき!",
      "SNSでバズってるやつ見ちゃった",
      "たまには外の空気吸いたいな〜",
      "新しいフォント見つけて即採用したい",
      "今日のBGM、集中できるやつにしよ",
      "次のネタ、降ってきた気がする",
      "写真の色味、もう少し明るくしようかな",
      "そういえばお昼何にしよう",
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
      "この表、もう少し見やすくできそう",
      "コーヒーより緑茶派です",
      "地味に整理整頓が好きなんです",
      "今日は珍しく数字がきれいに合った",
      "資料は角をきっちり揃えたい派",
      "電卓を打つ音がちょっと好き",
      "来月の予算、少し余裕ありそう",
    ],
  },
  secretary: {
    trait: "気配り上手で何でもこなすオールラウンダー",
    color: "#f472b6",
    idleLines: [
      "スケジュール、整理しておきますね",
      "みんなの飲み物、そろそろ切れそう",
      "resource足りてるかな、様子見よう",
      "書類の整理、意外と好きなんです",
      "何かお手伝いできること無いかな",
      "オフィスの観葉植物、元気そう",
      "そろそろ換気しておこうかな",
      "頼まれごとリスト、整理中",
      "みんな集中してるから静かに動こう",
      "次の来客対応、準備しておこう",
    ],
  },
};

export function pickIdleLine(dept: OfficeDeptKey): string {
  const lines = PERSONALITIES[dept].idleLines;
  return lines[Math.floor(Math.random() * lines.length)];
}
