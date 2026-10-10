import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  GraduationCap, Map, Lightbulb, BookOpen, Briefcase, ClipboardList,
  Plus, Trash2, Check, ChevronDown, ChevronRight,
  CheckCircle2, Circle, Sparkles, ArrowRight, Star
} from "lucide-react";

import LoadingSpinner from "../../components/common/LoadingSpinner";
import { getRoadmaps, createRoadmap, toggleRoadmapTask, deleteRoadmap, getSavedOpportunities, saveOpportunity, updateOpportunity, removeOpportunity } from "../../services/careerEnhancedService";

/* ── theme tokens ── */
const C = {
  brand: "#8C3737", brandBg: "#F6EFEA", brandLight: "#FBF9F7",
  ink: "#1E1B18", muted: "#4F4A45", faint: "#78726B",
  border: "#EDE6E2", success: "#2D6A4F", successBg: "#D8F3DC",
};

const TABS = [
  { id: "roadmap",      label: "Career Roadmap",    icon: Map },
  { id: "skills",       label: "Skill Gap Analyzer", icon: Lightbulb },
  { id: "resume",       label: "Resume Tips",        icon: BookOpen },
  { id: "opportunities",label: "Opportunities",      icon: Briefcase },
  { id: "tracker",      label: "Application Tracker",icon: ClipboardList },
];

/* ─────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────── */
export default function Career() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = useMemo(() => {
    const t = searchParams.get("tab");
    return TABS.find(x => x.id === t) ? t : "roadmap";
  }, [searchParams]);
  const setTab = id => setSearchParams({ tab: id });

  return (
    <div className="min-h-screen space-y-6" style={{ color: C.ink }}>
      <div className="mx-auto max-w-6xl space-y-6">

        {/* Header */}
        <div className="rounded-xl border bg-white p-6 sm:p-8 shadow-xs" style={{ borderColor: C.border }}>
          <div className="mb-2 inline-flex items-center gap-2 rounded-md px-2.5 py-1 text-xs font-semibold"
            style={{ background: C.brandBg, color: C.brand }}>
            <GraduationCap className="h-3.5 w-3.5" />
            <span>Executive &amp; Academic Acceleration</span>
          </div>
          <h1 className="font-serif text-2xl font-bold tracking-tight sm:text-3xl">Career Advancement &amp; Grants</h1>
          <p className="mt-1 text-xs sm:text-sm" style={{ color: C.muted }}>
            Curated fellowships, AI-powered roadmaps, skill gap analysis, and application tracking — all for women.
          </p>
        </div>

        {/* Tabs */}
        <div className="rounded-xl border bg-white p-2 shadow-xs" style={{ borderColor: C.border }}>
          <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0">
            {TABS.map(({ id, label, icon: Icon }) => {
              const active = activeTab === id;
              return (
                <button key={id} onClick={() => setTab(id)}
                  className="flex items-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors"
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
          {activeTab === "roadmap"       && <RoadmapTab />}
          {activeTab === "skills"        && <SkillGapTab />}
          {activeTab === "resume"        && <ResumeTipsTab />}
          {activeTab === "opportunities" && <OpportunitiesTab />}
          {activeTab === "tracker"       && <TrackerTab />}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   TAB: CAREER ROADMAP
───────────────────────────────────────────────────────── */
const ROADMAP_STAGES = {
  "Software Engineer": [
    { title: "Foundation (0–3 months)", tasks: ["Learn Python / JavaScript basics","Complete CS50 or equivalent MOOC","Build 2 small projects","Set up GitHub profile"] },
    { title: "Intermediate Skills (3–6 months)", tasks: ["Learn a framework (React / Django)","Study Data Structures & Algorithms","Contribute to open source","Create a portfolio site"] },
    { title: "Job Ready (6–12 months)", tasks: ["Apply for internships / entry roles","Practice LeetCode (50+ problems)","Network on LinkedIn","Prepare system design basics"] },
  ],
  "Data Scientist": [
    { title: "Statistics & Python (0–3 months)", tasks: ["Learn statistics fundamentals","Master pandas & numpy","Complete Kaggle Learn tracks","Understand probability"] },
    { title: "ML Fundamentals (3–6 months)", tasks: ["Study scikit-learn","Complete Andrew Ng's ML course","Build 2 ML projects","Learn data visualization"] },
    { title: "Specialisation (6–12 months)", tasks: ["Deep Learning (Fast.ai or TF)","Kaggle competitions","Build a Capstone project","Apply to data roles"] },
  ],
  "UX Designer": [
    { title: "Design Basics (0–2 months)", tasks: ["Learn Figma","Study UX principles (Nielsen)","Complete Google UX Design cert","Analyse 5 apps you use daily"] },
    { title: "Portfolio Building (2–6 months)", tasks: ["Design 3 case studies","Conduct user research","Learn Usability Testing","Build portfolio on Behance"] },
    { title: "Industry Ready (6–12 months)", tasks: ["Freelance 2–3 projects","Apply to junior UX roles","Practice mock interviews","Build on LinkedIn"] },
  ],
};

function RoadmapTab() {
  const [roadmaps, setRoadmaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [form, setForm] = useState({ careerGoal: "", educationLevel: "", currentSkills: "", availableHoursPerWeek: "", learningPace: "moderate", budget: "free" });
  const [generating, setGenerating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await getRoadmaps(); setRoadmaps(r.roadmaps || []); }
    catch { toast.error("Could not load roadmaps."); }
    finally { setLoading(false); }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!form.careerGoal.trim()) return toast.error("Please enter your career goal.");
    setGenerating(true);

    // Find matching template or use generic
    const match = Object.keys(ROADMAP_STAGES).find(k => form.careerGoal.toLowerCase().includes(k.toLowerCase()));
    const stageTemplate = ROADMAP_STAGES[match] || [
      { title: "Explore & Research (0–2 months)", tasks: ["Research the field thoroughly","Identify 3 role models","Find free learning resources","Define your 1-year goal"] },
      { title: "Skill Building (2–6 months)", tasks: ["Complete a foundational course","Build a small project","Join a relevant community","Seek a mentor"] },
      { title: "Launch (6–12 months)", tasks: ["Build a portfolio","Apply for roles or internships","Network actively","Iterate based on feedback"] },
    ];

    const stages = stageTemplate.map((s, i) => ({
      title: s.title, order: i,
      description: `Stage ${i + 1} of your journey towards becoming a ${form.careerGoal}.`,
      tasks: s.tasks.map(t => ({ title: t, completed: false })),
    }));

    const hoursNote = form.availableHoursPerWeek ? `${form.availableHoursPerWeek} hrs/week, ` : "";
    const roadmapContent = `Personalised roadmap for: ${form.careerGoal}. ${hoursNote}${form.learningPace} pace, ${form.budget} budget. Education: ${form.educationLevel || "not specified"}. Current skills: ${form.currentSkills || "beginner"}.`;

    try {
      await createRoadmap({ ...form, stages, roadmapContent });
      toast.success("Roadmap created!");
      setShowForm(false);
      setForm({ careerGoal: "", educationLevel: "", currentSkills: "", availableHoursPerWeek: "", learningPace: "moderate", budget: "free" });
      await load();
    } catch (err) { toast.error(err.response?.data?.message || "Failed to create roadmap."); }
    finally { setGenerating(false); }
  };

  const handleTaskToggle = async (roadmap, stageIndex, taskIndex, completed) => {
    try {
      await toggleRoadmapTask(roadmap._id, stageIndex, taskIndex, completed);
      setRoadmaps(prev => prev.map(r => {
        if (r._id !== roadmap._id) return r;
        const stages = r.stages.map((s, si) => si !== stageIndex ? s : {
          ...s, tasks: s.tasks.map((t, ti) => ti !== taskIndex ? t : { ...t, completed })
        });
        return { ...r, stages };
      }));
    } catch { toast.error("Could not update task."); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this roadmap?")) return;
    try { await deleteRoadmap(id); toast.success("Deleted."); await load(); }
    catch { toast.error("Could not delete."); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-xl font-bold" style={{ color: C.ink }}>Career Roadmaps</h2>
          <p className="text-sm mt-0.5" style={{ color: C.muted }}>Structured step-by-step plans for your career goal.</p>
        </div>
        <button onClick={() => setShowForm(s => !s)}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
          style={{ background: C.brand }}>
          <Plus className="h-3.5 w-3.5" /> Create Roadmap
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleGenerate} className="rounded-xl border p-5 space-y-4"
          style={{ borderColor: C.brand, background: C.brandBg }}>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-4 w-4" style={{ color: C.brand }} />
            <h3 className="font-semibold text-sm" style={{ color: C.brand }}>Generate Your Roadmap</h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium mb-1" style={{ color: C.muted }}>Career Goal *</label>
              <input type="text" required value={form.careerGoal} placeholder="e.g. Software Engineer, Data Scientist, UX Designer"
                onChange={e => setForm(f => ({ ...f, careerGoal: e.target.value }))}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none"
                style={{ borderColor: C.border }} />
            </div>
            {[
              { label: "Education Level", key: "educationLevel", placeholder: "e.g. 12th, Bachelors, Masters" },
              { label: "Current Skills", key: "currentSkills", placeholder: "e.g. Basic Python, Excel" },
              { label: "Hours/Week Available", key: "availableHoursPerWeek", placeholder: "e.g. 10", type: "number" },
            ].map(({ label, key, placeholder, type }) => (
              <div key={key}>
                <label className="block text-xs font-medium mb-1" style={{ color: C.muted }}>{label}</label>
                <input type={type || "text"} value={form[key]} placeholder={placeholder}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none"
                  style={{ borderColor: C.border }} />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: C.muted }}>Learning Pace</label>
              <select value={form.learningPace} onChange={e => setForm(f => ({ ...f, learningPace: e.target.value }))}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none" style={{ borderColor: C.border }}>
                <option value="slow">Slow &amp; Steady</option>
                <option value="moderate">Moderate</option>
                <option value="intensive">Intensive</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: C.muted }}>Budget</label>
              <select value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none" style={{ borderColor: C.border }}>
                <option value="free">Free resources only</option>
                <option value="low">Low (under ₹2,000)</option>
                <option value="moderate">Moderate (₹2K–₹10K)</option>
                <option value="flexible">Flexible</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowForm(false)}
              className="rounded-lg border px-4 py-2 text-xs font-medium" style={{ borderColor: C.border, color: C.muted }}>Cancel</button>
            <button type="submit" disabled={generating}
              className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold text-white"
              style={{ background: C.brand }}>
              <Sparkles className="h-3.5 w-3.5" />{generating ? "Generating…" : "Generate Roadmap"}
            </button>
          </div>
        </form>
      )}

      {loading ? <LoadingSpinner label="Loading roadmaps…" /> : roadmaps.length === 0 ? (
        <div className="py-12 flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full" style={{ background: C.brandBg }}>
            <Map className="h-6 w-6" style={{ color: C.brand }} />
          </div>
          <p className="text-sm max-w-xs" style={{ color: C.muted }}>No roadmaps yet. Create one to start your structured career journey!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {roadmaps.map(r => {
            const expanded = expandedId === r._id;
            const totalTasks = r.stages?.reduce((acc, s) => acc + (s.tasks?.length || 0), 0) || 0;
            const doneTasks = r.stages?.reduce((acc, s) => acc + (s.tasks?.filter(t => t.completed).length || 0), 0) || 0;
            const pct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
            return (
              <div key={r._id} className="rounded-xl border overflow-hidden" style={{ borderColor: C.border }}>
                <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-[#FAFAFA]"
                  onClick={() => setExpandedId(expanded ? null : r._id)}>
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm" style={{ color: C.ink }}>{r.careerGoal}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex-1 h-1.5 rounded-full" style={{ background: C.brandBg, maxWidth: 120 }}>
                        <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: C.brand }} />
                      </div>
                      <span className="text-xs" style={{ color: C.faint }}>{doneTasks}/{totalTasks} tasks · {pct}%</span>
                    </div>
                  </div>
                  <button onClick={e => { e.stopPropagation(); handleDelete(r._id); }}
                    className="p-1.5 rounded-lg" style={{ color: C.faint }} title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                  {expanded ? <ChevronDown className="h-4 w-4" style={{ color: C.faint }} /> : <ChevronRight className="h-4 w-4" style={{ color: C.faint }} />}
                </div>
                {expanded && (
                  <div className="border-t px-4 pb-4 pt-3 space-y-4" style={{ borderColor: C.border }}>
                    {r.stages?.map((stage, si) => (
                      <div key={si}>
                        <h4 className="font-semibold text-xs mb-2" style={{ color: C.brand }}>{stage.title}</h4>
                        <div className="space-y-1.5">
                          {stage.tasks?.map((task, ti) => (
                            <label key={ti} className="flex items-start gap-2 cursor-pointer">
                              <button onClick={() => handleTaskToggle(r, si, ti, !task.completed)}
                                className="mt-0.5 shrink-0">
                                {task.completed
                                  ? <CheckCircle2 className="h-4 w-4" style={{ color: C.success }} />
                                  : <Circle className="h-4 w-4" style={{ color: C.faint }} />}
                              </button>
                              <span className="text-sm" style={{ color: task.completed ? C.faint : C.ink, textDecoration: task.completed ? "line-through" : "none" }}>
                                {task.title}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
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

/* ─────────────────────────────────────────────────────────
   TAB: SKILL GAP ANALYZER
───────────────────────────────────────────────────────── */
const ROLE_SKILLS = {
  "software engineer": { required: ["Python / JavaScript","Data Structures","Git","REST APIs","Testing","Linux Basics","SQL"], nice: ["Cloud (AWS/GCP)","Docker","System Design"] },
  "data scientist": { required: ["Python","Statistics","Machine Learning","pandas","SQL","Data Visualisation","Jupyter"], nice: ["Deep Learning","Spark","MLOps"] },
  "ux designer": { required: ["Figma","User Research","Wireframing","Prototyping","Usability Testing","Information Architecture"], nice: ["Motion Design","HTML/CSS basics","Accessibility"] },
  "product manager": { required: ["Roadmapping","User Stories","Data Analysis","Stakeholder Communication","Prioritization","Agile/Scrum"], nice: ["SQL","A/B Testing","OKRs"] },
  "digital marketer": { required: ["SEO","Google Ads","Social Media","Content Marketing","Email Marketing","Analytics","Copywriting"], nice: ["Canva","Meta Ads","CRO"] },
};

function SkillGapTab() {
  const [targetRole, setTargetRole] = useState("");
  const [currentSkillsInput, setCurrentSkillsInput] = useState("");
  const [result, setResult] = useState(null);

  const analyze = () => {
    if (!targetRole.trim()) return toast.error("Enter a target role.");
    const normRole = targetRole.toLowerCase().trim();
    const match = Object.keys(ROLE_SKILLS).find(k => normRole.includes(k));
    if (!match) {
      toast("We don't have a template for that role yet. Try: Software Engineer, Data Scientist, UX Designer, Product Manager, or Digital Marketer.", { icon: "💡" });
      return;
    }
    const { required, nice } = ROLE_SKILLS[match];
    const userSkills = currentSkillsInput.toLowerCase();
    const gaps = required.filter(s => !userSkills.includes(s.toLowerCase().split("/")[0].trim()));
    const niceGaps = nice.filter(s => !userSkills.includes(s.toLowerCase().split("(")[0].trim()));
    const haveAlready = required.filter(s => !gaps.includes(s));
    setResult({ role: targetRole, required, nice, gaps, niceGaps, haveAlready });
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-serif text-xl font-bold" style={{ color: C.ink }}>Skill Gap Analyzer</h2>
        <p className="text-sm mt-0.5" style={{ color: C.muted }}>Discover exactly what skills you need for your target role.</p>
      </div>
      <div className="rounded-xl border p-5 space-y-4" style={{ borderColor: C.border, background: C.brandLight }}>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: C.muted }}>Target Role</label>
          <input type="text" value={targetRole} onChange={e => setTargetRole(e.target.value)}
            placeholder="e.g. Software Engineer, Data Scientist, UX Designer"
            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none"
            style={{ borderColor: C.border }} />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: C.muted }}>Your Current Skills (comma-separated)</label>
          <textarea rows={3} value={currentSkillsInput} onChange={e => setCurrentSkillsInput(e.target.value)}
            placeholder="e.g. Python, Excel, HTML, Figma basics, communication"
            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none resize-none"
            style={{ borderColor: C.border }} />
        </div>
        <button onClick={analyze}
          className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white"
          style={{ background: C.brand }}>
          <Lightbulb className="h-4 w-4" /> Analyze My Gaps
        </button>
      </div>

      {result && (
        <div className="space-y-4">
          <h3 className="font-semibold text-sm" style={{ color: C.ink }}>Results for: <span style={{ color: C.brand }}>{result.role}</span></h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <SkillBox title="✅ You Already Have" skills={result.haveAlready} color={C.success} bg={C.successBg} />
            <SkillBox title="⚠️ Gaps to Fill (Priority)" skills={result.gaps} color="#BA2626" bg="#FDF2F2" />
            <SkillBox title="⭐ Nice to Have" skills={result.niceGaps} color={C.brand} bg={C.brandBg} />
          </div>
          {result.gaps.length === 0 && (
            <div className="rounded-lg p-4 text-sm" style={{ background: C.successBg, color: C.success }}>
              🎉 Impressive! You already have all the core skills for this role. Focus on the nice-to-haves and apply!
            </div>
          )}
          {result.gaps.length > 0 && (
            <div className="rounded-lg p-4 text-sm" style={{ background: C.brandBg, color: C.brand }}>
              💡 Tip: Focus on the Priority gaps first using free resources like Coursera, YouTube, and documentation. Then build a project to demonstrate each skill.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SkillBox({ title, skills, color, bg }) {
  return (
    <div className="rounded-xl border p-4" style={{ borderColor: color + "44", background: bg }}>
      <h4 className="font-semibold text-xs mb-3" style={{ color }}>{title}</h4>
      {skills.length === 0
        ? <p className="text-xs" style={{ color }}>None</p>
        : <ul className="space-y-1">{skills.map(s => (
          <li key={s} className="flex items-center gap-1.5 text-xs" style={{ color }}>
            <ArrowRight className="h-3 w-3 shrink-0" />{s}
          </li>
        ))}</ul>}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   TAB: RESUME TIPS
───────────────────────────────────────────────────────── */
const RESUME_SECTIONS = [
  { icon: "📋", title: "ATS Optimisation", tips: ["Use keywords from the job description verbatim","Avoid tables, columns, and graphics — they confuse parsers","Save as a standard PDF or .docx","Use standard section headings: Experience, Education, Skills"] },
  { icon: "✨", title: "Powerful Action Verbs", tips: ["Start each bullet with a strong verb: Led, Built, Increased, Designed, Reduced","Avoid weak phrases like 'Responsible for' or 'Helped with'","Use present tense for current roles, past for previous ones","Examples: Engineered, Spearheaded, Orchestrated, Delivered, Mentored"] },
  { icon: "📊", title: "Quantify Achievements", tips: ["Add numbers wherever possible: 'Reduced load time by 40%'","Show scale: '5-person team', '10,000 users', '₹2 crore budget'","Use percentages, time saved, cost reduced, revenue generated","If no hard number, use a range: 'approx. 3x improvement'"] },
  { icon: "🎯", title: "Tailoring Your Resume", tips: ["Customise your resume for every application — at minimum the summary","Mirror language from the job description","Lead with your most relevant experience for each role","Keep it to 1 page if under 5 years of experience"] },
  { icon: "👩‍💼", title: "Women-Specific Tips", tips: ["Include leadership and volunteer roles — these count","Don't downplay soft skills like negotiation, team management, mentoring","Career gaps are acceptable — frame them positively (parental leave, caregiving, upskilling)","Use your full name — studies show name bias; initials can sometimes help"] },
  { icon: "🔗", title: "Portfolio & Online Presence", tips: ["Always include a LinkedIn URL (customise it to your name)","Add GitHub, Behance, or portfolio links relevant to the role","Ensure your LinkedIn matches your resume exactly","A well-maintained GitHub is worth more than most certifications for tech roles"] },
];

function ResumeTipsTab() {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-serif text-xl font-bold" style={{ color: C.ink }}>Resume &amp; Portfolio Tips</h2>
        <p className="text-sm mt-0.5" style={{ color: C.muted }}>Practical, research-backed advice to make your resume stand out.</p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        {RESUME_SECTIONS.map(({ icon, title, tips }) => (
          <div key={title} className="rounded-xl border p-5" style={{ borderColor: C.border, background: C.brandLight }}>
            <div className="text-2xl mb-2">{icon}</div>
            <h3 className="font-semibold text-sm mb-3" style={{ color: C.ink }}>{title}</h3>
            <ul className="space-y-2">
              {tips.map(t => (
                <li key={t} className="flex items-start gap-2 text-xs" style={{ color: C.muted }}>
                  <Check className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: C.brand }} />{t}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   TAB: OPPORTUNITIES
───────────────────────────────────────────────────────── */
const OPPORTUNITIES_DATA = [
  { id: "op1", title: "Google Women Techmakers Scholars Program", organization: "Google", type: "scholarship", amount: "₹83,000+", deadline: "December 2025", url: "https://developers.google.com/womentechmakers/scholars", tags: ["Tech", "STEM", "Undergraduate"] },
  { id: "op2", title: "Anita Borg Scholarship (ABI)", organization: "AnitaB.org", type: "scholarship", amount: "₹2.5L+", deadline: "January 2026", url: "https://anitab.org/scholarships-awards/", tags: ["Tech", "Graduate", "Leadership"] },
  { id: "op3", title: "Teach For India Fellowship", organization: "Teach For India", type: "fellowship", amount: "₹25,000/month", deadline: "Rolling", url: "https://www.teachforindia.org/fellowship", tags: ["Education", "Social Impact", "Leadership"] },
  { id: "op4", title: "Outreachy Open Source Internship", organization: "Software Freedom Conservancy", type: "internship", amount: "USD $7,000", deadline: "Bi-annual", url: "https://www.outreachy.org", tags: ["Open Source", "Remote", "Tech"] },
  { id: "op5", title: "Palantir Women in Technology Fellowship", organization: "Palantir", type: "fellowship", amount: "USD $7,000", deadline: "Autumn", url: "https://www.palantir.com/careers/fellowships/wit/", tags: ["Tech", "Data", "Engineering"] },
  { id: "op6", title: "Adobe Research Women-in-Technology Scholarship", organization: "Adobe", type: "scholarship", amount: "USD $10,000", deadline: "Annual", url: "https://research.adobe.com/scholarship/", tags: ["Design", "Tech", "Research"] },
  { id: "op7", title: "Nasscom Foundation Digital Opportunities", organization: "Nasscom Foundation", type: "program", amount: "Varies", deadline: "Rolling", url: "https://nasscomfoundation.org/", tags: ["Digital Skills", "India", "Women"] },
  { id: "op8", title: "Indian School of Business (ISB) Women's Scholarship", organization: "ISB", type: "scholarship", amount: "Up to ₹10L", deadline: "February 2026", url: "https://www.isb.edu/en/study-isb/post-graduate-programme.html", tags: ["MBA", "Business", "Leadership"] },
];

function OpportunitiesTab() {
  const [saved, setSaved] = useState([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    getSavedOpportunities().then(r => setSaved((r.opportunities || []).map(o => o.opportunityId))).catch(() => {});
  }, []);

  const handleSave = async (opp) => {
    const alreadySaved = saved.includes(opp.id);
    if (alreadySaved) return toast("Already saved. Manage it in the Application Tracker.", { icon: "📌" });
    try {
      await saveOpportunity({ opportunityId: opp.id, title: opp.title, organization: opp.organization, type: opp.type, applicationUrl: opp.url });
      setSaved(prev => [...prev, opp.id]);
      toast.success("Saved to Application Tracker!");
    } catch { toast.error("Could not save opportunity."); }
  };

  const filtered = filter === "all" ? OPPORTUNITIES_DATA : OPPORTUNITIES_DATA.filter(o => o.type === filter);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-xl font-bold" style={{ color: C.ink }}>Opportunities</h2>
          <p className="text-sm mt-0.5" style={{ color: C.muted }}>Scholarships, fellowships &amp; internships for women.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {["all","scholarship","fellowship","internship","program"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="rounded-full px-3 py-1 text-xs font-medium transition-colors capitalize"
              style={filter === f ? { background: C.brand, color: "#fff" } : { background: C.brandBg, color: C.brand }}>
              {f === "all" ? "All" : f}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {filtered.map(opp => {
          const isSaved = saved.includes(opp.id);
          return (
            <div key={opp.id} className="rounded-xl border p-5 flex flex-col gap-3"
              style={{ borderColor: C.border, background: C.brandLight }}>
              <div>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-serif text-sm font-semibold leading-snug" style={{ color: C.ink }}>{opp.title}</h3>
                  <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize"
                    style={{ background: C.brandBg, color: C.brand }}>{opp.type}</span>
                </div>
                <p className="text-xs" style={{ color: C.muted }}>{opp.organization}</p>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs" style={{ color: C.faint }}>
                <span>💰 {opp.amount}</span>
                <span>📅 {opp.deadline}</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {opp.tags.map(t => (
                  <span key={t} className="rounded-full px-2 py-0.5 text-[10px]"
                    style={{ background: "#F0F0F0", color: C.muted }}>{t}</span>
                ))}
              </div>
              <div className="flex gap-2 mt-auto">
                <a href={opp.url} target="_blank" rel="noopener noreferrer"
                  className="flex-1 rounded-lg border py-1.5 text-center text-xs font-medium transition hover:opacity-80"
                  style={{ borderColor: C.border, color: C.brand }}>Apply →</a>
                <button onClick={() => handleSave(opp)}
                  className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-white transition hover:opacity-90"
                  style={{ background: isSaved ? C.success : C.brand }}>
                  {isSaved ? <><CheckCircle2 className="h-3.5 w-3.5" /> Saved</> : <><Star className="h-3.5 w-3.5" /> Save</>}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   TAB: APPLICATION TRACKER
───────────────────────────────────────────────────────── */
const STATUS_LABELS = { interested: "Interested", preparing: "Preparing", applied: "Applied", result_received: "Result" };
const STATUS_COLORS = {
  interested: { bg: "#F6EFEA", color: "#8C3737" },
  preparing:  { bg: "#FFF8E1", color: "#B45309" },
  applied:    { bg: "#E8F4FD", color: "#1565C0" },
  result_received: { bg: "#D8F3DC", color: "#2D6A4F" },
};

function TrackerTab() {
  const [opps, setOpps] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await getSavedOpportunities(); setOpps(r.opportunities || []); }
    catch { toast.error("Could not load applications."); }
    finally { setLoading(false); }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const handleStatusChange = async (id, status) => {
    try {
      await updateOpportunity(id, { status });
      setOpps(prev => prev.map(o => o._id === id ? { ...o, status } : o));
      toast.success("Status updated.");
    } catch { toast.error("Could not update."); }
  };

  const handleRemove = async (id) => {
    if (!confirm("Remove this from tracker?")) return;
    try { await removeOpportunity(id); toast.success("Removed."); await load(); }
    catch { toast.error("Could not remove."); }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-serif text-xl font-bold" style={{ color: C.ink }}>Application Tracker</h2>
        <p className="text-sm mt-0.5" style={{ color: C.muted }}>Track your saved opportunities and application progress.</p>
      </div>
      {loading ? <LoadingSpinner label="Loading applications…" /> : opps.length === 0 ? (
        <div className="py-12 flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full" style={{ background: C.brandBg }}>
            <ClipboardList className="h-6 w-6" style={{ color: C.brand }} />
          </div>
          <p className="text-sm max-w-xs" style={{ color: C.muted }}>No saved applications yet. Browse <strong>Opportunities</strong> and save ones you're interested in.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {opps.map(o => {
            const s = STATUS_COLORS[o.status] || STATUS_COLORS.interested;
            return (
              <div key={o._id} className="rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center gap-3"
                style={{ borderColor: C.border }}>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm truncate" style={{ color: C.ink }}>{o.title}</h3>
                  <p className="text-xs" style={{ color: C.faint }}>{o.organization} · {o.type}</p>
                  {o.deadline && <p className="text-xs" style={{ color: C.faint }}>Deadline: {new Date(o.deadline).toLocaleDateString("en-IN")}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <select value={o.status} onChange={e => handleStatusChange(o._id, e.target.value)}
                    className="rounded-full px-3 py-1 text-xs font-semibold focus:outline-none border-0"
                    style={{ background: s.bg, color: s.color }}>
                    {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                  {o.applicationUrl && (
                    <a href={o.applicationUrl} target="_blank" rel="noopener noreferrer"
                      className="rounded-lg border px-2.5 py-1 text-xs font-medium"
                      style={{ borderColor: C.border, color: C.brand }}>Apply</a>
                  )}
                  <button onClick={() => handleRemove(o._id)} className="p-1.5 rounded-lg" style={{ color: C.faint }}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
