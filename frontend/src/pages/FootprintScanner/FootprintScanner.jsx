import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ScanSearch, FileText, History, ShieldCheck, ShieldAlert,
  Upload, Trash2, CheckCircle2, AlertTriangle, AlertCircle,
  Info, Eye, EyeOff, ChevronDown, ChevronRight, RefreshCw,
  X, Clock
} from "lucide-react";
import toast from "react-hot-toast";
import { analyzeScan, getScanHistory, deleteScan, deleteAllScans, updateFindingStatus, extractTextFromImage } from "../../services/footprintService";
import LoadingSpinner from "../../components/common/LoadingSpinner";

/* ── theme tokens ── */
const C = {
  brand: "#8C3737", brandBg: "#F6EFEA", brandLight: "#FBF9F7",
  ink: "#1E1B18", muted: "#4F4A45", faint: "#78726B",
  border: "#EDE6E2", success: "#2D6A4F", successBg: "#D8F3DC",
  warn: "#B45309", warnBg: "#FFF8E1",
  danger: "#BA2626", dangerBg: "#FDF2F2",
};

const SEVERITY_STYLES = {
  low:      { icon: Info,         color: "#1565C0", bg: "#E8F4FD",  label: "Low" },
  medium:   { icon: AlertTriangle, color: C.warn,   bg: C.warnBg,   label: "Medium" },
  high:     { icon: AlertCircle,   color: C.danger, bg: C.dangerBg, label: "High" },
  critical: { icon: ShieldAlert,   color: "#7B1010", bg: "#FFE4E4", label: "Critical" },
};

const RISK_LEVEL_STYLE = {
  low:      { color: "#1565C0", bg: "#E8F4FD",  label: "Low Risk",      icon: ShieldCheck },
  medium:   { color: C.warn,    bg: C.warnBg,   label: "Medium Risk",   icon: AlertTriangle },
  high:     { color: C.danger,  bg: C.dangerBg, label: "High Risk",     icon: AlertCircle },
  critical: { color: "#7B1010", bg: "#FFE4E4",  label: "Critical Risk", icon: ShieldAlert },
};

const TABS = [
  { id: "scan",    label: "New Scan",    icon: ScanSearch },
  { id: "history", label: "Scan History",icon: History },
  { id: "tips",    label: "Privacy Tips",icon: ShieldCheck },
];

/* ════════════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════════════ */
export default function FootprintScanner() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (() => {
    const t = searchParams.get("tab");
    return TABS.find(x => x.id === t) ? t : "scan";
  })();
  const setTab = id => setSearchParams({ tab: id });

  return (
    <div className="min-h-screen space-y-6" style={{ color: C.ink }}>
      <div className="mx-auto max-w-6xl space-y-6">

        {/* Header */}
        <div className="rounded-xl border bg-white p-6 sm:p-8 shadow-xs" style={{ borderColor: C.border }}>
          <div className="mb-2 inline-flex items-center gap-2 rounded-md px-2.5 py-1 text-xs font-semibold"
            style={{ background: C.brandBg, color: C.brand }}>
            <ScanSearch className="h-3.5 w-3.5" />
            <span>Privacy &amp; Digital Safety</span>
          </div>
          <h1 className="font-serif text-2xl font-bold tracking-tight sm:text-3xl">Footprint Scanner</h1>
          <p className="mt-1 text-xs sm:text-sm" style={{ color: C.muted }}>
            Scan your bio, social media post, or screenshot for personal information exposure — safely and privately.
          </p>
          {/* Privacy notice */}
          <div className="mt-3 flex items-start gap-2 rounded-lg p-3 text-xs"
            style={{ background: C.successBg, color: C.success }}>
            <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
            <span><strong>Zero-Storage Privacy:</strong> Your full text is analysed in-memory and never stored. Only anonymised metadata (finding counts, severity) is saved. Screenshot OCR runs entirely in your browser — images never leave your device.</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="rounded-xl border bg-white p-2 shadow-xs" style={{ borderColor: C.border }}>
          <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0">
            {TABS.map(({ id, label, icon: Icon }) => {
              const active = activeTab === id;
              return (
                <button key={id} onClick={() => setTab(id)}
                  className="flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
                  style={active ? { background: C.brand, color: "#fff" } : { color: C.muted }}>
                  <Icon className="h-4 w-4" style={active ? { color: "#fff" } : { color: C.faint }} />
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="rounded-xl border bg-white p-6 sm:p-8 shadow-xs" style={{ borderColor: C.border }}>
          {activeTab === "scan"    && <ScanTab onViewHistory={() => setTab("history")} />}
          {activeTab === "history" && <HistoryTab />}
          {activeTab === "tips"    && <PrivacyTipsTab />}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   SCAN TAB
════════════════════════════════════════════════════════ */
function ScanTab({ onViewHistory }) {
  const [scanMode, setScanMode] = useState("text"); // "text" | "screenshot"
  const [textInput, setTextInput] = useState("");
  const [scanning, setScanning] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(null);
  const [result, setResult] = useState(null);
  const [expandedFindings, setExpandedFindings] = useState({});
  const fileRef = useRef();

  const handleTextScan = async () => {
    if (!textInput.trim()) return toast.error("Please paste some text to scan.");
    if (textInput.length > 10000) return toast.error("Text exceeds 10,000 character limit. Please reduce it.");
    setScanning(true);
    setResult(null);
    try {
      const r = await analyzeScan(textInput, "text");
      setResult(r);
      if (r.findingCount === 0) toast.success("Scan complete — no exposures found!");
      else toast(`Found ${r.findingCount} item(s) to review.`, { icon: "⚠️" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Scan failed. Please try again.");
    } finally { setScanning(false); }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Please upload an image file.");
    if (file.size > 10 * 1024 * 1024) return toast.error("Image too large. Max 10MB.");

    setScanning(true);
    setResult(null);
    setOcrProgress({ msg: "Initialising OCR…", pct: 5 });

    try {
      const { text, confidence } = await extractTextFromImage(
        file,
        (msg, pct) => setOcrProgress({ msg, pct })
      );
      setOcrProgress(null);
      if (!text) { toast.error("No text found in the image."); setScanning(false); return; }
      toast(`Extracted text with ${confidence}% confidence. Analysing…`, { icon: "🔍" });
      const r = await analyzeScan(text, "screenshot");
      setResult(r);
      if (r.findingCount === 0) toast.success("Scan complete — no exposures found!");
      else toast(`Found ${r.findingCount} item(s) to review.`, { icon: "⚠️" });
    } catch (err) {
      toast.error(err.message || "Could not process image.");
    } finally { setScanning(false); setOcrProgress(null); }
  };

  const toggleFinding = idx => setExpandedFindings(prev => ({ ...prev, [idx]: !prev[idx] }));

  const handleUpdateStatus = async (scanId, findingIndex, status) => {
    try {
      const r = await updateFindingStatus(scanId, findingIndex, status);
      setResult(prev => ({
        ...prev,
        findings: r.scan.findings,
      }));
      toast.success("Status updated.");
    } catch { toast.error("Could not update."); }
  };

  return (
    <div className="space-y-6">
      {/* Mode toggle */}
      <div>
        <h2 className="font-serif text-xl font-bold mb-3" style={{ color: C.ink }}>Scan Your Content</h2>
        <div className="flex rounded-xl border overflow-hidden" style={{ borderColor: C.border }}>
          {[
            { id: "text", label: "Paste Text", icon: FileText, desc: "Profile bio, post, message" },
            { id: "screenshot", label: "Upload Screenshot", icon: Upload, desc: "Profile screenshot (OCR)" },
          ].map(({ id, label, icon: Icon, desc }) => (
            <button key={id} onClick={() => setScanMode(id)}
              className="flex-1 flex flex-col items-center gap-1.5 py-4 px-3 text-center transition-colors text-sm font-medium"
              style={scanMode === id
                ? { background: C.brand, color: "#fff" }
                : { background: C.brandLight, color: C.muted }}>
              <Icon className="h-5 w-5" />
              <span>{label}</span>
              <span className="text-[10px] opacity-70">{desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Input area */}
      {scanMode === "text" ? (
        <div className="space-y-3">
          <label className="block text-xs font-medium" style={{ color: C.muted }}>
            Paste your bio, social media post, or message (max 10,000 characters)
          </label>
          <textarea
            rows={8}
            value={textInput}
            onChange={e => setTextInput(e.target.value)}
            placeholder="e.g. Hi! I'm Priya Sharma, I live at 14 MG Road, Bangalore. You can reach me at priya@email.com or +91 98765 43210. I commute to Indiranagar every morning for work..."
            className="w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 resize-none"
            style={{ borderColor: C.border }}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: textInput.length > 9000 ? C.danger : C.faint }}>
              {textInput.length.toLocaleString()} / 10,000 characters
            </span>
            <div className="flex gap-2">
              {textInput && <button onClick={() => { setTextInput(""); setResult(null); }}
                className="text-xs px-3 py-1.5 rounded-lg border" style={{ borderColor: C.border, color: C.faint }}>
                Clear
              </button>}
              <button onClick={handleTextScan} disabled={scanning || !textInput.trim()}
                className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                style={{ background: C.brand }}>
                <ScanSearch className="h-4 w-4" />
                {scanning ? "Scanning…" : "Scan Now"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          <button onClick={() => fileRef.current?.click()} disabled={scanning}
            className="w-full rounded-xl border-2 border-dashed py-12 flex flex-col items-center gap-3 transition hover:opacity-80 disabled:opacity-50"
            style={{ borderColor: C.brand, background: C.brandBg }}>
            <Upload className="h-8 w-8" style={{ color: C.brand }} />
            <span className="text-sm font-semibold" style={{ color: C.brand }}>Click to upload screenshot</span>
            <span className="text-xs" style={{ color: C.muted }}>PNG, JPG, WebP — max 10MB. Processed entirely in your browser.</span>
          </button>
          {ocrProgress && (
            <div className="rounded-lg p-4 space-y-2" style={{ background: C.brandBg }}>
              <p className="text-xs font-medium" style={{ color: C.brand }}>{ocrProgress.msg}</p>
              <div className="h-1.5 rounded-full" style={{ background: "#E8D8D8" }}>
                <div className="h-1.5 rounded-full transition-all" style={{ width: `${ocrProgress.pct}%`, background: C.brand }} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Scanning indicator */}
      {scanning && !ocrProgress && <LoadingSpinner label="Analysing your content for privacy exposures…" />}

      {/* Results */}
      {result && (
        <div className="space-y-4 pt-2 border-t" style={{ borderColor: C.border }}>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h3 className="font-serif font-bold text-lg" style={{ color: C.ink }}>Scan Results</h3>
              <p className="text-xs mt-0.5" style={{ color: C.faint }}>
                Scanned at {result.checkedAt ? new Date(result.checkedAt).toLocaleString("en-IN") : "just now"}
              </p>
            </div>
            <RiskBadge level={result.overallRiskLevel} />
          </div>

          <div className="rounded-lg p-4 text-sm" style={{
            background: result.findingCount === 0 ? C.successBg : RISK_LEVEL_STYLE[result.overallRiskLevel]?.bg || C.warnBg,
            color: result.findingCount === 0 ? C.success : RISK_LEVEL_STYLE[result.overallRiskLevel]?.color || C.warn
          }}>
            {result.message}
          </div>

          {result.findings?.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-sm" style={{ color: C.ink }}>
                {result.findings.length} Finding{result.findings.length !== 1 ? "s" : ""} Detected
              </h4>
              {result.findings.map((finding, idx) => {
                const s = SEVERITY_STYLES[finding.severity] || SEVERITY_STYLES.medium;
                const Icon = s.icon;
                const expanded = expandedFindings[idx];
                return (
                  <div key={idx} className="rounded-xl border overflow-hidden"
                    style={{ borderColor: s.color + "44" }}>
                    <button
                      onClick={() => toggleFinding(idx)}
                      className="w-full flex items-center gap-3 p-4 text-left hover:opacity-90 transition-opacity"
                      style={{ background: s.bg }}>
                      <Icon className="h-5 w-5 shrink-0" style={{ color: s.color }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold" style={{ color: s.color }}>{finding.title}</p>
                        <p className="text-xs" style={{ color: s.color + "BB" }}>{s.label} severity</p>
                      </div>
                      <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize"
                        style={{ background: s.color + "22", color: s.color }}>
                        {finding.status?.replace("_", " ") || "to review"}
                      </span>
                      {expanded ? <ChevronDown className="h-4 w-4 shrink-0" style={{ color: s.color }} /> : <ChevronRight className="h-4 w-4 shrink-0" style={{ color: s.color }} />}
                    </button>
                    {expanded && (
                      <div className="p-4 space-y-3 border-t" style={{ borderColor: s.color + "33" }}>
                        <div>
                          <p className="text-xs font-semibold mb-1" style={{ color: C.muted }}>What was found</p>
                          <p className="text-sm" style={{ color: C.ink }}>{finding.evidence}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold mb-1" style={{ color: C.muted }}>Recommendation</p>
                          <p className="text-sm" style={{ color: C.ink }}>{finding.recommendation}</p>
                        </div>
                        {result.scanId && (
                          <div>
                            <p className="text-xs font-semibold mb-1" style={{ color: C.muted }}>Update Status</p>
                            <div className="flex flex-wrap gap-2">
                              {[
                                { value: "to_review", label: "To Review" },
                                { value: "in_progress", label: "In Progress" },
                                { value: "resolved", label: "Resolved" },
                                { value: "not_applicable", label: "N/A" },
                              ].map(({ value, label }) => (
                                <button key={value}
                                  onClick={() => handleUpdateStatus(result.scanId, idx, value)}
                                  className="rounded-full px-3 py-1 text-xs font-medium border transition"
                                  style={finding.status === value
                                    ? { background: s.color, color: "#fff", borderColor: s.color }
                                    : { background: "transparent", color: C.muted, borderColor: C.border }}>
                                  {label}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="pt-2">
            <button onClick={onViewHistory}
              className="text-xs font-semibold" style={{ color: C.brand }}>
              View full scan history →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   HISTORY TAB
════════════════════════════════════════════════════════ */
function HistoryTab() {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await getScanHistory(); setScans(r.scans || []); }
    catch { toast.error("Could not load scan history."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDeleteScan = async (id) => {
    if (!confirm("Delete this scan report?")) return;
    try { await deleteScan(id); toast.success("Deleted."); await load(); }
    catch { toast.error("Could not delete."); }
  };

  const handleDeleteAll = async () => {
    if (!confirm("Delete ALL scan history? This cannot be undone.")) return;
    setDeleting(true);
    try { await deleteAllScans(); toast.success("All scan history deleted."); setScans([]); }
    catch { toast.error("Could not delete."); }
    finally { setDeleting(false); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-xl font-bold" style={{ color: C.ink }}>Scan History</h2>
          <p className="text-sm mt-0.5" style={{ color: C.muted }}>Only metadata is stored. Full content is never saved.</p>
        </div>
        {scans.length > 0 && (
          <button onClick={handleDeleteAll} disabled={deleting}
            className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition hover:opacity-80"
            style={{ borderColor: C.danger, color: C.danger }}>
            <Trash2 className="h-3.5 w-3.5" />{deleting ? "Deleting…" : "Clear All"}
          </button>
        )}
      </div>

      {loading ? <LoadingSpinner label="Loading scan history…" /> : scans.length === 0 ? (
        <div className="py-12 flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full" style={{ background: C.brandBg }}>
            <History className="h-6 w-6" style={{ color: C.brand }} />
          </div>
          <p className="text-sm max-w-xs" style={{ color: C.muted }}>No scans yet. Run your first scan to see results here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {scans.map(scan => {
            const rStyle = RISK_LEVEL_STYLE[scan.overallRiskLevel] || RISK_LEVEL_STYLE.low;
            const RIcon = rStyle.icon;
            const expanded = expandedId === scan._id;
            return (
              <div key={scan._id} className="rounded-xl border overflow-hidden" style={{ borderColor: C.border }}>
                <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-[#FAFAFA]"
                  onClick={() => setExpandedId(expanded ? null : scan._id)}>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ background: rStyle.bg }}>
                    <RIcon className="h-4 w-4" style={{ color: rStyle.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold capitalize" style={{ color: C.ink }}>{scan.scanType} Scan</span>
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                        style={{ background: rStyle.bg, color: rStyle.color }}>{rStyle.label}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs" style={{ color: C.faint }}>
                        <Clock className="h-3 w-3 inline mr-1" />
                        {new Date(scan.createdAt).toLocaleDateString("en-IN")}
                      </span>
                      <span className="text-xs" style={{ color: C.faint }}>
                        {scan.findingCount} finding{scan.findingCount !== 1 ? "s" : ""}
                        {scan.resolvedCount > 0 && ` · ${scan.resolvedCount} resolved`}
                      </span>
                    </div>
                  </div>
                  <button onClick={e => { e.stopPropagation(); handleDeleteScan(scan._id); }}
                    className="p-1.5 rounded-lg" style={{ color: C.faint }} title="Delete scan">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                  {expanded ? <ChevronDown className="h-4 w-4" style={{ color: C.faint }} /> : <ChevronRight className="h-4 w-4" style={{ color: C.faint }} />}
                </div>
                {expanded && (
                  <div className="border-t p-4" style={{ borderColor: C.border }}>
                    <p className="text-xs mb-3" style={{ color: C.muted }}>
                      Scan summary: <span className="font-medium">{scan.inputSummary || "No summary available"}</span>
                    </p>
                    {scan.findings?.length > 0 ? (
                      <div className="space-y-2">
                        {scan.findings.map((f, i) => {
                          const s = SEVERITY_STYLES[f.severity] || SEVERITY_STYLES.medium;
                          return (
                            <div key={i} className="flex items-center gap-2 rounded-lg p-2.5"
                              style={{ background: s.bg }}>
                              <span className="text-xs font-semibold" style={{ color: s.color }}>{f.title}</span>
                              <span className="ml-auto rounded-full px-2 py-0.5 text-[10px] capitalize"
                                style={{ background: s.color + "22", color: s.color }}>
                                {f.status?.replace("_", " ") || "to review"}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm" style={{ color: C.success }}>✅ No findings — all clear!</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   PRIVACY TIPS TAB
════════════════════════════════════════════════════════ */
const PRIVACY_TIPS = [
  { emoji: "👤", title: "Audit Your Social Profiles", tips: ["Review your Instagram, LinkedIn, and Facebook bio for phone numbers and addresses","Set accounts to private if you don't need public visibility","Remove your birth year and exact birthday from public view","Unlink your personal email from public bios"] },
  { emoji: "📍", title: "Location & Routine Safety", tips: ["Never post your home address, workplace, or school on public profiles","Avoid tagging your exact home location in posts","Don't share regular daily routines (e.g. 'gym every morning at 6am')","Disable location tagging in photos by default"] },
  { emoji: "📱", title: "Phone & Contact Safety", tips: ["Don't list your personal phone number publicly","Use a separate business number or Google Voice for public contacts","Be cautious with WhatsApp statuses — they reveal your last seen and phone number","Enable two-factor authentication on all accounts"] },
  { emoji: "🔒", title: "Account Security", tips: ["Use a unique, strong password for each platform","Enable login alerts on all major accounts","Audit third-party app access — revoke what you don't use","Regularly check which apps have access to your Google/Facebook account"] },
  { emoji: "🖼️", title: "Image & Content Safety", tips: ["Check photo backgrounds for identifying information (house numbers, school name boards)","Avoid posting photos that reveal your exact neighbourhood","Be cautious with school or workplace uniform photos","Remove metadata (EXIF data) from photos before public sharing using a free tool"] },
  { emoji: "💬", title: "Safe Online Communication", tips: ["Be wary of DMs from strangers asking for personal details","Use platform-based messaging rather than sharing personal contact info","Verify identities before sharing any personal documents","Trust your instincts — if a request feels unsafe, it probably is"] },
];

function PrivacyTipsTab() {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-serif text-xl font-bold" style={{ color: C.ink }}>Privacy Protection Tips</h2>
        <p className="text-sm mt-0.5" style={{ color: C.muted }}>
          Practical steps to reduce your digital footprint and protect your personal safety online.
        </p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        {PRIVACY_TIPS.map(({ emoji, title, tips }) => (
          <div key={title} className="rounded-xl border p-5" style={{ borderColor: C.border, background: C.brandLight }}>
            <div className="text-2xl mb-2">{emoji}</div>
            <h3 className="font-semibold text-sm mb-3" style={{ color: C.ink }}>{title}</h3>
            <ul className="space-y-2">
              {tips.map(t => (
                <li key={t} className="flex items-start gap-2 text-xs" style={{ color: C.muted }}>
                  <ShieldCheck className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: C.brand }} />{t}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="rounded-xl border p-5" style={{ borderColor: C.brand, background: C.brandBg }}>
        <h3 className="font-semibold text-sm mb-2" style={{ color: C.brand }}>🚨 Emergency: If You Feel Unsafe Online</h3>
        <ul className="space-y-1.5 text-xs" style={{ color: C.muted }}>
          <li>• Report threatening messages directly to the platform and save screenshots</li>
          <li>• File a complaint at <strong>cybercrime.gov.in</strong> or call <strong>1930</strong> (National Cyber Crime Helpline)</li>
          <li>• Contact iCall: <strong>9152987821</strong> for psychological support after online harassment</li>
          <li>• Block and restrict — you are never obligated to remain accessible to anyone who makes you feel unsafe</li>
        </ul>
      </div>
    </div>
  );
}

/* ── Shared components ── */
function RiskBadge({ level }) {
  const s = RISK_LEVEL_STYLE[level] || RISK_LEVEL_STYLE.low;
  const Icon = s.icon;
  return (
    <div className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
      style={{ background: s.bg, color: s.color }}>
      <Icon className="h-3.5 w-3.5" />{s.label}
    </div>
  );
}
