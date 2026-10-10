import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  GraduationCap, Map, Lightbulb, BookOpen,
  Plus, Trash2, Check, ChevronDown, ChevronRight,
  CheckCircle2, Circle, Sparkles, ArrowRight, Star, AlertTriangle,
  Compass, BookmarkCheck, Rocket, RefreshCw,
} from "lucide-react";

import LoadingSpinner from "../../components/common/LoadingSpinner";
import {
  getRoadmaps, createRoadmap, toggleRoadmapTask, deleteRoadmap,
  analyzeSkillGap,
} from "../../services/careerEnhancedService";

/* ── theme tokens ── */
const C = {
  brand: "#8C3737", brandBg: "#F6EFEA", brandLight: "#FBF9F7",
  ink: "#1E1B18", muted: "#4F4A45", faint: "#78726B",
  border: "#EDE6E2", success: "#2D6A4F", successBg: "#D8F3DC",
};

const TABS = [
  { id: "roadmap", label: "Career Roadmap",     icon: Map },
  { id: "skills",  label: "Skill Gap Analyzer", icon: Lightbulb },
  { id: "resume",  label: "Resume Tips",        icon: BookOpen },
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
            Career roadmaps, skill analysis, and resume guidance to help you plan your next step.
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
          {activeTab === "roadmap" && <RoadmapTab />}
          {activeTab === "skills"  && <SkillGapTab />}
          {activeTab === "resume"  && <ResumeTipsTab />}
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

/* ───────────────────────────────────────────────────────── */
const POPULAR_ROLE_SUGGESTIONS = [
  "Software Engineer",
  "AI Security Engineer",
  "Machine Learning Engineer",
  "Cloud Security Architect",
  "Data Scientist",
  "Bioinformatics Analyst",
  "Blockchain Developer",
  "Robotics Engineer",
  "Prompt Engineer",
  "AR/VR Developer",
  "Renewable Energy Analyst",
  "Technical Writer",
  "UX Designer",
  "Product Manager",
  "Digital Marketer",
];

function SkillGapTab() {
  const [targetRole, setTargetRole] = useState("");
  const [currentSkillsInput, setCurrentSkillsInput] = useState("");
  const [educationLevel, setEducationLevel] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("Entry-level / Switcher");
  const [careerGoal, setCareerGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const [savingRoadmap, setSavingRoadmap] = useState(false);
  const [result, setResult] = useState(null);
  const [showAdvancedProfile, setShowAdvancedProfile] = useState(false);

  const analyze = async () => {
    if (!targetRole.trim()) return toast.error("Please enter a target career role.");
    setLoading(true);
    try {
      const res = await analyzeSkillGap({
        targetRole: targetRole.trim(),
        currentSkills: currentSkillsInput,
        educationLevel,
        experienceLevel,
        careerGoal,
      });
      if (res.success && res.analysis) {
        setResult(res.analysis);
        toast.success(`Analysis ready for ${res.analysis.targetRole}!`);
      } else {
        toast.error(res.message || "Failed to analyze skill gap.");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to analyze skill gap. Please check your input.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToRoadmaps = async () => {
    if (!result || !result.learningRoadmap) return;
    setSavingRoadmap(true);
    try {
      const stages = result.learningRoadmap.map((st, idx) => ({
        title: st.stage,
        description: st.estimatedHours || "",
        tasks: (st.milestones || []).map((m) => ({ title: m, completed: false })),
        order: idx + 1,
      }));

      await createRoadmap({
        careerGoal: result.targetRole,
        educationLevel: educationLevel || "General",
        currentSkills: currentSkillsInput || "Not specified",
        roadmapContent: result.roleDescription || "",
        stages,
        notes: `Generated via Skill Gap Analyzer. Readiness: ${result.readinessAssessment?.score ?? 0}%.`,
      });

      toast.success(`Roadmap for ${result.targetRole} saved to your Career Roadmaps!`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save roadmap.");
    } finally {
      setSavingRoadmap(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="font-serif text-xl font-bold" style={{ color: C.ink }}>Skill Gap Analyzer</h2>
        <p className="text-sm mt-0.5" style={{ color: C.muted }}>
          Analyze any modern, specialized, or interdisciplinary career role against your personal skills and background.
        </p>
      </div>

      {/* Input Form Card */}
      <div className="rounded-xl border p-5 space-y-4" style={{ borderColor: C.border, background: C.brandLight }}>
        <div>
          <label className="block text-xs font-semibold mb-1" style={{ color: C.ink }}>
            Target Career Role <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            placeholder="e.g. AI Security Engineer, Bioinformatics Analyst, Cloud Architect, UX Designer"
            className="w-full rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none bg-white transition"
            style={{ borderColor: C.border }}
          />

          {/* Role Suggestion Chips */}
          <div className="mt-2.5">
            <span className="text-[11px] font-medium block mb-1.5" style={{ color: C.faint }}>
              Popular &amp; Emerging Career References:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_ROLE_SUGGESTIONS.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setTargetRole(role)}
                  className="rounded-full px-2.5 py-1 text-[11px] font-medium transition hover:opacity-80"
                  style={{
                    background: targetRole === role ? C.brand : "#EDE6E2",
                    color: targetRole === role ? "#fff" : C.ink,
                  }}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1" style={{ color: C.ink }}>
            Your Current Skills (comma-separated, optional)
          </label>
          <textarea
            rows={2}
            value={currentSkillsInput}
            onChange={(e) => setCurrentSkillsInput(e.target.value)}
            placeholder="e.g. Python, SQL, Git, Linux, problem solving, data analysis"
            className="w-full rounded-lg border px-3.5 py-2 text-sm focus:outline-none resize-none bg-white transition"
            style={{ borderColor: C.border }}
          />
          <p className="text-[11px] mt-1" style={{ color: C.faint }}>
            Leave blank for a general role benchmark, or include your actual skills for a tailored gap analysis.
          </p>
        </div>

        {/* Toggle Additional Profile Context */}
        <div>
          <button
            type="button"
            onClick={() => setShowAdvancedProfile((prev) => !prev)}
            className="text-xs font-medium inline-flex items-center gap-1 hover:underline"
            style={{ color: C.brand }}
          >
            {showAdvancedProfile ? "− Hide background details" : "+ Add background & goals (optional)"}
          </button>
        </div>

        {showAdvancedProfile && (
          <div className="grid gap-3 sm:grid-cols-3 pt-1 border-t" style={{ borderColor: C.border }}>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: C.muted }}>Education</label>
              <select
                value={educationLevel}
                onChange={(e) => setEducationLevel(e.target.value)}
                className="w-full rounded-lg border px-2.5 py-1.5 text-xs bg-white focus:outline-none"
                style={{ borderColor: C.border }}
              >
                <option value="">Not Specified</option>
                <option value="Self-Taught / Bootcamp">Self-Taught / Bootcamp</option>
                <option value="Bachelor's Degree">Bachelor's Degree</option>
                <option value="Master's Degree">Master's Degree</option>
                <option value="PhD / Research">PhD / Research</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: C.muted }}>Experience Level</label>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
                className="w-full rounded-lg border px-2.5 py-1.5 text-xs bg-white focus:outline-none"
                style={{ borderColor: C.border }}
              >
                <option value="Entry-level / Switcher">Entry-level / Switcher</option>
                <option value="1-3 Years Experience">1-3 Years Experience</option>
                <option value="3-5 Years Experience">3-5 Years Experience</option>
                <option value="Senior / Lead">Senior / Lead</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: C.muted }}>Primary Career Focus</label>
              <input
                type="text"
                value={careerGoal}
                onChange={(e) => setCareerGoal(e.target.value)}
                placeholder="e.g. Remote work, FAANG, startups"
                className="w-full rounded-lg border px-2.5 py-1.5 text-xs bg-white focus:outline-none"
                style={{ borderColor: C.border }}
              />
            </div>
          </div>
        )}

        <div>
          <button
            onClick={analyze}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-50"
            style={{ background: C.brand }}
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Analyzing Career Requirements…</span>
              </>
            ) : (
              <>
                <Lightbulb className="h-4 w-4" />
                <span>Analyze My Skill Gap</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Complete Skill Gap Report */}
      {result && (
        <div className="space-y-6 animate-fadeIn">
          {/* 1. Header Banner */}
          <div className="rounded-xl border p-5 bg-white shadow-xs" style={{ borderColor: C.border }}>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider"
                style={{ background: C.brandBg, color: C.brand }}
              >
                Target Role
              </span>
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-md"
                style={{
                  background: result.analysisSource === "ai" ? "#E0F2FE" : "#F3F4F6",
                  color: result.analysisSource === "ai" ? "#0369A1" : "#4B5563",
                }}
              >
                {result.analysisSource === "ai" ? "🤖 AI-Synthesized Analysis" : "📐 Domain Curriculum Engine"}
              </span>
            </div>
            <h3 className="font-serif text-2xl font-bold" style={{ color: C.ink }}>{result.targetRole}</h3>
            <p className="text-sm mt-1 leading-relaxed" style={{ color: C.muted }}>{result.roleDescription}</p>
          </div>

          {/* 2. Readiness Assessment Card & Limitations */}
          <div
            className="rounded-xl border p-5"
            style={{
              borderColor: C.border,
              background: "linear-gradient(135deg, #FAF7F5 0%, #FFFFFF 100%)",
            }}
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: C.faint }}>
                  Estimated Career Readiness
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="font-serif text-3xl font-bold" style={{ color: C.brand }}>
                    {result.readinessAssessment?.score ?? 0}%
                  </span>
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      background:
                        (result.readinessAssessment?.score ?? 0) >= 70
                          ? C.successBg
                          : (result.readinessAssessment?.score ?? 0) >= 40
                          ? "#FEF3C7"
                          : "#EDE6E2",
                      color:
                        (result.readinessAssessment?.score ?? 0) >= 70
                          ? C.success
                          : (result.readinessAssessment?.score ?? 0) >= 40
                          ? "#B45309"
                          : C.faint,
                    }}
                  >
                    {result.readinessAssessment?.level || "Early Stage"}
                  </span>
                </div>
                <p className="text-xs mt-1" style={{ color: C.muted }}>
                  {result.readinessAssessment?.summary}
                </p>
              </div>

              {/* Save Roadmap CTA */}
              <button
                onClick={handleSaveToRoadmaps}
                disabled={savingRoadmap}
                className="flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-semibold transition hover:bg-white"
                style={{ borderColor: C.brand, color: C.brand }}
              >
                <BookmarkCheck className="h-4 w-4" />
                {savingRoadmap ? "Saving…" : "Save as Active Roadmap"}
              </button>
            </div>

            {/* Assumptions & Limitations Box */}
            {result.readinessAssessment?.assumptionsAndLimitations && (
              <div
                className="mt-4 rounded-lg p-3 text-xs flex items-start gap-2"
                style={{ background: "#F9F6F3", color: C.faint, borderLeft: `3px solid ${C.brand}` }}
              >
                <Compass className="h-4 w-4 shrink-0 mt-0.5" style={{ color: C.brand }} />
                <span><strong>Assessment Note:</strong> {result.readinessAssessment.assumptionsAndLimitations}</span>
              </div>
            )}
          </div>

          {/* 3. Three-Way Skill Breakdown */}
          <div>
            <h4 className="font-serif text-base font-bold mb-3" style={{ color: C.ink }}>Skill Breakdown</h4>
            <div className="grid gap-4 sm:grid-cols-3">
              {/* Confirmed Skills */}
              <div className="rounded-xl border p-4" style={{ borderColor: "#A7F3D0", background: C.successBg }}>
                <div className="flex items-center gap-1.5 mb-2.5">
                  <CheckCircle2 className="h-4 w-4" style={{ color: C.success }} />
                  <h5 className="font-bold text-xs" style={{ color: C.success }}>
                    Confirmed Skills ({result.confirmedSkills?.length || 0})
                  </h5>
                </div>
                {(!result.confirmedSkills || result.confirmedSkills.length === 0) ? (
                  <p className="text-xs italic" style={{ color: C.muted }}>
                    No confirmed skills matching this role yet. Add your skills above to verify your strengths.
                  </p>
                ) : (
                  <ul className="space-y-1.5">
                    {result.confirmedSkills.map((s) => (
                      <li key={s} className="text-xs flex items-center gap-1.5" style={{ color: C.ink }}>
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: C.success }} />
                        {s}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Priority Gaps */}
              <div className="rounded-xl border p-4" style={{ borderColor: "#FECACA", background: "#FEF2F2" }}>
                <div className="flex items-center gap-1.5 mb-2.5">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <h5 className="font-bold text-xs text-red-700">
                    Priority Gaps to Fill ({result.skillGaps?.length || 0})
                  </h5>
                </div>
                {(!result.skillGaps || result.skillGaps.length === 0) ? (
                  <p className="text-xs text-green-700 font-medium">
                    🎉 Excellent! You have demonstrated all core skills for this role.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {result.skillGaps.map((gap, idx) => (
                      <li key={idx} className="text-xs border-b pb-1.5 last:border-b-0" style={{ borderColor: "#FEE2E2" }}>
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-semibold text-gray-900">{gap.skill}</span>
                          <span
                            className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded"
                            style={{
                              background: gap.priority === "high" ? "#DC2626" : gap.priority === "medium" ? "#D97706" : "#6B7280",
                              color: "#fff",
                            }}
                          >
                            {gap.priority}
                          </span>
                        </div>
                        {gap.reason && <p className="text-[11px] text-gray-600 mt-0.5 leading-snug">{gap.reason}</p>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Unverified / Complementary Skills */}
              <div className="rounded-xl border p-4" style={{ borderColor: C.border, background: C.brandBg }}>
                <div className="flex items-center gap-1.5 mb-2.5">
                  <Star className="h-4 w-4" style={{ color: C.brand }} />
                  <h5 className="font-bold text-xs" style={{ color: C.brand }}>
                    Unverified / Secondary Skills ({result.unverifiedSkills?.length || 0})
                  </h5>
                </div>
                {(!result.unverifiedSkills || result.unverifiedSkills.length === 0) ? (
                  <p className="text-xs" style={{ color: C.faint }}>
                    No additional complementary skills noted.
                  </p>
                ) : (
                  <ul className="space-y-1.5">
                    {result.unverifiedSkills.map((s) => (
                      <li key={s} className="text-xs flex items-center gap-1.5" style={{ color: C.muted }}>
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: C.brand }} />
                        {s}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* 4. Ordered Learning Roadmap */}
          {result.learningRoadmap && result.learningRoadmap.length > 0 && (
            <div className="rounded-xl border p-5 bg-white shadow-xs" style={{ borderColor: C.border }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Map className="h-4 w-4" style={{ color: C.brand }} />
                  <h4 className="font-serif text-base font-bold" style={{ color: C.ink }}>
                    Ordered Learning Roadmap
                  </h4>
                </div>
                <span className="text-xs font-medium" style={{ color: C.faint }}>
                  Step-by-step progression
                </span>
              </div>

              <div className="space-y-4">
                {result.learningRoadmap.map((stage, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border p-4 transition-all"
                    style={{ borderColor: C.border, background: C.brandLight }}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white"
                          style={{ background: C.brand }}
                        >
                          {idx + 1}
                        </span>
                        <h5 className="font-semibold text-sm" style={{ color: C.ink }}>{stage.stage}</h5>
                      </div>
                      {stage.estimatedHours && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#EDE6E2", color: C.muted }}>
                          ⏱️ {stage.estimatedHours}
                        </span>
                      )}
                    </div>
                    {stage.milestones && (
                      <ul className="space-y-1.5 pl-8 mt-2">
                        {stage.milestones.map((m, mIdx) => (
                          <li key={mIdx} className="text-xs flex items-start gap-2" style={{ color: C.muted }}>
                            <ArrowRight className="h-3 w-3 shrink-0 mt-0.5" style={{ color: C.brand }} />
                            <span>{m}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. Beginner-Friendly Project Recommendations */}
          {result.projectRecommendations && result.projectRecommendations.length > 0 && (
            <div className="rounded-xl border p-5 bg-white shadow-xs" style={{ borderColor: C.border }}>
              <div className="flex items-center gap-2 mb-4">
                <Rocket className="h-4 w-4" style={{ color: C.brand }} />
                <h4 className="font-serif text-base font-bold" style={{ color: C.ink }}>
                  Beginner-Friendly Portfolio Projects
                </h4>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {result.projectRecommendations.map((proj, idx) => (
                  <div key={idx} className="rounded-lg border p-4 flex flex-col justify-between" style={{ borderColor: C.border, background: C.brandLight }}>
                    <div>
                      <h5 className="font-bold text-sm mb-1" style={{ color: C.ink }}>{proj.title}</h5>
                      <p className="text-xs mb-3 leading-relaxed" style={{ color: C.muted }}>{proj.description}</p>
                      {proj.skillsPracticed && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {proj.skillsPracticed.map((sk) => (
                            <span key={sk} className="text-[10px] font-medium px-2 py-0.5 rounded bg-white border" style={{ borderColor: C.border, color: C.brand }}>
                              {sk}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="pt-2 border-t text-[11px]" style={{ borderColor: C.border, color: C.faint }}>
                      <strong>Deliverable:</strong> {proj.deliverable}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. Reputable Learning Resources */}
          {result.learningResources && result.learningResources.length > 0 && (
            <div className="rounded-xl border p-5 bg-white shadow-xs" style={{ borderColor: C.border }}>
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="h-4 w-4" style={{ color: C.brand }} />
                <h4 className="font-serif text-base font-bold" style={{ color: C.ink }}>
                  Recommended Learning Resources
                </h4>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {result.learningResources.map((resItem, idx) => (
                  <div key={idx} className="rounded-lg border p-3.5" style={{ borderColor: C.border, background: C.brandLight }}>
                    <h5 className="font-semibold text-xs mb-1" style={{ color: C.ink }}>{resItem.name}</h5>
                    <p className="text-[11px] mb-2 leading-relaxed" style={{ color: C.muted }}>{resItem.description}</p>
                    {resItem.topics && (
                      <div className="flex flex-wrap gap-1">
                        {resItem.topics.map((t) => (
                          <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-white text-gray-700 border" style={{ borderColor: C.border }}>
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
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

