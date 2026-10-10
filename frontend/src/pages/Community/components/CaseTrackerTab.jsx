import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookmarkCheck,
  Plus,
  CheckCircle2,
  Circle,
  Trash2,
  Lock,
  ChevronDown,
  ChevronUp,
  ListTodo,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getSupportCases,
  createSupportCase,
  updateSupportCase,
  deleteSupportCase,
  addCaseTask,
  toggleCaseTask
} from '../../../services/communityService';

const statusOptions = [
  { value: 'all', label: 'All Cases' },
  { value: 'planning', label: 'Planning' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'awaiting_response', label: 'Awaiting Response' },
  { value: 'follow_up_needed', label: 'Follow-Up Needed' },
  { value: 'resolved', label: 'Resolved' },
];

export default function CaseTrackerTab({ onCasesChanged }) {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [expandedCaseId, setExpandedCaseId] = useState(null);

  // New Case Modal / Drawer
  const [isCreatingCase, setIsCreatingCase] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Workplace Dispute');
  const [newPriority, setNewPriority] = useState('medium');
  const [newIncidentDate, setNewIncidentDate] = useState('');
  const [newTargetDate, setNewTargetDate] = useState('');
  const [newDescription, setNewDescription] = useState('');

  // Task adding state per case
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [activeTaskCaseId, setActiveTaskCaseId] = useState(null);

  // Note adding state
  const [newNoteText, setNewNoteText] = useState('');
  const [activeNoteCaseId, setActiveNoteCaseId] = useState(null);

  const loadCases = async () => {
    try {
      setLoading(true);
      const res = await getSupportCases({ status: filterStatus });
      if (res.success) {
        setCases(res.cases || []);
        if (onCasesChanged) onCasesChanged(res.cases || []);
      }
    } catch (err) {
      console.error('Error fetching cases:', err);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    loadCases();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus]);

  const handleCreateCase = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      toast.error('Case title is required');
      return;
    }

    try {
      const res = await createSupportCase({
        title: newTitle.trim(),
        category: newCategory,
        priority: newPriority,
        incidentDate: newIncidentDate,
        targetResolutionDate: newTargetDate,
        description: newDescription.trim(),
        status: 'planning',
        tasks: [
          { title: 'Gather all initial documents and communication records', completed: false, priority: 'urgent' },
          { title: 'Draft formal notification or grievance letter', completed: false, priority: 'normal' },
        ],
      });

      if (res.success) {
        toast.success('Private case created successfully!');
        setIsCreatingCase(false);
        setNewTitle('');
        setNewDescription('');
        setNewIncidentDate('');
        setNewTargetDate('');
        loadCases();
      }
    } catch (err) {
      console.error('Error creating case:', err);
      toast.error('Failed to create case');
    }
  };

  const handleStatusChange = async (caseId, newStatus) => {
    try {
      const res = await updateSupportCase(caseId, { status: newStatus });
      if (res.success) {
        toast.success(`Case status set to ${newStatus.replace('_', ' ')}`);
        setCases((prev) =>
          prev.map((c) => (c._id === caseId ? { ...c, status: newStatus } : c))
        );
      }
    } catch (_err) {
      toast.error('Failed to update status');
    }
  };

  const handleToggleTask = async (caseId, taskId, currentVal) => {
    try {
      const res = await toggleCaseTask(caseId, taskId, !currentVal);
      if (res.success) {
        setCases((prev) =>
          prev.map((c) => {
            if (c._id === caseId) {
              const updatedTasks = c.tasks.map((t) =>
                t.id === taskId ? { ...t, completed: !currentVal } : t
              );
              return { ...c, tasks: updatedTasks };
            }
            return c;
          })
        );
      }
    } catch (_err) {
      toast.error('Failed to update task');
    }
  };

  const handleAddTask = async (caseId) => {
    if (!newTaskTitle.trim()) return;
    try {
      const res = await addCaseTask(caseId, { title: newTaskTitle.trim() });
      if (res.success) {
        setCases((prev) =>
          prev.map((c) =>
            c._id === caseId ? { ...c, tasks: [...c.tasks, res.task] } : c
          )
        );
        setNewTaskTitle('');
        setActiveTaskCaseId(null);
        toast.success('Task added');
      }
    } catch (_err) {
      toast.error('Failed to add task');
    }
  };

  const handleAddNote = async (caseId) => {
    if (!newNoteText.trim()) return;
    try {
      const targetCase = cases.find((c) => c._id === caseId);
      if (!targetCase) return;

      const newNote = {
        id: `note_${Date.now()}`,
        date: new Date(),
        text: newNoteText.trim(),
      };
      const updatedNotes = [...(targetCase.notes || []), newNote];

      const res = await updateSupportCase(caseId, { notes: updatedNotes });
      if (res.success) {
        setCases((prev) =>
          prev.map((c) => (c._id === caseId ? { ...c, notes: updatedNotes } : c))
        );
        setNewNoteText('');
        setActiveNoteCaseId(null);
        toast.success('Note recorded');
      }
    } catch (_err) {
      toast.error('Failed to record note');
    }
  };

  const handleDeleteCase = async (caseId) => {
    if (!window.confirm('Are you sure you want to delete this case? This cannot be undone.')) {
      return;
    }
    try {
      const res = await deleteSupportCase(caseId);
      if (res.success) {
        toast.success('Case deleted');
        setCases((prev) => prev.filter((c) => c._id !== caseId));
      }
    } catch (_err) {
      toast.error('Failed to delete case');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Creator */}
      <div className="rounded-2xl border border-[#EDE6E2] bg-white p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F6EFEA] text-[#8C3737]">
              <BookmarkCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-serif text-xl font-bold text-[#1E1B18]">
                Personal Case &amp; Action Tracker
              </h2>
              <p className="text-xs text-[#78726B]">
                Your confidential milestone workspace. Never shared with the community.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsCreatingCase(!isCreatingCase)}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#8C3737] px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-[#752B2B] transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>{isCreatingCase ? 'Close Form' : 'New Case / Action Plan'}</span>
          </button>
        </div>
      </div>

      {/* New Case Creation Form */}
      <AnimatePresence>
        {isCreatingCase && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleCreateCase}
            className="rounded-2xl border border-[#EDE6E2] bg-white p-6 shadow-xs space-y-4 overflow-hidden"
          >
            <h3 className="font-serif text-base font-bold text-[#1E1B18] pb-2 border-b border-[#EDE6E2]">
              Create New Personal Case
            </h3>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-[#1E1B18] mb-1">
                  Case Title *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Unpaid Overtime at TechCorp"
                  className="w-full rounded-lg border border-[#EDE6E2] bg-[#FBF9F7] px-3 py-2 text-xs text-[#1E1B18] focus:border-[#8C3737] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1E1B18] mb-1">
                  Category
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full rounded-lg border border-[#EDE6E2] bg-[#FBF9F7] px-3 py-2 text-xs text-[#1E1B18] focus:border-[#8C3737] focus:outline-hidden"
                >
                  <option value="Workplace Dispute">Workplace Dispute</option>
                  <option value="POSH Harassment">POSH Harassment</option>
                  <option value="Unpaid Wages">Unpaid Wages</option>
                  <option value="Digital Safety / Cyber">Digital Safety / Cyber</option>
                  <option value="Educational Grievance">Educational Grievance</option>
                  <option value="Legal Aid Application">Legal Aid Application</option>
                  <option value="General Support">General Support</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1E1B18] mb-1">
                  Priority
                </label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value)}
                  className="w-full rounded-lg border border-[#EDE6E2] bg-[#FBF9F7] px-3 py-2 text-xs text-[#1E1B18] focus:border-[#8C3737] focus:outline-hidden"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1E1B18] mb-1">
                  Target Resolution Date
                </label>
                <input
                  type="date"
                  value={newTargetDate}
                  onChange={(e) => setNewTargetDate(e.target.value)}
                  className="w-full rounded-lg border border-[#EDE6E2] bg-[#FBF9F7] px-3 py-2 text-xs text-[#1E1B18] focus:border-[#8C3737] focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1E1B18] mb-1">
                Confidential Description &amp; Initial Notes
              </label>
              <textarea
                rows={3}
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Keep private notes regarding facts, references, counterparty names..."
                className="w-full rounded-lg border border-[#EDE6E2] bg-[#FBF9F7] p-2.5 text-xs text-[#1E1B18] focus:border-[#8C3737] focus:outline-hidden"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCreatingCase(false)}
                className="rounded-lg border border-[#EDE6E2] bg-white px-4 py-2 text-xs font-semibold text-[#1E1B18] hover:bg-[#F6EFEA]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-[#8C3737] px-4 py-2 text-xs font-semibold text-white hover:bg-[#752B2B]"
              >
                Save Private Case
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Filter Tabs */}
      <div className="flex overflow-x-auto gap-1.5 pb-1 scrollbar-none">
        {statusOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFilterStatus(opt.value)}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              filterStatus === opt.value
                ? 'bg-[#8C3737] text-white shadow-xs'
                : 'border border-[#EDE6E2] bg-white text-[#4F4A45] hover:bg-[#F6EFEA]'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Cases List */}
      {loading ? (
        <div className="rounded-2xl border border-[#EDE6E2] bg-white p-12 text-center text-xs text-[#78726B]">
          Loading your private case records...
        </div>
      ) : cases.length === 0 ? (
        <div className="rounded-2xl border border-[#EDE6E2] bg-white p-12 text-center">
          <Lock className="mx-auto h-10 w-10 text-[#A8A29E] mb-2" />
          <h3 className="font-serif text-base font-semibold text-[#1E1B18]">
            No Cases Found
          </h3>
          <p className="text-xs text-[#78726B] mt-1 max-w-sm mx-auto">
            You don't have any cases matching this filter. Click "New Case / Action Plan" above or use the Rights Action Assistant to automatically generate one.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {cases.map((c) => {
            const isExpanded = expandedCaseId === c._id;
            const completedTasks = (c.tasks || []).filter((t) => t.completed).length;
            const totalTasks = (c.tasks || []).length;
            const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

            return (
              <div
                key={c._id}
                className="rounded-2xl border border-[#EDE6E2] bg-white p-5 shadow-xs transition-all"
              >
                {/* Case Card Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-[#F6EFEA] px-2 py-0.5 text-[10px] font-semibold text-[#8C3737]">
                        {c.category}
                      </span>
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                          c.priority === 'urgent'
                            ? 'bg-[#FDF2F2] text-[#BA2626]'
                            : c.priority === 'high'
                            ? 'bg-[#FFF7ED] text-[#C2410C]'
                            : 'bg-[#F3F4F6] text-[#4B5563]'
                        }`}
                      >
                        {c.priority}
                      </span>
                    </div>
                    <h3 className="font-serif text-base font-bold text-[#1E1B18]">
                      {c.title}
                    </h3>
                  </div>

                  {/* Status Dropdown & Expand Toggle */}
                  <div className="flex items-center gap-2">
                    <select
                      value={c.status}
                      onChange={(e) => handleStatusChange(c._id, e.target.value)}
                      className="rounded-lg border border-[#EDE6E2] bg-[#FBF9F7] px-2.5 py-1 text-xs font-semibold text-[#1E1B18] focus:border-[#8C3737] focus:outline-hidden"
                    >
                      <option value="planning">Planning</option>
                      <option value="in_progress">In Progress</option>
                      <option value="awaiting_response">Awaiting Response</option>
                      <option value="follow_up_needed">Follow-Up Needed</option>
                      <option value="resolved">Resolved</option>
                    </select>

                    <button
                      onClick={() => setExpandedCaseId(isExpanded ? null : c._id)}
                      className="rounded-lg border border-[#EDE6E2] p-1.5 text-[#78726B] hover:bg-[#F6EFEA]"
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Progress Bar & Summary */}
                <div className="mt-4 pt-3 border-t border-[#EDE6E2]">
                  <div className="flex items-center justify-between text-xs text-[#78726B] mb-1.5">
                    <span className="flex items-center gap-1 font-medium">
                      <ListTodo className="h-3.5 w-3.5 text-[#8C3737]" />
                      Tasks: {completedTasks} / {totalTasks} completed
                    </span>
                    <span className="font-semibold text-[#1E1B18]">{progress}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#F6EFEA] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#8C3737] transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Expanded Details: Tasks & Notes */}
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-5 pt-4 border-t border-[#EDE6E2] space-y-5"
                  >
                    {/* Description */}
                    {c.description && (
                      <div className="rounded-xl border border-[#EDE6E2] bg-[#FBF9F7] p-3.5 text-xs text-[#1E1B18] whitespace-pre-line leading-relaxed">
                        <strong className="block text-[10px] uppercase font-bold text-[#78726B] mb-1">
                          Case Notes &amp; Facts
                        </strong>
                        {c.description}
                      </div>
                    )}

                    {/* Task Checklist */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-serif text-xs font-bold uppercase tracking-wider text-[#78726B]">
                          Action Tasks
                        </h4>
                        <button
                          onClick={() => setActiveTaskCaseId(activeTaskCaseId === c._id ? null : c._id)}
                          className="text-[11px] font-semibold text-[#8C3737] hover:underline"
                        >
                          + Add Task
                        </button>
                      </div>

                      {/* Add Task Input */}
                      {activeTaskCaseId === c._id && (
                        <div className="flex gap-2 mb-3">
                          <input
                            type="text"
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            placeholder="e.g. Follow up on acknowledgment email"
                            className="flex-1 rounded-lg border border-[#EDE6E2] bg-[#FBF9F7] px-3 py-1.5 text-xs text-[#1E1B18] focus:border-[#8C3737] focus:outline-hidden"
                          />
                          <button
                            onClick={() => handleAddTask(c._id)}
                            className="rounded-lg bg-[#8C3737] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#752B2B]"
                          >
                            Add
                          </button>
                        </div>
                      )}

                      <div className="space-y-2">
                        {(c.tasks || []).map((t) => (
                          <div
                            key={t.id}
                            onClick={() => handleToggleTask(c._id, t.id, t.completed)}
                            className="cursor-pointer flex items-center gap-2.5 rounded-lg border border-[#EDE6E2] bg-[#FBF9F7] p-2.5 hover:border-[#8C3737]/30 transition-colors"
                          >
                            {t.completed ? (
                              <CheckCircle2 className="h-4 w-4 text-[#286646] shrink-0" />
                            ) : (
                              <Circle className="h-4 w-4 text-[#A8A29E] shrink-0" />
                            )}
                            <span
                              className={`text-xs ${
                                t.completed ? 'line-through text-[#A8A29E]' : 'text-[#1E1B18]'
                              }`}
                            >
                              {t.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Chronological Notes */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-serif text-xs font-bold uppercase tracking-wider text-[#78726B]">
                          Chronological Log
                        </h4>
                        <button
                          onClick={() => setActiveNoteCaseId(activeNoteCaseId === c._id ? null : c._id)}
                          className="text-[11px] font-semibold text-[#8C3737] hover:underline"
                        >
                          + Add Note
                        </button>
                      </div>

                      {/* Add Note Input */}
                      {activeNoteCaseId === c._id && (
                        <div className="flex gap-2 mb-3">
                          <input
                            type="text"
                            value={newNoteText}
                            onChange={(e) => setNewNoteText(e.target.value)}
                            placeholder="e.g. Called DLSA helpline, advocate assigned."
                            className="flex-1 rounded-lg border border-[#EDE6E2] bg-[#FBF9F7] px-3 py-1.5 text-xs text-[#1E1B18] focus:border-[#8C3737] focus:outline-hidden"
                          />
                          <button
                            onClick={() => handleAddNote(c._id)}
                            className="rounded-lg bg-[#8C3737] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#752B2B]"
                          >
                            Save Note
                          </button>
                        </div>
                      )}

                      <div className="space-y-1.5">
                        {(c.notes || []).map((n) => (
                          <div
                            key={n.id || n._id}
                            className="rounded-lg border border-[#EDE6E2] bg-white p-2.5 text-xs text-[#4F4A45]"
                          >
                            <span className="text-[10px] font-semibold text-[#78726B] block">
                              {new Date(n.date).toLocaleDateString()} {new Date(n.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <p className="mt-0.5">{n.text}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Delete Action */}
                    <div className="pt-3 border-t border-[#EDE6E2] flex justify-between items-center">
                      <span className="text-[11px] text-[#78726B]">
                        Last modified: {new Date(c.updatedAt).toLocaleDateString()}
                      </span>
                      <button
                        onClick={() => handleDeleteCase(c._id)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#BA2626] hover:underline"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Delete Case</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Security & Non-Official Registry Notice */}
      <div className="rounded-xl border border-[#EDE6E2] bg-[#FFFBF7] p-4 text-xs text-[#78726B] leading-relaxed flex items-start gap-2.5">
        <Lock className="h-4 w-4 text-[#8C3737] shrink-0 mt-0.5" />
        <p>
          <strong>Private Workspace Notice:</strong> HerGuardian AI case records are personal organizer logs encrypted to your account. Creating or updating a case here does not constitute filing a case with any court, police department, or government agency.
        </p>
      </div>
    </div>
  );
}
