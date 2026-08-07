import OfficeSceneLoader from "./office-scene-loader";

export default function OfficePage() {
  return (
    <>
      <h1>オフィス</h1>
      <p style={{ marginBottom: "1rem", color: "var(--muted)" }}>
        各部門の稼働状況をリアルタイムに表示します。吹き出しは実際のデータ(依頼・企画)に基づいています。
      </p>
      <OfficeSceneLoader />
    </>
  );
}
