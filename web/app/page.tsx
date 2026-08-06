import Link from "next/link";
import { listIdeas, listRequests } from "@/lib/data";

export default async function DashboardPage() {
  const [ideas, requests] = await Promise.all([listIdeas(), listRequests()]);

  const draftIdeas = ideas.filter((i) => i.status === "draft");
  const queuedRequests = requests.filter(
    (r) => r.status === "queued" || r.status === "in_progress"
  );

  return (
    <>
      <h1>状況</h1>

      <div className="stat-grid">
        <div className="stat">
          <div className="stat-value">{draftIdeas.length}</div>
          <div className="stat-label">確認待ちの企画</div>
        </div>
        <div className="stat">
          <div className="stat-value">{queuedRequests.length}</div>
          <div className="stat-label">処理待ちの依頼</div>
        </div>
        <div className="stat">
          <div className="stat-value">{ideas.length}</div>
          <div className="stat-label">企画の総数</div>
        </div>
      </div>

      <h2>直近の企画</h2>
      {ideas.length === 0 && (
        <p className="empty">
          まだ企画はありません。クラウドルーチンが次回実行されると、note市場調査をもとに企画が追加されます。
        </p>
      )}
      {ideas.slice(0, 5).map((idea) => (
        <Link key={idea.id} className="card-link" href={`/ideas/${idea.id}`}>
          <div className="card">
            <div className="card-title">{idea.title}</div>
            <span className={`badge badge-${idea.status}`}>
              {idea.status}
            </span>
          </div>
        </Link>
      ))}
      {ideas.length > 0 && (
        <p>
          <Link href="/ideas">すべての企画を見る →</Link>
        </p>
      )}

      <h2 style={{ marginTop: "2rem" }}>直近の依頼</h2>
      {requests.length === 0 && <p className="empty">まだ依頼はありません。</p>}
      {requests.slice(0, 5).map((r) => (
        <div className="card" key={r.id}>
          <div className="card-title">{r.text}</div>
          <span className={`badge badge-${r.status}`}>{r.status}</span>
        </div>
      ))}
      {requests.length > 0 && (
        <p>
          <Link href="/requests">すべての依頼を見る →</Link>
        </p>
      )}
    </>
  );
}
