import { useState } from 'react';
import {
  Scale,
  ShieldAlert,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  FileText,
  AlertTriangle,
  ExternalLink,
  PhoneCall,
  Sparkles,
  ClipboardList,
  Edit3
} from 'lucide-react';
import toast from 'react-hot-toast';
import { statutoryProvisions } from '../../../data/rightsDirectoryData';

const categories = [
  {
    id: 'posh',
    title: 'Workplace Harassment / POSH',
    desc: 'Unwelcome conduct, discrimination, hostile work environment, or ICC inquiries.',
    keyLaw: 'POSH Act, 2013',
  },
  {
    id: 'unpaid_wages',
    title: 'Unpaid Salary / Workplace Dispute',
    desc: 'Withheld wages, illegal deductions, notice period pay, or lack of F&F settlement.',
    keyLaw: 'Payment of Wages Act & Industrial Disputes Act',
  },
  {
    id: 'cyber_abuse',
    title: 'Online Harassment / Cyber Stalking',
    desc: 'Non-consensual imagery, morphing, trolling, doxxing, or threatening messages.',
    keyLaw: 'IT Act, 2000 (Sec 66E, 67) & BNS/IPC',
  },
  {
    id: 'education',
    title: 'Educational Institution Grievance',
    desc: 'University bias, ragging, hostel restrictions, internal grievance apathy.',
    keyLaw: 'UGC Grievance Redressal Regulations',
  },
  {
    id: 'legal_aid',
    title: 'Accessing Free Legal Aid',
    desc: 'Court-appointed representation for family disputes, divorce, domestic safety, maintenance.',
    keyLaw: 'Legal Services Authorities Act (Sec 12c)',
  },
  {
    id: 'schemes',
    title: 'Applying for Support Schemes',
    desc: 'Government subsidies, Working Women Hostels, One Stop Centres, maternity grant.',
    keyLaw: 'Statutory Welfare Schemes (MWCD)',
  },
  {
    id: 'other',
    title: 'Other Personal or Institutional Issue',
    desc: 'Consumer fraud, landlord disputes, arbitrary institutional notices.',
    keyLaw: 'Civil & Consumer Protection Provisions',
  },
];

export default function RightsAssistantTab({ onSwitchToComplaint }) {
  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('posh');
  const [jurisdiction, setJurisdiction] = useState('India (National)');
  const [institutionType, setInstitutionType] = useState('Private Company (10+ employees)');
  const [incidentDate, setIncidentDate] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [hasWitnessesOrProof, setHasWitnessesOrProof] = useState('yes');
  const [isImmediateDanger, setIsImmediateDanger] = useState(false);

  // Analysis result
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isEditingPlan, setIsEditingPlan] = useState(false);
  const [editedSteps, setEditedSteps] = useState([]);

  const handleGeneratePlan = () => {
    if (!issueDescription.trim()) {
      toast.error('Please describe what happened in your own words.');
      return;
    }

    const catObj = categories.find((c) => c.id === selectedCategory) || categories[0];
    let statutoryRef = statutoryProvisions[selectedCategory] || {
      title: catObj.keyLaw,
      keyRules: [
        'Right to submit a formal written grievance with timestamped acknowledgment.',
        'Right to access internal conciliation or redressal without retaliation.',
        'Right to statutory escalation to district authorities or relevant tribunal.',
      ],
      officialAuthority: 'Relevant District Grievance Officer / Tribunal',
    };

    let steps;
    let evidenceChecklist;
    let officialLinks;

    if (selectedCategory === 'posh') {
      steps = [
        { id: '1', title: 'Compile contemporaneous timeline with dates, locations, and exact words used.' },
        { id: '2', title: 'Submit a formal written complaint to the Internal Complaints Committee (ICC) within 3 months.' },
        { id: '3', title: 'Request interim relief in writing (e.g., transfer, paid leave, change of reporting manager).' },
        { id: '4', title: 'If employer lacks an ICC or fails to act, lodge grievance on the central SHe-Box portal.' },
      ];
      evidenceChecklist = ['Emails, Slack/WhatsApp messages, or voice notes', 'Workplace badge / log records', 'Names of any colleagues present or informed shortly after'];
      officialLinks = [
        { name: 'SHe-Box Central Portal', url: 'https://shebox.wcd.gov.in', note: 'Central monitoring portal for POSH grievances' },
        { name: 'National Commission for Women', url: 'http://ncw.nic.in', note: 'Escalation for institutional inaction' },
      ];
    } else if (selectedCategory === 'unpaid_wages') {
      steps = [
        { id: '1', title: 'Send a formal Demand Letter / Notice giving 7 to 14 days for settlement of pending dues.' },
        { id: '2', title: 'Gather appointment letter, payslips, bank statements, and resignation acceptance email.' },
        { id: '3', title: 'If unanswered, file a recovery petition before the local Labor Commissioner office.' },
      ];
      evidenceChecklist = ['Appointment letter & signed contract', 'Bank statements showing missed months', 'Timesheets, client emails proving work completed', 'Written acknowledgment of resignation'];
      officialLinks = [
        { name: 'Ministry of Labour & Employment', url: 'https://labour.gov.in', note: 'Statutory guidelines under Payment of Wages Act' },
      ];
    } else if (selectedCategory === 'cyber_abuse') {
      steps = [
        { id: '1', title: 'Take full-screen screenshots preserving URLs, usernames, dates, and post links.' },
        { id: '2', title: 'Call 1930 Cyber Crime helpline or report on cybercrime.gov.in under Women/Child category.' },
        { id: '3', title: 'Submit grievance to platform Grievance Officer requesting content takedown within 24 hours.' },
        { id: '4', title: 'Block and preserve evidence; avoid engaging or deleting perpetrator messages.' },
      ];
      evidenceChecklist = ['Full screenshots with timestamps', 'Profile URL of perpetrator', 'Original unedited image/media if morphing occurred'];
      officialLinks = [
        { name: 'National Cyber Crime Reporting Portal', url: 'https://cybercrime.gov.in', note: 'Official portal to register cyber offenses' },
      ];
    } else if (selectedCategory === 'legal_aid') {
      steps = [
        { id: '1', title: 'Locate the District Legal Services Authority (DLSA) office in your district court complex.' },
        { id: '2', title: 'Fill Form for Free Legal Services under Section 12(c) (Zero fee for all women).' },
        { id: '3', title: 'Meet the assigned panel advocate and discuss strategy prior to filing pleadings.' },
      ];
      evidenceChecklist = ['Government ID proof (Aadhaar / Voter ID)', 'Marriage / child birth certificates (if family dispute)', 'Any police complaints, notices, or court orders received'];
      officialLinks = [
        { name: 'NALSA Portal', url: 'https://nalsa.gov.in', note: 'Apply online for free legal representation' },
      ];
    } else {
      steps = [
        { id: '1', title: 'Document factual chronology with dates, witnesses, and monetary loss if applicable.' },
        { id: '2', title: 'Send a formal, documented grievance to the designated authority.' },
        { id: '3', title: 'Set a 14-day calendar checkpoint for institutional follow-up.' },
      ];
      evidenceChecklist = ['Written agreements or policy handbook', 'Email correspondence', 'Receipts or transactional proof'];
      officialLinks = [
        { name: 'National Consumer Helpline', url: 'https://consumerhelpline.gov.in', note: 'For consumer or institutional service deficiencies' },
      ];
    }

    const result = {
      category: catObj.title,
      statutoryLaw: statutoryRef.title,
      statutoryRules: statutoryRef.keyRules,
      authority: statutoryRef.officialAuthority,
      factualSummary: issueDescription.trim(),
      steps,
      evidenceChecklist,
      officialLinks,
      date: new Date().toLocaleDateString(),
    };

    setAnalysisResult(result);
    setEditedSteps(steps);
    setStep(4);
  };

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="rounded-xl border border-[#EDE6E2] bg-white p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-[#8C3737]" />
            <h2 className="font-serif text-base font-bold text-[#1E1B18]">
              Rights Action Assistant
            </h2>
          </div>
          <span className="text-xs font-semibold text-[#78726B]">
            Step {step} of 4
          </span>
        </div>

        {/* Progress Bar */}
        <div className="mt-3 h-1.5 w-full bg-[#F6EFEA] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#8C3737] transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>
      </div>

      {/* Immediate Danger Warning */}
      {isImmediateDanger && (
        <div className="rounded-xl border border-[#BA2626] bg-[#FFF5F5] p-5 shadow-xs">
          <div className="flex items-start gap-3">
            <ShieldAlert className="h-6 w-6 text-[#BA2626] shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h3 className="font-serif text-base font-bold text-[#BA2626]">
                Safety First: You May Be In Immediate Danger
              </h3>
              <p className="text-xs text-[#7A3E3E] leading-relaxed">
                If someone is threatening physical violence or you are in immediate peril, do not wait to finish this questionnaire. Reach emergency rescue immediately.
              </p>
              <div className="flex items-center gap-3 pt-2">
                <a
                  href="tel:112"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#BA2626] px-4 py-2 text-xs font-bold text-white hover:bg-[#9B1C1C]"
                >
                  <PhoneCall className="h-3.5 w-3.5" /> Dial 112 (Police / Rescue)
                </a>
                <a
                  href="tel:181"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#BA2626] bg-white px-4 py-2 text-xs font-bold text-[#BA2626] hover:bg-[#FDF2F2]"
                >
                  <PhoneCall className="h-3.5 w-3.5" /> Dial 181 (Women Helpline)
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 1: CATEGORY SELECTION */}
      {step === 1 && (
        <div className="rounded-2xl border border-[#EDE6E2] bg-white p-6 shadow-xs space-y-6">
          <div>
            <h3 className="font-serif text-lg font-bold text-[#1E1B18]">
              What kind of situation are you facing?
            </h3>
            <p className="text-xs text-[#78726B] mt-1">
              Select the category that best matches your concern. We will align our guidance with verified statutory provisions.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <div
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`cursor-pointer rounded-xl border p-4 transition-all ${
                    isSelected
                      ? 'border-[#8C3737] bg-[#F6EFEA]/60 shadow-xs'
                      : 'border-[#EDE6E2] bg-[#FBF9F7] hover:border-[#8C3737]/40'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <h4 className="font-serif text-sm font-semibold text-[#1E1B18]">
                      {cat.title}
                    </h4>
                    {isSelected && (
                      <CheckCircle2 className="h-4 w-4 text-[#8C3737] shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-[#78726B] mt-1.5 leading-relaxed">
                    {cat.desc}
                  </p>
                  <div className="mt-3 pt-2 border-t border-[#EDE6E2]/60">
                    <span className="text-[10px] font-semibold text-[#8C3737] bg-white px-2 py-0.5 rounded border border-[#EDE6E2]">
                      {cat.keyLaw}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-[#EDE6E2] flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-[#7A3E3E]">
              <input
                type="checkbox"
                checked={isImmediateDanger}
                onChange={(e) => setIsImmediateDanger(e.target.checked)}
                className="rounded border-[#F0D5D5] text-[#BA2626] focus:ring-[#BA2626]"
              />
              <span className="font-semibold">I feel in immediate physical danger</span>
            </label>

            <button
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#8C3737] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#752B2B] transition-colors"
            >
              <span>Continue</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: CONTEXT & JURISDICTION */}
      {step === 2 && (
        <div className="rounded-2xl border border-[#EDE6E2] bg-white p-6 shadow-xs space-y-6">
          <div>
            <h3 className="font-serif text-lg font-bold text-[#1E1B18]">
              Context &amp; Jurisdiction Details
            </h3>
            <p className="text-xs text-[#78726B] mt-1">
              Legal rules depend on whether the institution is public or private, organization size, and region.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-[#1E1B18] mb-1">
                Applicable Jurisdiction / Region
              </label>
              <select
                value={jurisdiction}
                onChange={(e) => setJurisdiction(e.target.value)}
                className="w-full rounded-lg border border-[#EDE6E2] bg-[#FBF9F7] px-3.5 py-2 text-xs text-[#1E1B18] focus:border-[#8C3737] focus:outline-hidden"
              >
                <option value="India (National)">India (National Law / Central Acts)</option>
                <option value="Delhi NCT">Delhi NCT</option>
                <option value="Maharashtra">Maharashtra</option>
                <option value="Karnataka">Karnataka</option>
                <option value="Tamil Nadu">Tamil Nadu</option>
                <option value="International / General">International / General Principles</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1E1B18] mb-1">
                Organization / Counterparty Type
              </label>
              <select
                value={institutionType}
                onChange={(e) => setInstitutionType(e.target.value)}
                className="w-full rounded-lg border border-[#EDE6E2] bg-[#FBF9F7] px-3.5 py-2 text-xs text-[#1E1B18] focus:border-[#8C3737] focus:outline-hidden"
              >
                <option value="Private Company (10+ employees)">Private Company (10+ employees — Mandatory ICC)</option>
                <option value="Small Business / Startup (<10 employees)">Small Business / Startup (&lt;10 employees — Local Committee)</option>
                <option value="Government / PSU">Government Department / PSU</option>
                <option value="College / University">College / University / Educational Board</option>
                <option value="Individual / Private Person">Individual / Private Person (Domestic, online, landlord)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1E1B18] mb-1">
                Approximate Date of Incident / First Notice
              </label>
              <input
                type="date"
                value={incidentDate}
                onChange={(e) => setIncidentDate(e.target.value)}
                className="w-full rounded-lg border border-[#EDE6E2] bg-[#FBF9F7] px-3.5 py-2 text-xs text-[#1E1B18] focus:border-[#8C3737] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1E1B18] mb-1">
                Do you possess written records, screenshots, or witnesses?
              </label>
              <select
                value={hasWitnessesOrProof}
                onChange={(e) => setHasWitnessesOrProof(e.target.value)}
                className="w-full rounded-lg border border-[#EDE6E2] bg-[#FBF9F7] px-3.5 py-2 text-xs text-[#1E1B18] focus:border-[#8C3737] focus:outline-hidden"
              >
                <option value="yes">Yes, I have saved emails, messages, or documents</option>
                <option value="partial">Some evidence, but incomplete</option>
                <option value="no">No written proof yet; happened verbally</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-[#EDE6E2] flex items-center justify-between">
            <button
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#EDE6E2] bg-white px-4 py-2 text-xs font-semibold text-[#1E1B18] hover:bg-[#F6EFEA]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back</span>
            </button>
            <button
              onClick={() => setStep(3)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#8C3737] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#752B2B]"
            >
              <span>Continue</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: USER NARRATIVE */}
      {step === 3 && (
        <div className="rounded-2xl border border-[#EDE6E2] bg-white p-6 shadow-xs space-y-6">
          <div>
            <h3 className="font-serif text-lg font-bold text-[#1E1B18]">
              Describe what happened in your own words
            </h3>
            <p className="text-xs text-[#78726B] mt-1">
              Be factual. Mention what occurred, who was involved, any dates or communications received, and what resolution you want.
            </p>
          </div>

          <div>
            <textarea
              rows={6}
              value={issueDescription}
              onChange={(e) => setIssueDescription(e.target.value)}
              placeholder="Example: On Sept 15, my reporting manager made inappropriate comments during an internal review. When I objected, they threatened my appraisal. I have saved our WhatsApp exchange and sent a note to HR which went unacknowledged..."
              className="w-full rounded-xl border border-[#EDE6E2] bg-[#FBF9F7] p-4 text-xs text-[#1E1B18] leading-relaxed focus:border-[#8C3737] focus:outline-hidden"
            />
            <p className="text-[11px] text-[#78726B] mt-1.5">
              Tip: Keep names and dates accurate. We will structure this into actionable points without inventing any allegations.
            </p>
          </div>

          <div className="pt-4 border-t border-[#EDE6E2] flex items-center justify-between">
            <button
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#EDE6E2] bg-white px-4 py-2 text-xs font-semibold text-[#1E1B18] hover:bg-[#F6EFEA]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back</span>
            </button>
            <button
              onClick={handleGeneratePlan}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#8C3737] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#752B2B]"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Analyze &amp; Generate Action Plan</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: ACTION PLAN & RESULTS */}
      {step === 4 && analysisResult && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="rounded-2xl border border-[#EDE6E2] bg-white p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#EDE6E2]">
              <div>
                <span className="rounded-md bg-[#F6EFEA] px-2.5 py-1 text-[11px] font-semibold text-[#8C3737]">
                  {analysisResult.category}
                </span>
                <h3 className="font-serif text-xl font-bold text-[#1E1B18] mt-2">
                  Tailored Rights Action Roadmap
                </h3>
                <p className="text-xs text-[#78726B] mt-0.5">
                  Governed by {analysisResult.statutoryLaw}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onSwitchToComplaint(selectedCategory, analysisResult.factualSummary)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#EDE6E2] bg-white px-3.5 py-2 text-xs font-semibold text-[#1E1B18] hover:bg-[#F6EFEA]"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>Draft Complaint</span>
                </button>
              </div>
            </div>

            {/* Factual Summary Review */}
            <div className="mt-4 rounded-xl border border-[#EDE6E2] bg-[#FBF9F7] p-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#78726B]">
                Your Factual Summary
              </p>
              <p className="mt-1 text-xs text-[#1E1B18] leading-relaxed">
                "{analysisResult.factualSummary}"
              </p>
            </div>
          </div>

          {/* Statutory Provisions Grounding */}
          <div className="rounded-2xl border border-[#EDE6E2] bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-[#8C3737]" />
              <h4 className="font-serif text-base font-bold text-[#1E1B18]">
                Applicable Statutory Rights &amp; Legal Principles
              </h4>
            </div>

            <div className="rounded-xl border border-[#EDE6E2] bg-[#FBF9F7] p-4 space-y-2">
              <p className="text-xs font-bold text-[#8C3737]">
                {analysisResult.statutoryLaw}
              </p>
              <ul className="space-y-1.5">
                {analysisResult.statutoryRules.map((rule, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-[#4F4A45]">
                    <span className="text-[#8C3737] font-bold">•</span>
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
              <p className="text-[11px] text-[#78726B] pt-2 border-t border-[#EDE6E2]">
                Designated Statutory Authority: <strong className="text-[#1E1B18]">{analysisResult.authority}</strong>
              </p>
            </div>
          </div>

          {/* Action Steps Checklist */}
          <div className="rounded-2xl border border-[#EDE6E2] bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-[#8C3737]" />
                <h4 className="font-serif text-base font-bold text-[#1E1B18]">
                  Prioritized Next Steps
                </h4>
              </div>
              <button
                onClick={() => setIsEditingPlan(!isEditingPlan)}
                className="text-xs font-semibold text-[#8C3737] hover:underline flex items-center gap-1"
              >
                <Edit3 className="h-3 w-3" />
                <span>{isEditingPlan ? 'Done Editing' : 'Edit Steps'}</span>
              </button>
            </div>

            <div className="space-y-3">
              {editedSteps.map((stepItem, idx) => (
                <div
                  key={stepItem.id}
                  className="rounded-xl border border-[#EDE6E2] bg-[#FBF9F7] p-4 flex items-start gap-3"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#8C3737] text-[11px] font-bold text-white">
                    {idx + 1}
                  </span>
                  <div className="flex-1">
                    {isEditingPlan ? (
                      <input
                        type="text"
                        value={stepItem.title}
                        onChange={(e) => {
                          const updated = [...editedSteps];
                          updated[idx].title = e.target.value;
                          setEditedSteps(updated);
                        }}
                        className="w-full rounded border border-[#EDE6E2] bg-white px-2 py-1 text-xs text-[#1E1B18]"
                      />
                    ) : (
                      <p className="text-xs font-semibold text-[#1E1B18] leading-relaxed">
                        {stepItem.title}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Evidence Checklist & Official Portals */}
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Evidence Checklist */}
            <div className="rounded-2xl border border-[#EDE6E2] bg-white p-6 shadow-xs space-y-3">
              <h4 className="font-serif text-sm font-bold text-[#1E1B18]">
                Evidence to Preserve Before Escalating
              </h4>
              <ul className="space-y-2">
                {analysisResult.evidenceChecklist.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-[#4F4A45]">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#286646] shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Official Links */}
            <div className="rounded-2xl border border-[#EDE6E2] bg-white p-6 shadow-xs space-y-3">
              <h4 className="font-serif text-sm font-bold text-[#1E1B18]">
                Official Portals &amp; Filing Cells
              </h4>
              <div className="space-y-2.5">
                {analysisResult.officialLinks.map((link, idx) => (
                  <a
                    key={idx}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-lg border border-[#EDE6E2] bg-[#FBF9F7] p-3 hover:border-[#8C3737]/40 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs font-semibold text-[#1E1B18]">
                      <span>{link.name}</span>
                      <ExternalLink className="h-3 w-3 text-[#8C3737]" />
                    </div>
                    <p className="text-[11px] text-[#78726B] mt-0.5">{link.note}</p>
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Legal Disclaimer */}
          <div className="rounded-xl border border-[#EDE6E2] bg-[#FFFBF7] p-4 text-xs text-[#78726B] leading-relaxed flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 text-[#A85C12] shrink-0 mt-0.5" />
            <p>
              <strong>Informational Guidance Only:</strong> This structured roadmap provides objective procedural advice under recognized statutory statutes. It does not constitute attorney-client privilege or guarantee an administrative outcome. For formal litigation or defense, consult a licensed advocate or your District Legal Services Authority.
            </p>
          </div>

          {/* Reset / Start New */}
          <div className="pt-2 text-center">
            <button
              onClick={() => {
                setStep(1);
                setAnalysisResult(null);
              }}
              className="text-xs font-semibold text-[#8C3737] hover:underline"
            >
              ← Start Another Assessment
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
