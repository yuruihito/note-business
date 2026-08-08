import { hasValidSession } from "@/lib/auth";
import { getOfficeNames, listActivityLog, listIdeas, listRequests } from "@/lib/data";
import type { ActivityLogEntry, RequestStatus } from "@/lib/types";

export type DeptStatus = {
  status: "working" | "idle";
  message: string;
  link: string | null;
};

export type ActiveRequestSummary = {
  id: string;
  text: string;
  status: RequestStatus;
};

export type DraftIdeaSummary = {
  id: string;
  title: string;
  summary: string;
  body: string | null;
};

export type OfficeStatusResponse = {
  cmo: DeptStatus;
  cfo: DeptStatus;
  secretary: DeptStatus;
  names: { cmo: string; cfo: string; ceo: string; secretary: string };
  activeRequest: ActiveRequestSummary | null;
  draftIdeas: DraftIdeaSummary[];
  pendingRequestCount: number;
  suggestHiring: boolean;
  recentActivity: ActivityLogEntry[];
};

const RECENT_MS = 24 * 60 * 60 * 1000; // consider content "fresh" for 24h
const HIRING_SUGGESTION_THRESHOLD = 3;

function truncate(text: string, max = 42) {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

export async function GET() {
  if (!(await hasValidSession())) {
    return new Response(null, { status: 401 });
  }

  const [requests, ideas, names, recentActivity] = await Promise.all([
    listRequests(),
    listIdeas(),
    getOfficeNames(),
    listActivityLog(15),
  ]);

  const pendingRequests = requests.filter(
    (r) => r.status === "queued" || r.status === "in_progress"
  );
  const activeRequest = pendingRequests[0];

  const latestActivityForActiveRequest = activeRequest
    ? recentActivity.find((a) => a.request_id === activeRequest.id)
    : undefined;

  let cmo: DeptStatus;
  if (activeRequest) {
    cmo = {
      status: "working",
      message: latestActivityForActiveRequest
        ? truncate(latestActivityForActiveRequest.message, 60)
        : `「${truncate(activeRequest.text)}」に対応中`,
      link: "/requests",
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
          link: `/ideas/${latestIdea.id}`,
        }
      : { status: "idle", message: "待機中です", link: null };
  }

  // CFOは現時点で連携する会計データが無いため、常に待機中として正直に表示する。
  const cfo: DeptStatus = {
    status: "idle",
    message: "経理タスクはまだありません",
    link: null,
  };

  const allDraftIdeas = ideas.filter((i) => i.status === "draft");
  const draftIdeas: DraftIdeaSummary[] = allDraftIdeas
    .slice(0, 5)
    .map((i) => ({
      id: i.id,
      title: i.title,
      summary: truncate(i.summary, 60),
      body: i.body,
    }));

  const backlogCount = pendingRequests.length + allDraftIdeas.length;
  const latestSecretaryActivity = recentActivity.find((a) => a.actor === "secretary");
  const secretary: DeptStatus =
    backlogCount > 0
      ? {
          status: "working",
          message: latestSecretaryActivity
            ? truncate(latestSecretaryActivity.message, 60)
            : `未対応の依頼・企画あわせて${backlogCount}件をサポート中`,
          link: null,
        }
      : { status: "idle", message: "今は落ち着いています", link: null };

  const response: OfficeStatusResponse = {
    cmo,
    cfo,
    secretary,
    names,
    activeRequest: activeRequest
      ? { id: activeRequest.id, text: activeRequest.text, status: activeRequest.status }
      : null,
    draftIdeas,
    pendingRequestCount: pendingRequests.length,
    suggestHiring: pendingRequests.length >= HIRING_SUGGESTION_THRESHOLD,
    recentActivity,
  };
  return Response.json(response);
}
