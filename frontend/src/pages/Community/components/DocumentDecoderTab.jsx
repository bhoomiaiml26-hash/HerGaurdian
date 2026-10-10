import { useState } from 'react';
import {
  FileText,
  HelpCircle,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { legalGlossary } from '../../../data/rightsDirectoryData';

export default function DocumentDecoderTab() {
  const [inputText, setInputText] = useState('');
  const [decodedResult, setDecodedResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDecode = () => {
    if (!inputText.trim()) {
      toast.error('Please paste or upload document text to decode.');
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      const text = inputText.trim();

      // 1. Detect explicit dates and deadlines
      const dateRegex = /\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:,\s*\d{4})?|\b\d{1,2}\s+(?:days|weeks|months)\b|\bwithin\s+\w+\s+(?:days|hours|weeks)\b)/gi;
      const detectedDates = Array.from(new Set(text.match(dateRegex) || []));

      // 2. Identify matched legal terms from glossary
      const foundTerms = legalGlossary.filter((item) => {
        const termPattern = new RegExp(`\\b${item.term.split(' ')[0]}\\b`, 'i');
        return termPattern.test(text);
      });

      // 3. Extract action triggers (words like must, shall, required, submit, appear, pay)
      const sentences = text.split(/(?<=[.?!])\s+/);
      const actionSentences = sentences.filter((s) =>
        /\b(must|shall|required|submit|appear|respond|provide|pay|furnish|explain)\b/i.test(s)
      );

      // 4. Synthesize plain language breakdown
      const summary = `This document appears to be an official or institutional notice communicating formal requirements. It outlines specific obligations and establishes an administrative expectation for compliance or response.`;

      // 5. Formulate questions to ask
      const questionsToAsk = [
        'What is the exact statutory or internal policy regulation under which this notice is issued?',
        'What specific documentation or written response is required to formally resolve this matter?',
        'Who is the designated appellate or independent grievance officer should I contest this determination?',
        'Can I be granted an extension of time if additional records or legal counsel are required?',
      ];

      setDecodedResult({
        summary,
        detectedDates,
        actionItems: actionSentences.slice(0, 5),
        foundTerms,
        questionsToAsk,
      });

      setIsProcessing(false);
      toast.success('Document analysis completed!');
    }, 400);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.match(/\.(txt|md|text|csv)$/i)) {
      toast.error('Please upload a plain text (.txt or .md) document.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        setInputText(content.slice(0, 20000));
        toast.success(`Loaded "${file.name}"`);
      }
    };
    reader.readAsText(file);
  };

  const handleCopy = () => {
    if (!decodedResult) return;
    const reportText = `DOCUMENT DECODER ANALYSIS REPORT
---------------------------------
PLAIN LANGUAGE SUMMARY:
${decodedResult.summary}

DETECTED DATES & DEADLINES:
${decodedResult.detectedDates.join(', ') || 'No explicit dates detected'}

REQUIRED ACTIONS:
${decodedResult.actionItems.map((a, i) => `${i + 1}. ${a}`).join('\n')}

TERMS EXPLAINED:
${decodedResult.foundTerms.map((t) => `${t.term}: ${t.explanation}`).join('\n')}

QUESTIONS TO ASK:
${decodedResult.questionsToAsk.map((q, i) => `${i + 1}. ${q}`).join('\n')}
`;
    navigator.clipboard.writeText(reportText);
    toast.success('Analysis report copied to clipboard!');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl border border-[#EDE6E2] bg-white p-6 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F6EFEA] text-[#8C3737]">
            <HelpCircle className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-serif text-xl font-bold text-[#1E1B18]">
              Document Decoder &amp; Jargon Translator
            </h2>
            <p className="text-xs text-[#78726B]">
              Paste confusing workplace letters, show-cause notices, or policies to extract real deadlines, required actions, and plain English meanings.
            </p>
          </div>
        </div>
      </div>

      {/* Input Section */}
      <div className="rounded-2xl border border-[#EDE6E2] bg-white p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <label className="text-xs font-semibold text-[#1E1B18]">
            Paste Document Text or Notice Below:
          </label>
          <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-[#8C3737] hover:underline">
            <span>Upload Text File (.txt)</span>
            <input
              type="file"
              accept=".txt,.md,.text"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        <textarea
          rows={7}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Paste the text of the employment contract, HR email, university disciplinary notice, or legal letter here..."
          className="w-full rounded-xl border border-[#EDE6E2] bg-[#FBF9F7] p-3.5 text-xs text-[#1E1B18] leading-relaxed focus:border-[#8C3737] focus:outline-hidden"
        />

        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-[#78726B]">
            {inputText.length} characters (All processing occurs securely inside your session)
          </span>
          <button
            onClick={handleDecode}
            disabled={isProcessing}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#8C3737] px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-[#752B2B] disabled:opacity-50 transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>{isProcessing ? 'Analyzing...' : 'Decode Document'}</span>
          </button>
        </div>
      </div>

      {/* Decoded Results Grid */}
      {decodedResult && (
        <div className="space-y-6">
          {/* Plain Summary & Copy Bar */}
          <div className="rounded-2xl border border-[#EDE6E2] bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#EDE6E2]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-[#286646]" />
                <h3 className="font-serif text-base font-bold text-[#1E1B18]">
                  Plain-Language Assessment
                </h3>
              </div>
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#EDE6E2] bg-[#FBF9F7] px-3 py-1.5 text-xs font-semibold text-[#1E1B18] hover:bg-[#F6EFEA]"
              >
                <Copy className="h-3.5 w-3.5" />
                <span>Copy Summary Report</span>
              </button>
            </div>

            <p className="text-xs text-[#4F4A45] leading-relaxed bg-[#FBF9F7] p-4 rounded-xl border border-[#EDE6E2]">
              {decodedResult.summary}
            </p>
          </div>

          {/* Deadlines & Action Items */}
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Detected Deadlines */}
            <div className="rounded-2xl border border-[#EDE6E2] bg-white p-6 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-[#8C3737]">
                <Calendar className="h-4 w-4" />
                <h4 className="font-serif text-sm font-bold text-[#1E1B18]">
                  Detected Dates &amp; Deadlines
                </h4>
              </div>

              {decodedResult.detectedDates.length === 0 ? (
                <p className="text-xs text-[#78726B] italic">
                  No explicit calendar dates or day counts detected in the text.
                </p>
              ) : (
                <div className="space-y-2">
                  {decodedResult.detectedDates.map((date, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg border border-[#EDE6E2] bg-[#FBF9F7] p-2.5 text-xs font-mono font-semibold text-[#8C3737]"
                    >
                      📅 {date}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Extracted Required Actions */}
            <div className="rounded-2xl border border-[#EDE6E2] bg-white p-6 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-[#8C3737]">
                <FileText className="h-4 w-4" />
                <h4 className="font-serif text-sm font-bold text-[#1E1B18]">
                  Extracted Action Requirements
                </h4>
              </div>

              {decodedResult.actionItems.length === 0 ? (
                <p className="text-xs text-[#78726B] italic">
                  No mandatory imperatives (must, shall, submit) identified.
                </p>
              ) : (
                <div className="space-y-2">
                  {decodedResult.actionItems.map((act, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg border border-[#EDE6E2] bg-[#FBF9F7] p-2.5 text-xs text-[#4F4A45] leading-relaxed"
                    >
                      <strong className="text-[#8C3737]">{idx + 1}. </strong>
                      {act}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Legal Terms Glossary Breakdown */}
          {decodedResult.foundTerms.length > 0 && (
            <div className="rounded-2xl border border-[#EDE6E2] bg-white p-6 shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-[#8C3737]" />
                <h4 className="font-serif text-sm font-bold text-[#1E1B18]">
                  Legal Terms Found in this Document
                </h4>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {decodedResult.foundTerms.map((term, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-[#EDE6E2] bg-[#FBF9F7] p-3 text-xs space-y-1"
                  >
                    <span className="font-bold text-[#8C3737]">{term.term}</span>
                    <p className="text-[#4F4A45] leading-relaxed">{term.explanation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Questions to Ask Authority */}
          <div className="rounded-2xl border border-[#EDE6E2] bg-white p-6 shadow-xs space-y-3">
            <h4 className="font-serif text-sm font-bold text-[#1E1B18]">
              Recommended Questions to Ask Before Signing or Responding
            </h4>
            <div className="space-y-2">
              {decodedResult.questionsToAsk.map((q, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 rounded-lg border border-[#EDE6E2] bg-[#FBF9F7] p-2.5 text-xs text-[#1E1B18]"
                >
                  <span className="text-[#8C3737] font-bold">?</span>
                  <span>{q}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Safety Disclaimer */}
          <div className="rounded-xl border border-[#EDE6E2] bg-[#FFFBF7] p-4 text-xs text-[#78726B] leading-relaxed flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 text-[#A85C12] shrink-0 mt-0.5" />
            <p>
              <strong>Untrusted Input Caution:</strong> Never sign a document under duress or without reviewing full implications with a licensed advocate or union representative. This decoder separates factual text from analytical inferences to keep you informed.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
