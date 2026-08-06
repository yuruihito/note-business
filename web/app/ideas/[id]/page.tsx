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
