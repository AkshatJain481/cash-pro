"use client";

import { ChartColumn, Clock3, Moon, Sun } from "lucide-react";
import { Activity, useEffect, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import { clockTime, longDate } from "@/lib/cash-pro/dates";
import { TABS, type Tab } from "@/lib/cash-pro/tabs";
import type { AppUser, Snapshot } from "@/lib/cash-pro/types";
import { cn } from "@/lib/utils";

import { AccountMenuContent, UserAvatar, useAppTheme } from "./account";
import { AppSidebar } from "./app-sidebar";
import { BrandMark } from "./brand";
import { useMounted, useNow } from "./hooks";
import { SCREENS, screenFor } from "./navigation";
import { Reminders } from "./reminders";
import { ScreenSkeleton } from "./screen-skeleton";
import { AssetsScreen } from "./screens/assets";
import { CalendarScreen } from "./screens/calendar";
import { HomeScreen } from "./screens/home";
import { MoneyScreen } from "./screens/money";
import { TasksScreen } from "./screens/tasks";
import { TodosScreen } from "./screens/todos";
import { SettingsSheet } from "./settings-sheet";
import { CashProProvider, useCashPro, useCashProActions, useCashProStore } from "./store";
import { SummaryDialog } from "./summary-dialog";

type CashProAppProps = {
  user: AppUser;
  snapshot: Snapshot;
  initialTab: Tab;
  sidebarOpen: boolean;
};

export function CashProApp({ user, snapshot, initialTab, sidebarOpen }: CashProAppProps) {
  return (
    <CashProProvider user={user} snapshot={snapshot}>
      <TooltipProvider delayDuration={200}>
        <SidebarProvider defaultOpen={sidebarOpen}>
          <AppShell initialTab={initialTab} />
        </SidebarProvider>
      </TooltipProvider>
    </CashProProvider>
  );
}

function AppShell({ initialTab }: { initialTab: Tab }) {
  const [tab, setTab] = useState(initialTab);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  // Screens depend on the user's clock and time zone, so they render in the browser only.
  const mounted = useMounted();
  const isMobile = useIsMobile();
  useResyncWhenVisible();

  function changeTab(next: Tab) {
    setTab(next);
    window.history.replaceState(null, "", next === "home" ? "/" : `/?tab=${next}`);
    window.scrollTo({ top: 0 });
  }

  const openSettings = () => setSettingsOpen(true);
  const openSummary = () => setSummaryOpen(true);
  const screens: Record<Tab, ReactNode> = {
    home: <HomeScreen onOpenSummary={openSummary} />,
    money: <MoneyScreen />,
    calendar: <CalendarScreen />,
    tasks: <TasksScreen />,
    todo: <TodosScreen />,
    assets: <AssetsScreen />,
  };

  return (
    <>
      <AppSidebar tab={tab} onNavigate={changeTab} onOpenSettings={openSettings} onOpenSummary={openSummary} />

      <div className="flex min-w-0 flex-1 flex-col">
        <MobileTopBar onOpenSettings={openSettings} onOpenSummary={openSummary} />
        <DesktopHeader tab={tab} onOpenSummary={openSummary} />

        <main className="@container/main mx-auto w-full max-w-7xl flex-1 px-3.5 pt-3.5 pb-[calc(env(safe-area-inset-bottom)+6.5rem)] md:px-6 md:pt-6 md:pb-12 lg:px-8">
          {mounted ? (
            TABS.map((name) => (
              // Hidden screens stay mounted, so half-filled forms survive tab switches.
              <Activity key={name} mode={name === tab ? "visible" : "hidden"}>
                <div className="flex flex-col gap-3 @4xl/main:gap-5">{screens[name]}</div>
              </Activity>
            ))
          ) : (
            <ScreenSkeleton />
          )}
        </main>

        <BottomNav tab={tab} onChange={changeTab} />
      </div>

      <SettingsSheet
        side={isMobile ? "left" : "right"}
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        onOpenSummary={() => {
          setSettingsOpen(false);
          setSummaryOpen(true);
        }}
      />
      <SummaryDialog open={summaryOpen} onOpenChange={setSummaryOpen} />
      {mounted && <Reminders />}
    </>
  );
}

/** Picks up changes made on other devices when the app comes back into view. */
function useResyncWhenVisible() {
  const store = useCashProStore();
  const actions = useCashProActions();

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - store.getState().syncedAt > 60_000) void actions.resync({ silent: true });
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [store, actions]);
}

type OverlayHandlers = { onOpenSettings: () => void; onOpenSummary: () => void };

function MobileTopBar({ onOpenSettings, onOpenSummary }: OverlayHandlers) {
  const now = useNow();
  const user = useCashPro((s) => s.user);

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-card/85 pt-[env(safe-area-inset-top)] backdrop-blur-xl backdrop-saturate-150 md:hidden">
      <div className="flex h-16 items-center justify-between gap-3 px-4">
        <button
          type="button"
          onClick={onOpenSettings}
          aria-label="Open settings and backup"
          className="group flex min-w-0 items-center gap-2.5 rounded-2xl text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <BrandMark className="size-10 transition-transform group-hover:scale-105" />
          <span className="min-w-0">
            <span className="block text-[17px] leading-tight font-bold tracking-tight">Cash Pro</span>
            <span className="block truncate font-mono text-[10px] tracking-wide text-muted-foreground">
              {now === null ? " " : longDate(new Date(now))}
            </span>
          </span>
        </button>

        <div className="flex shrink-0 items-center gap-1.5">
          <span className="hidden rounded-lg border bg-muted px-2 py-1 font-mono text-[11px] tracking-wide text-muted-foreground tabular-nums min-[400px]:inline-block">
            {now === null ? "--:--:--" : clockTime(new Date(now))}
          </span>
          <ThemeToggle />
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Account menu"
                className="rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                <UserAvatar user={user} className="size-9 ring-2 ring-secondary after:hidden" />
              </button>
            </DropdownMenuTrigger>
            <AccountMenuContent user={user} onOpenSettings={onOpenSettings} onOpenSummary={onOpenSummary} />
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

function DesktopHeader({ tab, onOpenSummary }: { tab: Tab; onOpenSummary: () => void }) {
  const screen = screenFor(tab);
  const now = useNow();

  return (
    <header className="sticky top-0 z-20 hidden h-16 shrink-0 border-b border-border/70 bg-background/80 backdrop-blur-xl backdrop-saturate-150 md:block">
      <div className="mx-auto flex h-full w-full max-w-7xl items-center gap-3 px-6 lg:px-8">
        <SidebarTrigger className="-ml-2 text-muted-foreground" />
        <Separator orientation="vertical" className="h-5" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[17px] leading-tight font-bold tracking-tight">{screen.label}</h1>
          <p className="truncate text-xs text-muted-foreground">{screen.description}</p>
        </div>
        <span className="hidden items-center gap-2 rounded-xl border bg-card px-3 py-1.5 font-mono text-xs text-muted-foreground tabular-nums lg:inline-flex">
          <Clock3 className="size-3.5" />
          {now === null ? " " : `${longDate(new Date(now))} · ${clockTime(new Date(now))}`}
        </span>
        <Button variant="outline" className="rounded-xl" onClick={onOpenSummary}>
          <ChartColumn />
          Summary
        </Button>
        <ThemeToggle />
      </div>
    </header>
  );
}

function ThemeToggle() {
  const theme = useAppTheme();

  return (
    <Button
      variant="outline"
      size="icon"
      aria-label="Toggle dark mode"
      className="rounded-xl text-muted-foreground"
      onClick={theme.toggle}
    >
      <Moon className="dark:hidden" />
      <Sun className="hidden dark:block" />
    </Button>
  );
}

function BottomNav({ tab, onChange }: { tab: Tab; onChange: (tab: Tab) => void }) {
  return (
    <nav
      aria-label="Sections"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-card/90 pb-[max(0.625rem,env(safe-area-inset-bottom))] backdrop-blur-xl backdrop-saturate-150 md:hidden"
    >
      <div className="mx-auto grid max-w-xl grid-cols-6 gap-1 px-2 pt-1.5">
        {SCREENS.map(({ tab: name, shortLabel, icon: Icon }) => {
          const active = name === tab;
          return (
            <button
              key={name}
              type="button"
              onClick={() => onChange(name)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[10px] font-semibold tracking-wide transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                active ? "bg-secondary text-primary" : "text-faint hover:bg-muted hover:text-muted-foreground",
              )}
            >
              <Icon className={cn("size-5 transition-transform", active && "scale-110")} strokeWidth={active ? 2.2 : 1.8} />
              {shortLabel}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
