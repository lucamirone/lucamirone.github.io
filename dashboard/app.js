const state = {
  authorization: sessionStorage.getItem("dashboardAuthorization") || "",
  data: null
};

const eventLabels = {
  contact_click: "Contact clicks", email_click: "Email clicks", phone_click: "Phone clicks",
  linkedin_click: "LinkedIn clicks", vcard_download: "vCard downloads",
  assessment_start: "Assessment starts", assessment_submit: "Assessment completions",
  consultation_click: "Consultation clicks"
};

const number = (value) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value || 0);
const percent = (value) => `${Math.round((value || 0) * 100)}%`;
const duration = (seconds) => seconds >= 60 ? `${Math.round(seconds / 60)}m` : `${Math.round(seconds || 0)}s`;
const escapeHtml = (value = "") => String(value).replace(/[&<>"']/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
}[character]));

function queryDates() {
  const range = document.querySelector("#date-range").value;
  if (range === "custom") {
    return new URLSearchParams({
      startDate: document.querySelector("#start-date").value,
      endDate: document.querySelector("#end-date").value
    });
  }
  if (range === "ytd") {
    return new URLSearchParams({ startDate: `${new Date().getFullYear()}-01-01`, endDate: "today" });
  }
  return new URLSearchParams({ startDate: range, endDate: "today" });
}

async function loadDashboard() {
  const banner = document.querySelector("#status-banner");
  const loginError = document.querySelector("#login-error");
  loginError.hidden = true;
  banner.textContent = "Loading secure GA4 reporting data…";
  banner.classList.remove("error");
  try {
    const response = await fetch(`/api/analytics?${queryDates()}`, {
      headers: { authorization: state.authorization }
    });
    const payload = await response.json();
    if (!response.ok) {
      const error = new Error(payload.error || "Unable to load dashboard");
      error.status = response.status;
      throw error;
    }
    state.data = payload;
    render(payload);
    document.querySelector("#login-panel").hidden = true;
    document.querySelector("#dashboard-content").hidden = false;
    banner.textContent = "Live GA4 data. Qualified-intent events are aggregated and anonymous.";
  } catch (error) {
    if (error.status === 401) {
      sessionStorage.removeItem("dashboardAuthorization");
      document.querySelector("#login-panel").hidden = false;
      document.querySelector("#dashboard-content").hidden = true;
      loginError.textContent = "The username or password is incorrect.";
      loginError.hidden = false;
      return;
    }

    document.querySelector("#login-panel").hidden = true;
    document.querySelector("#dashboard-content").hidden = false;
    banner.classList.add("error");
    banner.textContent = `Dashboard setup required: ${error.message}`;
  }
}

function metricCard(label, value, note) {
  return `<article class="metric-card"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong><small>${escapeHtml(note)}</small></article>`;
}

function renderOverview(data) {
  const metrics = [
    ["Total users", number(data.overview.totalUsers), "Website reach"],
    ["New users", number(data.overview.newUsers), "First-time visitors"],
    ["Returning users", number(data.overview.returningUsers), "Repeat interest"],
    ["Sessions", number(data.overview.sessions), "Visits"],
    ["Page views", number(data.overview.pageViews), "Content consumption"],
    ["Avg. engagement", duration(data.overview.averageEngagementTime), "Per session"],
    ["Engagement rate", percent(data.overview.engagementRate), "Engaged sessions"],
    ...Object.entries(eventLabels).map(([event, label]) => [label, number(data.events[event]), "Qualified-intent event"])
  ];
  document.querySelector("#overview-cards").innerHTML = metrics.map((item) => metricCard(...item)).join("");
}

function renderLeadScore(data) {
  const score = data.leadScore.averageScoreProxy;
  document.querySelector("#lead-score").innerHTML = `<strong>${number(score)}</strong><span>average intent score proxy<br>${number(data.leadScore.weightedIntentPoints)} weighted points</span>`;
  const hot = (data.events.assessment_submit || 0) + (data.events.email_click || 0) + (data.events.phone_click || 0);
  const warm = (data.events.assessment_start || 0) + (data.events.assessment_toggle_open || 0) + (data.events.vcard_download || 0);
  const cold = Math.max(data.overview.totalUsers - warm - hot, 0);
  const total = Math.max(cold + warm + hot, 1);
  document.querySelector("#lead-tier-bars").innerHTML = [
    ["cold", cold], ["warm", warm], ["hot", hot]
  ].map(([tier, count]) => `<div class="tier-row ${tier}"><span>${tier}</span><div class="bar-track"><div class="bar-fill" style="width:${Math.max((count / total) * 100, 2)}%"></div></div><strong>${number(count)}</strong></div>`).join("");
}

function table(headers, rows) {
  if (!rows.length) return `<div class="empty">Not enough data is available for this view yet.</div>`;
  return `<table><thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead><tbody>${rows.join("")}</tbody></table>`;
}

function renderActivity(data) {
  const rows = data.activity.map((row) => `<tr><td class="event-name">${escapeHtml(row.eventName)}</td><td>${escapeHtml(row.pagePath)}</td><td>${escapeHtml(row.sessionDefaultChannelGroup)}</td><td>${escapeHtml(row.deviceCategory)}</td><td>${escapeHtml([row.city, row.country].filter(Boolean).join(", "))}</td><td>${escapeHtml(row.dateHourMinute)}</td></tr>`);
  document.querySelector("#activity-table").innerHTML = table(["Signal", "Page", "Source", "Device", "Location", "Timestamp"], rows);
}

function renderFunnel(data) {
  const e = data.events;
  const steps = [
    ["Visitors", data.overview.totalUsers],
    ["Advisory viewed", (e.approach_section_view || 0) + (e.services_section_view || 0)],
    ["Assessment opened", e.assessment_toggle_open || 0],
    ["Assessment started", e.assessment_start || 0],
    ["Assessment submitted", e.assessment_submit || 0],
    ["Direct contact", (e.email_click || 0) + (e.phone_click || 0) + (e.linkedin_click || 0) + (e.vcard_download || 0)]
  ];
  document.querySelector("#lead-funnel").innerHTML = steps.map(([label, value], index) => `<article class="funnel-step"><span>Step ${index + 1}</span><strong>${number(value)}</strong><small>${escapeHtml(label)}</small></article>`).join("");
}

function renderSources(data) {
  const max = Math.max(...data.sources.map((row) => row.qualityScore), 1);
  document.querySelector("#source-quality").innerHTML = data.sources.length
    ? data.sources.map((row) => `<div class="source-row"><span>${escapeHtml(row.sessionSource || row.sessionDefaultChannelGroup)}<small>${escapeHtml(row.sessionDefaultChannelGroup)}</small></span><div class="bar-track"><div class="bar-fill" style="width:${Math.max((row.qualityScore / max) * 100, 2)}%"></div></div><strong>${number(row.qualityScore)}</strong></div>`).join("")
    : `<div class="empty">Traffic-source quality will appear after intent events are collected.</div>`;
}

function renderTrend(data) {
  const byDate = data.trend.reduce((result, row) => {
    result[row.date] = (result[row.date] || 0) + row.eventCount;
    return result;
  }, {});
  const values = Object.values(byDate);
  const max = Math.max(...values, 1);
  document.querySelector("#trend-chart").innerHTML = values.length
    ? Object.entries(byDate).map(([date, value]) => `<div class="trend-column" style="height:${Math.max((value / max) * 100, 3)}%" title="${escapeHtml(date)}: ${number(value)} qualified signals"></div>`).join("")
    : `<div class="empty">Trend data will appear after qualified-intent events are collected.</div>`;
}

function renderExperience(data) {
  document.querySelector("#page-table").innerHTML = table(["Page", "Views", "Users", "Engagement", "CTA actions"], data.pages.slice(0, 8).map((row) => `<tr><td>${escapeHtml(row.pageTitle || row.pagePath)}</td><td>${number(row.screenPageViews)}</td><td>${number(row.totalUsers)}</td><td>${duration(row.userEngagementDuration)}</td><td>${number(row.ctaClicks)}</td></tr>`));
  const starts = data.events.assessment_start || 0;
  const submits = data.events.assessment_submit || 0;
  const errors = data.events.form_error || 0;
  document.querySelector("#form-intelligence").innerHTML = `<div class="stat-stack">
    <div class="stat-line"><span>Assessment starts</span><strong>${number(starts)}</strong></div>
    <div class="stat-line"><span>Completions</span><strong>${number(submits)}</strong></div>
    <div class="stat-line"><span>Completion rate</span><strong>${starts ? percent(submits / starts) : "—"}</strong></div>
    <div class="stat-line"><span>Drop-off rate</span><strong>${starts ? percent(Math.max(starts - submits, 0) / starts) : "—"}</strong></div>
    <div class="stat-line"><span>Form errors</span><strong>${number(errors)}</strong></div>
  </div>`;
  document.querySelector("#device-table").innerHTML = table(["Device", "Sessions", "Engagement"], data.devices.slice(0, 8).map((row) => `<tr><td>${escapeHtml(`${row.deviceCategory} · ${row.browser}`)}</td><td>${number(row.sessions)}</td><td>${percent(row.engagementRate)}</td></tr>`));
  document.querySelector("#geography-table").innerHTML = table(["Country / region / city", "Users", "Engaged sessions", "Events"], data.geography.slice(0, 12).map((row) => `<tr><td>${escapeHtml([row.country, row.region, row.city].filter(Boolean).join(" · "))}</td><td>${number(row.totalUsers)}</td><td>${number(row.engagedSessions)}</td><td>${number(row.eventCount)}</td></tr>`));
}

function render(data) {
  renderOverview(data);
  renderLeadScore(data);
  renderActivity(data);
  renderFunnel(data);
  renderSources(data);
  renderTrend(data);
  renderExperience(data);
  document.querySelector("#suggested-actions").innerHTML = data.recommendations.map((recommendation, index) => `<div class="action-card"><span>${index + 1}</span><p>${escapeHtml(recommendation)}</p></div>`).join("");
  document.querySelector("#last-updated").textContent = `Updated ${new Date(data.generatedAt).toLocaleString()}`;
}

document.querySelector("#login-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const username = document.querySelector("#username").value;
  const password = document.querySelector("#password").value;
  state.authorization = `Basic ${btoa(`${username}:${password}`)}`;
  sessionStorage.setItem("dashboardAuthorization", state.authorization);
  loadDashboard();
});

document.querySelector("#refresh").addEventListener("click", loadDashboard);
document.querySelector("#date-range").addEventListener("change", (event) => {
  document.querySelector("#custom-dates").hidden = event.target.value !== "custom";
});

if (state.authorization) loadDashboard();
