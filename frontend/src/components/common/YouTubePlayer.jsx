/**
 * Resilient, privacy-enhanced YouTube video player component for HerGuardian AI.
 * Uses youtube-nocookie.com, responsive 16:9 styling, strict-origin referrer policy,
 * and graceful fallback options ("Watch on YouTube", "Search YouTube") if playback fails.
 */
import { useState } from "react";
import { ExternalLink, Play, RefreshCw, Search, ShieldAlert } from "lucide-react";

export default function YouTubePlayer({
  videoId,
  title,
  source,
  description,
  fallbackQuery,
  className = "",
}) {
  const [hasError, setHasError] = useState(false);
  const [key, setKey] = useState(0);

  if (!videoId) return null;

  const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`;
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const searchQuery = fallbackQuery || title || "women health wellness";
  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`;

  return (
    <div className={`overflow-hidden rounded-xl border border-[#EDE6E2] bg-white shadow-xs ${className}`}>
      {/* Aspect Ratio Video Container */}
      <div className="relative aspect-video w-full bg-[#1E1B18]">
        {!hasError ? (
          <iframe
            key={key}
            title={title || "YouTube video player"}
            src={embedUrl}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
            loading="lazy"
            className="h-full w-full border-0"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center text-white">
            <ShieldAlert className="h-10 w-10 text-[#8C3737]/80 sm:h-12 sm:w-12" aria-hidden="true" />
            <h4 className="mt-3 font-serif text-base font-bold text-white sm:text-lg">
              Playback unavailable in frame
            </h4>
            <p className="mt-1 max-w-sm text-xs text-white/80">
              This video can be watched directly on YouTube or explored via search.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <a
                href={watchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#8C3737] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#752B2B]"
              >
                <Play className="h-3.5 w-3.5" aria-hidden="true" /> Open on YouTube
              </a>
              <button
                type="button"
                onClick={() => {
                  setHasError(false);
                  setKey((k) => k + 1);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/20"
              >
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" /> Retry player
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Video Details & Action Footer */}
      <div className="p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h4 className="font-serif text-sm font-bold text-[#1E1B18] sm:text-base">
              {title}
            </h4>
            {source && (
              <p className="mt-0.5 text-xs font-semibold text-[#8C3737]">
                {source}
              </p>
            )}
          </div>
        </div>

        {description && (
          <p className="mt-2 text-xs leading-relaxed text-[#4F4A45]">
            {description}
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2.5 border-t border-[#EDE6E2] pt-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={watchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-semibold text-[#8C3737] hover:underline"
              aria-label={`Watch ${title} directly on YouTube`}
            >
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /> Watch on YouTube
            </a>
            <span className="text-[#EDE6E2]" aria-hidden="true">•</span>
            <a
              href={searchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[#78726B] hover:text-[#1E1B18] hover:underline"
            >
              <Search className="h-3 w-3" aria-hidden="true" /> Search related
            </a>
          </div>

          <button
            type="button"
            onClick={() => setHasError((e) => !e)}
            className="text-[11px] text-[#A19B93] hover:text-[#78726B]"
          >
            {hasError ? "Show embedded player" : "Report playback issue"}
          </button>
        </div>
      </div>
    </div>
  );
}
