import { motion } from 'framer-motion';
import {
  ShieldAlert,
  Users,
  FileText,
  BookmarkCheck,
  Search,
  Scale,
  PhoneCall,
  ArrowRight,
  CheckCircle2,
  Lock,
  MessageSquare,
  HelpCircle,
  FileCheck
} from 'lucide-react';
import { verifiedHelplines } from '../../../data/rightsDirectoryData';

export default function CommunityHomeTab({ onSelectTab, casesCount = 0, recentCases = [] }) {
  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <div className="rounded-2xl border border-[#EDE6E2] bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-md bg-[#F6EFEA] px-3 py-1 text-xs font-semibold text-[#8C3737]">
              <Scale className="h-3.5 w-3.5" />
              <span>Interactive Support, Rights Advocacy &amp; Mutual Care</span>
            </div>
            <h1 className="font-serif text-2xl font-bold tracking-tight text-[#1E1B18] sm:text-3xl lg:text-4xl">
              Community &amp; Rights Support Centre
            </h1>
            <p className="text-xs sm:text-sm leading-relaxed text-[#4F4A45]">
              Understand your rights under verified statutory laws, draft formal complaints with step-by-step guidance, track personal cases in an encrypted workspace, and exchange mutual support with peers.
            </p>
          </div>

          {/* Emergency SOS Callout */}
          <div className="rounded-xl border border-[#F0D5D5] bg-[#FFF8F8] p-4 lg:w-80 shrink-0">
            <div className="flex items-center gap-2 text-[#BA2626] font-semibold text-xs mb-2">
              <ShieldAlert className="h-4 w-4" />
              <span>Urgent Distress or Danger?</span>
            </div>
            <p className="text-[11px] text-[#7A3E3E] leading-relaxed mb-3">
              If you are in immediate physical danger, dial 112 or the 24/7 National Women Helpline 181 immediately.
            </p>
            <div className="flex items-center gap-2">
              <a
                href="tel:181"
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#BA2626] px-3 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#9B1C1C] transition-colors"
              >
                <PhoneCall className="h-3.5 w-3.5" /> Call 181
              </a>
              <a
                href="tel:112"
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#F0D5D5] bg-white px-3 py-2 text-xs font-bold text-[#BA2626] hover:bg-[#FDF2F2] transition-colors"
              >
                <PhoneCall className="h-3.5 w-3.5" /> Call 112
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Action Pathways Grid */}
      <div>
        <h2 className="font-serif text-lg font-bold text-[#1E1B18] mb-4">
          How can we support you today?
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Action 1 */}
          <motion.div
            whileHover={{ y: -3 }}
            onClick={() => onSelectTab('assistant')}
            className="cursor-pointer rounded-xl border border-[#EDE6E2] bg-white p-5 shadow-xs hover:border-[#8C3737]/40 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F6EFEA] text-[#8C3737] mb-3">
                <Scale className="h-5 w-5" />
              </div>
              <h3 className="font-serif text-base font-semibold text-[#1E1B18]">
                Get Help With an Issue
              </h3>
              <p className="mt-1 text-xs text-[#78726B] leading-relaxed">
                Step-by-step guidance for workplace disputes, harassment, salary issues, and legal aid.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#EDE6E2] flex items-center text-xs font-semibold text-[#8C3737]">
              <span>Explore My Options</span>
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </div>
          </motion.div>

          {/* Action 2 */}
          <motion.div
            whileHover={{ y: -3 }}
            onClick={() => onSelectTab('complaint')}
            className="cursor-pointer rounded-xl border border-[#EDE6E2] bg-white p-5 shadow-xs hover:border-[#8C3737]/40 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F6EFEA] text-[#8C3737] mb-3">
                <FileText className="h-5 w-5" />
              </div>
              <h3 className="font-serif text-base font-semibold text-[#1E1B18]">
                Prepare Complaint / Letter
              </h3>
              <p className="mt-1 text-xs text-[#78726B] leading-relaxed">
                Generate formal POSH grievance, wage demand, cyber report, or legal aid letter drafts.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#EDE6E2] flex items-center text-xs font-semibold text-[#8C3737]">
              <span>Start Drafting</span>
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </div>
          </motion.div>

          {/* Action 3 */}
          <motion.div
            whileHover={{ y: -3 }}
            onClick={() => onSelectTab('directory')}
            className="cursor-pointer rounded-xl border border-[#EDE6E2] bg-white p-5 shadow-xs hover:border-[#8C3737]/40 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F6EFEA] text-[#8C3737] mb-3">
                <Search className="h-5 w-5" />
              </div>
              <h3 className="font-serif text-base font-semibold text-[#1E1B18]">
                Find Support Near Me
              </h3>
              <p className="mt-1 text-xs text-[#78726B] leading-relaxed">
                Search verified helplines, free legal aid cells, shelters, counseling, and accredited NGOs.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#EDE6E2] flex items-center text-xs font-semibold text-[#8C3737]">
              <span>Search Directory</span>
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </div>
          </motion.div>

          {/* Action 4 */}
          <motion.div
            whileHover={{ y: -3 }}
            onClick={() => onSelectTab('circles')}
            className="cursor-pointer rounded-xl border border-[#EDE6E2] bg-white p-5 shadow-xs hover:border-[#8C3737]/40 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F6EFEA] text-[#8C3737] mb-3">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="font-serif text-base font-semibold text-[#1E1B18]">
                Community Support Circles
              </h3>
              <p className="mt-1 text-xs text-[#78726B] leading-relaxed">
                Join safe, moderated discussions with peers on student life, career, and personal safety.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#EDE6E2] flex items-center text-xs font-semibold text-[#8C3737]">
              <span>Visit Circles</span>
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Personal Case Tracker Snapshot & Features Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: My Cases & Action Plans */}
        <div className="lg:col-span-2 rounded-2xl border border-[#EDE6E2] bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[#EDE6E2]">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#F6EFEA] text-[#8C3737]">
                  <BookmarkCheck className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-serif text-base font-bold text-[#1E1B18]">
                    My Private Cases &amp; Action Plans
                  </h3>
                  <p className="text-xs text-[#78726B]">
                    Strictly confidential to your account. Never posted to community.
                  </p>
                </div>
              </div>
              <button
                onClick={() => onSelectTab('tracker')}
                className="text-xs font-semibold text-[#8C3737] hover:underline flex items-center gap-1"
              >
                <span>View All ({casesCount})</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            {/* Cases Content */}
            <div className="mt-4">
              {recentCases.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#EDE6E2] bg-[#FBF9F7] p-6 text-center">
                  <Lock className="mx-auto h-8 w-8 text-[#A8A29E] mb-2" />
                  <p className="text-xs font-semibold text-[#1E1B18]">No Active Cases Yet</p>
                  <p className="mt-1 text-xs text-[#78726B] max-w-sm mx-auto">
                    Use the Rights Assistant or Complaint Builder to save structured action plans and private task checklists.
                  </p>
                  <button
                    onClick={() => onSelectTab('tracker')}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#8C3737] px-4 py-2 text-xs font-semibold text-white hover:bg-[#752B2B] transition-colors"
                  >
                    Open Case Tracker
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentCases.slice(0, 3).map((c) => (
                    <div
                      key={c._id}
                      onClick={() => onSelectTab('tracker')}
                      className="cursor-pointer rounded-xl border border-[#EDE6E2] bg-[#FBF9F7] p-3.5 hover:border-[#8C3737]/40 transition-colors flex items-center justify-between"
                    >
                      <div>
                        <p className="text-xs font-semibold text-[#1E1B18]">{c.title}</p>
                        <div className="mt-1 flex items-center gap-2 text-[11px] text-[#78726B]">
                          <span className="capitalize">{c.category}</span>
                          <span>•</span>
                          <span>{c.tasks?.length || 0} Tasks</span>
                        </div>
                      </div>
                      <span className="rounded-md bg-white border border-[#EDE6E2] px-2.5 py-1 text-[10px] font-semibold text-[#8C3737] uppercase tracking-wider">
                        {c.status.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#EDE6E2] flex flex-wrap items-center justify-between gap-3 text-xs text-[#78726B]">
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#286646]" /> Zero public exposure
            </span>
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#286646]" /> Milestone reminders
            </span>
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#286646]" /> Evidence checklist
            </span>
          </div>
        </div>

        {/* Right Col: Interactive Utilities */}
        <div className="rounded-2xl border border-[#EDE6E2] bg-white p-6 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="font-serif text-base font-bold text-[#1E1B18]">
              Interactive Tool Suites
            </h3>
            
            <div
              onClick={() => onSelectTab('navigator')}
              className="cursor-pointer rounded-xl border border-[#EDE6E2] bg-[#FBF9F7] p-3.5 hover:border-[#8C3737]/40 transition-all flex items-start gap-3"
            >
              <div className="rounded-lg bg-white p-2 border border-[#EDE6E2] text-[#8C3737]">
                <FileCheck className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#1E1B18]">Scheme Eligibility Navigator</p>
                <p className="text-[11px] text-[#78726B] mt-0.5">Check qualification for maternity, hostels, and legal aid.</p>
              </div>
            </div>

            <div
              onClick={() => onSelectTab('decoder')}
              className="cursor-pointer rounded-xl border border-[#EDE6E2] bg-[#FBF9F7] p-3.5 hover:border-[#8C3737]/40 transition-all flex items-start gap-3"
            >
              <div className="rounded-lg bg-white p-2 border border-[#EDE6E2] text-[#8C3737]">
                <HelpCircle className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#1E1B18]">Document Decoder</p>
                <p className="text-[11px] text-[#78726B] mt-0.5">Translate institutional notices into plain English &amp; deadlines.</p>
              </div>
            </div>

            <div
              onClick={() => onSelectTab('talk')}
              className="cursor-pointer rounded-xl border border-[#EDE6E2] bg-[#FBF9F7] p-3.5 hover:border-[#8C3737]/40 transition-all flex items-start gap-3"
            >
              <div className="rounded-lg bg-white p-2 border border-[#EDE6E2] text-[#8C3737]">
                <MessageSquare className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#1E1B18]">Difficult Conversation Helper</p>
                <p className="text-[11px] text-[#78726B] mt-0.5">Prepare calm, assertive speaking points and email replies.</p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#EDE6E2]">
            <button
              onClick={() => onSelectTab('library')}
              className="w-full text-center text-xs font-semibold text-[#8C3737] hover:underline"
            >
              Explore Knowledge &amp; Rights Library →
            </button>
          </div>
        </div>
      </div>

      {/* Verified Statutory Helplines Bar */}
      <div className="rounded-2xl border border-[#EDE6E2] bg-white p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <div>
            <h3 className="font-serif text-base font-bold text-[#1E1B18]">
              Statutory 24/7 National Emergency Helplines
            </h3>
            <p className="text-xs text-[#78726B]">
              Verified governmental hotlines with zero fee and priority intervention.
            </p>
          </div>
          <button
            onClick={() => onSelectTab('directory')}
            className="text-xs font-semibold text-[#8C3737] hover:underline"
          >
            Full Directory ({verifiedHelplines.length}+)
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {verifiedHelplines.slice(0, 3).map((hl) => (
            <div
              key={hl.id}
              className="rounded-xl border border-[#EDE6E2] bg-[#FBF9F7] p-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-md bg-white border border-[#EDE6E2] px-2 py-0.5 text-[10px] font-semibold text-[#8C3737]">
                    {hl.hours}
                  </span>
                  <span className="text-[11px] font-bold text-[#286646]">Verified</span>
                </div>
                <h4 className="font-serif text-sm font-semibold text-[#1E1B18] mt-2">
                  {hl.name}
                </h4>
                <p className="text-xs text-[#78726B] mt-1 leading-relaxed line-clamp-2">
                  {hl.purpose}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#EDE6E2] flex items-center justify-between">
                <span className="font-mono text-base font-bold text-[#8C3737]">{hl.number}</span>
                <a
                  href={`tel:${hl.number}`}
                  className="inline-flex items-center gap-1 rounded-md bg-[#8C3737] px-3 py-1 text-xs font-semibold text-white hover:bg-[#752B2B] transition-colors"
                >
                  <PhoneCall className="h-3 w-3" /> Call
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
