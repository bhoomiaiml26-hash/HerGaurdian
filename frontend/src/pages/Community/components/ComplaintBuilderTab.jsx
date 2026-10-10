import { useState } from 'react';
import {
  FileText,
  Copy,
  Download,
  BookmarkPlus,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Eye,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { saveDocumentDraft, createSupportCase } from '../../../services/communityService';

const templates = [
  {
    id: 'posh',
    name: 'Workplace POSH / Harassment Complaint',
    recipientDefault: 'The Presiding Officer & Members of the Internal Committee (ICC)\n[Company / Organization Name]',
    subjectDefault: 'Formal Complaint of Workplace Harassment under the POSH Act, 2013',
    reliefDefault: '1. Initiate an inquiry under the POSH Act, 2013.\n2. Provide interim relief (change of reporting manager / transfer / paid leave) during inquiry.\n3. Ensure strict confidentiality and protection against retaliation.',
  },
  {
    id: 'salary',
    name: 'Demand Notice for Unpaid Wages / Full & Final Settlement',
    recipientDefault: 'Human Resources Department & Management\n[Company / Organization Name]',
    subjectDefault: 'Formal Demand for Release of Pending Salary and Full & Final (F&F) Dues',
    reliefDefault: '1. Release all pending earned wages totaling ₹[Amount] within 10 business days.\n2. Issue relieving letter, experience certificate, and Form 16 without delay.\n3. Provide itemized statement of dues.',
  },
  {
    id: 'cyber',
    name: 'Complaint to Cyber Crime Cell / Police Station',
    recipientDefault: 'The Station House Officer / Cyber Crime Police Cell\n[District / City Police Department]',
    subjectDefault: 'Complaint regarding Online Harassment, Stalking, and Non-Consensual Imagery under the IT Act, 2000',
    reliefDefault: '1. Register an FIR / investigation under Section 66E/67 of IT Act and relevant provisions.\n2. Direct relevant digital platforms to preserve log records and take down infringing media.\n3. Take strict legal action against the perpetrator.',
  },
  {
    id: 'education',
    name: 'Educational Institution Grievance / Bias Complaint',
    recipientDefault: 'The Internal Student Grievance Redressal Committee / Dean of Student Welfare\n[University / College Name]',
    subjectDefault: 'Formal Student Grievance regarding Institutional Unfairness / Hostile Environment',
    reliefDefault: '1. Conduct an impartial review into the incident.\n2. Ensure no academic or disciplinary reprisal against the complainant.\n3. Provide written communication of the resolution within statutory UGC timelines.',
  },
  {
    id: 'legal_aid',
    name: 'Application for Free Legal Aid (NALSA / DLSA)',
    recipientDefault: 'The Member Secretary\nDistrict Legal Services Authority (DLSA), [District Court Name]',
    subjectDefault: 'Application for Assignment of Free Legal Aid Counsel under Section 12(c) of Legal Services Authorities Act, 1987',
    reliefDefault: '1. Appoint a panel legal aid advocate to represent applicant before the appropriate court.\n2. Assist in drafting and filing necessary petition/pleadings at zero legal fee.',
  },
  {
    id: 'general',
    name: 'General Formal Notice / Institutional Letter',
    recipientDefault: '[Designation of Authority]\n[Organization / Department Name]',
    subjectDefault: 'Formal Written Request / Notice regarding [Matter]',
    reliefDefault: '1. Provide written acknowledgment and response to this notice within 14 days.\n2. Take necessary corrective steps as requested herein.',
  },
];

export default function ComplaintBuilderTab({ initialCategory = 'posh', initialFacts = '' }) {
  const [selectedTemplate, setSelectedTemplate] = useState(
    templates.find((t) => t.id === initialCategory) ? initialCategory : 'posh'
  );

  const currentTpl = templates.find((t) => t.id === selectedTemplate) || templates[0];

  const [senderName, setSenderName] = useState('');
  const [senderContact, setSenderContact] = useState('');
  const [recipient, setRecipient] = useState(currentTpl.recipientDefault);
  const [subject, setSubject] = useState(currentTpl.subjectDefault);
  const [incidentDate, setIncidentDate] = useState('');
  const [incidentLocation, setIncidentLocation] = useState('');
  const [facts, setFacts] = useState(initialFacts || '');
  const [requestedRelief, setRequestedRelief] = useState(currentTpl.reliefDefault);
  const [attachments, setAttachments] = useState('1. Relevant email/chat screenshots with timestamps\n2. Relevant official correspondence');
  
  const [generatedDraft, setGeneratedDraft] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Template change handler
  const handleTemplateChange = (tplId) => {
    setSelectedTemplate(tplId);
    const tpl = templates.find((t) => t.id === tplId) || templates[0];
    setRecipient(tpl.recipientDefault);
    setSubject(tpl.subjectDefault);
    setRequestedRelief(tpl.reliefDefault);
    setGeneratedDraft('');
  };

  const generateLetter = () => {
    if (!facts.trim()) {
      toast.error('Please describe the relevant facts of the issue.');
      return;
    }

    const todayDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const draft = `Date: ${todayDate}

To,
${recipient || '[Designation & Organization]'}

Subject: ${subject}

Dear Sir/Madam / Members of the Committee,

I, ${senderName ? senderName.trim() : '[Your Full Name]'}, am submitting this formal communication to bring to your immediate notice an urgent matter requiring administrative and procedural intervention.

1. FACTUAL BACKGROUND & TIMELINE OF EVENTS:
${incidentDate ? `• Date / Timeframe: ${incidentDate}\n` : ''}${incidentLocation ? `• Location / Context: ${incidentLocation}\n` : ''}
${facts.trim()}

2. SPECIFIC ACTION / RELIEF REQUESTED:
In accordance with established procedural guidelines and applicable statutory rights, I respectfully request the following:
${requestedRelief.trim()}

3. SUPPORTING DOCUMENTS / ENCLOSURES:
I am enclosing true copies of the following documents to substantiate this formal request:
${attachments.trim()}

I request a formal written acknowledgment receipt of this communication, along with reference tracking details for future correspondence.

Respectfully submitted,

____________________________
${senderName ? senderName.trim() : '[Signature / Name]'}
${senderContact ? senderContact.trim() : '[Contact Phone / Email]'}`;

    setGeneratedDraft(draft);
    toast.success('Document draft generated successfully!');
  };

  const handleCopy = () => {
    if (!generatedDraft) return;
    navigator.clipboard.writeText(generatedDraft);
    toast.success('Draft copied to clipboard!');
  };

  const handleDownload = () => {
    if (!generatedDraft) return;
    const element = document.createElement('a');
    const file = new Blob([generatedDraft], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `${selectedTemplate}_draft_${Date.now()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success('Draft downloaded as text file!');
  };

  const handleSaveDraft = async () => {
    if (!generatedDraft) return;
    setIsSaving(true);
    try {
      const res = await saveDocumentDraft({
        title: subject || `${currentTpl.name} Draft`,
        templateType: currentTpl.name,
        recipient: recipient.split('\n')[0],
        subject,
        content: generatedDraft,
        status: 'draft',
      });
      if (res.success) {
        toast.success('Draft saved to your private HerGuardian library!');
      }
    } catch (err) {
      console.error('Failed to save draft:', err);
      toast.error('Failed to save draft. Please check your login session.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateCaseFromDraft = async () => {
    if (!generatedDraft) return;
    setIsSaving(true);
    try {
      const res = await createSupportCase({
        title: subject.slice(0, 100),
        category: currentTpl.name,
        description: `FORMAL DRAFT PREPARED:\n\n${generatedDraft}`,
        status: 'planning',
        priority: 'high',
        incidentDate: incidentDate || new Date().toISOString().split('T')[0],
        tasks: [
          { title: 'Review and verify draft facts with personal records', completed: false, priority: 'urgent' },
          { title: 'Send formal communication to recipient via email / registered post', completed: false },
          { title: 'Follow up on written acknowledgment within 7 days', completed: false },
        ],
      });
      if (res.success) {
        toast.success('Created new case in Case Tracker with this draft!');
      }
    } catch (err) {
      console.error('Failed to create case:', err);
      toast.error('Failed to create case.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border border-[#EDE6E2] bg-white p-6 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F6EFEA] text-[#8C3737]">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-serif text-xl font-bold text-[#1E1B18]">
              Complaint, Letter &amp; Application Builder
            </h2>
            <p className="text-xs text-[#78726B]">
              Prepare clear, formal, and objective communications grounded in facts. No legal jargon fabrication.
            </p>
          </div>
        </div>
      </div>

      {/* Template Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-1 scrollbar-none">
        {templates.map((tpl) => (
          <button
            key={tpl.id}
            onClick={() => handleTemplateChange(tpl.id)}
            className={`whitespace-nowrap rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
              selectedTemplate === tpl.id
                ? 'bg-[#8C3737] text-white shadow-xs'
                : 'border border-[#EDE6E2] bg-white text-[#4F4A45] hover:bg-[#F6EFEA]'
            }`}
          >
            {tpl.name}
          </button>
        ))}
      </div>

      {/* Main Grid: Form Left, Preview Right */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Col: Guided Input Fields */}
        <div className="rounded-2xl border border-[#EDE6E2] bg-white p-6 shadow-xs space-y-4">
          <h3 className="font-serif text-base font-bold text-[#1E1B18] pb-2 border-b border-[#EDE6E2]">
            1. Document Details &amp; Parties
          </h3>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-[#1E1B18] mb-1">
                Your Full Name / Identification
              </label>
              <input
                type="text"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="e.g. Ananya Sharma or [Anonymous Complainant]"
                className="w-full rounded-lg border border-[#EDE6E2] bg-[#FBF9F7] px-3 py-2 text-xs text-[#1E1B18] focus:border-[#8C3737] focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1E1B18] mb-1">
                Your Contact Information
              </label>
              <input
                type="text"
                value={senderContact}
                onChange={(e) => setSenderContact(e.target.value)}
                placeholder="e.g. Phone or confidential email"
                className="w-full rounded-lg border border-[#EDE6E2] bg-[#FBF9F7] px-3 py-2 text-xs text-[#1E1B18] focus:border-[#8C3737] focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1E1B18] mb-1">
              Recipient Designation &amp; Institution
            </label>
            <textarea
              rows={2}
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="w-full rounded-lg border border-[#EDE6E2] bg-[#FBF9F7] p-2.5 text-xs text-[#1E1B18] focus:border-[#8C3737] focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1E1B18] mb-1">
              Subject Line
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full rounded-lg border border-[#EDE6E2] bg-[#FBF9F7] px-3 py-2 text-xs text-[#1E1B18] focus:border-[#8C3737] focus:outline-hidden"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-[#1E1B18] mb-1">
                Relevant Incident Date(s)
              </label>
              <input
                type="text"
                value={incidentDate}
                onChange={(e) => setIncidentDate(e.target.value)}
                placeholder="e.g. August 12, 2024 to September 2, 2024"
                className="w-full rounded-lg border border-[#EDE6E2] bg-[#FBF9F7] px-3 py-2 text-xs text-[#1E1B18] focus:border-[#8C3737] focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1E1B18] mb-1">
                Location / Department / Context
              </label>
              <input
                type="text"
                value={incidentLocation}
                onChange={(e) => setIncidentLocation(e.target.value)}
                placeholder="e.g. Bangalore Branch Office / Online Platform"
                className="w-full rounded-lg border border-[#EDE6E2] bg-[#FBF9F7] px-3 py-2 text-xs text-[#1E1B18] focus:border-[#8C3737] focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1E1B18] mb-1">
              Chronology &amp; Facts of the Event (Be Objective)
            </label>
            <textarea
              rows={4}
              value={facts}
              onChange={(e) => setFacts(e.target.value)}
              placeholder="State the facts chronologically. Avoid assumptions. Mention what was said or done, who was present, and what was communicated..."
              className="w-full rounded-lg border border-[#EDE6E2] bg-[#FBF9F7] p-3 text-xs text-[#1E1B18] leading-relaxed focus:border-[#8C3737] focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1E1B18] mb-1">
              Specific Resolution or Relief Sought
            </label>
            <textarea
              rows={3}
              value={requestedRelief}
              onChange={(e) => setRequestedRelief(e.target.value)}
              className="w-full rounded-lg border border-[#EDE6E2] bg-[#FBF9F7] p-2.5 text-xs text-[#1E1B18] focus:border-[#8C3737] focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1E1B18] mb-1">
              Enclosed Attachments / Proof List
            </label>
            <textarea
              rows={2}
              value={attachments}
              onChange={(e) => setAttachments(e.target.value)}
              className="w-full rounded-lg border border-[#EDE6E2] bg-[#FBF9F7] p-2.5 text-xs text-[#1E1B18] focus:border-[#8C3737] focus:outline-hidden"
            />
          </div>

          <div className="pt-2">
            <button
              onClick={generateLetter}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#8C3737] px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-[#752B2B] transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Generate Structured Draft</span>
            </button>
          </div>
        </div>

        {/* Right Col: Live Generated Document & Controls */}
        <div className="rounded-2xl border border-[#EDE6E2] bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#EDE6E2]">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-[#8C3737]" />
                <h3 className="font-serif text-base font-bold text-[#1E1B18]">
                  Draft Preview
                </h3>
              </div>
              {generatedDraft && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1 rounded-md border border-[#EDE6E2] bg-[#FBF9F7] px-2.5 py-1 text-xs font-semibold text-[#1E1B18] hover:bg-[#F6EFEA]"
                    title="Copy to Clipboard"
                  >
                    <Copy className="h-3 w-3" /> Copy
                  </button>
                  <button
                    onClick={handleDownload}
                    className="inline-flex items-center gap-1 rounded-md border border-[#EDE6E2] bg-[#FBF9F7] px-2.5 py-1 text-xs font-semibold text-[#1E1B18] hover:bg-[#F6EFEA]"
                    title="Download as .txt"
                  >
                    <Download className="h-3 w-3" /> Download
                  </button>
                </div>
              )}
            </div>

            <div className="mt-4">
              {!generatedDraft ? (
                <div className="rounded-xl border border-dashed border-[#EDE6E2] bg-[#FBF9F7] p-12 text-center">
                  <FileText className="mx-auto h-10 w-10 text-[#A8A29E] mb-2" />
                  <p className="text-xs font-semibold text-[#1E1B18]">No Draft Generated Yet</p>
                  <p className="text-xs text-[#78726B] mt-1 max-w-sm mx-auto">
                    Fill out the facts on the left and click "Generate Structured Draft" to produce an editable formal letter.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-[#78726B]">
                      You can edit this draft directly below:
                    </span>
                    <span className="text-[10px] text-[#286646] font-bold">Editable</span>
                  </div>
                  <textarea
                    rows={18}
                    value={generatedDraft}
                    onChange={(e) => setGeneratedDraft(e.target.value)}
                    className="w-full font-mono rounded-xl border border-[#EDE6E2] bg-[#FAF8F6] p-4 text-xs text-[#1E1B18] leading-relaxed focus:border-[#8C3737] focus:outline-hidden"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons & Review Notice */}
          <div className="mt-6 space-y-4">
            {generatedDraft && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleSaveDraft}
                  disabled={isSaving}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#8C3737] px-4 py-2 text-xs font-semibold text-white hover:bg-[#752B2B] disabled:opacity-50"
                >
                  <BookmarkPlus className="h-3.5 w-3.5" />
                  <span>Save to My Private Drafts</span>
                </button>
                <button
                  onClick={handleCreateCaseFromDraft}
                  disabled={isSaving}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#EDE6E2] bg-white px-4 py-2 text-xs font-semibold text-[#1E1B18] hover:bg-[#F6EFEA] disabled:opacity-50"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#286646]" />
                  <span>Save as Case in Tracker</span>
                </button>
              </div>
            )}

            {/* Mandatory Verification Notice */}
            <div className="rounded-xl border border-[#EDE6E2] bg-[#FFFBF7] p-3 text-[11px] text-[#78726B] leading-relaxed flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-[#A85C12] shrink-0 mt-0.5" />
              <p>
                <strong>Pre-Send Verification Notice:</strong> Please carefully review all dates, names, amounts, and recipient addresses before dispatching. HerGuardian AI does not automatically transmit legal or administrative documents on your behalf.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
