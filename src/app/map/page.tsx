import { Suspense } from "react";
import MapClient from "./MapClient";

export default function Page() {
  return (
    <Suspense fallback={<div style={{ padding: 16 }}>Loading map...</div>}>
      <MapClient />
    </Suspense>
  );
}
