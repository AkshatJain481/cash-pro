"use client";

import { toast } from "sonner";

import { withCashAsset } from "@/lib/cash-pro/assets";
import { buildAssetsCsv, buildBackupPayload, buildMoneyCsv } from "@/lib/cash-pro/backup";
import { nextSundayKey, todayKey } from "@/lib/cash-pro/dates";

import { useCashProActions, useCashProStore } from "./store";

function saveFile(filename: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Backup, export and share helpers. Everything is built from local state. */
export function useBackupTools() {
  const store = useCashProStore();
  const actions = useCashProActions();

  const payload = () => {
    const state = store.getState();
    return buildBackupPayload(state, withCashAsset(state.assets, state.money));
  };

  function downloadJson({ silent = false } = {}) {
    saveFile(`CashPro_Backup_${todayKey()}.json`, JSON.stringify(payload(), null, 2), "application/json");
    actions.recordBackup("📂 Downloaded JSON");
    if (!silent) toast.success("Backup downloaded!");
  }

  function exportMoneyCsv() {
    saveFile(`CashPro_Money_${todayKey()}.csv`, buildMoneyCsv(store.getState().money), "text/csv;charset=utf-8");
    actions.recordBackup("📊 Exported CSV");
    toast.success("CSV exported!");
  }

  function exportAssetsCsv() {
    const { assets, money } = store.getState();
    saveFile(`CashPro_Assets_${todayKey()}.csv`, buildAssetsCsv(withCashAsset(assets, money)), "text/csv;charset=utf-8");
    actions.recordBackup("📋 Assets exported (Excel/CSV)");
    toast.success("Assets exported! Open in Excel / Sheets.");
  }

  /** Opens Gmail compose with a summary and downloads the JSON to attach. */
  function sendToGmail(address: string) {
    if (!address) {
      toast.error("Enter your Gmail address first");
      return;
    }
    const data = payload();
    const body =
      `CashPro Backup\nDate: ${new Date().toLocaleString("en-IN")}\n` +
      `Entries: ${data.summary.moneyEntries} money, ${data.summary.tasks} tasks, ${data.summary.events} events\n\n` +
      `Full data is too large for a link. Attach the downloaded JSON file, or copy the data below:\n\n` +
      `${JSON.stringify(data).slice(0, 1500)}...[truncated — use Download JSON for full backup]`;
    const url =
      `https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(address)}` +
      `&su=${encodeURIComponent(`CashPro Backup ${todayKey()}`)}&body=${encodeURIComponent(body)}`;

    window.open(url, "_blank", "noopener,noreferrer");
    actions.recordBackup(`📧 Gmail to ${address}`);
    setTimeout(() => {
      downloadJson({ silent: true });
      toast.success("Gmail opened + JSON downloaded. Attach the file!");
    }, 800);
  }

  /** Uses the phone's share sheet (WhatsApp, Drive…), or downloads instead. */
  async function share() {
    const file = new File([JSON.stringify(payload(), null, 2)], `CashPro_${todayKey()}.json`, {
      type: "application/json",
    });
    if (!navigator.canShare?.({ files: [file] })) {
      downloadJson({ silent: true });
      toast("Sharing isn't supported here — the file was downloaded instead");
      return;
    }
    try {
      await navigator.share({ title: "CashPro Backup", files: [file] });
      actions.recordBackup("🔗 Shared via Share menu");
      toast.success("Shared!");
    } catch (error) {
      if ((error as DOMException).name !== "AbortError") downloadJson();
    }
  }

  async function addBackupReminder() {
    const added = await actions.addEvent({
      title: "📦 Weekly CashPro Backup",
      date: nextSundayKey(),
      time: "10:00",
      notes: "Open Cash Pro → tap the logo → Download JSON or send to Gmail",
    });
    if (added) toast.success("📅 Weekly reminder added to Calendar!");
  }

  return { downloadJson, exportMoneyCsv, exportAssetsCsv, sendToGmail, share, addBackupReminder };
}
