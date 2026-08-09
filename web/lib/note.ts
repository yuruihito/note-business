import "server-only";

// note.com has no official API. This uses the same undocumented endpoint the
// note.com editor itself calls to autosave a draft, authenticated with the
// CEO's own logged-in session cookie (NOTE_SESSION_COOKIE). It is inherently
// fragile: note.com can change this at any time without notice, and the
// session cookie will eventually expire and need to be refreshed.
//
// This is only ever called for *drafts* (never publishes), and only after
// the CEO has approved an idea in this dashboard.

const NOTE_ORIGIN = "https://editor.note.com";
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";

function getCookie(): string {
  const cookie = process.env.NOTE_SESSION_COOKIE;
  if (!cookie) throw new Error("NOTE_SESSION_COOKIE is not set");
  return cookie;
}

function commonHeaders(cookie: string): Record<string, string> {
  return {
    accept: "*/*",
    "content-type": "application/json",
    origin: NOTE_ORIGIN,
    referer: `${NOTE_ORIGIN}/`,
    "x-requested-with": "XMLHttpRequest",
    "user-agent": USER_AGENT,
    cookie,
  };
}

// Visiting /notes/new creates a fresh blank draft server-side and redirects
// into the editor at /notes/{noteKey}/edit/. The numeric id draft_save needs
// is embedded in the page's hydration JSON, not the URL — extracted by
// searching near the noteKey rather than grabbing the first number on the
// page (the page has many unrelated numeric ids).
async function createDraft(cookie: string): Promise<{ id: number; noteKey: string }> {
  const res = await fetch("https://note.com/notes/new", {
    headers: { cookie, "user-agent": USER_AGENT },
    redirect: "follow",
  });
  if (!res.ok) {
    throw new Error(`note.comの新規下書き作成に失敗しました (${res.status})`);
  }

  const finalUrl = res.url;
  const keyMatch = finalUrl.match(/notes\/([a-z0-9]+)\/edit/);
  if (!keyMatch) {
    throw new Error(`note.comの新規下書きURLを解釈できませんでした: ${finalUrl}`);
  }
  const noteKey = keyMatch[1];

  const html = await res.text();
  const keyIndex = html.indexOf(`"${noteKey}"`);
  if (keyIndex === -1) {
    throw new Error("note.comの下書きIDをページ内で見つけられませんでした（ページ構造が変わった可能性があります）");
  }
  const nearby = html.slice(Math.max(0, keyIndex - 300), keyIndex + 300);
  const idMatch = nearby.match(/"id":(\d+)/);
  if (!idMatch) {
    throw new Error("note.comの下書きIDを抽出できませんでした（ページ構造が変わった可能性があります）");
  }

  return { id: Number(idMatch[1]), noteKey };
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// note's editor stores rich content as an HTML fragment. Markdown from
// content-engine is converted paragraph-by-paragraph; markdown images become
// a plain-text placeholder rather than a raw <img>, since we don't know
// note's exact block schema and a broken image block is worse than a
// visible placeholder the CEO can swap in manually.
function markdownToNoteHtml(markdown: string): string {
  const paragraphs = markdown
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const image = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
      if (image) {
        const [, alt, url] = image;
        return `<p>[画像: ${escapeHtml(alt || "image")} — ${escapeHtml(url)}]</p>`;
      }
      return `<p>${escapeHtml(line)}</p>`;
    });
  return paragraphs.length > 0 ? paragraphs.join("") : "<p><br></p>";
}

function plainTextLength(markdown: string): number {
  return markdown
    .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
    .replace(/[#*_`>]/g, "")
    .trim().length;
}

export async function saveDraftToNote(
  title: string,
  bodyMarkdown: string
): Promise<{ draftUrl: string }> {
  const cookie = getCookie();
  const { id, noteKey } = await createDraft(cookie);

  const res = await fetch(
    `https://note.com/api/v1/text_notes/draft_save?id=${id}&is_temp_saved=true`,
    {
      method: "POST",
      headers: commonHeaders(cookie),
      body: JSON.stringify({
        body: markdownToNoteHtml(bodyMarkdown),
        body_length: plainTextLength(bodyMarkdown),
        name: title,
        index: false,
        is_lead_form: false,
      }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`note下書きの保存に失敗しました (${res.status}): ${text.slice(0, 300)}`);
  }

  return { draftUrl: `${NOTE_ORIGIN}/notes/${noteKey}/edit/` };
}
