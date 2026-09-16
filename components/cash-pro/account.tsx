"use client";

import { ChartColumn, DatabaseBackup, LogOut, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useState, type ComponentProps } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";
import type { AppUser } from "@/lib/cash-pro/types";
import { cn } from "@/lib/utils";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "?";

/** The Google profile photo, or the user's initials. */
export function UserAvatar({
  user,
  className,
  fallbackClassName,
}: {
  user: AppUser;
  className?: string;
  fallbackClassName?: string;
}) {
  return (
    <Avatar className={className}>
      {user.image && <AvatarImage src={user.image} alt={user.name} referrerPolicy="no-referrer" />}
      <AvatarFallback className={cn("bg-secondary font-semibold text-primary", fallbackClassName)}>
        {initials(user.name)}
      </AvatarFallback>
    </Avatar>
  );
}

export function useSignOut() {
  const [pending, setPending] = useState(false);

  async function signOut() {
    setPending(true);
    await authClient.signOut();
    // A full page load so no financial data stays in memory (or behind Back).
    window.location.replace("/login");
  }

  return { signOut, pending };
}

export function useThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const dark = resolvedTheme === "dark";
  return { dark, toggle: () => setTheme(dark ? "light" : "dark") };
}

type AccountMenuContentProps = {
  user: AppUser;
  onOpenSettings: () => void;
  onOpenSummary: () => void;
} & Pick<ComponentProps<typeof DropdownMenuContent>, "side" | "align">;

/** Profile menu shared by the phone top bar and the desktop sidebar. */
export function AccountMenuContent({
  user,
  onOpenSettings,
  onOpenSummary,
  side = "bottom",
  align = "end",
}: AccountMenuContentProps) {
  const { signOut } = useSignOut();
  const theme = useThemeToggle();

  return (
    <DropdownMenuContent side={side} align={align} sideOffset={8} className="w-64">
      <DropdownMenuLabel className="p-0 font-normal">
        <div className="flex items-center gap-3 px-2 py-2">
          <UserAvatar user={user} className="size-10" />
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-semibold text-foreground">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <DropdownMenuItem onSelect={onOpenSettings}>
          <DatabaseBackup />
          Backup &amp; settings
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onOpenSummary}>
          <ChartColumn />
          Daily fund summary
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={(event) => {
            event.preventDefault();
            theme.toggle();
          }}
        >
          {theme.dark ? <Sun /> : <Moon />}
          {theme.dark ? "Light mode" : "Dark mode"}
        </DropdownMenuItem>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuItem variant="destructive" onSelect={() => void signOut()}>
        <LogOut />
        Sign out
      </DropdownMenuItem>
    </DropdownMenuContent>
  );
}
