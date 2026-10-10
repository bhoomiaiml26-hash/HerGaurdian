import { useState, useRef, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  UploadCloud,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Trash2,
  PhoneCall,
  Lock,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  Info,
  AlertOctagon,
  ArrowRight
} from "lucide-react";
import toast from "react-hot-toast";
import { analyzeMessage, extractTextFromScreenshot } from "../../services/safetyAnalyzerService";

const DEMO_EXAMPLES = [
  {
    id: "job-scam",
    label: "Job Scam",
    badge: "High Risk",
    text: "Congratulations! You have been selected for a work from home job. Pay ₹2999 registration fee to receive your joining letter.",
  },
  {
    id: "phishing",
    label: "Phishing Link",
    badge: "High Risk",
    text: "Your bank account will be blocked today. Click this link and verify your account immediately.",
  },
  {
    id: "threat",
    label: "Threat / Extortion",
    badge: "Very High Risk",
    text: "Send me ₹5000 immediately or I will make sure everyone knows your private information.",
  },
  {
    id: "normal",
    label: "Normal Chat",
    badge: "Low Risk",
    text: "Hey, are you free for coffee tomorrow?",
  },
];

export default function DigitalSafetyAnalyzer() {
  const fileInputId = useId();
  // Input method: 'paste' | 'screenshot'
  const [activeTab, setActiveTab] = useState("paste");

  // Paste state
  const [pastedText, setPastedText] = useState("");

  // Screenshot OCR state
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrProgress, setOcrProgress] = useState({ text: "", pct: 0 });
  const [ocrError, setOcrError] = useState("");
  const [extractedText, setExtractedText] = useState("");
  const [isEditingExtracted, setIsEditingExtracted] = useState(false);

  // Analysis state
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisError, setAnalysisError] = useState("");
  const [isWhyExpanded, setIsWhyExpanded] = useState(true);
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef(null);

  // Handle demo clicks
  const handleApplyDemo = (example) => {
    setActiveTab("paste");
    setPastedText(example.text);
    setAnalysisResult(null);
    setAnalysisError("");
    toast.success(`Loaded "${example.label}" demo message`);
  };

  // Clear text
  const handleClearPaste = () => {
    setPastedText("");
    setAnalysisResult(null);
    setAnalysisError("");
  };

  // File selection
  const handleFileSelect = (file) => {
    if (!file) return;

    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a valid image file (PNG, JPG, JPEG, or WebP).");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image file is too large. Maximum size is 10 MB.");
      return;
    }

    setSelectedFile(file);
    setImagePreview(URL.createObjectURL(file));
    setExtractedText("");
    setOcrError("");
    setAnalysisResult(null);
    setAnalysisError("");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    setExtractedText("");
    setOcrError("");
    setOcrLoading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // OCR Processing
  const handleExtractText = async () => {
    if (!selectedFile && !imagePreview) {
      toast.error("Please select an image first.");
      return;
    }

    setOcrLoading(true);
    setOcrError("");
    setExtractedText("");

    try {
      const res = await extractTextFromScreenshot(selectedFile || imagePreview, (msg, pct) => {
        setOcrProgress({ text: msg, pct });
      });

      if (!res.text || res.text.trim().length < 8) {
        setOcrError("We couldn't read enough text from this image. Try uploading a clearer screenshot.");
        toast.error("Low text clarity detected in image");
      } else {
        setExtractedText(res.text);
        toast.success("Text extracted successfully! You can review or edit it below.");
      }
    } catch (err) {
      setOcrError(err.message || "We couldn't read enough text from this image. Try uploading a clearer screenshot.");
      toast.error("OCR reading failed. Please use a clearer screenshot.");
    } finally {
      setOcrLoading(false);
    }
  };

  // Perform Analysis
  const handleRunAnalysis = async (textToAnalyze) => {
    if (!textToAnalyze || !textToAnalyze.trim()) {
      toast.error("Please enter or extract a message to analyze.");
      return;
    }

    if (textToAnalyze.trim().length < 4) {
      toast.error("Message is too short. Please provide the full message or context.");
      return;
    }

    setAnalyzing(true);
    setAnalysisError("");

    try {
      const result = await analyzeMessage(textToAnalyze.trim());
      setAnalysisResult(result);
      setIsWhyExpanded(true);
      toast.success("Analysis complete");
    } catch (err) {
      const msg = err.message || "Something went wrong while analyzing this message. Please try again.";
      setAnalysisError(msg);
      toast.error(msg);
    } finally {
      setAnalyzing(false);
    }
  };

  // Copy Summary
  const handleCopySummary = () => {
    if (!analysisResult) return;
    const indicators = analysisResult.warningIndicators || analysisResult.detectedWarningSigns || [];
    const actions = analysisResult.safetyActions || analysisResult.suggestedActions || [];
    const explanation = analysisResult.explanation || analysisResult.whyExplanation || "";
    const breakdown = analysisResult.scoreBreakdown
      ? analysisResult.scoreBreakdown.map((b) => `• ${b.category}: ${b.score}/${b.max}`).join("\n")
      : "";

    const summary = `HerGuardian AI - Digital Safety Analyzer Report
Category: ${analysisResult.displayCategory}
Assessment: ${analysisResult.headline}
Risk Level: ${analysisResult.riskLevel} (${analysisResult.riskScore}/100)
Confidence: ${analysisResult.confidence}%

Score Breakdown:
${breakdown || "• General Evaluation"}

Detected Warning Signs:
${indicators.map((s) => `• ${s}`).join("\n") || "• None flagged"}

Why Flagged:
${explanation}

Suggested Safety Actions:
${actions.map((a, i) => `${i + 1}. ${a}`).join("\n") || "• Practice normal caution"}

Disclaimer: This is an AI safety-support tool, not law enforcement or legal forensic advice.`;

    navigator.clipboard.writeText(summary);
    setCopied(true);
    toast.success("Report summary copied to clipboard");
    setTimeout(() => setCopied(false), 2500);
  };

  // Risk styling helpers
  const getRiskColorClasses = (level) => {
    switch (level) {
      case "Critical":
      case "Very High":
        return {
          bg: "bg-[#FDF2F2]",
          border: "border-[#F8B4B4]",
          text: "text-[#BA2626]",
          badgeBg: "bg-[#BA2626]",
          badgeText: "text-white",
          barColor: "bg-[#BA2626]",
          icon: AlertOctagon,
        };
      case "High":
        return {
          bg: "bg-[#FFF7ED]",
          border: "border-[#FED7AA]",
          text: "text-[#C2410C]",
          badgeBg: "bg-[#EA580C]",
          badgeText: "text-white",
          barColor: "bg-[#EA580C]",
          icon: AlertTriangle,
        };
      case "Moderate":
      case "Medium":
        return {
          bg: "bg-[#FEFCE8]",
          border: "border-[#FEF08A]",
          text: "text-[#B45309]",
          badgeBg: "bg-[#CA8A04]",
          badgeText: "text-white",
          barColor: "bg-[#CA8A04]",
          icon: HelpCircle,
        };
      case "Caution":
        return {
          bg: "bg-[#FFFBEB]",
          border: "border-[#FDE68A]",
          text: "text-[#D97706]",
          badgeBg: "bg-[#D97706]",
          badgeText: "text-white",
          barColor: "bg-[#D97706]",
          icon: HelpCircle,
        };
      case "Low":
      default:
        return {
          bg: "bg-[#F0FDF4]",
          border: "border-[#BBF7D0]",
          text: "text-[#15803D]",
          badgeBg: "bg-[#16A34A]",
          badgeText: "text-white",
          barColor: "bg-[#16A34A]",
          icon: ShieldCheck,
        };
    }
  };

  const riskStyles = analysisResult ? getRiskColorClasses(analysisResult.riskLevel) : null;
  const ResultIcon = riskStyles?.icon || ShieldAlert;

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-16">
      {/* 1. Header Section */}
      <div className="rounded-2xl border border-[#EDE6E2] bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#8C3737] text-white shadow-xs">
                <ShieldAlert className="h-5 w-5" />
              </span>
              <h1 className="font-serif text-2xl font-bold tracking-tight text-[#1E1B18] sm:text-3xl">
                Digital Safety Analyzer
              </h1>
            </div>
            <p className="mt-2 text-sm text-[#4F4A45] sm:text-base">
              Check suspicious messages for potential scams, harassment, threats, and other digital safety risks.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#EDE6E2] bg-[#FBF9F7] px-3 py-1 font-medium text-[#4F4A45]">
              <Sparkles className="h-3.5 w-3.5 text-[#8C3737]" />
              NLP / ML Powered
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#D1FAE5] bg-[#ECFDF5] px-3 py-1 font-medium text-[#065F46]">
              <Lock className="h-3.5 w-3.5 text-[#10B981]" />
              Zero-Storage Privacy
            </span>
          </div>
        </div>

        {/* Demo Quick Test Bar */}
        <div className="mt-6 border-t border-[#EDE6E2] pt-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#78726B]">
              Demo Quick-Test:
            </span>
            <div className="flex flex-wrap gap-2">
              {DEMO_EXAMPLES.map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => handleApplyDemo(ex)}
                  className="group inline-flex items-center gap-1.5 rounded-lg border border-[#EDE6E2] bg-[#FBF9F7] px-3 py-1.5 text-xs font-medium text-[#4F4A45] transition-all hover:border-[#8C3737] hover:bg-white hover:text-[#8C3737]"
                >
                  <span>{ex.label}</span>
                  <span className="rounded bg-[#EDE6E2] px-1.5 py-0.5 text-[10px] text-[#78726B] group-hover:bg-[#F6EFEA] group-hover:text-[#8C3737]">
                    {ex.badge}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Input Card with Tabs */}
      <div className="rounded-2xl border border-[#EDE6E2] bg-white p-6 sm:p-8 shadow-xs">
        {/* Method Switcher Tabs */}
        <div className="flex border-b border-[#EDE6E2]">
          <button
            onClick={() => setActiveTab("paste")}
            className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-colors ${
              activeTab === "paste"
                ? "border-[#8C3737] text-[#8C3737]"
                : "border-transparent text-[#78726B] hover:text-[#1E1B18]"
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Option A — Paste Message</span>
          </button>
          <button
            onClick={() => setActiveTab("screenshot")}
            className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-colors ${
              activeTab === "screenshot"
                ? "border-[#8C3737] text-[#8C3737]"
                : "border-transparent text-[#78726B] hover:text-[#1E1B18]"
            }`}
          >
            <ImageIcon className="h-4 w-4" />
            <span>Option B — Screenshot Analyzer (OCR)</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === "paste" ? (
            /* ==========================================
               OPTION A: PASTE MESSAGE
               ========================================== */
            <div className="space-y-4">
              <div>
                <label htmlFor="suspicious-message-input" className="block text-xs font-semibold uppercase tracking-wider text-[#78726B]">
                  Suspicious Message Content
                </label>
                <div className="relative mt-2">
                  <textarea
                    id="suspicious-message-input"
                    rows={6}
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder="Paste a suspicious message here (e.g., job offer demanding payment, urgent account blocking link, blackmail threat, etc.)..."
                    className="w-full resize-y rounded-xl border border-[#EDE6E2] bg-[#FBF9F7] p-4 text-sm text-[#1E1B18] placeholder-[#78726B] transition-colors focus:border-[#8C3737] focus:bg-white focus:outline-hidden"
                  />
                  <div className="mt-1 flex items-center justify-between text-xs text-[#78726B]">
                    <span className="flex items-center gap-1 text-[11px] text-[#78726B]">
                      <Info className="h-3 w-3 shrink-0" />
                      Never share passwords, OTPs, bank details, or other sensitive information.
                    </span>
                    <span>{pastedText.length} / 5000 characters</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  onClick={handleClearPaste}
                  disabled={!pastedText || analyzing}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#EDE6E2] px-4 py-2.5 text-xs font-medium text-[#4F4A45] hover:bg-[#F6EFEA] disabled:opacity-40 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Clear
                </button>

                <button
                  onClick={() => handleRunAnalysis(pastedText)}
                  disabled={!pastedText.trim() || analyzing}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#8C3737] px-6 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-[#772F2F] disabled:opacity-50 transition-all"
                >
                  {analyzing ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Analyzing Message...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4" />
                      Analyze Message
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* ==========================================
               OPTION B: SCREENSHOT ANALYZER
               ========================================== */
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-semibold text-[#1E1B18]">Analyze a Screenshot</h2>
                <p className="mt-1 text-sm text-[#4F4A45]">
                  Upload a screenshot of a suspicious message and HerGuardian will extract the visible text and analyze potential safety risks.
                </p>
              </div>

              {/* Upload Dropzone */}
              {!imagePreview ? (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#EDE6E2] bg-[#FBF9F7] p-8 text-center transition-colors hover:border-[#8C3737] hover:bg-[#F6EFEA]/50"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-xs border border-[#EDE6E2] text-[#8C3737]">
                    <UploadCloud className="h-7 w-7" />
                  </div>
                  <h3 className="mt-4 text-sm font-semibold text-[#1E1B18]">
                    Drag & drop message screenshot here
                  </h3>
                  <p className="mt-1 text-xs text-[#78726B]">
                    Supports PNG, JPG, JPEG, and WebP (Up to 10 MB)
                  </p>

                  <div className="mt-4">
                    <label
                      htmlFor={fileInputId}
                      className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-semibold text-[#8C3737] border border-[#EDE6E2] shadow-xs hover:bg-[#F6EFEA] transition-colors"
                    >
                      <ImageIcon className="h-4 w-4" />
                      Browse Files
                    </label>
                    <input
                      id={fileInputId}
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      className="hidden"
                      onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
                    />
                  </div>

                  <p className="mt-4 text-[11px] text-[#78726B] flex items-center gap-1">
                    <Lock className="h-3 w-3 text-[#10B981]" />
                    OCR runs directly inside your browser. The screenshot is never uploaded to an external server.
                  </p>
                </div>
              ) : (
                /* Preview & Extraction Area */
                <div className="space-y-4">
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Left: Image Preview */}
                    <div className="flex flex-col rounded-xl border border-[#EDE6E2] bg-[#FBF9F7] p-3">
                      <div className="flex items-center justify-between pb-2">
                        <span className="text-xs font-semibold text-[#4F4A45]">Screenshot Preview</span>
                        <button
                          onClick={handleRemoveImage}
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-[#BA2626] hover:bg-[#FDF2F2]"
                        >
                          <Trash2 className="h-3 w-3" />
                          Remove Image
                        </button>
                      </div>
                      <div className="flex max-h-72 items-center justify-center overflow-hidden rounded-lg bg-black/5">
                        <img
                          src={imagePreview}
                          alt="Screenshot preview"
                          className="max-h-72 w-auto object-contain"
                        />
                      </div>
                      <div className="mt-3">
                        <button
                          onClick={handleExtractText}
                          disabled={ocrLoading}
                          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#8C3737] py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-[#772F2F] disabled:opacity-50 transition-colors"
                        >
                          {ocrLoading ? (
                            <>
                              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                              Reading Screenshot...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-3.5 w-3.5" />
                              Extract Text from Screenshot
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Right: Extracted Text / Status */}
                    <div className="flex flex-col justify-between rounded-xl border border-[#EDE6E2] bg-[#FBF9F7] p-4">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold uppercase tracking-wider text-[#78726B]">
                            Text Detected from Screenshot
                          </span>
                          {extractedText && (
                            <button
                              onClick={() => setIsEditingExtracted(!isEditingExtracted)}
                              className="text-xs font-semibold text-[#8C3737] hover:underline"
                            >
                              {isEditingExtracted ? "Done Editing" : "Edit Text"}
                            </button>
                          )}
                        </div>

                        {ocrLoading ? (
                          <div className="mt-6 flex flex-col items-center justify-center py-8 text-center">
                            <RefreshCw className="h-8 w-8 animate-spin text-[#8C3737]" />
                            <p className="mt-3 text-xs font-semibold text-[#1E1B18]">
                              {ocrProgress.text || "Scanning screenshot..."}
                            </p>
                            <div className="mt-3 h-2 w-48 overflow-hidden rounded-full bg-[#EDE6E2]">
                              <div
                                className="h-full bg-[#8C3737] transition-all duration-300"
                                style={{ width: `${ocrProgress.pct}%` }}
                              />
                            </div>
                            <span className="mt-1 text-[11px] text-[#78726B]">
                              {ocrProgress.pct}% complete
                            </span>
                          </div>
                        ) : ocrError ? (
                          <div className="mt-4 rounded-xl border border-[#F8B4B4] bg-[#FDF2F2] p-4 text-xs text-[#BA2626]">
                            <p className="font-semibold">{ocrError}</p>
                            <p className="mt-1 text-[11px] text-[#78726B]">
                              Tip: Ensure the text is right-side up, well-lit, and not blurry.
                            </p>
                          </div>
                        ) : extractedText ? (
                          <div className="mt-3">
                            {isEditingExtracted ? (
                              <textarea
                                rows={6}
                                value={extractedText}
                                onChange={(e) => setExtractedText(e.target.value)}
                                className="w-full resize-y rounded-lg border border-[#EDE6E2] bg-white p-3 text-xs text-[#1E1B18] focus:border-[#8C3737] focus:outline-hidden"
                              />
                            ) : (
                              <div className="max-h-52 overflow-y-auto rounded-lg border border-[#EDE6E2] bg-white p-3 font-mono text-xs text-[#1E1B18]">
                                {extractedText}
                              </div>
                            )}
                            <p className="mt-1.5 text-[11px] text-[#78726B]">
                              Review the extracted text above. You can edit any missed words before running analysis.
                            </p>
                          </div>
                        ) : (
                          <div className="mt-8 text-center text-xs text-[#78726B]">
                            Click <strong>"Extract Text from Screenshot"</strong> to begin OCR reading.
                          </div>
                        )}
                      </div>

                      {extractedText && (
                        <div className="mt-4 pt-3 border-t border-[#EDE6E2]">
                          <button
                            onClick={() => handleRunAnalysis(extractedText)}
                            disabled={analyzing}
                            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#8C3737] py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-[#772F2F] disabled:opacity-50 transition-colors"
                          >
                            {analyzing ? (
                              <>
                                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                Analyzing Extracted Text...
                              </>
                            ) : (
                              <>
                                <ShieldCheck className="h-3.5 w-3.5" />
                                Analyze Extracted Text
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Analysis Error Message */}
      {analysisError && (
        <div className="rounded-xl border border-[#F8B4B4] bg-[#FDF2F2] p-4 text-xs font-medium text-[#BA2626]">
          {analysisError}
        </div>
      )}

      {/* 3. Result Section */}
      <AnimatePresence>
        {analysisResult && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.35 }}
            className="space-y-6"
          >
            {/* Primary Result Card */}
            <div className={`rounded-2xl border p-6 sm:p-8 shadow-xs ${riskStyles.bg} ${riskStyles.border}`}>
              {/* Header: Headline & Risk Score */}
              <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex rounded-lg p-2 ${riskStyles.badgeBg} text-white shadow-xs`}>
                      <ResultIcon className="h-5 w-5" />
                    </span>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${riskStyles.badgeBg} ${riskStyles.badgeText}`}>
                      {analysisResult.riskLevel} Risk
                    </span>
                    <span className="rounded-full border border-[#EDE6E2] bg-white px-3 py-1 text-xs font-medium text-[#4F4A45]">
                      {analysisResult.displayCategory}
                    </span>
                  </div>

                  <h2 className={`font-serif text-2xl font-bold tracking-tight ${riskStyles.text} sm:text-3xl`}>
                    {analysisResult.headline}
                  </h2>

                  <p className="text-xs text-[#78726B]">
                    Classification Confidence: <span className="font-semibold text-[#1E1B18]">{analysisResult.confidence}%</span> • Analyzed on {new Date(analysisResult.analyzedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                {/* Score Gauge */}
                <div className="flex shrink-0 items-center gap-4 rounded-xl border border-white/60 bg-white/80 p-4 shadow-xs backdrop-blur-xs">
                  <div className="text-center">
                    <span className="block text-[11px] font-semibold uppercase tracking-wider text-[#78726B]">
                      Risk Score
                    </span>
                    <div className="mt-0.5 flex items-baseline justify-center gap-0.5">
                      <span className={`text-3xl font-extrabold ${riskStyles.text}`}>
                        {analysisResult.riskScore}
                      </span>
                      <span className="text-xs font-medium text-[#78726B]">/ 100</span>
                    </div>
                  </div>
                  <div className="h-10 w-px bg-[#EDE6E2]" />
                  <div className="w-24">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-[#EDE6E2]">
                      <div
                        className={`h-full ${riskStyles.barColor} transition-all duration-700`}
                        style={{ width: `${analysisResult.riskScore}%` }}
                      />
                    </div>
                    <span className="mt-1 block text-right text-[10px] font-medium text-[#78726B]">
                      Scale: 0–100
                    </span>
                  </div>
                </div>
              </div>

              {/* Score Breakdown (Section 4) */}
              {analysisResult.scoreBreakdown && analysisResult.scoreBreakdown.length > 0 && (
                <div className="mt-6 border-t border-black/5 pt-5">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[#4F4A45]">
                    Risk Score Breakdown:
                  </h3>
                  <div className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                    {analysisResult.scoreBreakdown.map((item, idx) => {
                      const pct = Math.round((item.score / item.max) * 100);
                      const isElevated = item.score > 0;
                      return (
                        <div
                          key={idx}
                          className={`rounded-xl border p-3 shadow-xs transition-colors ${
                            isElevated
                              ? "border-black/10 bg-white/95"
                              : "border-black/5 bg-white/60 opacity-80"
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-[#1E1B18]">{item.category}</span>
                            <span
                              className={`font-mono font-bold ${
                                isElevated ? riskStyles.text : "text-[#78726B]"
                              }`}
                            >
                              {item.score} / {item.max}
                            </span>
                          </div>
                          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#EDE6E2]">
                            <div
                              className={`h-full transition-all duration-500 ${
                                isElevated ? riskStyles.barColor : "bg-[#78726B]/30"
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Detected Safety Signals Grid (Section 10) */}
              {analysisResult.detectedSignals && (
                <div className="mt-5 border-t border-black/5 pt-5">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[#4F4A45]">
                    Evaluated Safety Signals:
                  </h3>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {[
                      { key: "scam", label: "Financial / Job Scam" },
                      { key: "phishing", label: "Phishing & Credential Theft" },
                      { key: "harassment", label: "Harassment & Degradation" },
                      { key: "threat", label: "Threat & Intimidation" },
                      { key: "blackmail", label: "Blackmail & Extortion" },
                      { key: "privacyRisk", label: "Privacy / Location Request" },
                      { key: "sexualCoercion", label: "Sexual / Image Coercion" },
                    ].map((sig) => {
                      const isActive = Boolean(analysisResult.detectedSignals[sig.key]);
                      return (
                        <span
                          key={sig.key}
                          className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                            isActive
                              ? `${riskStyles.badgeBg} text-white shadow-xs`
                              : "border border-[#EDE6E2] bg-white/70 text-[#78726B]"
                          }`}
                        >
                          {isActive ? (
                            <AlertTriangle className="h-3.5 w-3.5" />
                          ) : (
                            <Check className="h-3 w-3 text-[#10B981]" />
                          )}
                          <span>{sig.label}</span>
                          <span
                            className={`rounded px-1 text-[10px] uppercase ${
                              isActive ? "bg-black/20 text-white" : "text-[#78726B]"
                            }`}
                          >
                            {isActive ? "Flagged" : "Clear"}
                          </span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Detected Warning Signs */}
              <div className="mt-6 border-t border-black/5 pt-6">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#4F4A45]">
                  Detected Warning Signs & Indicators:
                </h3>
                {((analysisResult.warningIndicators && analysisResult.warningIndicators.length > 0) ||
                  (analysisResult.detectedWarningSigns && analysisResult.detectedWarningSigns.length > 0)) ? (
                  <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                    {(analysisResult.warningIndicators || analysisResult.detectedWarningSigns).map((sign, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2.5 rounded-xl border border-white/80 bg-white/90 p-3 shadow-xs"
                      >
                        <CheckCircle2 className={`h-4 w-4 shrink-0 mt-0.5 ${riskStyles.text}`} />
                        <span className="text-xs font-medium text-[#1E1B18]">{sign}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-[#78726B]">
                    No explicit high-risk indicators were detected in this message.
                  </p>
                )}
              </div>

              {/* Explainable AI: "Why did HerGuardian flag this?" */}
              <div className="mt-6 border-t border-black/5 pt-4">
                <button
                  onClick={() => setIsWhyExpanded(!isWhyExpanded)}
                  className="flex w-full items-center justify-between text-left text-sm font-semibold text-[#1E1B18] hover:text-[#8C3737]"
                >
                  <span className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-[#8C3737]" />
                    Why did HerGuardian flag this?
                  </span>
                  {isWhyExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>

                {isWhyExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-3 rounded-xl border border-white/80 bg-white/95 p-4 text-xs leading-relaxed text-[#4F4A45] shadow-xs"
                  >
                    <p>{analysisResult.explanation || analysisResult.whyExplanation}</p>
                    <p className="mt-2 text-[11px] text-[#78726B]">
                      Note: This safety analysis evaluates linguistic signals, fraud databases, and coercive terminology to identify potential safety hazards.
                    </p>
                  </motion.div>
                )}
              </div>

              {/* Suggested Actions Checklist */}
              <div className="mt-6 border-t border-black/5 pt-6">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#4F4A45]">
                  Suggested Safety Actions:
                </h3>
                <div className="mt-3 space-y-2">
                  {(analysisResult.safetyActions || analysisResult.suggestedActions)?.map((action, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 rounded-xl border border-white/80 bg-white/90 p-3 shadow-xs"
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#EDE6E2] text-[11px] font-bold text-[#4F4A45]">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-medium text-[#1E1B18]">{action}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Quick Tools */}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-black/5 pt-4">
                <button
                  onClick={handleCopySummary}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#EDE6E2] bg-white px-3.5 py-2 text-xs font-medium text-[#4F4A45] shadow-xs hover:bg-[#F6EFEA] transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-[#10B981]" />
                      Report Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Copy Analysis Summary
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    setAnalysisResult(null);
                    setPastedText("");
                    handleRemoveImage();
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#8C3737] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#772F2F] transition-colors"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Analyze Another Message
                </button>
              </div>
            </div>

            {/* 4. Immediate Safety Escalation Card (For High & Very High Risk) */}
            {analysisResult.showEmergencySection && (
              <div className="rounded-2xl border border-[#F8B4B4] bg-linear-to-br from-[#FDF2F2] to-white p-6 shadow-xs">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#BA2626] text-white">
                        <AlertOctagon className="h-4 w-4" />
                      </span>
                      <h3 className="font-serif text-lg font-bold text-[#BA2626]">
                        If you feel immediately unsafe
                      </h3>
                    </div>
                    <p className="mt-1.5 text-xs text-[#4F4A45]">
                      Because this message contains high-risk indicators or intimidation language, protect yourself by reaching out to verified emergency resources:
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <a
                      href="tel:1091"
                      className="inline-flex items-center gap-2 rounded-xl bg-[#BA2626] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#991B1B] transition-colors"
                    >
                      <PhoneCall className="h-3.5 w-3.5" />
                      Women Helpline 1091
                    </a>
                    <a
                      href="tel:112"
                      className="inline-flex items-center gap-2 rounded-xl border border-[#BA2626] bg-white px-4 py-2 text-xs font-bold text-[#BA2626] shadow-xs hover:bg-[#FDF2F2] transition-colors"
                    >
                      <PhoneCall className="h-3.5 w-3.5" />
                      Police 112
                    </a>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <Link
                    to="/emergency"
                    className="flex items-center justify-between rounded-xl border border-[#EDE6E2] bg-white p-3.5 text-xs font-semibold text-[#1E1B18] shadow-xs hover:border-[#8C3737] hover:bg-[#F6EFEA]/40 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 text-[#BA2626]" />
                      Open Emergency SOS & Notify Contacts
                    </span>
                    <ArrowRight className="h-4 w-4 text-[#78726B]" />
                  </Link>

                  <Link
                    to="/community"
                    className="flex items-center justify-between rounded-xl border border-[#EDE6E2] bg-white p-3.5 text-xs font-semibold text-[#1E1B18] shadow-xs hover:border-[#8C3737] hover:bg-[#F6EFEA]/40 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <ExternalLink className="h-4 w-4 text-[#8C3737]" />
                      Cyber Crime & Legal Rights Resources
                    </span>
                    <ArrowRight className="h-4 w-4 text-[#78726B]" />
                  </Link>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. Privacy & Ethics Notice */}
      <div className="rounded-xl border border-[#EDE6E2] bg-[#FBF9F7] p-4 text-center">
        <p className="text-xs text-[#78726B] leading-relaxed">
          <strong className="text-[#4F4A45]">HerGuardian Privacy & Safety Commitment:</strong>{" "}
          Your message is analyzed in-memory for safety indicators. Avoid sharing passwords, OTPs, bank details, or other sensitive personal information. HerGuardian is a safety-support tool designed to help you identify risks, not a substitute for official law enforcement or judicial assistance.
        </p>
      </div>
    </div>
  );
}
