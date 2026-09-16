"use client";

import { CalendarDays, DatabaseBackup, Landmark, ShieldCheck, WalletCards } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";

import { BrandMark, GoogleIcon } from "./brand";

const FEATURES = [
  { icon: WalletCards, title: "Receipts & payments", text: "A daily ledger that keeps your cash balance in sync" },
  { icon: Landmark, title: "Net worth", text: "Assets and liabilities grouped by how liquid they are" },
  { icon: CalendarDays, title: "Calendar & tasks", text: "Events with reminders, tasks and a quick to-do list" },
  { icon: DatabaseBackup, title: "Backups", text: "Export to JSON, CSV or Gmail whenever you like" },
];

/** The brand panel beside the sign-in card on large screens. */
export function LoginBrandPanel() {
  return (
    <section className="relative hidden flex-col justify-between overflow-hidden bg-linear-to-br from-hero-from to-hero-to p-10 text-white lg:flex xl:p-14">
      <div aria-hidden className="pointer-events-none absolute -top-32 -right-24 size-[28rem] rounded-full bg-white/6" />
      <div aria-hidden className="pointer-events-none absolute -bottom-40 -left-20 size-[26rem] rounded-full bg-white/4" />

      <div className="relative flex items-center gap-3">
        <BrandMark glass className="size-11" />
        <span className="text-xl font-bold tracking-tight">Cash Pro</span>
      </div>

      <div className="relative max-w-xl">
        <h1 className="text-4xl leading-[1.1] font-bold tracking-tight xl:text-5xl">
          Your money, tasks and net worth — in one place.
        </h1>
        <p className="mt-4 max-w-lg text-base leading-relaxed text-white/70">
          Record receipts and payments, stay on top of events and to-dos, and see exactly how liquid your net worth
          is.
        </p>
        <ul className="mt-10 grid grid-cols-2 gap-3">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <li key={title} className="rounded-2xl bg-white/8 p-4 ring-1 ring-white/10 backdrop-blur-sm">
              <Icon className="size-5 text-white/90" />
              <p className="mt-3 text-sm font-semibold">{title}</p>
              <p className="mt-1 text-xs leading-relaxed text-white/60">{text}</p>
            </li>
          ))}
        </ul>
      </div>

      <p className="relative flex items-center gap-2 text-xs text-white/50">
        <ShieldCheck className="size-4" />
        Your data is private to your Google account.
      </p>
    </section>
  );
}

export function LoginCard({ failed }: { failed: boolean }) {
  const [pending, setPending] = useState(false);

  async function signIn() {
    setPending(true);
    const { error } = await authClient.signIn.social({
      provider: "google",
      callbackURL: "/",
      errorCallbackURL: "/login",
    });
    if (error) {
      setPending(false);
      toast.error(error.message || "Couldn't start Google sign-in. Please try again.");
    }
  }

  return (
    <div className="w-full max-w-sm">
      {/* Phones: a compact brand header above the card. */}
      <section className="relative overflow-hidden rounded-3xl bg-linear-to-br from-hero-from to-hero-to px-6 pt-7 pb-16 text-white shadow-xl shadow-hero-from/20 lg:hidden">
        <div aria-hidden className="pointer-events-none absolute -top-12 -right-10 size-40 rounded-full bg-white/7" />
        <div aria-hidden className="pointer-events-none absolute -bottom-10 left-16 size-28 rounded-full bg-white/5" />
        <BrandMark glass className="relative size-12" />
        <h1 className="relative mt-5 text-3xl font-bold tracking-tight">Cash Pro</h1>
        <p className="relative mt-1.5 text-sm leading-relaxed text-white/70">
          Receipts &amp; payments, calendar, tasks and net worth — in one place.
        </p>
      </section>

      <Card className="relative mx-3 -mt-10 gap-0 py-6 shadow-lg lg:mx-0 lg:mt-0 lg:py-9 lg:shadow-xl">
        <CardContent className="flex flex-col gap-5 px-6 lg:px-8">
          <div className="hidden lg:block">
            <BrandMark className="size-11" />
            <h2 className="mt-6 text-2xl font-bold tracking-tight">Sign in to Cash Pro</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">Use your Google account to continue.</p>
          </div>

          <ul className="flex flex-col gap-3 lg:hidden">
            {FEATURES.slice(0, 3).map(({ icon: Icon, title }) => (
              <li key={title} className="flex items-center gap-3 text-[13px]">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
                  <Icon className="size-4" />
                </span>
                {title}
              </li>
            ))}
          </ul>

          {failed && (
            <p role="alert" className="rounded-xl bg-destructive/10 px-3 py-2 text-xs text-destructive">
              Google sign-in didn&apos;t complete. Please try again.
            </p>
          )}

          <Button
            size="lg"
            variant="outline"
            className="h-11 w-full bg-card text-[15px] font-semibold"
            onClick={signIn}
            disabled={pending}
          >
            {pending ? <Spinner /> : <GoogleIcon className="size-5" />}
            Continue with Google
          </Button>

          <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
            We only use your Google name, email and photo to sign you in.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
