"use client";

import Link from "next/link";
import type { DeptStatus } from "../api/office-status/route";

export default function DetailPanel({
  name,
  role,
  trait,
  status,
  onClose,
}: {
  name: string;
  role: string;
  trait: string;
  status: DeptStatus;
  onClose: () => void;
}) {
  return (
    <div className="office-panel">
      <div className="office-panel-header">
        <div>
          <div className="card-title">{name}</div>
          <div className="card-meta">
            {role} ・ {trait}
          </div>
        </div>
        <button type="button" className="secondary" onClick={onClose}>
          閉じる
        </button>
      </div>

      <span className={`badge badge-${status.status === "working" ? "draft" : "queued"}`}>
        {status.status === "working" ? "作業中" : "待機中"}
      </span>
      <p className="prose" style={{ marginTop: "0.75rem" }}>
        {status.message}
      </p>

      {status.link && (
        <p style={{ marginTop: "1rem" }}>
          <Link href={status.link}>詳細を見る →</Link>
        </p>
      )}
    </div>
  );
}
