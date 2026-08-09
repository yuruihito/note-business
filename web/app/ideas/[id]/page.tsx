import { notFound } from "next/navigation";
import { getIdea } from "@/lib/data";
import { decideIdea } from "../../actions";

export default async function IdeaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const idea = await getIdea(id);
  if (!idea) notFound();

  return (
    <>
      <h1>{idea.title}</h1>
      <span className={`badge badge-${idea.status}`}>{idea.status}</span>

      {idea.thumbnail_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={idea.thumbnail_url}
          alt={`${idea.title} のサムネイル`}
          style={{ width: "100%", maxWidth: 640, borderRadius: 10, marginTop: "1rem" }}
        />
      )}
      {idea.status === "approved" && !idea.thumbnail_url && (
        <p className="card-meta" style={{ marginTop: "0.75rem" }}>
          サムネイル画像は生成できませんでした(Gemini APIの設定を確認してください)。
        </p>
      )}

      <h2 style={{ marginTop: "1.5rem" }}>概要</h2>
      <p className="prose">{idea.summary}</p>

      {idea.market_notes && (
        <>
          <h2 style={{ marginTop: "1.5rem" }}>市場調査メモ</h2>
          <p className="prose">{idea.market_notes}</p>
        </>
      )}

      {idea.body && (
        <>
          <h2 style={{ marginTop: "1.5rem" }}>note投稿の下書き</h2>
          <div className="card">
            <p className="prose">{idea.body}</p>
          </div>
        </>
      )}

      {idea.decision_reason && (
        <p className="card-meta">判断理由: {idea.decision_reason}</p>
      )}

      {idea.status === "draft" && (
        <div className="actions-row">
          <form action={decideIdea}>
            <input type="hidden" name="id" value={idea.id} />
            <input type="hidden" name="decision" value="approved" />
            <button type="submit">承認する</button>
          </form>
          <form action={decideIdea}>
            <input type="hidden" name="id" value={idea.id} />
            <input type="hidden" name="decision" value="rejected" />
            <button type="submit" className="danger">
              却下する
            </button>
          </form>
        </div>
      )}
    </>
  );
}
