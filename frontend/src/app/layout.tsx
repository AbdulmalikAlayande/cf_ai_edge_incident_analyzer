import type { PropsWithChildren } from "react";

function AppLayout({ children }: PropsWithChildren) {
  return <div className="min-h-screen bg-background text-foreground antialiased">{children}</div>;
}

export default AppLayout;
