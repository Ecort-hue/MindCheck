const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
 
function getMoodEmoji(s) {
  s = Number(s);
  return s < 20 ? "😢" : s < 40 ? "🙁" : s < 60 ? "😐" : s < 80 ? "🙂" : "😄";
}
 
function getMoodLabel(s) {
  s = Number(s);
  return s < 20 ? "Really tough" : s < 40 ? "A bit low" : s < 60 ? "Neutral" : s < 80 ? "Pretty good" : "Feeling great";
}
 
function getDayLabel(offset) {
  if (offset === 0) return "Today";
  const d = new Date(); d.setDate(d.getDate() + offset);
  return DAYS[d.getDay()];
}
 
// Storage
const loadMood    = () => localStorage.getItem("userMood");
const loadTags    = () => JSON.parse(localStorage.getItem("userTags") || "[]");
const loadNote    = () => localStorage.getItem("userNote") || "";
const loadHistory = () => JSON.parse(localStorage.getItem("weeklyMoods") || "[]");
const loadTagHistory = () => JSON.parse(localStorage.getItem("weeklyTags") || "[]");
 
function saveCheckIn(mood, tags) {
  localStorage.setItem("userMood", mood);
  localStorage.setItem("userTags", JSON.stringify(tags));
  const h = loadHistory(); h.push(Number(mood)); if (h.length > 7) h.shift();
  localStorage.setItem("weeklyMoods", JSON.stringify(h));
  const t = loadTagHistory(); t.push(tags); if (t.length > 7) t.shift();
  localStorage.setItem("weeklyTags", JSON.stringify(t));
}
 
function resetData() {
  if (!confirm("Clear all data?")) return;
  ["userMood","userTags","userNote","weeklyMoods","weeklyTags"].forEach(k => localStorage.removeItem(k));
  location.href = "index.html";
}
 
// Check-in
function logCheckIn() {
  const slider = document.getElementById("mood-slider");
  if (!slider) return;
  const tags = [...document.querySelectorAll(".pill-input:checked, .pill-cb:checked")]
    .map(i => document.querySelector(`label[for="${i.id}"]`)?.innerText.trim()).filter(Boolean);
  saveCheckIn(slider.value, tags);
  location.href = "userWeek.html";
}
 
function initCheckInPage() {
  const slider = document.getElementById("mood-slider");
  const box = document.getElementById("mood-emoji");
  if (!slider) return;
  slider.addEventListener("input", () => { if (box) box.textContent = getMoodEmoji(slider.value); });
  if (box) box.textContent = getMoodEmoji(slider.value);
}
 
// Week page
function initWeekPage() {
  const mood = loadMood(), tags = loadTags(), history = loadHistory(), tagHistory = loadTagHistory();
 
  // Badge
  const badge = document.getElementById("mood-badge");
  if (badge && mood) {
    document.getElementById("badge-emoji").textContent = getMoodEmoji(mood);
    document.getElementById("badge-label").textContent = getMoodLabel(mood) + " — " + mood + "/100";
    badge.style.display = "inline-flex";
  }
 
  // Bar chart
  const bars = document.querySelectorAll(".bar");
  const labelsEl = document.getElementById("chart-labels");
  if (bars.length && labelsEl) {
    labelsEl.innerHTML = "";
    bars.forEach((_, i) => {
      const s = document.createElement("span");
      s.textContent = getDayLabel(i - (bars.length - 1));
      if (i === bars.length - 1) s.classList.add("now");
      labelsEl.appendChild(s);
    });
    bars.forEach(b => b.style.height = "0%");
    let bi = bars.length - 1;
    for (let i = history.length - 1; i >= 0 && bi >= 0; i--, bi--)
      ((idx, h) => setTimeout(() => bars[idx].style.height = h + "%", 100))(bi, history[i]);
  }
 
  // Tags
  const pbox = document.getElementById("user-pattern");
  if (pbox) pbox.innerHTML = tags.length
    ? tags.map(t => `<span class="tag">${t}</span>`).join(" ") + " affected your mood today."
    : "No factors tagged today.";
 
  // Summary (3+ days)
  const sbox = document.getElementById("week-summary"), stext = document.getElementById("week-summary-text");
  if (sbox && stext && history.length >= 3) {
    const avg = Math.round(history.reduce((a, b) => a + b, 0) / history.length);
    const best = Math.max(...history), worst = Math.min(...history);
    const change = history[history.length - 1] - history[history.length - 2];
    const trend = change > 10 ? "📈 On an upswing." : change < -10 ? "📉 Today dipped — that's okay." : "➡️ You've been steady.";
    const tc = {}; tagHistory.flat().forEach(t => tc[t] = (tc[t] || 0) + 1);
    const topTags = Object.entries(tc).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([t]) => t);
    const insight = topTags.some(t => t.includes("Sleep")) ? "Sleep keeps showing up. One earlier bedtime could help."
      : topTags.some(t => t.includes("Stress")) ? "Stress is recurring. Small daily habits add up."
      : topTags.some(t => t.includes("Work")) ? "Work is weighing on you. Protect some real downtime."
      : avg >= 70 ? "Strong week. Notice what's working." : avg >= 50 ? "Steady week. Stability is strength."
      : "Tough stretch. Checking in still matters.";
    stext.innerHTML = `<p>${trend}</p>
      <div class="stats">
        <div class="stat"><b>${avg}/100</b><br><small>Avg mood</small></div>
        <div class="stat"><b>${history.length} days</b><br><small>Streak 🔥</small></div>
        <div class="stat"><b>${best}/100</b><br><small>Best</small></div>
        <div class="stat"><b>${worst}/100</b><br><small>Toughest</small></div>
      </div>
      ${topTags.length ? "<p>Top factors: " + topTags.map(t => `<span class="tag">${t}</span>`).join(" ") + "</p>" : ""}
      <p><em>${insight}</em></p>`;
    sbox.style.display = "block";
  }
}
 
// Next Steps page
function initNextStepsPage() {
  const mood = loadMood(), tags = loadTags(), score = Number(mood);
  const fb = document.getElementById("dynamic-feedback");
  if (fb && mood) fb.textContent = score < 30 ? "You've had a heavy day. Be gentle with yourself."
    : score < 50 ? "A bit rough — small steps are enough."
    : score < 70 ? "Holding steady. Here's something to build on."
    : "You're feeling good — keep those habits going.";
 
  const ACTIONS = [
    { tag:"😴", title:"Build your wind-down ritual", desc:"You flagged sleep. Check off what you'll do in the 30 mins before bed.",
      widget: () => makeChecklist(["No work/email after 9 PM","Dim screens","Lay out tomorrow's clothes","Read for 10 mins","Phone out of bedroom"], "Ritual set. 🌙") },
    { tag:"😤", title:"Empty your head", desc:"Get what's looping in your mind onto the page.",
      widget: () => { const w=el("div"),ta=el("textarea"),r=resultBox(); ta.placeholder="What's looping..."; const b=btn("Done",()=>{if(!ta.value.trim())return;b.remove();ta.disabled=true;show(r,"Good. Out of your head now.");});w.append(ta,b,r);return w; } },
    { tag:"🥗", title:"Fuel your next 3 hours", desc:"Plan your next meal and hydration.",
      widget: () => { const w=el("div"),inp=el("input"),r=resultBox(); inp.type="time"; const now=new Date();now.setMinutes(now.getMinutes()+90);inp.value=now.toTimeString().slice(0,5); const b=btn("Lock in meal",()=>{if(!inp.value)return;b.remove();show(r,"Meal locked in. Treating your body with intention.");});w.append(inp,b,r,makeChecklist(["Drink water now","Refill before meal","Skip sugary drink"],"💧 Locked.")); return w; } },
    { tag:"🏃", title:"Commit to one move", desc:"Pick one movement for today.",
      widget: () => { const w=el("div"),r=resultBox(),g=el("div"); ["🚶 10-min walk","🧘 Yoga/stretch","🚴 Cardio","💃 Dance"].forEach(o=>{const b=el("button");b.textContent=o;b.onclick=()=>{g.querySelectorAll("button").forEach(x=>x.classList.remove("on"));b.classList.add("on");show(r,`"${o}" — committed.`);};g.appendChild(b);});w.append(g,r);return w; } },
    { tag:"💼", title:"Plan tomorrow now", desc:"Three priorities so your brain can rest tonight.",
      widget: () => { const w=el("div"),r=resultBox(),inputs=[]; for(let i=1;i<=3;i++){const inp=el("input");inp.type="text";inp.placeholder=`Task ${i}...`;inputs.push(inp);w.appendChild(inp);} const b=btn("Save plan",()=>{if(!inputs.some(i=>i.value.trim()))return;b.remove();inputs.forEach(i=>i.disabled=true);show(r,"Tomorrow planned. Close your laptop.");});w.append(b,r);return w; } },
    { tag:"🤝", title:"One meaningful message", desc:"Who's one person you'd feel good reaching out to?",
      widget: () => { const w=el("div"),r=resultBox(),g=el("div"),inp=el("input");inp.type="text";inp.placeholder="A name..."; ["Hey, thinking of you 👋","Haven't caught up — how are you?","Fancy a call?"].forEach(s=>{const b=el("button");b.textContent=s;b.onclick=()=>show(r,"Send it — it'll make you feel better.");g.appendChild(b);});w.append(inp,g,r);return w; } },
    { tag:null, title:"Capture what's working", desc:"Three things that made today feel good.",
      widget: () => { const w=el("div"),r=resultBox(),inputs=[]; ["Something that went well:","Someone who helped:","One thing I'm glad exists:"].forEach(p=>{const inp=el("input");inp.type="text";inp.placeholder="...";inputs.push(inp);w.append(el("div",null,p),inp);}); const b=btn("Save moment",()=>{if(!inputs.some(i=>i.value.trim()))return;b.remove();inputs.forEach(i=>i.disabled=true);show(r,"Saved. Worth revisiting on a harder day.");});w.append(b,r);return w; } },
  ];
 
  const action = ACTIONS.find(a => a.tag && tags.some(t => t.startsWith(a.tag))) || ACTIONS[ACTIONS.length - 1];
  const titleEl = document.getElementById("action-title"), descEl = document.getElementById("action-desc"), widgetEl = document.getElementById("action-interactive");
  if (titleEl) titleEl.textContent = action.title;
  if (descEl) descEl.textContent = action.desc;
  if (widgetEl && action.widget) { const w = action.widget(); if (w) widgetEl.appendChild(w); }
 
  const bt = document.getElementById("bonus-tip");
  if (bt && mood) {
    bt.style.display = "block";
    document.getElementById("bonus-tip-title").textContent = score < 40 ? "When things feel heavy" : score < 65 ? "Build on today" : "Ride the momentum";
    document.getElementById("bonus-tip-text").textContent = score < 40 ? "Checking in was already a kind act toward yourself." : score < 65 ? "Mid-range days are great for building habits." : "High-energy days are perfect for what you've been putting off.";
  }
}
 
// Widget utilities
function el(tag, cls, txt) { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
function btn(label, onClick) { const b = el("button"); b.textContent = label; b.onclick = onClick; return b; }
function resultBox() { return el("div", "msg"); }
function show(box, msg) { box.textContent = msg; box.classList.add("show"); }
 
function makeChecklist(items, doneMsg) {
  const wrap = el("div");
  items.forEach(text => {
    const row = el("label", "check-row"), cb = el("input");
    cb.type = "checkbox";
    cb.onchange = () => {
      row.classList.toggle("done", cb.checked);
      const done = wrap.querySelector(".check-done");
      if (done) done.classList.toggle("show", wrap.querySelectorAll(":checked").length === items.length);
    };
    row.append(cb, text); wrap.appendChild(row);
  });
  wrap.appendChild(el("div", "check-done", doneMsg));
  return wrap;
}
 
// Router
window.addEventListener("DOMContentLoaded", () => {
  const t = document.title;
  if (t.startsWith("Check In"))   initCheckInPage();
  if (t.startsWith("Your Week"))  initWeekPage();
  if (t.startsWith("Next Steps")) initNextStepsPage();
});
 