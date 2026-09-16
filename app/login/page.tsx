import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LoginBrandPanel, LoginCard } from "@/components/cash-pro/login-card";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Sign in · Cash Pro",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  if (await getSession()) redirect("/");
  const { error } = await searchParams;

  return (
    <main className="grid min-h-dvh lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
      <LoginBrandPanel />
      <div className="flex items-center justify-center px-4 py-10 lg:px-10">
        <LoginCard failed={Boolean(error)} />
      </div>
    </main>
  );
}
