"use client";

import { ChartColumn, ChevronsUpDown, DatabaseBackup } from "lucide-react";
import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";

import { DropdownMenu, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { computeCashBalance, summarizeAssets, withCashAsset } from "@/lib/cash-pro/assets";
import { formatINR } from "@/lib/cash-pro/format";
import type { Tab } from "@/lib/cash-pro/tabs";

import { AccountMenuContent, UserAvatar } from "./account";
import { BrandMark } from "./brand";
import { SCREENS } from "./navigation";
import { useCashPro } from "./store";

type AppSidebarProps = {
  tab: Tab;
  onNavigate: (tab: Tab) => void;
  onOpenSettings: () => void;
  onOpenSummary: () => void;
};

const groupLabel = "text-[10px] font-bold tracking-[0.1em] text-faint uppercase";
const menuButton = "h-10 gap-3 font-medium text-sidebar-foreground/80";

/** Desktop and tablet navigation. Phones use the bottom navigation instead. */
export function AppSidebar({ tab, onNavigate, onOpenSettings, onOpenSummary }: AppSidebarProps) {
  const { user, tasks, todos, assets, money } = useCashPro(
    useShallow((s) => ({ user: s.user, tasks: s.tasks, todos: s.todos, assets: s.assets, money: s.money })),
  );
  const { netWorth, cash } = useMemo(
    () => ({
      netWorth: summarizeAssets(withCashAsset(assets, money)).netWorth,
      cash: Math.max(0, computeCashBalance(money)),
    }),
    [assets, money],
  );
  const badges: Partial<Record<Tab, number>> = {
    tasks: tasks.filter((task) => task.status !== "DONE").length,
    todo: todos.filter((todo) => todo.status !== "DONE").length,
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-16 justify-center border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip="Cash Pro"
              onClick={() => onNavigate("home")}
              className="h-11 hover:bg-transparent active:bg-transparent"
            >
              <BrandMark className="size-8 rounded-[10px]" />
              <span className="grid min-w-0 flex-1 leading-tight">
                <span className="truncate text-[15px] font-bold tracking-tight">Cash Pro</span>
                <span className="truncate text-[11px] text-muted-foreground">Money · Tasks · Net worth</span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className={groupLabel}>Workspace</SidebarGroupLabel>
          <SidebarMenu>
            {SCREENS.map(({ tab: name, label, icon: Icon }) => (
              <SidebarMenuItem key={name}>
                <SidebarMenuButton
                  isActive={name === tab}
                  tooltip={label}
                  onClick={() => onNavigate(name)}
                  className={`${menuButton} data-active:bg-secondary data-active:font-semibold data-active:text-primary`}
                >
                  <Icon />
                  <span>{label}</span>
                </SidebarMenuButton>
                {badges[name] ? (
                  <SidebarMenuBadge className="rounded-full bg-accent px-1.5 text-[11px] text-muted-foreground peer-data-[size=default]/menu-button:top-2.5">
                    {badges[name]}
                  </SidebarMenuBadge>
                ) : null}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className={groupLabel}>Tools</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Daily Fund Summary" onClick={onOpenSummary} className={menuButton}>
                <ChartColumn />
                <span>Daily Fund Summary</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Backup & Settings" onClick={onOpenSettings} className={menuButton}>
                <DatabaseBackup />
                <span>Backup &amp; Settings</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup className="mt-auto group-data-[collapsible=icon]:hidden">
          <button
            type="button"
            onClick={() => onNavigate("assets")}
            className="relative overflow-hidden rounded-2xl bg-linear-to-br from-hero-from to-hero-to p-4 text-left text-white outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <span aria-hidden className="pointer-events-none absolute -top-8 -right-6 size-24 rounded-full bg-white/7" />
            <span className="relative block text-[10px] font-semibold tracking-[0.08em] text-white/60 uppercase">
              Net worth
            </span>
            <span className="relative mt-1 block font-mono text-lg leading-tight font-medium break-words tabular-nums">
              {formatINR(netWorth)}
            </span>
            <span className="relative mt-2 block text-[11px] text-white/60">Cash balance {formatINR(cash)}</span>
          </button>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" className="h-12 data-open:bg-sidebar-accent">
                  <UserAvatar user={user} className="size-8" />
                  <span className="grid min-w-0 flex-1 leading-tight">
                    <span className="truncate text-sm font-semibold">{user.name}</span>
                    <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                  </span>
                  <ChevronsUpDown className="ml-auto text-muted-foreground" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <AccountMenuContent
                user={user}
                side="right"
                align="end"
                onOpenSettings={onOpenSettings}
                onOpenSummary={onOpenSummary}
              />
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
