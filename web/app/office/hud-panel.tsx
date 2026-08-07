"use client";

import { useState } from "react";
import Link from "next/link";
import { decideIdea } from "../actions";
import OfficeRequestForm from "./request-form-fields";
import { PERSONALITIES } from "@/lib/office-flavor";
import type {
  DraftIdeaSummary,
  OfficeStatusResponse,
} from "../api/office-status/route";
import type { RequestStatus } from "@/lib/types";

const CEO_COLOR = "#a78bfa";
const REQUEST_STEPS: { key: RequestStatus; label: string }[] = [
  { key: "queued", label: "受付" },
  { key: "in_progress", label: "対応中" },
  { key: "done", label: "完了" },
];

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
  return (
    <div className="hud-idea-row">
      <div className="hud-idea-title">{idea.title}</div>
      <p className="hud-idea-summary">{idea.summary}</p>
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
          詳細
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
      color: CEO_COLOR,
      working: false,
      statusLabel: "操作中",
      message: "オフィスを歩き回っています",
    },
    {
      key: "cmo",
      label: status.names.cmo,
      color: PERSONALITIES.cmo.color,
      working: status.cmo.status === "working",
      statusLabel: status.cmo.status === "working" ? "作業中" : "休憩中",
      message: status.cmo.message,
    },
    {
      key: "cfo",
      label: status.names.cfo,
      color: PERSONALITIES.cfo.color,
      working: status.cfo.status === "working",
      statusLabel: status.cfo.status === "working" ? "作業中" : "休憩中",
      message: status.cfo.message,
    },
  ];

  return (
    <aside className="hud-panel">
      <section>
        <h2 className="hud-heading">メンバー</h2>
        {roster.map((m) => (
          <div className="hud-member" key={m.key}>
            <FaceIcon color={m.color} />
            <div className="hud-member-info">
              <div className="office-bubble-head">
                <strong>{m.label}</strong>
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
