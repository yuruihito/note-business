import OfficeScene from "./office-scene";

export default function OfficePage() {
  return (
    <>
      <h1>オフィス</h1>
      <p style={{ marginBottom: "1rem", color: "var(--muted)" }}>
        各部門の稼働状況を15秒ごとに更新して表示します。吹き出しは実際のデータ(依頼・企画)に基づいています。
      </p>
      <OfficeScene />
    </>
  );
}
