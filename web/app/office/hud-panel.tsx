"use client";

import { useState } from "react";
import Link from "next/link";
import { decideIdea } from "../actions";
import OfficeRequestForm from "./request-form-fields";
import RoutineTimer from "./routine-timer";
import { PERSONALITIES, ROLE_LABELS } from "@/lib/office-flavor";
import type {
  DraftIdeaSummary,
  OfficeStatusResponse,
} from "../api/office-status/route";
import type { ActivityActor, ActivityLogEntry, RequestStatus } from "@/lib/types";

const CEO_COLOR = "#a78bfa";
const REQUEST_STEPS: { key: RequestStatus; label: string }[] = [
  { key: "queued", label: "受付" },
  { key: "in_progress", label: "対応中" },
  { key: "done", label: "完了" },
];

const ACTOR_LABELS: Record<ActivityActor, string> = {
  orchestrator: "統括",
  cmo: "CMO",
  cfo: "CFO",
  secretary: "秘書",
};

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "たった今";
  if (minutes < 60) return `${minutes}分前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}時間前`;
  return `${Math.floor(hours / 24)}日前`;
}

function ActivityRow({ entry }: { entry: ActivityLogEntry }) {
  return (
    <div className="hud-activity-row">
      <span className="hud-activity-actor">{ACTOR_LABELS[entry.actor]}</span>
      <span className="hud-activity-msg">{entry.message}</span>
      <span className="hud-activity-time">{timeAgo(entry.created_at)}</span>
    </div>
  );
}

function FaceIcon({ color }: { color: string }) {
  return (
    <svg width="36" height="36" viewBox="0 0 40 40" aria-hidden className="hud-face">
      <circle cx="20" cy="20" r="19" fill={color} />
      <circle cx="14" cy="18" r="2.2" fill="#2b2b2b" />
      <circle cx="26" cy="18" r="2.2" fill="#2b2b2b" />
      <path
        d="M14 25 Q20 29 26 25"
        stroke="#2b2b2b"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

function RequestProgressBar({ status }: { status: RequestStatus }) {
  const order = REQUEST_STEPS.map((s) => s.key);
  const currentIndex = order.indexOf(status);
  const failed = status === "failed";

  return (
    <>
      <div className="progress-bar">
        {REQUEST_STEPS.map((step, i) => (
          <div
            key={step.key}
            className={`progress-step ${
              failed ? (i === 0 ? "failed" : "") : i <= currentIndex ? "done" : ""
            }`}
          />
        ))}
      </div>
      <div className="progress-labels">
        {failed ? (
          <span>処理に失敗しました</span>
        ) : (
          REQUEST_STEPS.map((step) => <span key={step.key}>{step.label}</span>)
        )}
      </div>
    </>
  );
}

function IdeaApprovalRow({ idea }: { idea: DraftIdeaSummary }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="hud-idea-row">
      <button
        type="button"
        className="hud-idea-toggle"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="hud-idea-title">{idea.title}</div>
        <p className="hud-idea-summary">{idea.summary}</p>
        <span className="hud-idea-expand-hint">
          {expanded ? "下書きを閉じる ▲" : "下書きを読む ▼"}
        </span>
      </button>

      {expanded && (
        <div className="hud-idea-body">
          {idea.body ? idea.body : "下書き本文はまだありません。"}
        </div>
      )}

      <div className="actions-row">
        <form action={decideIdea}>
          <input type="hidden" name="id" value={idea.id} />
          <input type="hidden" name="decision" value="approved" />
          <input type="hidden" name="returnTo" value="/office" />
          <button type="submit">承認</button>
        </form>
        <form action={decideIdea}>
          <input type="hidden" name="id" value={idea.id} />
          <input type="hidden" name="decision" value="rejected" />
          <input type="hidden" name="returnTo" value="/office" />
          <button type="submit" className="danger">
            却下
          </button>
        </form>
        <Link href={`/ideas/${idea.id}`} className="hud-idea-link">
          専用ページで開く
        </Link>
      </div>
    </div>
  );
}

export default function HudPanel({ status }: { status: OfficeStatusResponse }) {
  const [requestFormKey, setRequestFormKey] = useState(0);

  const roster = [
    {
      key: "ceo",
      label: status.names.ceo,
      role: ROLE_LABELS.ceo,
      color: CEO_COLOR,
      working: false,
      statusLabel: "操作中",
      message: "オフィスを歩き回っています",
    },
    {
      key: "cmo",
      label: status.names.cmo,
      role: ROLE_LABELS.cmo,
      color: PERSONALITIES.cmo.color,
      working: status.cmo.status === "working",
      statusLabel: status.cmo.status === "working" ? "作業中" : "休憩中",
      message: status.cmo.message,
    },
    {
      key: "cfo",
      label: status.names.cfo,
      role: ROLE_LABELS.cfo,
      color: PERSONALITIES.cfo.color,
      working: status.cfo.status === "working",
      statusLabel: status.cfo.status === "working" ? "作業中" : "休憩中",
      message: status.cfo.message,
    },
    {
      key: "secretary",
      label: status.names.secretary,
      role: ROLE_LABELS.secretary,
      color: PERSONALITIES.secretary.color,
      working: status.secretary.status === "working",
      statusLabel: status.secretary.status === "working" ? "作業中" : "休憩中",
      message: status.secretary.message,
    },
  ];

  return (
    <aside className="hud-panel">
      {status.suggestHiring && (
        <div className="hud-suggestion">
          未対応の依頼が{status.pendingRequestCount}件たまっています。人手が足りないかもしれません。
          「秘書を増やして」のように話しかければ部門を増やせます。
        </div>
      )}

      <section>
        <h2 className="hud-heading">次の自動執筆</h2>
        <RoutineTimer
          nextRunAt={status.nextRoutineRunAt}
          intervalHours={status.routineIntervalHours}
        />
      </section>

      <section>
        <h2 className="hud-heading">メンバー</h2>
        {roster.map((m) => (
          <div className="hud-member" key={m.key}>
            <FaceIcon color={m.color} />
            <div className="hud-member-info">
              <div className="office-bubble-head">
                <div>
                  <strong>{m.label}</strong>
                  <div className="office-role-label">{m.role}</div>
                </div>
                <span
                  className={`office-status-pill ${m.working ? "working" : "idle"}`}
                >
                  {m.statusLabel}
                </span>
              </div>
              <p className="hud-member-msg">{m.message}</p>
            </div>
          </div>
        ))}
      </section>

      <section>
        <h2 className="hud-heading">依頼の進捗</h2>
        {status.activeRequest ? (
          <div>
            <p className="hud-request-text">{status.activeRequest.text}</p>
            <RequestProgressBar status={status.activeRequest.status} />
          </div>
        ) : (
          <p className="empty hud-empty">対応中の依頼はありません</p>
        )}
      </section>

      <section>
        <h2 className="hud-heading">最近の活動ログ</h2>
        {status.recentActivity.length === 0 ? (
          <p className="empty hud-empty">まだ記録がありません</p>
        ) : (
          status.recentActivity.map((entry) => (
            <ActivityRow key={entry.id} entry={entry} />
          ))
        )}
      </section>

      <section>
        <h2 className="hud-heading">依頼する</h2>
        <OfficeRequestForm
          key={requestFormKey}
          autoFocus={false}
          onSuccess={() => setRequestFormKey((k) => k + 1)}
        />
      </section>

      <section>
        <h2 className="hud-heading">確認待ちの企画</h2>
        {status.draftIdeas.length === 0 ? (
          <p className="empty hud-empty">確認待ちの企画はありません</p>
        ) : (
          status.draftIdeas.map((idea) => (
            <IdeaApprovalRow key={idea.id} idea={idea} />
          ))
        )}
      </section>
    </aside>
  );
}
