import { listRequests } from "@/lib/data";
import RequestForm from "./request-form";

export default async function RequestsPage() {
  const requests = await listRequests();

  return (
    <>
      <h1>CEOからの依頼</h1>
      <p style={{ marginBottom: "1.25rem", color: "var(--muted)" }}>
        「〇〇についてnoteで市場調査して」のように自由に書いてください。次回のクラウドルーチン実行時に処理されます。
      </p>

      <RequestForm />

      <h2 style={{ marginTop: "2rem" }}>依頼履歴</h2>
      {requests.length === 0 && <p className="empty">まだ依頼はありません。</p>}
      {requests.map((r) => (
        <div className="card" key={r.id}>
          <div className="card-title">{r.text}</div>
          <span className={`badge badge-${r.status}`}>{r.status}</span>
          {r.result && <p style={{ marginTop: "0.5rem" }}>{r.result}</p>}
          <div className="card-meta">
            {new Date(r.created_at).toLocaleString("ja-JP")}
          </div>
        </div>
      ))}
    </>
  );
}
