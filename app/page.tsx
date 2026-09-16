import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { CashProApp } from "@/components/cash-pro/app";
import { parseTab } from "@/lib/cash-pro/tabs";
import { getSnapshot } from "@/lib/server/snapshot";
import { getSession } from "@/lib/session";

export default async function HomePage({ searchParams }: PageProps<"/">) {
  const session = await getSession();
  if (!session) redirect("/login");

  const [snapshot, { tab }, cookieStore] = await Promise.all([
    getSnapshot(session.user.id),
    searchParams,
    cookies(),
  ]);
  const { id, name, email, image } = session.user;

  return (
    <CashProApp
      user={{ id, name, email, image: image ?? null }}
      snapshot={snapshot}
      initialTab={parseTab(tab)}
      // The sidebar remembers whether it was collapsed in this cookie.
      sidebarOpen={cookieStore.get("sidebar_state")?.value !== "false"}
    />
  );
}
