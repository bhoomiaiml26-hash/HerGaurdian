/**
 * Feature 6 — Personal Pattern Insights
 * Renders the deterministic insights computed by the backend from the user's
 * OWN records. Every insight names its period, links its supporting records,
 * and states when data is insufficient. Optional AI rephrase is consent-gated
 * and clearly separated from user-entered data.
 */
import { useCallback, useEffect, useState } from "react";
import {
  BarChart3,
  ChevronDown,
  ChevronUp,
  Info,
  Lightbulb,
  Sparkles,
} from "lucide-react";
import { getInsights, explainInsight } from "../../../services/wellnessService";
import {
  Card,
  SectionHeader,
  EmptyState,
  LoadingBlock,
  ErrorNote,
  InfoNote,
} from "./ui";
import { friendlyDate } from "./studioUtils";

function InsightCard({ insight }) {
  const [open, setOpen] = useState(false);
  const [aiText, setAiText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  const handleExplain = async () => {
    setAiLoading(true);
    setAiError("");
    try {
      const data = await explainInsight(insight.title, insight.observation);
      setAiText(data.explanation);
    } catch (err) {
      setAiError(
        err.response?.data?.message ||
          "AI isn't available right now — the observation above still stands."
      );
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <Card className={insight.isCautionary ? "border-[#A85C12]/25" : ""}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#F6EFEA] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#8C3737]">
              {insight.category}
            </span>
            {insight.period?.from && (
              <span className="text-[11px] text-[#78726B]">
                {friendlyDate(insight.period.from)} – {friendlyDate(insight.period.to)}
              </span>
            )}
          </div>
          <h3 className="mt-1.5 font-serif text-base font-bold text-[#1E1B18]">
            {insight.title}
          </h3>
        </div>
      </div>

      <p className="mt-2 text-sm leading-relaxed text-[#4F4A45]">{insight.observation}</p>

      {insight.suggestion && (
        <div className="mt-3 flex items-start gap-2 rounded-lg bg-[#FBF9F7] p-3 text-xs text-[#4F4A45]">
          <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#8C3737]" aria-hidden="true" />
          <span>
            <span className="font-semibold">Optional next step:</span> {insight.suggestion}
          </span>
        </div>
      )}

      {/* Supporting records — inspectable */}
      <div className="mt-3">
        <button
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8C3737] hover:underline"
        >
          {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          Inspect the {insight.supportingRecords?.length || 0} supporting record
          {(insight.supportingRecords?.length || 0) === 1 ? "" : "s"}
        </button>
        {open && (
          <ul className="mt-2 divide-y divide-[#EDE6E2] rounded-lg border border-[#EDE6E2] bg-[#FBF9F7]">
            {insight.supportingRecords?.map((r, idx) => (
              <li key={`${r.date}-${idx}`} className="flex items-center justify-between gap-3 px-3.5 py-2 text-xs">
                <span className="font-semibold text-[#1E1B18]">{friendlyDate(r.date)}</span>
                <span className="text-right text-[#4F4A45]">{r.label}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Optional AI rephrase — clearly separated */}
      {!aiText && (
        <button
          onClick={handleExplain}
          disabled={aiLoading}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-[#EDE6E2] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#4F4A45] transition hover:bg-[#F6EFEA] disabled:opacity-50"
        >
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          {aiLoading ? "Asking AI..." : "Explain in simpler words (AI, optional)"}
        </button>
      )}
      {aiText && (
        <div className="mt-3 rounded-lg border border-[#EDE6E2] bg-[#FBF9F7] p-3.5">
          <p className="text-[11px] font-semibold text-[#8C3737]">
            <Sparkles className="mr-1 inline h-3 w-3" aria-hidden="true" />
            Simplified by AI — based only on the observation above
          </p>
          <p className="mt-1 text-xs leading-relaxed text-[#4F4A45]">{aiText}</p>
        </div>
      )}
      {aiError && <p className="mt-2 text-[11px] text-[#A85C12]">{aiError}</p>}
    </Card>
  );
}

export default function InsightsSection() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await getInsights();
      setData(result);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load insights.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const counts = data?.recordCount;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Personal Pattern Insights"
        subtitle="Observations calculated from your own records — each one shows the period it covers and the entries behind it."
      />

      {loading ? (
        <LoadingBlock label="Looking through your records..." />
      ) : error ? (
        <Card>
          <ErrorNote message={error} onRetry={load} />
        </Card>
      ) : !data ? null : (
        <>
          {/* Record counts — transparency about what was analyzed */}
          <Card>
            <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#78726B]">
              <BarChart3 className="h-4 w-4" aria-hidden="true" />
              Records analyzed
            </h3>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Check-ins", value: counts?.checkins },
                { label: "Sleep logs", value: counts?.sleep },
                { label: "Movement sessions", value: counts?.movement },
                { label: "Cycle entries", value: counts?.menstrual },
              ].map((item) => (
                <div key={item.label} className="rounded-lg border border-[#EDE6E2] bg-[#FBF9F7] p-3 text-center">
                  <p className="font-serif text-xl font-bold text-[#1E1B18]">{item.value ?? 0}</p>
                  <p className="text-[11px] text-[#78726B]">{item.label}</p>
                </div>
              ))}
            </div>
          </Card>

          {data.insights.length === 0 ? (
            <EmptyState
              icon={Sparkles}
              title="Not enough records yet"
              message="Insights appear once you have a few entries to compare. Nothing is invented — we only ever show what your records support."
            />
          ) : (
            <div className="space-y-4">
              {data.insights.map((insight) => (
                <InsightCard key={insight.id} insight={insight} />
              ))}
            </div>
          )}

          {/* Insufficient states are shown, not hidden */}
          {data.insufficient?.length > 0 && (
            <Card>
              <h3 className="flex items-center gap-2 font-serif text-base font-bold text-[#1E1B18]">
                <Info className="h-4 w-4 text-[#78726B]" aria-hidden="true" />
                Patterns that need more data
              </h3>
              <ul className="mt-3 space-y-2.5">
                {data.insufficient.map((gap) => (
                  <li key={gap.id} className="rounded-lg border border-[#EDE6E2] bg-[#FBF9F7] p-3.5">
                    <p className="text-sm font-semibold text-[#1E1B18]">{gap.title}</p>
                    <p className="mt-0.5 text-xs text-[#78726B]">{gap.reason}</p>
                    {gap.need && (
                      <p className="mt-1 text-xs font-semibold text-[#8C3737]">{gap.need}</p>
                    )}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Personal suggestions — deterministic, optional */}
          {data.suggestions?.length > 0 && (
            <Card>
              <h3 className="flex items-center gap-2 font-serif text-base font-bold text-[#1E1B18]">
                <Lightbulb className="h-4 w-4 text-[#8C3737]" aria-hidden="true" />
                Small optional suggestions
              </h3>
              <ul className="mt-3 space-y-2">
                {data.suggestions.map((s, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-[#4F4A45]">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#8C3737]" aria-hidden="true" />
                    {s}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[11px] text-[#A19B93]">
                These are gentle ideas based on your goals and record counts — not
                medical advice and not validated treatments.
              </p>
            </Card>
          )}

          <InfoNote>
            Insights describe what appeared together in your entries — they never claim
            cause and effect, never compare you to anyone else, and never diagnose.
            Each one links the exact records behind it so you can check the work.
          </InfoNote>
        </>
      )}
    </div>
  );
}
