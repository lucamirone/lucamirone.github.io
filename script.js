const menuButton = document.querySelector(".menu-button");
const nav = document.querySelector("#site-nav");
const form = document.querySelector("#intake-form");
const steps = [...document.querySelectorAll(".form-step")];
const progress = [...document.querySelectorAll(".form-progress span")];
let activeStep = 0;

menuButton.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  menuButton.setAttribute("aria-expanded", String(open));
});

nav.addEventListener("click", () => {
  nav.classList.remove("open");
  menuButton.setAttribute("aria-expanded", "false");
});

const assessmentGroups = [...document.querySelectorAll(".assessment-group")];
const assessmentToggle = document.querySelector("#assessment-toggle");
const assessmentToggleText = document.querySelector(".assessment-toggle-text");
const assessmentPanel = document.querySelector("#initial-advisory-assessment-form");
const assessmentSection = document.querySelector("#assessment");
const expandAssessment = document.querySelector("#expand-assessment");
const collapseAssessment = document.querySelector("#collapse-assessment");
const engagementItems = [...document.querySelectorAll(".engagement-item")];

function setAssessmentOpen(open) {
  assessmentPanel?.classList.toggle("is-open", open);
  assessmentSection?.classList.toggle("has-open", open);
  assessmentPanel?.setAttribute("aria-hidden", String(!open));
  assessmentToggle?.setAttribute("aria-expanded", String(open));

  if (assessmentPanel) {
    if (open) {
      assessmentPanel.removeAttribute("inert");
    } else {
      assessmentPanel.setAttribute("inert", "");
    }
  }

  if (assessmentToggleText) {
    assessmentToggleText.textContent = open
      ? "Hide Initial Advisory Assessment"
      : "Open Initial Advisory Assessment";
  }
}

setAssessmentOpen(false);

assessmentToggle?.addEventListener("click", () => {
  const open = assessmentToggle.getAttribute("aria-expanded") !== "true";
  setAssessmentOpen(open);
  if (open) {
    history.replaceState(null, "", "#assessment");
    window.setTimeout(() => assessmentSection?.scrollIntoView({ behavior: "smooth" }), 120);
  }
});

document.addEventListener("click", (event) => {
  const link = event.target.closest(".assessment-nav-link");
  if (!link) return;
  event.preventDefault();
  setAssessmentOpen(true);
  history.replaceState(null, "", "#assessment");
  window.setTimeout(() => assessmentSection?.scrollIntoView({ behavior: "smooth" }), 120);
});

engagementItems.forEach((item) => {
  item.addEventListener("toggle", () => {
    if (!item.open) return;
    engagementItems.forEach((otherItem) => {
      if (otherItem !== item) otherItem.open = false;
    });
  });
});

expandAssessment?.addEventListener("click", () => {
  assessmentGroups.forEach((group) => {
    group.open = true;
  });
});

collapseAssessment?.addEventListener("click", () => {
  assessmentGroups.forEach((group) => {
    group.open = false;
  });
});

function showStep(nextIndex) {
  steps.forEach((step, index) => step.classList.toggle("active", index === nextIndex));
  progress.forEach((marker, index) => marker.classList.toggle("active", index <= nextIndex));
  activeStep = nextIndex;
}

document.querySelectorAll(".next-step").forEach((button) => {
  button.addEventListener("click", () => {
    const fields = [...steps[activeStep].querySelectorAll("input, select, textarea")];
    if (!fields.every((field) => field.reportValidity())) return;
    showStep(Math.min(activeStep + 1, steps.length - 1));
  });
});

document.querySelectorAll(".previous-step").forEach((button) => {
  button.addEventListener("click", () => showStep(Math.max(activeStep - 1, 0)));
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;

  const data = Object.fromEntries(new FormData(form).entries());
  const subject = `Consultation Request: ${data.area} — ${data.name}`;
  const body = [
    "CONSULTATION QUESTIONNAIRE",
    "",
    `Name: ${data.name}`,
    `Email: ${data.email}`,
    `Company: ${data.company || "Not provided"}`,
    `Advisory area: ${data.area}`,
    `Business stage: ${data.stage}`,
    `Timeline: ${data.timeline}`,
    "",
    "Objectives:",
    data.objectives,
    "",
    "Additional context:",
    data.message || "Not provided",
  ].join("\n");

  const mailto = `mailto:Luca@LucaMirone.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  document.querySelector("#success-name").textContent = data.name.split(" ")[0];
  document.querySelector("#email-brief").href = mailto;
  steps.forEach((step) => step.classList.remove("active"));
  document.querySelector(".form-success").hidden = false;
});

const observer = new IntersectionObserver(
  (entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add("visible")),
  { threshold: 0.12 }
);
document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));
document.querySelector("#year").textContent = new Date().getFullYear();
