"use client";

import { useState, type ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@ui-sdk/react/alert-dialog";
import {
  SegmentedControl,
  SegmentedControlIndicator,
  SegmentedControlItem,
} from "@ui-sdk/react/segmented-control";
import { Toggle } from "@ui-sdk/react/toggle";
import icon from "@/app/icon.svg";
import type { Lang } from "@/game/types";
import { UI } from "@/i18n/strings";
import { useLang } from "./lang";

export interface ChromeProps {
  muted: boolean;
  toggleMute: () => void;
}

/**
 * The name at the top left of a screen: the game's, behind its mark, unless
 * another is given. The mark is the favicon itself (`src/app/icon.svg`), so
 * the two cannot differ. It is decoration: the name is written next to it.
 */
export function Brand({
  as: Tag = "span",
  mark = true,
  children = "Kebab Profitable",
}: {
  as?: "span" | "h1";
  mark?: boolean;
  children?: ReactNode;
}) {
  return (
    <Tag className="brand">
      {mark && (
        // A plain image on purpose: pixel art must not be resampled or re-encoded.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={icon.src} width={32} height={32} alt="" className="brand-mark" />
      )}
      {children}
    </Tag>
  );
}

/** The speaker, with either sound waves or a cross beside it. */
function SpeakerIcon({ hidden, waves }: { hidden: boolean; waves: string }) {
  return (
    <svg
      className={hidden ? "icon-layer icon-layer-off" : "icon-layer"}
      viewBox="0 0 12 12"
      width="18"
      height="18"
      shapeRendering="crispEdges"
    >
      <path d="M1 4h3l3-3v10L4 8H1z" fill="currentColor" />
      {/* 1.33 units paint as 2px at this size, the weight of the labels next to it. */}
      <path d={waves} stroke="currentColor" strokeWidth="1.33" fill="none" />
    </svg>
  );
}

/** Language and sound controls, shown on every screen. */
export function Controls({ muted, toggleMute }: ChromeProps) {
  const { lang, setLang, t } = useLang();
  // The icons cross-fade only once the player has used the switch, so the
  // saved setting does not animate in when the page loads.
  const [live, setLive] = useState(false);
  return (
    <div className="controls">
      <SegmentedControl
        className="seg"
        aria-label={t(UI.language)}
        value={lang}
        onValueChange={(value) => value && setLang(value as Lang)}
      >
        <SegmentedControlIndicator className="seg-indicator" />
        <SegmentedControlItem value="fr">FR</SegmentedControlItem>
        <SegmentedControlItem value="en">EN</SegmentedControlItem>
      </SegmentedControl>
      {/* Pressed means the sound plays: the name stays put, the state changes. */}
      <Toggle
        className="icon-btn"
        pressed={!muted}
        onPressedChange={() => {
          setLive(true);
          toggleMute();
        }}
        aria-label={t(UI.sound)}
        title={t(muted ? UI.unmute : UI.mute)}
      >
        <span className={live ? "icon-swap icon-swap-live" : "icon-swap"} aria-hidden="true">
          <SpeakerIcon hidden={muted} waves="M8.5 4v4M10.5 2.5v7" />
          <SpeakerIcon hidden={!muted} waves="M8 4l3 4M11 4l-3 4" />
        </span>
      </Toggle>
    </div>
  );
}

/**
 * "Give up", asked twice: the run counts as an attempt, so a stray tap must
 * not end it. `onOpenChange` lets the screen behind pause while it is open.
 */
export function GiveUp({
  onConfirm,
  onOpenChange,
}: {
  onConfirm: () => void;
  onOpenChange?: (open: boolean) => void;
}) {
  const { t } = useLang();
  return (
    <AlertDialog
      onOpenChange={(open, details) => {
        onOpenChange?.(open);
        if (!open && details.returnValue === "confirm") onConfirm();
      }}
    >
      <AlertDialogTrigger className="btn btn-small">{t(UI.quit)}</AlertDialogTrigger>
      <AlertDialogBackdrop className="sheet-backdrop" />
      <AlertDialogContent className="card sheet">
        <AlertDialogTitle>{t(UI.quitTitle)}</AlertDialogTitle>
        <AlertDialogDescription>{t(UI.quitBody)}</AlertDialogDescription>
        <div className="sheet-actions">
          <AlertDialogClose className="btn btn-primary">{t(UI.keepPlaying)}</AlertDialogClose>
          <AlertDialogClose className="btn btn-danger" value="confirm">
            {t(UI.quit)}
          </AlertDialogClose>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function Footer() {
  const { t } = useLang();
  return (
    <footer className="footer">
      <p>{t(UI.disclaimer)}</p>
      <p>
        {t(UI.madeBy)}{" "}
        <a href="https://github.com/flexbox/kebab-profitable" target="_blank" rel="noreferrer">
          github.com/flexbox/kebab-profitable
        </a>
        {" · "}
        <a href="https://luma.com/indiehackerslille" target="_blank" rel="noreferrer">
          Indie Hackers Lille
        </a>
      </p>
    </footer>
  );
}
