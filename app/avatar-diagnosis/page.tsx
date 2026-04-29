import * as React from "react";
import { AvatarDiagnosisClient } from "./ui/AvatarDiagnosisClient";

export default function AvatarDiagnosisPage() {
  return (
    <React.Suspense fallback={null}>
      <AvatarDiagnosisClient />
    </React.Suspense>
  );
}

