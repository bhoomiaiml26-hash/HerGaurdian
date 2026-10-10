/**
 * Shared UI pieces for the Wellness Studio.
 * Uses the existing HerGuardian design tokens (cream backgrounds, muted
 * deep-red accents, Fraunces headings, soft borders).
 */
import { HeartPulse } from "lucide-react";

export function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h2 className="font-serif text-xl font-bold tracking-tight text-[#1E1B18]">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-[#4F4A45]">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function Card({ children, className = "" }) {
  return (
    <div className={`rounded-xl border border-[#EDE6E2] bg-white p-5 shadow-xs sm:p-6 ${className}`}>
      {children}
    </div>
  );
}

export function InfoNote({ children, icon: Icon = HeartPulse, tone = "neutral" }) {
  const tones = {
    neutral: "bg-[#F6EFEA]/70 border-[#EDE6E2] text-[#4F4A45]",
    safe: "bg-[#EBF3EE] border-[#286646]/20 text-[#286646]",
    caution: "bg-[#FEF7ED] border-[#A85C12]/20 text-[#A85C12]",
  };
  return (
    <div className={`flex items-start gap-3 rounded-lg border p-3.5 text-xs leading-relaxed ${tones[tone]}`}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, message, actionLabel, onAction }) {
  return (
    <div className="rounded-xl border border-dashed border-[#EDE6E2] bg-[#FBF9F7] p-8 text-center">
      {Icon && <Icon className="mx-auto h-10 w-10 text-[#8C3737]/50" aria-hidden="true" />}
      <h3 className="mt-3 font-serif text-base font-bold text-[#1E1B18]">{title}</h3>
      <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-[#78726B]">{message}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 inline-flex items-center rounded-lg bg-[#8C3737] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#752B2B]"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function LoadingBlock({ label = "Loading..." }) {
  return (
    <div className="flex items-center justify-center gap-3 rounded-xl border border-[#EDE6E2] bg-white p-8 text-sm text-[#78726B]">
      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[#EDE6E2] border-t-[#8C3737]" />
      {label}
    </div>
  );
}

export function ErrorNote({ message, onRetry }) {
  if (!message) return null;
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-[#BA2626]/20 bg-[#FDF2F2] p-3.5 text-xs text-[#BA2626] sm:flex-row sm:items-center sm:justify-between">
      <span>{message}</span>
      {onRetry && (
        <button onClick={onRetry} className="shrink-0 font-semibold underline underline-offset-2">
          Try again
        </button>
      )}
    </div>
  );
}

/**
 * A labelled 1–5 scale. Everything is a real radio group for keyboard and
 * screen-reader support. Labels stay plain-language.
 */
export function ScaleRating({ legend, value, onChange, labels, id, required = false, mute = false }) {
  const scaleLabels = labels || ["1", "2", "3", "4", "5"];
  const groupName = `scale-${id}`;
  return (
    <fieldset className="rounded-lg border border-[#EDE6E2] bg-[#FBF9F7] p-3.5">
      <legend className="px-1 text-xs font-semibold text-[#4F4A45]">
        {legend}
        {!required && <span className="ml-1.5 font-normal text-[#A19B93]">(optional)</span>}
      </legend>
      <div className="mt-2 flex items-stretch gap-1.5" role="radiogroup" aria-label={legend}>
        {scaleLabels.map((label, idx) => {
          const val = idx + 1;
          const selected = value === val;
          return (
            <label
              key={val}
              className={`flex min-h-11 flex-1 cursor-pointer flex-col items-center justify-center rounded-md border text-xs font-semibold transition ${
                selected
                  ? "border-[#8C3737] bg-[#8C3737] text-white"
                  : "border-[#EDE6E2] bg-white text-[#78726B] hover:border-[#8C3737]/40 hover:bg-[#F6EFEA]"
              } ${mute ? "opacity-90" : ""}`}
            >
              <input
                type="radio"
                name={groupName}
                value={val}
                checked={selected}
                onChange={() => onChange(selected ? null : val)}
                className="sr-only"
              />
              <span aria-hidden="true">{label}</span>
              <span className="sr-only">{`${legend}: ${val} of 5`}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

const MOODS = [
  { id: "great", label: "Great" },
  { id: "good", label: "Good" },
  { id: "neutral", label: "Okay" },
  { id: "low", label: "Low" },
  { id: "stressed", label: "Stressed" },
];

export function MoodPicker({ value, onChange, name = "mood" }) {
  return (
    <fieldset className="rounded-lg border border-[#EDE6E2] bg-[#FBF9F7] p-3.5">
      <legend className="px-1 text-xs font-semibold text-[#4F4A45]">
        Mood
        <span className="ml-1.5 font-normal text-[#A19B93]">(optional)</span>
      </legend>
      <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="Mood">
        {MOODS.map((mood) => {
          const selected = value === mood.id;
          return (
            <label
              key={mood.id}
              className={`inline-flex min-h-10 cursor-pointer items-center rounded-full border px-4 text-xs font-semibold transition ${
                selected
                  ? "border-[#8C3737] bg-[#8C3737] text-white"
                  : "border-[#EDE6E2] bg-white text-[#4F4A45] hover:border-[#8C3737]/40 hover:bg-[#F6EFEA]"
              }`}
            >
              <input
                type="radio"
                name={name}
                value={mood.id}
                checked={selected}
                onChange={() => onChange(selected ? "" : mood.id)}
                className="sr-only"
              />
              {mood.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export function PrimaryButton({ children, onClick, type = "button", disabled = false, className = "", icon: Icon }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#8C3737] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#752B2B] disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {Icon && <Icon className="h-4 w-4" aria-hidden="true" />}
      {children}
    </button>
  );
}

export function SecondaryButton({ children, onClick, type = "button", disabled = false, className = "", icon: Icon }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#EDE6E2] bg-white px-4 py-2.5 text-sm font-semibold text-[#4F4A45] transition hover:border-[#8C3737]/30 hover:bg-[#F6EFEA] hover:text-[#1E1B18] disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {Icon && <Icon className="h-4 w-4" aria-hidden="true" />}
      {children}
    </button>
  );
}

export function DangerButton({ children, onClick, className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[#BA2626]/30 bg-white px-3 py-1.5 text-xs font-semibold text-[#BA2626] transition hover:bg-[#FDF2F2] ${className}`}
    >
      {children}
    </button>
  );
}

// Formatting helpers (formatMinutes, friendlyDate, todayISO, MOOD_LABELS…)
// live in ./studioUtils.js so this file only exports components.

import YouTubePlayer from "../../../components/common/YouTubePlayer";

/**
 * Embedded video player strip (privacy-enhanced YouTube embed with fallback options,
 * preserved and upgraded from the old Wellness Hub video content).
 * Renders nothing when empty.
 */
export function VideoStrip({ videos, title = "Watch & follow along" }) {
  if (!videos?.length) return null;
  return (
    <Card>
      <h3 className="font-serif text-base font-bold text-[#1E1B18]">{title}</h3>
      <p className="mt-0.5 text-xs text-[#78726B]">
        Optional guided videos — the exercises and routines work fine without them.
      </p>
      <div className="mt-4 grid gap-5 sm:grid-cols-2">
        {videos.map((v) => (
          <YouTubePlayer
            key={v.id || v.videoId}
            videoId={v.videoId}
            title={v.title}
            source={v.creator || v.source}
            description={v.description}
            fallbackQuery={v.fallbackQuery || v.title}
          />
        ))}
      </div>
    </Card>
  );
}


