const menuButton = document.querySelector(".menu-button");
const nav = document.querySelector("#site-nav");
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

const deliveryEmail = "Luca@lucamirone.com";

function addHiddenField(form, name, value) {
  if (form.querySelector(`[name="${name}"]`)) return;
  const field = document.createElement("input");
  field.type = "hidden";
  field.name = name;
  field.value = value;
  form.prepend(field);
}

function addSubmissionConfirmation(form, id, message, beforeForm = false) {
  let confirmation = document.querySelector(`#${id}`);
  if (confirmation) return confirmation;

  confirmation = document.createElement("div");
  confirmation.id = id;
  confirmation.className = "submission-confirmation";
  confirmation.setAttribute("role", "status");
  confirmation.hidden = true;
  confirmation.innerHTML = message;

  if (beforeForm) {
    form.before(confirmation);
  } else {
    form.prepend(confirmation);
  }
  return confirmation;
}

function configureFormDelivery() {
  const deliveryStyles = document.createElement("style");
  deliveryStyles.textContent = `
    .form-honey { position: absolute !important; left: -9999px !important; width: 1px !important; height: 1px !important; overflow: hidden !important; }
    .submission-confirmation { margin: 0 0 20px; padding: 16px 18px; color: #173f2b; background: #edf7f0; border: 1px solid #aacdb5; border-left: 4px solid #1f6b45; font-size: 13px; line-height: 1.55; }
    .submission-confirmation strong { display: block; color: #0d3521; }
  `;
  document.head.append(deliveryStyles);

  const assessmentForm = document.querySelector("#advisory-assessment");
  if (assessmentForm) {
    assessmentForm.action = `https://formsubmit.co/${deliveryEmail}`;
    assessmentForm.method = "POST";
    assessmentForm.removeAttribute("novalidate");
    addHiddenField(assessmentForm, "_subject", "New Advisory Assessment from lucamirone.com");
    addHiddenField(assessmentForm, "_template", "table");
    addHiddenField(assessmentForm, "_next", "https://lucamirone.com/?submitted=assessment#assessment");
    if (!assessmentForm.querySelector('[name="_honey"]')) {
      const honey = document.createElement("input");
      honey.className = "form-honey";
      honey.name = "_honey";
      honey.tabIndex = -1;
      honey.autocomplete = "off";
      assessmentForm.prepend(honey);
    }

    const fullName = assessmentForm.querySelector('[name="assessment_full_name"]');
    const assessmentEmail = assessmentForm.querySelector('[name="assessment_email"], [name="email"]');
    fullName?.setAttribute("required", "");
    if (assessmentEmail) {
      assessmentEmail.name = "email";
      assessmentEmail.required = true;
    }

    const toolbarText = document.querySelector(".assessment-toolbar p");
    if (toolbarText) {
      toolbarText.innerHTML = "<strong>Complete only what is useful.</strong> Name and email are required so Luca can reply; every other field is optional.";
    }

    const closing = assessmentForm.querySelector(".assessment-closing");
    const closingTitle = closing?.querySelector("summary strong");
    const closingSummary = closing?.querySelector("summary small");
    const closingHeading = closing?.querySelector(".assessment-cta h3");
    const closingParagraphs = closing?.querySelectorAll(".assessment-cta p");
    if (closingTitle) closingTitle.textContent = "Submit Assessment";
    if (closingSummary) closingSummary.textContent = "Send your completed information directly to Luca";
    if (closingHeading) closingHeading.textContent = "Send your assessment when ready.";
    if (closingParagraphs?.[0]) closingParagraphs[0].textContent = `Your completed assessment will be sent directly to ${deliveryEmail} for review.`;
    if (closingParagraphs?.[1]) closingParagraphs[1].textContent = "Only your name and email are required. Complete as much of the remaining assessment as you wish.";

    const existingAssessmentAction = closing?.querySelector(".button");
    if (existingAssessmentAction?.tagName !== "BUTTON") {
      const submitButton = document.createElement("button");
      submitButton.className = "button button-gold";
      submitButton.type = "submit";
      submitButton.textContent = "Submit Advisory Assessment";
      existingAssessmentAction?.replaceWith(submitButton);
    }

    addSubmissionConfirmation(
      assessmentForm,
      "assessment-submission-confirmation",
      "<strong>Assessment submitted.</strong> Thank you. Luca will review your information and reply by email.",
      true
    );
  }

  const intakeForm = document.querySelector("#intake-form");
  if (intakeForm) {
    intakeForm.action = `https://formsubmit.co/${deliveryEmail}`;
    intakeForm.method = "POST";
    addHiddenField(intakeForm, "_subject", "New Consultation Request from lucamirone.com");
    addHiddenField(intakeForm, "_template", "table");
    addHiddenField(intakeForm, "_next", "https://lucamirone.com/?submitted=contact#contact");
    if (!intakeForm.querySelector('[name="_honey"]')) {
      const honey = document.createElement("input");
      honey.className = "form-honey";
      honey.name = "_honey";
      honey.tabIndex = -1;
      honey.autocomplete = "off";
      intakeForm.prepend(honey);
    }

    const submitButton = intakeForm.querySelector('button[type="submit"]');
    if (submitButton) submitButton.textContent = "Submit Consultation Request";
    intakeForm.querySelector(".form-success")?.remove();
    addSubmissionConfirmation(
      intakeForm,
      "contact-submission-confirmation",
      "<strong>Consultation request submitted.</strong> Thank you. Luca will reply by email."
    );
  }
}

configureFormDelivery();

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

const submittedForm = new URLSearchParams(window.location.search).get("submitted");
if (submittedForm === "assessment") {
  setAssessmentOpen(true);
  document.querySelector("#assessment-submission-confirmation")?.removeAttribute("hidden");
}
if (submittedForm === "contact") {
  document.querySelector("#contact-submission-confirmation")?.removeAttribute("hidden");
}

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

const observer = new IntersectionObserver(
  (entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add("visible")),
  { threshold: 0.12 }
);
document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));
document.querySelector("#year").textContent = new Date().getFullYear();
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
