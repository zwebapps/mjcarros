"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Share2 } from "lucide-react";

import { useLocale } from "@/components/locale-provider";
import { cn } from "@/lib/utils";

type Status = "idle" | "copied" | "failed";

/** Fallback for browsers/contexts without the async Clipboard API (e.g. plain http). */
function copyWithTextarea(text: string): boolean {
  const el = document.createElement("textarea");
  el.value = text;
  el.setAttribute("readonly", "");
  el.style.position = "fixed";
  el.style.opacity = "0";
  document.body.appendChild(el);
  el.select();
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  document.body.removeChild(el);
  return ok;
}

/** Small icon button that copies the current vehicle URL so it can be pasted anywhere. */
export function ShareLinkButton({ className }: { className?: string }) {
  const { t } = useLocale();
  const [status, setStatus] = useState<Status>("idle");
  const resetTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(resetTimer.current), []);

  const onCopy = async () => {
    const url = window.location.href.split("#")[0];
    let ok = false;
    try {
      await navigator.clipboard.writeText(url);
      ok = true;
    } catch {
      ok = copyWithTextarea(url);
    }
    setStatus(ok ? "copied" : "failed");
    clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setStatus("idle"), 2500);
  };

  const message =
    status === "copied" ? t("product.linkCopied") : status === "failed" ? t("product.copyFailed") : "";

  return (
    <div className={cn("relative shrink-0", className)}>
      <button
        type="button"
        onClick={onCopy}
        aria-label={t("product.shareCopyLink")}
        title={t("product.shareCopyLink")}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground/80 transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        {status === "copied" ? (
          <Check className="h-[18px] w-[18px] text-primary" aria-hidden="true" />
        ) : (
          <Share2 className="h-[18px] w-[18px]" aria-hidden="true" />
        )}
      </button>
      <span
        role="status"
        aria-live="polite"
        className={cn(
          "pointer-events-none absolute right-0 top-full z-10 mt-2 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs font-medium text-background shadow-md transition-opacity",
          message ? "opacity-100" : "opacity-0"
        )}
      >
        {message}
      </span>
    </div>
  );
}
