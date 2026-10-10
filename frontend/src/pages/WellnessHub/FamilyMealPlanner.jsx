import { useState } from "react";
import { Users, UserPlus, X, RefreshCw, TriangleAlert, HeartPulse } from "lucide-react";
import Markdown from "./Markdown";
import { generateFamilyPlan } from "../../services/nutritionService";

const emptyMember = { name: "", age: "", gender: "female", diet: "", allergies: "", health_notes: "" };

function FamilyMealPlanner() {
  const [member, setMember] = useState(emptyMember);
  const [members, setMembers] = useState([]);
  const [plan, setPlan] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const update = (key) => (e) => setMember((m) => ({ ...m, [key]: e.target.value }));

  const addMember = () => {
    const name = member.name.trim();
    const age = Number(member.age);
    if (!name) {
      setError("Enter the family member's name.");
      return;
    }
    if (!member.age || !Number.isInteger(age) || age < 1 || age > 120) {
      setError("Enter an age between 1 and 120.");
      return;
    }
    setError("");
    setMembers((prev) => [...prev, { ...member, name, age }]);
    setMember(emptyMember);
  };

  const removeMember = (index) => {
    setMembers((prev) => prev.filter((_, i) => i !== index));
  };

  const generate = async () => {
    if (!members.length) {
      setError("Add at least one family member first.");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const data = await generateFamilyPlan(members);
      setPlan(data.family_plan);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      {/* Members */}
      <div className="nb-card rounded-xl p-5 lg:col-span-2">
        <h3 className="mb-1 flex items-center gap-2 text-base font-bold">
          <UserPlus className="h-4 w-4 nb-accent" />
          Family Members
        </h3>
        <p className="nb-soft mb-4 text-xs">
          Add each person with their own diet and requirements — the plan will respect
          individual needs instead of assuming one meal fits everyone.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="nb-label" htmlFor="fam-name">Name *</label>
            <input id="fam-name" className="nb-input" value={member.name} onChange={update("name")} placeholder="e.g. Aanya" />
          </div>
          <div>
            <label className="nb-label" htmlFor="fam-age">Age *</label>
            <input id="fam-age" className="nb-input" type="number" min="1" max="120" value={member.age} onChange={update("age")} placeholder="28" />
          </div>
          <div>
            <label className="nb-label" htmlFor="fam-gender">Gender</label>
            <select id="fam-gender" className="nb-input" value={member.gender} onChange={update("gender")}>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="nb-label" htmlFor="fam-diet">Dietary preference</label>
            <input id="fam-diet" className="nb-input" value={member.diet} onChange={update("diet")} placeholder="e.g. vegetarian, vegan, keto" />
          </div>
          <div className="col-span-2">
            <label className="nb-label" htmlFor="fam-allergies">Allergies / intolerances</label>
            <input id="fam-allergies" className="nb-input" value={member.allergies} onChange={update("allergies")} placeholder="e.g. peanuts, lactose" />
          </div>
          <div className="col-span-2">
            <label className="nb-label" htmlFor="fam-notes">Health notes (optional)</label>
            <input id="fam-notes" className="nb-input" value={member.health_notes} onChange={update("health_notes")} placeholder="e.g. diabetic, pregnant, lactose intolerant" />
          </div>
        </div>

        <button type="button" onClick={addMember} className="nb-btn nb-btn-outline mt-4 w-full cursor-pointer">
          <UserPlus className="h-4 w-4" />
          Add Member
        </button>

        {/* Member list */}
        {members.length > 0 && (
          <ul className="mt-4 space-y-2">
            {members.map((m, index) => (
              <li key={`${m.name}-${index}`} className="nb-card-soft flex items-start justify-between gap-2 rounded-lg p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{m.name}</p>
                  <p className="nb-soft text-xs">
                    {m.age} yrs · {m.gender}
                    {m.diet && <> · {m.diet}</>}
                  </p>
                  {m.allergies && (
                    <p className="mt-0.5 text-xs" style={{ color: "var(--nb-danger)" }}>
                      ⚠ Allergies: {m.allergies}
                    </p>
                  )}
                  {m.health_notes && <p className="nb-muted mt-0.5 text-xs">{m.health_notes}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => removeMember(index)}
                  className="nb-btn nb-btn-ghost shrink-0 cursor-pointer p-1"
                  aria-label={`Remove ${m.name}`}
                  title="Remove"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <button
          type="button"
          onClick={generate}
          disabled={isLoading || members.length === 0}
          className="nb-btn nb-btn-primary mt-4 w-full cursor-pointer"
        >
          {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
          {isLoading ? "Generating..." : plan ? "Regenerate Family Plan" : "Generate Family Plan"}
        </button>
      </div>

      {/* Plan */}
      <div className="nb-card rounded-xl p-5 lg:col-span-3">
        <h3 className="mb-3 flex items-center gap-2 text-base font-bold">
          <HeartPulse className="h-4 w-4 nb-accent" />
          Family Plan
        </h3>

        {error && (
          <p className="nb-alert-error mb-3 flex items-center gap-2">
            <TriangleAlert className="h-4 w-4 shrink-0" />
            {error}
          </p>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center gap-3 py-14 text-sm nb-soft">
            <RefreshCw className="h-6 w-6 animate-spin nb-accent" />
            Creating a nutrition plan for your family of {members.length}…
          </div>
        ) : plan ? (
          <>
            <Markdown content={plan} />
            <p className="nb-soft mt-4 border-t border-[var(--nb-border)] pt-3 text-xs">
              ⚠️ Portions and calories are estimates. Check every dish against each
              member's allergies — when in doubt, consult a registered dietitian.
            </p>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
            <Users className="h-10 w-10 nb-accent opacity-50" />
            <p className="nb-soft max-w-xs text-sm">
              Add your family members with their individual diets and restrictions, then
              generate a shared meal plan with per-person modifications.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default FamilyMealPlanner;
