import { useState } from 'react';
import {
  MessageSquare,
  Sparkles,
  Copy,
  BookmarkPlus,
  Volume2,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { saveDocumentDraft } from '../../../services/communityService';

const situationPresets = [
  {
    id: 'unpaid_due',
    label: 'Requesting Overdue Payment / Salary',
    role: 'HR Manager / Client',
    issue: 'My invoice of ₹[Amount] for [Work] submitted on [Date] is pending past the agreed payment date.',
    outcome: 'Please confirm when the transfer will be initiated or release payment by [Date].',
  },
  {
    id: 'clarify_policy',
    label: 'Asking Institution to Clarify a Policy',
    role: 'College Administrator / HR',
    issue: 'I received contradictory information regarding [Policy/Leave/Attendance] guidelines.',
    outcome: 'I request written clarification so I can adhere properly to established regulations.',
  },
  {
    id: 'boundary',
    label: 'Setting a Firm Professional Boundary',
    role: 'Colleague / Manager',
    issue: 'Workplace interactions have crossed professional boundaries during off-hours / communications.',
    outcome: 'I request that our communication remain strictly professional and limited to work-related matters during business hours.',
  },
  {
    id: 'followup',
    label: 'Following Up on an Ignored Grievance',
    role: 'Internal Complaints Cell / HR Head',
    issue: 'I submitted a formal inquiry regarding [Issue] on [Date] and have not received an acknowledgment or timeline.',
    outcome: 'Please provide written confirmation of receipt and the expected timeline for resolution.',
  },
  {
    id: 'decline',
    label: 'Respectfully Declining an Unreasonable Demand',
    role: 'Supervisor / Client',
    issue: 'I have been requested to take on tasks outside my contracted scope / after-hours without compensation.',
    outcome: 'I must decline this request to maintain quality on my agreed responsibilities, but can prioritize it during normal hours if scope is adjusted.',
  },
];

export default function LetterAssistantTab() {
  const [selectedPreset, setSelectedPreset] = useState(situationPresets[0].id);
  const [counterpartyRole, setCounterpartyRole] = useState(situationPresets[0].role);
  const [issueSummary, setIssueSummary] = useState(situationPresets[0].issue);
  const [desiredOutcome, setDesiredOutcome] = useState(situationPresets[0].outcome);
  const [tone, setTone] = useState('professional');

  const [generatedMessage, setGeneratedMessage] = useState('');
  const [speakingPoints, setSpeakingPoints] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  const handleSelectPreset = (presetId) => {
    setSelectedPreset(presetId);
    const p = situationPresets.find((item) => item.id === presetId);
    if (p) {
      setCounterpartyRole(p.role);
      setIssueSummary(p.issue);
      setDesiredOutcome(p.outcome);
      setGeneratedMessage('');
      setSpeakingPoints([]);
    }
  };

  const handleGenerate = () => {
    if (!issueSummary.trim()) {
      toast.error('Please describe the context of the conversation.');
      return;
    }

    let greeting;
    let signoff;

    if (tone === 'polite') {
      greeting = 'Dear [Name], I hope you are having a productive week.';
      signoff = 'Thank you for your understanding and prompt support.\nSincerely,\n[Your Name]';
    } else if (tone === 'firm') {
      greeting = 'Dear [Name],';
      signoff = 'I expect your timely written response.\nRegards,\n[Your Name]';
    } else if (tone === 'concise') {
      greeting = 'Hello [Name],';
      signoff = 'Thanks,\n[Your Name]';
    } else {
      // professional
      greeting = 'Dear [Name],';
      signoff = 'Warm regards,\n[Your Name]';
    }

    const message = `${greeting}

I am reaching out regarding ${issueSummary.trim()}

To ensure we are aligned and move forward constructively:
${desiredOutcome.trim()}

Please let me know if you require any additional documentation from my end.

${signoff}`;

    const talkPoints = [
      `"I appreciate your time. I wanted to speak with you directly about ${counterpartyRole.toLowerCase()} matters so there is complete clarity."`,
      `"Specifically: ${issueSummary.trim().slice(0, 100)}..."`,
      `"To resolve this constructively, my requested next step is: ${desiredOutcome.trim().slice(0, 100)}."`,
      `"Could we agree on a written confirmation by the end of the week?"`,
    ];

    setGeneratedMessage(message);
    setSpeakingPoints(talkPoints);
    toast.success('Generated communication drafts!');
  };

  const handleCopy = () => {
    if (!generatedMessage) return;
    navigator.clipboard.writeText(generatedMessage);
    toast.success('Message draft copied to clipboard!');
  };

  const handleSaveToDrafts = async () => {
    if (!generatedMessage) return;
    setIsSaving(true);
    try {
      const res = await saveDocumentDraft({
        title: `Communication Draft: ${counterpartyRole}`,
        templateType: 'Difficult Conversation Draft',
        recipient: counterpartyRole,
        subject: `Regarding: ${issueSummary.slice(0, 40)}`,
        content: generatedMessage,
        status: 'draft',
      });
      if (res.success) {
        toast.success('Draft saved to your private HerGuardian library!');
      }
    } catch {
      toast.error('Failed to save draft. Please login first.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl border border-[#EDE6E2] bg-white p-6 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F6EFEA] text-[#8C3737]">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-serif text-xl font-bold text-[#1E1B18]">
              Difficult Conversation &amp; Letter Assistant
            </h2>
            <p className="text-xs text-[#78726B]">
              Prepare calm, assertive, and respectful communication drafts for salary follow-ups, workplace boundaries, and institutional policy questions.
            </p>
          </div>
        </div>
      </div>

      {/* Preset Scenarios */}
      <div className="flex overflow-x-auto gap-2 pb-1 scrollbar-none">
        {situationPresets.map((preset) => (
          <button
            key={preset.id}
            onClick={() => handleSelectPreset(preset.id)}
            className={`whitespace-nowrap rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
              selectedPreset === preset.id
                ? 'bg-[#8C3737] text-white shadow-xs'
                : 'border border-[#EDE6E2] bg-white text-[#4F4A45] hover:bg-[#F6EFEA]'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Form & Generation Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Col: Customization */}
        <div className="rounded-2xl border border-[#EDE6E2] bg-white p-6 shadow-xs space-y-4">
          <h3 className="font-serif text-base font-bold text-[#1E1B18] pb-2 border-b border-[#EDE6E2]">
            Situation Parameters
          </h3>

          <div>
            <label className="block text-xs font-semibold text-[#1E1B18] mb-1">
              Counterparty Role / Relationship
            </label>
            <input
              type="text"
              value={counterpartyRole}
              onChange={(e) => setCounterpartyRole(e.target.value)}
              placeholder="e.g. Senior Manager / HR Lead / Landlord"
              className="w-full rounded-lg border border-[#EDE6E2] bg-[#FBF9F7] px-3 py-2 text-xs text-[#1E1B18] focus:border-[#8C3737] focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1E1B18] mb-1">
              Select Desired Tone
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { id: 'professional', label: 'Professional' },
                { id: 'polite', label: 'Polite / Gentle' },
                { id: 'firm', label: 'Firm & Assertive' },
                { id: 'concise', label: 'Concise & Direct' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTone(t.id)}
                  className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                    tone === t.id
                      ? 'border-[#8C3737] bg-[#F6EFEA] text-[#8C3737]'
                      : 'border-[#EDE6E2] bg-white text-[#4F4A45] hover:bg-[#FBF9F7]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1E1B18] mb-1">
              Context / Core Issue (What happened?)
            </label>
            <textarea
              rows={3}
              value={issueSummary}
              onChange={(e) => setIssueSummary(e.target.value)}
              placeholder="Explain the background situation objectively..."
              className="w-full rounded-lg border border-[#EDE6E2] bg-[#FBF9F7] p-3 text-xs text-[#1E1B18] leading-relaxed focus:border-[#8C3737] focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1E1B18] mb-1">
              Desired Action / Outcome
            </label>
            <textarea
              rows={3}
              value={desiredOutcome}
              onChange={(e) => setDesiredOutcome(e.target.value)}
              placeholder="What specific step do you need from them?"
              className="w-full rounded-lg border border-[#EDE6E2] bg-[#FBF9F7] p-3 text-xs text-[#1E1B18] leading-relaxed focus:border-[#8C3737] focus:outline-hidden"
            />
          </div>

          <div className="pt-2">
            <button
              onClick={handleGenerate}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#8C3737] px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-[#752B2B] transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Generate Email Draft &amp; Speaking Points</span>
            </button>
          </div>
        </div>

        {/* Right Col: Output Draft & Spoken Phrases */}
        <div className="space-y-6">
          {/* Written Draft */}
          <div className="rounded-2xl border border-[#EDE6E2] bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#EDE6E2]">
              <h3 className="font-serif text-base font-bold text-[#1E1B18]">
                Written Communication Draft
              </h3>
              {generatedMessage && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1 rounded-md border border-[#EDE6E2] bg-[#FBF9F7] px-2.5 py-1 text-xs font-semibold text-[#1E1B18] hover:bg-[#F6EFEA]"
                  >
                    <Copy className="h-3 w-3" /> Copy
                  </button>
                  <button
                    onClick={handleSaveToDrafts}
                    disabled={isSaving}
                    className="inline-flex items-center gap-1 rounded-md bg-[#8C3737] px-2.5 py-1 text-xs font-semibold text-white hover:bg-[#752B2B]"
                  >
                    <BookmarkPlus className="h-3 w-3" /> Save
                  </button>
                </div>
              )}
            </div>

            {!generatedMessage ? (
              <div className="rounded-xl border border-dashed border-[#EDE6E2] bg-[#FBF9F7] p-10 text-center text-xs text-[#78726B]">
                Configure parameters on the left and click Generate.
              </div>
            ) : (
              <textarea
                rows={10}
                value={generatedMessage}
                onChange={(e) => setGeneratedMessage(e.target.value)}
                className="w-full rounded-xl border border-[#EDE6E2] bg-[#FAF8F6] p-3 text-xs text-[#1E1B18] leading-relaxed font-sans focus:border-[#8C3737] focus:outline-hidden"
              />
            )}
          </div>

          {/* Spoken Talking Points */}
          {speakingPoints.length > 0 && (
            <div className="rounded-2xl border border-[#EDE6E2] bg-white p-6 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-[#8C3737]">
                <Volume2 className="h-4 w-4" />
                <h4 className="font-serif text-sm font-bold text-[#1E1B18]">
                  Spoken Script (For In-Person / Phone Conversation)
                </h4>
              </div>

              <div className="space-y-2">
                {speakingPoints.map((point, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-[#EDE6E2] bg-[#FBF9F7] p-3 text-xs text-[#4F4A45] leading-relaxed"
                  >
                    <span className="font-bold text-[#8C3737] mr-1">Cue {idx + 1}:</span>
                    {point}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
