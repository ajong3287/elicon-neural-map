import Link from "next/link";

export default function DataPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#0b0b0f", color: "#e5e7eb", padding: 20 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <Link href="/map" style={{ color: "#a78bfa" }}>← Map</Link>
        <h1 style={{ margin: 0 }}>Data (v0.2 예정)</h1>
      </div>
      <p style={{ opacity: 0.8, marginTop: 12 }}>
        v0.2에서 Data는 "DB/스키마 기반 ERD( Folder/File/Code/Doc/Self ) 자동 생성"으로 구현합니다.
        먼저 v0.1을 안정화한 뒤 Prisma 스키마를 붙여 ERD를 그립니다.
      </p>
    </div>
  );
}
