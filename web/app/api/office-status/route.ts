import { hasValidSession } from "@/lib/auth";
import { listIdeas, listRequests } from "@/lib/data";

export type DeptStatus = {
  status: "working" | "idle";
  message: string;
};

const RECENT_MS = 24 * 60 * 60 * 1000; // consider content "fresh" for 24h

function truncate(text: string, max = 42) {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

export async function GET() {
  if (!(await hasValidSession())) {
    return new Response(null, { status: 401 });
  }

  const [requests, ideas] = await Promise.all([listRequests(), listIdeas()]);

  const activeRequest = requests.find(
    (r) => r.status === "queued" || r.status === "in_progress"
  );

  let cmo: DeptStatus;
  if (activeRequest) {
    cmo = {
      status: "working",
      message: `「${truncate(activeRequest.text)}」に対応中`,
    };
  } else {
    const latestIdea = ideas[0];
    const isFresh =
      latestIdea &&
      Date.now() - new Date(latestIdea.created_at).getTime() < RECENT_MS;
    cmo = isFresh
      ? {
          status: "working",
          message:
            latestIdea.status === "draft"
              ? `企画「${truncate(latestIdea.title, 28)}」を作成しました`
              : `「${truncate(latestIdea.title, 28)}」を検討中`,
        }
      : { status: "idle", message: "待機中です" };
  }

  // CFOは現時点で連携する会計データが無いため、常に待機中として正直に表示する。
  const cfo: DeptStatus = { status: "idle", message: "経理タスクはまだありません" };

  return Response.json({ cmo, cfo });
}
