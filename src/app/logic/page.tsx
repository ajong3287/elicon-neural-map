import Link from "next/link";

export default function LogicPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#0b0b0f", color: "#e5e7eb", padding: 20 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <Link href="/map" style={{ color: "#a78bfa" }}>← Map</Link>
        <h1 style={{ margin: 0 }}>Logic (v0.2 예정)</h1>
      </div>
      <p style={{ opacity: 0.8, marginTop: 12 }}>
        v0.1은 Map에서 "노드 클릭 → 코드 미리보기"까지 완성했습니다.
        v0.2에서 Logic은 "흐름/파이프라인 노드(작업/결정/검증) + 실행 로그 연결"로 확장합니다.
      </p>
    </div>
  );
}
