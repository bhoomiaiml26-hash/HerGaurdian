import { useState } from "react";
import { Calculator, RefreshCw, TriangleAlert, Info } from "lucide-react";
import Markdown from "./Markdown";
import { calculateBmi } from "../../services/nutritionService";

const CATEGORY_COLORS = {
  Underweight: "#3b82f6",
  "Normal weight": "#286646",
  Overweight: "#a85c12",
  Obese: "#ba2626",
};

function BmiCalculator() {
  const [form, setForm] = useState({ weight: "", height: "", age: "", gender: "female" });
  const [result, setResult] = useState(null);
  const [advice, setAdvice] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const validate = () => {
    const weight = Number(form.weight);
    const height = Number(form.height);
    const age = Number(form.age);
    if (!form.weight || !Number.isFinite(weight) || weight < 20 || weight > 400) {
      return "Enter a weight between 20 and 400 kg.";
    }
    if (!form.height || !Number.isFinite(height) || height < 80 || height > 260) {
      return "Enter a height between 80 and 260 cm.";
    }
    if (form.age && (!Number.isInteger(age) || age < 5 || age > 120)) {
      return "Age must be a whole number between 5 and 120.";
    }
    return "";
  };

  const calculate = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const data = await calculateBmi({
        weight: Number(form.weight),
        height: Number(form.height),
        age: Number(form.age) || 30,
        gender: form.gender,
      });
      setResult(data.bmi_info);
      setAdvice(data.advice);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Pointer position: BMI 15 → 0%, BMI 40 → 100%
  const pointerPct = result
    ? Math.min(100, Math.max(0, ((result.bmi - 15) / 25) * 100))
    : 0;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Calculator */}
      <div className="nb-card rounded-xl p-5">
        <h3 className="mb-1 flex items-center gap-2 text-base font-bold">
          <Calculator className="h-4 w-4 nb-accent" />
          BMI Calculator
        </h3>
        <p className="nb-soft mb-4 text-xs">
          Metric units (kg / cm), same as the original NutriBot calculator.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="nb-label" htmlFor="bmi-weight">Weight (kg) *</label>
            <input id="bmi-weight" className="nb-input" type="number" min="20" max="400" value={form.weight} onChange={update("weight")} placeholder="70" />
          </div>
          <div>
            <label className="nb-label" htmlFor="bmi-height">Height (cm) *</label>
            <input id="bmi-height" className="nb-input" type="number" min="80" max="260" value={form.height} onChange={update("height")} placeholder="170" />
          </div>
          <div>
            <label className="nb-label" htmlFor="bmi-age">Age</label>
            <input id="bmi-age" className="nb-input" type="number" min="5" max="120" value={form.age} onChange={update("age")} placeholder="30" />
          </div>
          <div>
            <label className="nb-label" htmlFor="bmi-gender">Gender</label>
            <select id="bmi-gender" className="nb-input" value={form.gender} onChange={update("gender")}>
              <option value="female">Female</option>
              <option value="male">Male</option>
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={calculate}
          disabled={isLoading}
          className="nb-btn nb-btn-primary mt-4 w-full cursor-pointer"
        >
          {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Calculator className="h-4 w-4" />}
          {isLoading ? "Calculating..." : "Calculate BMI"}
        </button>

        {error && (
          <p className="nb-alert-error mt-3 flex items-center gap-2">
            <TriangleAlert className="h-4 w-4 shrink-0" />
            {error}
          </p>
        )}

        {/* Result gauge */}
        {result && (
          <div className="mt-5 text-center">
            <p
              className="text-4xl font-bold"
              style={{ color: CATEGORY_COLORS[result.category] || "var(--nb-primary)" }}
            >
              {result.bmi}
            </p>
            <p
              className="mt-1 text-sm font-semibold"
              style={{ color: CATEGORY_COLORS[result.category] || "var(--nb-primary)" }}
            >
              {result.category}
            </p>

            <div className="mt-4">
              <div
                className="relative h-2.5 w-full rounded-full"
                style={{
                  background:
                    "linear-gradient(to right, #3b82f6 0%, #286646 35%, #a85c12 65%, #ba2626 100%)",
                }}
              >
                <span
                  className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
                  style={{ left: `${pointerPct}%`, background: "var(--nb-text)" }}
                  aria-label={`BMI marker at ${result.bmi}`}
                />
              </div>
              <div className="mt-1 flex justify-between text-[10px] nb-soft">
                <span>Under</span>
                <span>Normal</span>
                <span>Over</span>
                <span>Obese</span>
              </div>
            </div>

            <p className="mt-3 text-xs nb-soft">
              Healthy weight range for your height: <strong>{result.healthy_range}</strong>
            </p>
          </div>
        )}
      </div>

      {/* AI advice */}
      <div className="nb-card rounded-xl p-5">
        <h3 className="mb-3 flex items-center gap-2 text-base font-bold">
          <Info className="h-4 w-4 nb-accent" />
          AI Guidance
        </h3>

        <p className="nb-alert-info mb-4">
          BMI is a <strong>screening measure only</strong>. It does not independently
          determine your health — muscle mass, body composition, age, and other factors
          matter. This is not a medical diagnosis.
        </p>

        {isLoading ? (
          <div className="flex flex-col items-center gap-3 py-10 text-sm nb-soft">
            <RefreshCw className="h-6 w-6 animate-spin nb-accent" />
            Preparing personalised guidance…
          </div>
        ) : advice ? (
          <Markdown content={advice} />
        ) : (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <Calculator className="h-10 w-10 nb-accent opacity-50" />
            <p className="nb-soft max-w-xs text-sm">
              Enter your measurements and calculate BMI to receive personalised
              nutrition and lifestyle guidance.
            </p>
          </div>
        )}

        {advice && (
          <p className="nb-soft mt-4 border-t border-[var(--nb-border)] pt-3 text-xs">
            For pregnancy, eating disorders, serious medical conditions, or medically
            prescribed diets, consult an appropriately qualified healthcare professional.
          </p>
        )}
      </div>
    </div>
  );
}

export default BmiCalculator;
