import { Suspense } from "react";

import { LoginFlow } from "@/components/login-flow";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginFlow portal="Admin console" avatar="pearl-4" />
    </Suspense>
  );
}
