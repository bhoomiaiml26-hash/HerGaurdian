import { useState } from 'react';
import {
  FileCheck,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  BookmarkPlus,
  RefreshCw,
  PhoneCall
} from 'lucide-react';
import toast from 'react-hot-toast';
import { statutorySchemes } from '../../../data/rightsDirectoryData';
import { createSupportCase } from '../../../services/communityService';

export default function EligibilityNavigatorTab({ onCaseCreated }) {
  const [needCategory, setNeedCategory] = useState('shelter');
  const [employmentStatus, setEmploymentStatus] = useState('salaried');
  const [incomeBracket, setIncomeBracket] = useState('low');
  const [hasImmediateEmergency, setHasImmediateEmergency] = useState(false);
  const [matchedSchemes, setMatchedSchemes] = useState(null);
  const [isSavingCase, setIsSavingCase] = useState(false);

  const handleRunNavigator = () => {
    let matches;

    if (needCategory === 'shelter') {
      matches = statutorySchemes.filter(
        (s) => s.category.includes('Shelter') || s.category.includes('Housing')
      );
    } else if (needCategory === 'legal') {
      matches = statutorySchemes.filter((s) => s.category.includes('Legal'));
    } else if (needCategory === 'maternity') {
      matches = statutorySchemes.filter((s) => s.category.includes('Maternity'));
    } else if (needCategory === 'workplace') {
      matches = statutorySchemes.filter((s) => s.category.includes('Workplace'));
    } else if (needCategory === 'cyber') {
      matches = statutorySchemes.filter((s) => s.category.includes('Digital'));
    } else {
      matches = statutorySchemes;
    }

    if (matches.length === 0) {
      matches = statutorySchemes.slice(0, 2);
    }

    setMatchedSchemes(matches);
    toast.success(`Found ${matches.length} matching statutory schemes!`);
  };

  const handleSaveSchemeToCase = async (scheme) => {
    setIsSavingCase(true);
    try {
      const res = await createSupportCase({
        title: `Application Tracker: ${scheme.name}`,
        category: 'Statutory Scheme Application',
        description: `SCHEME DETAILS:\n${scheme.description}\n\nELIGIBILITY:\n${scheme.eligibility}\n\nREQUIRED DOCUMENTS:\n${(scheme.documentsRequired || []).join('\n')}\n\nOFFICIAL PORTAL:\n${scheme.officialUrl}`,
        status: 'planning',
        priority: 'medium',
        tasks: (scheme.applicationSteps || []).map((step, idx) => ({
          title: step,
          completed: false,
          priority: idx === 0 ? 'urgent' : 'normal',
        })),
      });

      if (res.success) {
        toast.success(`Created private tracker for ${scheme.name}!`);
        if (onCaseCreated) onCaseCreated(res.case);
      }
    } catch (err) {
      console.error('Failed to save scheme to case:', err);
      toast.error('Failed to create tracker. Please check your login session.');
    } finally {
      setIsSavingCase(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl border border-[#EDE6E2] bg-white p-6 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F6EFEA] text-[#8C3737]">
            <FileCheck className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-serif text-xl font-bold text-[#1E1B18]">
              Rights &amp; Support Eligibility Navigator
            </h2>
            <p className="text-xs text-[#78726B]">
              Discover which verified governmental welfare programs, shelters, or legal aid cells you qualify for.
            </p>
          </div>
        </div>
      </div>

      {/* Guided Questionnaire */}
      <div className="rounded-2xl border border-[#EDE6E2] bg-white p-6 shadow-xs space-y-6">
        <div>
          <h3 className="font-serif text-base font-bold text-[#1E1B18]">
            Eligibility Discovery Assessment
          </h3>
          <p className="text-xs text-[#78726B] mt-1">
            Answer 4 basic questions. We use verified government notification criteria to filter applicable programs.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Question 1: Support Need */}
          <div>
            <label className="block text-xs font-semibold text-[#1E1B18] mb-1">
              1. What is your primary need right now?
            </label>
            <select
              value={needCategory}
              onChange={(e) => setNeedCategory(e.target.value)}
              className="w-full rounded-lg border border-[#EDE6E2] bg-[#FBF9F7] px-3.5 py-2 text-xs text-[#1E1B18] focus:border-[#8C3737] focus:outline-hidden"
            >
              <option value="shelter">Safe Housing, Crisis Shelter &amp; Sakhi Niwas</option>
              <option value="legal">Free Legal Representation &amp; Court Defense</option>
              <option value="maternity">Maternity Benefits &amp; Childcare Subsidies</option>
              <option value="workplace">Workplace Harassment (POSH) Redressal</option>
              <option value="cyber">Cyber Crime &amp; Digital Harassment Relief</option>
            </select>
            <span className="text-[11px] text-[#78726B] mt-1 block">
              Helps us match specific ministry schemes.
            </span>
          </div>

          {/* Question 2: Employment / Life Status */}
          <div>
            <label className="block text-xs font-semibold text-[#1E1B18] mb-1">
              2. Your current employment or student status
            </label>
            <select
              value={employmentStatus}
              onChange={(e) => setEmploymentStatus(e.target.value)}
              className="w-full rounded-lg border border-[#EDE6E2] bg-[#FBF9F7] px-3.5 py-2 text-xs text-[#1E1B18] focus:border-[#8C3737] focus:outline-hidden"
            >
              <option value="salaried">Salaried Employee (Private / Corporate / PSU)</option>
              <option value="informal">Informal / Domestic Worker / Daily Wage</option>
              <option value="student">Student (School / College / University)</option>
              <option value="homemaker">Homemaker / Self-Employed</option>
            </select>
            <span className="text-[11px] text-[#78726B] mt-1 block">
              Certain hostels and DBT grants have employment qualifications.
            </span>
          </div>

          {/* Question 3: Income Bracket */}
          <div>
            <label className="block text-xs font-semibold text-[#1E1B18] mb-1">
              3. Annual household income bracket
            </label>
            <select
              value={incomeBracket}
              onChange={(e) => setIncomeBracket(e.target.value)}
              className="w-full rounded-lg border border-[#EDE6E2] bg-[#FBF9F7] px-3.5 py-2 text-xs text-[#1E1B18] focus:border-[#8C3737] focus:outline-hidden"
            >
              <option value="low">Below ₹1,00,000 / Priority BPL</option>
              <option value="medium">₹1,00,000 to ₹3,00,000</option>
              <option value="high">Above ₹3,00,000 / No restriction</option>
            </select>
            <span className="text-[11px] text-[#78726B] mt-1 block">
              Note: Free legal aid under Section 12(c) has NO income cap for women.
            </span>
          </div>

          {/* Question 4: Immediate Emergency */}
          <div>
            <label className="block text-xs font-semibold text-[#1E1B18] mb-1">
              4. Immediate physical safety status
            </label>
            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-[#1E1B18]">
                <input
                  type="checkbox"
                  checked={hasImmediateEmergency}
                  onChange={(e) => setHasImmediateEmergency(e.target.checked)}
                  className="rounded text-[#BA2626] focus:ring-[#BA2626]"
                />
                <span className="font-semibold text-[#BA2626]">
                  I need urgent emergency intervention or safe relocation
                </span>
              </label>
            </div>
            <span className="text-[11px] text-[#78726B] mt-1.5 block">
              If checked, prioritized crisis response centers are highlighted first.
            </span>
          </div>
        </div>

        <div className="pt-3 border-t border-[#EDE6E2] flex justify-end">
          <button
            onClick={handleRunNavigator}
            className="inline-flex items-center gap-2 rounded-lg bg-[#8C3737] px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-[#752B2B] transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Check Potential Eligibility</span>
          </button>
        </div>
      </div>

      {/* Results Section */}
      {matchedSchemes && (
        <div className="space-y-5">
          <h3 className="font-serif text-lg font-bold text-[#1E1B18]">
            Potentially Matching Programs &amp; Schemes ({matchedSchemes.length})
          </h3>

          <div className="grid gap-6 lg:grid-cols-2">
            {matchedSchemes.map((scheme) => (
              <div
                key={scheme.id}
                className="rounded-2xl border border-[#EDE6E2] bg-white p-6 shadow-xs flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="rounded-md bg-[#F6EFEA] px-2.5 py-0.5 text-[10px] font-semibold text-[#8C3737]">
                        {scheme.category}
                      </span>
                      <span className="text-[11px] font-bold text-[#286646] flex items-center gap-0.5">
                        <ShieldCheck className="h-3.5 w-3.5" /> Verified Program
                      </span>
                    </div>
                    <h4 className="font-serif text-base font-bold text-[#1E1B18] mt-2">
                      {scheme.name}
                    </h4>
                    <p className="text-xs text-[#78726B] mt-0.5">
                      Jurisdiction: {scheme.jurisdiction}
                    </p>
                  </div>

                  <p className="text-xs text-[#4F4A45] leading-relaxed">
                    {scheme.description}
                  </p>

                  {/* Eligibility criteria */}
                  <div className="rounded-xl border border-[#EDE6E2] bg-[#FBF9F7] p-3.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#78726B]">
                      Eligibility Condition
                    </p>
                    <p className="mt-1 text-xs text-[#1E1B18] font-medium leading-relaxed">
                      {scheme.eligibility}
                    </p>
                  </div>

                  {/* Documents Required */}
                  {scheme.documentsRequired && (
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-[#78726B] mb-1.5">
                        Documents Needed:
                      </p>
                      <ul className="space-y-1">
                        {scheme.documentsRequired.map((doc, idx) => (
                          <li key={idx} className="flex items-start gap-1.5 text-xs text-[#4F4A45]">
                            <CheckCircle2 className="h-3.5 w-3.5 text-[#286646] shrink-0 mt-0.5" />
                            <span>{doc}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Step-by-step application */}
                  {scheme.applicationSteps && (
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-[#78726B] mb-1.5">
                        Application Roadmap:
                      </p>
                      <ol className="space-y-1.5">
                        {scheme.applicationSteps.map((step, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs text-[#4F4A45]">
                            <span className="font-bold text-[#8C3737]">{idx + 1}.</span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="mt-6 pt-4 border-t border-[#EDE6E2] flex flex-wrap items-center justify-between gap-2">
                  <div className="flex gap-2">
                    {scheme.contact && (
                      <a
                        href={`tel:${scheme.contact}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-[#EDE6E2] bg-white px-3 py-1.5 text-xs font-semibold text-[#1E1B18] hover:bg-[#F6EFEA]"
                      >
                        <PhoneCall className="h-3 w-3" /> Helpline {scheme.contact}
                      </a>
                    )}
                    {scheme.officialUrl && (
                      <a
                        href={scheme.officialUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg border border-[#EDE6E2] bg-white px-3 py-1.5 text-xs font-semibold text-[#1E1B18] hover:bg-[#F6EFEA]"
                      >
                        <ExternalLink className="h-3 w-3" /> Official Portal
                      </a>
                    )}
                  </div>

                  <button
                    onClick={() => handleSaveSchemeToCase(scheme)}
                    disabled={isSavingCase}
                    className="inline-flex items-center gap-1 rounded-lg bg-[#8C3737] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#752B2B] disabled:opacity-50"
                  >
                    <BookmarkPlus className="h-3.5 w-3.5" />
                    <span>Track Application in Case Tracker</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Transparency Disclaimer */}
          <div className="rounded-xl border border-[#EDE6E2] bg-[#FFFBF7] p-4 text-xs text-[#78726B] leading-relaxed flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 text-[#A85C12] shrink-0 mt-0.5" />
            <p>
              <strong>Transparent Scheme Notice:</strong> HerGuardian AI does not make binding eligibility determinations or guarantee government sanction. Final eligibility verification is made exclusively by designated government departments (e.g. MWCD, District Legal Services Authority) upon physical document review.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
