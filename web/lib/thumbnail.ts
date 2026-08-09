import "server-only";
import { createCanvas, GlobalFonts, loadImage, type SKRSContext2D } from "@napi-rs/canvas";

const WIDTH = 1280;
const HEIGHT = 670;
const FONT_FAMILY = "Noto Sans JP";
// Google's official Noto Sans JP (SIL OFL), fetched once per warm server
// instance instead of bundled in the repo to keep it small.
const FONT_URL =
  "https://raw.githubusercontent.com/google/fonts/main/ofl/notosansjp/NotoSansJP%5Bwght%5D.ttf";

let fontReady: Promise<void> | null = null;
function ensureFont(): Promise<void> {
  if (!fontReady) {
    fontReady = (async () => {
      const res = await fetch(FONT_URL);
      if (!res.ok) throw new Error(`フォントの取得に失敗しました (${res.status})`);
      const buf = Buffer.from(await res.arrayBuffer());
      GlobalFonts.register(buf, FONT_FAMILY);
    })();
  }
  return fontReady;
}

// CJK-safe wrapping: break by character width rather than whitespace, since
// Japanese headlines have no spaces to split on.
function wrapText(
  ctx: SKRSContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
): string[] {
  const chars = Array.from(text);
  const lines: string[] = [];
  let current = "";
  for (const ch of chars) {
    const candidate = current + ch;
    if (current && ctx.measureText(candidate).width > maxWidth) {
      lines.push(current);
      current = ch;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  if (lines.length > maxLines) {
    lines.length = maxLines;
    lines[maxLines - 1] = `${lines[maxLines - 1].slice(0, -1)}…`;
  }
  return lines;
}

// Composites a plain illustration (no text) with a Japanese headline and an
// accent divider, in the style of note's default eyecatch template: bold
// left-aligned heading + orange dashed rule on the left, illustration on
// the right.
export async function composeThumbnail(
  headline: string,
  illustrationPng: Buffer
): Promise<Buffer> {
  await ensureFont();

  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const illoW = WIDTH * 0.52;
  const illoX = WIDTH - illoW;
  const illustration = await loadImage(illustrationPng);
  const scale = Math.max(illoW / illustration.width, HEIGHT / illustration.height);
  const drawW = illustration.width * scale;
  const drawH = illustration.height * scale;

  ctx.save();
  ctx.beginPath();
  ctx.rect(illoX, 0, illoW, HEIGHT);
  ctx.clip();
  ctx.drawImage(illustration, illoX + (illoW - drawW) / 2, (HEIGHT - drawH) / 2, drawW, drawH);
  ctx.restore();

  const paddingX = 70;
  const maxTextWidth = illoX - paddingX * 2;
  const fontSize = Array.from(headline).length > 18 ? 54 : 66;
  ctx.font = `bold ${fontSize}px "${FONT_FAMILY}"`;
  ctx.fillStyle = "#1a1a1a";
  ctx.textBaseline = "alphabetic";

  const lines = wrapText(ctx, headline, maxTextWidth, 4);
  const lineHeight = fontSize * 1.35;
  const textBlockHeight = lines.length * lineHeight;
  let y = HEIGHT / 2 - textBlockHeight / 2 + fontSize * 0.85;
  for (const line of lines) {
    ctx.fillText(line, paddingX, y);
    y += lineHeight;
  }

  const dividerY = y - lineHeight + fontSize * 0.55;
  ctx.strokeStyle = "#e8823c";
  ctx.lineWidth = 5;
  ctx.setLineDash([22, 14]);
  ctx.beginPath();
  ctx.moveTo(paddingX, dividerY);
  ctx.lineTo(paddingX + Math.min(maxTextWidth, 420), dividerY);
  ctx.stroke();

  return canvas.toBuffer("image/png");
}

export { WIDTH as THUMBNAIL_WIDTH, HEIGHT as THUMBNAIL_HEIGHT };
