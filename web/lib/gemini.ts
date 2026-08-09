import "server-only";

const GEMINI_MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";

export function buildIllustrationPrompt(title: string, summary: string): string {
  return [
    "Monochrome pen-and-ink line-art sketch illustration, hand-drawn notebook/journal style,",
    "clean plain white background, no text, no letters, no words, no logos anywhere in the image,",
    "warm minimalist editorial illustration style,",
    `depicting the theme: ${title} — ${summary}`,
  ].join(" ");
}

// Calls Gemini's image generation model and returns the raw image bytes.
// Throws on any failure — the caller decides how to degrade gracefully.
export async function generateIllustration(prompt: string): Promise<Buffer> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error (${res.status}): ${errText.slice(0, 300)}`);
  }

  const json = await res.json();
  const parts: Array<{ inlineData?: { data: string } }> =
    json?.candidates?.[0]?.content?.parts ?? [];
  const imagePart = parts.find((p) => p.inlineData?.data);
  if (!imagePart?.inlineData) {
    throw new Error("Gemini did not return an image part");
  }
  return Buffer.from(imagePart.inlineData.data, "base64");
}
