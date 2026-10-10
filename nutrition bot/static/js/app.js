/* ============================================================
   NutriBot — Frontend JavaScript
   IBM Watsonx.ai Nutrition Agent
   ============================================================ */

"use strict";

// ── Helpers ──────────────────────────────────────────────────
const $ = id => document.getElementById(id);

function showToast(msg, delay = 3000) {
  const el = $("appToast");
  $("toastBody").textContent = msg;
  const toast = new bootstrap.Toast(el, { delay });
  toast.show();
}

function md(text) {
  if (typeof marked !== "undefined") {
    return marked.parse(text || "");
  }
  // Fallback: minimal markdown (bold, newlines)
  return (text || "")
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
    .replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>")
    .replace(/\*(.+?)\*/g,"<em>$1</em>")
    .replace(/\n/g,"<br>");
}

function setLoading(btn, loading, label = "Loading…") {
  if (loading) {
    btn.dataset.origText = btn.innerHTML;
    btn.innerHTML = `<span class="spinner-brand"></span>${label}`;
    btn.disabled = true;
  } else {
    btn.innerHTML = btn.dataset.origText || label;
    btn.disabled = false;
  }
}

async function post(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// ── Theme Toggle ─────────────────────────────────────────────
const html = document.documentElement;
const themeBtn = $("themeToggle");
const THEME_KEY = "nutribot-theme";

function applyTheme(theme) {
  html.setAttribute("data-theme", theme);
  themeBtn.innerHTML = theme === "dark"
    ? '<i class="bi bi-sun-fill"></i>'
    : '<i class="bi bi-moon-stars-fill"></i>';
  localStorage.setItem(THEME_KEY, theme);
}

// Load saved theme
applyTheme(localStorage.getItem(THEME_KEY) || "light");

themeBtn.addEventListener("click", () => {
  applyTheme(html.getAttribute("data-theme") === "dark" ? "light" : "dark");
});

// ── API Status Check ──────────────────────────────────────────
async function checkApiStatus() {
  const dot = $("statusDot");
  try {
    const data = await fetch("/api/health").then(r => r.json());
    if (data.watsonx_configured) {
      dot.className = "status-dot ok";
      dot.title = `Watsonx.ai connected — ${data.model}`;
    } else {
      dot.className = "status-dot warn";
      dot.title = "Watsonx.ai not configured — check .env";
    }
  } catch {
    dot.className = "status-dot err";
    dot.title = "Server unreachable";
  }
}

checkApiStatus();

// ── Smooth scroll for nav links ───────────────────────────────
document.querySelectorAll('a.nav-link[href^="#"]').forEach(a => {
  a.addEventListener("click", () => {
    // Close mobile nav
    const nav = document.querySelector(".navbar-collapse");
    if (nav.classList.contains("show")) {
      bootstrap.Collapse.getOrCreateInstance(nav).hide();
    }
  });
});

// ══════════════════════════════════════════════════════════════
//  CHAT
// ══════════════════════════════════════════════════════════════
const chatBox   = $("chatBox");
const chatInput = $("chatInput");
const sendBtn   = $("sendBtn");
const clearBtn  = $("clearChatBtn");

function appendMessage(role, html_content) {
  const wrap = document.createElement("div");
  wrap.className = `chat-message ${role}`;

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.textContent = role === "user" ? "🙂" : "🥦";

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.innerHTML = html_content;

  wrap.appendChild(avatar);
  wrap.appendChild(bubble);
  chatBox.appendChild(wrap);
  chatBox.scrollTop = chatBox.scrollHeight;
  return wrap;
}

function showTyping() {
  const wrap = document.createElement("div");
  wrap.className = "chat-message assistant";
  wrap.id = "typingWrap";

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.textContent = "🥦";

  const ind = document.createElement("div");
  ind.className = "typing-indicator";
  ind.innerHTML = "<span></span><span></span><span></span>";

  wrap.appendChild(avatar);
  wrap.appendChild(ind);
  chatBox.appendChild(wrap);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function removeTyping() {
  const t = $("typingWrap");
  if (t) t.remove();
}

async function sendMessage() {
  const message = chatInput.value.trim();
  if (!message) return;

  appendMessage("user", md(message));
  chatInput.value = "";
  chatInput.style.height = "auto";
  setLoading(sendBtn, true, "Sending…");
  showTyping();

  try {
    const data = await post("/api/chat", { message });
    removeTyping();
    appendMessage("assistant", md(data.reply));
  } catch (err) {
    removeTyping();
    appendMessage("assistant", `<span class="text-danger">⚠️ ${err.message}</span>`);
  } finally {
    setLoading(sendBtn, false, '<i class="bi bi-send-fill me-1"></i>Send');
  }
}

sendBtn.addEventListener("click", sendMessage);

chatInput.addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// Auto-resize textarea
chatInput.addEventListener("input", () => {
  chatInput.style.height = "auto";
  chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + "px";
});

clearBtn.addEventListener("click", async () => {
  await fetch("/api/clear-history", { method: "POST" });
  chatBox.innerHTML = `
    <div class="chat-message assistant">
      <div class="avatar">🥦</div>
      <div class="bubble">Chat cleared! How can I help you with your nutrition goals today? 🌿</div>
    </div>`;
  showToast("Chat history cleared");
});

// Suggestion chips
document.querySelectorAll(".chip-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    chatInput.value = btn.dataset.msg;
    chatInput.focus();
    document.getElementById("chatSection").scrollIntoView({ behavior: "smooth" });
  });
});

// ══════════════════════════════════════════════════════════════
//  MEAL PLAN GENERATOR
// ══════════════════════════════════════════════════════════════
const generatePlanBtn = $("generatePlanBtn");
const planResult      = $("planResult");
const copyPlanBtn     = $("copyPlanBtn");

generatePlanBtn.addEventListener("click", async () => {
  const name     = $("mpName").value.trim() || "User";
  const age      = +$("mpAge").value || 30;
  const weight   = +$("mpWeight").value;
  const height   = +$("mpHeight").value;
  const gender   = $("mpGender").value;
  const goal     = $("mpGoal").value;
  const diet     = $("mpDiet").value;
  const activity = $("mpActivity").value;
  const allergies= $("mpAllergies").value.trim() || "none";

  if (!weight || !height) {
    showToast("⚠️ Please enter your weight and height");
    return;
  }

  setLoading(generatePlanBtn, true, "Generating…");
  planResult.innerHTML = `<div class="text-center py-4 text-muted">
    <span class="spinner-brand" style="border-color:var(--accent);border-top-color:transparent;width:24px;height:24px;border-width:3px;"></span>
    <br><br>🤖 IBM Watsonx.ai Granite is crafting your personalised plan…
  </div>`;
  copyPlanBtn.classList.add("d-none");
  $("planStatsRow").classList.add("d-none");

  try {
    const data = await post("/api/nutrition-plan", {
      name, age, weight, height, gender, goal,
      diet_type: diet, activity, allergies, cuisine: "Indian"
    });

    // Show stat row
    $("planBmi").textContent   = data.bmi.bmi;
    $("planBmi").title         = data.bmi.category;
    $("planBmi").style.color   = data.bmi.color;
    $("planTdee").textContent  = data.calories.tdee;
    $("planLoss").textContent  = data.calories.weight_loss;
    $("planGain").textContent  = data.calories.weight_gain;
    $("planStatsRow").classList.remove("d-none");

    planResult.innerHTML = md(data.plan);
    copyPlanBtn.classList.remove("d-none");

    // Update dashboard macros (rough estimate)
    updateDashMacros(data.calories.tdee);

  } catch (err) {
    planResult.innerHTML = `<span class="text-danger">⚠️ ${err.message}</span>`;
    showToast("Failed to generate plan — check API config");
  } finally {
    setLoading(generatePlanBtn, false, '<i class="bi bi-magic me-2"></i>Generate 7-Day Plan');
  }
});

copyPlanBtn.addEventListener("click", () => {
  navigator.clipboard.writeText(planResult.innerText)
    .then(() => showToast("✅ Plan copied to clipboard!"))
    .catch(() => showToast("Could not copy — try manually"));
});

function updateDashMacros(calories) {
  $("dashCalories").textContent = calories;
  $("dashProtein").textContent  = Math.round(calories * 0.25 / 4);
  $("dashCarbs").textContent    = Math.round(calories * 0.50 / 4);
  $("dashFat").textContent      = Math.round(calories * 0.25 / 9);
}

// ══════════════════════════════════════════════════════════════
//  CALORIE ANALYSER
// ══════════════════════════════════════════════════════════════
const analyseBtn    = $("analyseBtn");
const analyseInput  = $("mealAnalyseInput");
const analyseResult = $("analyseResult");

async function runAnalyse() {
  const meal = analyseInput.value.trim();
  if (!meal) { showToast("⚠️ Enter a meal to analyse"); return; }

  setLoading(analyseBtn, true, "Analysing…");
  analyseResult.classList.remove("d-none");
  analyseResult.innerHTML = `<div class="text-muted">🔍 Analysing nutritional content…</div>`;

  try {
    const data = await post("/api/calorie-analysis", { meal });
    analyseResult.innerHTML = md(data.analysis);
  } catch (err) {
    analyseResult.innerHTML = `<span class="text-danger">⚠️ ${err.message}</span>`;
  } finally {
    setLoading(analyseBtn, false, '<i class="bi bi-lightning-charge-fill me-1"></i>Analyse');
  }
}

analyseBtn.addEventListener("click", runAnalyse);
analyseInput.addEventListener("keydown", e => {
  if (e.key === "Enter") runAnalyse();
});

// ══════════════════════════════════════════════════════════════
//  BMI CALCULATOR
// ══════════════════════════════════════════════════════════════
const calcBmiBtn = $("calcBmiBtn");

calcBmiBtn.addEventListener("click", async () => {
  const weight = +$("bmiWeight").value;
  const height = +$("bmiHeight").value;
  const age    = +$("bmiAge").value || 30;
  const gender = $("bmiGender").value;

  if (!weight || !height) {
    showToast("⚠️ Enter weight and height");
    return;
  }

  setLoading(calcBmiBtn, true, "Calculating…");

  try {
    const data = await post("/api/bmi", { weight, height, age, gender });
    const b = data.bmi_info;

    // Show gauge
    $("bmiGauge").classList.remove("d-none");
    $("bmiValue").textContent    = b.bmi;
    $("bmiValue").style.color    = b.color;
    $("bmiCategory").textContent = b.category;
    $("bmiCategory").style.color = b.color;
    $("bmiHealthyRange").textContent = b.healthy_range;

    // Position pointer: BMI 15=0%, BMI 40=100%
    const pct = Math.min(100, Math.max(0, ((b.bmi - 15) / 25) * 100));
    $("bmiPointer").style.left = pct + "%";

    // Show advice
    const advEl = $("bmiAdvice");
    advEl.classList.remove("plan-placeholder");
    advEl.innerHTML = `<div class="text-muted mb-2 small">Loading AI advice…</div>`;
    advEl.innerHTML = md(data.advice);

  } catch (err) {
    showToast("⚠️ " + err.message);
  } finally {
    setLoading(calcBmiBtn, false, '<i class="bi bi-calculator-fill me-2"></i>Calculate BMI');
  }
});

// ══════════════════════════════════════════════════════════════
//  FAMILY PLANNER
// ══════════════════════════════════════════════════════════════
let familyMembers = [];

const addMemberBtn    = $("addMemberBtn");
const genFamilyPlanBtn= $("genFamilyPlanBtn");
const membersList     = $("membersList");
const familyPlanResult= $("familyPlanResult");

addMemberBtn.addEventListener("click", () => {
  const name   = $("famName").value.trim();
  const age    = +$("famAge").value;
  const gender = $("famGender").value;
  const notes  = $("famNotes").value.trim();

  if (!name || !age) { showToast("⚠️ Enter name and age"); return; }

  const member = { name, age, gender, health_notes: notes || "healthy" };
  familyMembers.push(member);
  renderMembersList();

  // Clear inputs
  $("famName").value = "";
  $("famAge").value  = "";
  $("famNotes").value= "";
});

function renderMembersList() {
  membersList.innerHTML = "";
  familyMembers.forEach((m, i) => {
    const div = document.createElement("div");
    div.className = "member-item";
    div.innerHTML = `
      <div class="member-info">
        <span class="member-name">${m.name}</span>
        <span class="ms-2 text-muted small">${m.age}y · ${m.gender} · ${m.health_notes}</span>
      </div>
      <button class="member-remove" data-idx="${i}" title="Remove">✕</button>`;
    membersList.appendChild(div);
  });

  membersList.querySelectorAll(".member-remove").forEach(btn => {
    btn.addEventListener("click", () => {
      familyMembers.splice(+btn.dataset.idx, 1);
      renderMembersList();
      if (!familyMembers.length) genFamilyPlanBtn.classList.add("d-none");
    });
  });

  genFamilyPlanBtn.classList.toggle("d-none", familyMembers.length === 0);
}

genFamilyPlanBtn.addEventListener("click", async () => {
  if (!familyMembers.length) return;

  setLoading(genFamilyPlanBtn, true, "Generating…");
  familyPlanResult.innerHTML = `<div class="text-muted py-3 text-center">
    🤖 Creating a nutrition plan for your family of ${familyMembers.length}…
  </div>`;

  try {
    const data = await post("/api/family-plan", { members: familyMembers });
    familyPlanResult.innerHTML = md(data.family_plan);
    familyPlanResult.classList.remove("plan-placeholder");
  } catch (err) {
    familyPlanResult.innerHTML = `<span class="text-danger">⚠️ ${err.message}</span>`;
  } finally {
    setLoading(genFamilyPlanBtn, false, '<i class="bi bi-magic me-2"></i>Generate Family Plan');
  }
});

// ── Intersection Observer for scroll animations ───────────────
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add("animate-fadeInUp");
      observer.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll(".card-custom, .stat-card").forEach(el => observer.observe(el));
