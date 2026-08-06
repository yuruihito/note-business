import Link from "next/link";
import { listIdeas } from "@/lib/data";

export default async function IdeasPage() {
  const ideas = await listIdeas();

  return (
    <>
      <h1>企画一覧</h1>
      {ideas.length === 0 && (
        <p className="empty">
          まだ企画はありません。クラウドルーチンが次回実行されると、note市場調査をもとに企画が追加されます。
        </p>
      )}
      {ideas.map((idea) => (
        <Link key={idea.id} className="card-link" href={`/ideas/${idea.id}`}>
          <div className="card">
            <div className="card-title">{idea.title}</div>
            <p>{idea.summary}</p>
            <div className="card-meta">
              <span className={`badge badge-${idea.status}`}>
                {idea.status}
              </span>
              {"  "}
              {new Date(idea.created_at).toLocaleString("ja-JP")}
            </div>
          </div>
        </Link>
      ))}
    </>
  );
}
