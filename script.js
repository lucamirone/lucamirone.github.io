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
const analyticsConsentKey = "lucamirone-analytics-consent";
const analyticsMeasurementId = "G-5L3N934J2F";
const analyticsVisitKey = "lucamirone-last-visit";
const analyticsSessionVisitKey = "lucamirone-session-visit-recorded";
const analyticsLeadScoreKey = "lucamirone-lead-score";
let analyticsLoaded = false;
let assessmentStarted = false;

const leadScoreValues = {
  page_view: 5,
  approach_section_view: 10,
  services_section_view: 10,
  contact_section_view: 10,
  consultation_click: 10,
  advisory_brief_click: 10,
  scroll_50: 10,
  scroll_75: 15,
  assessment_toggle_open: 15,
  assessment_start: 25,
  assessment_submit: 50,
  email_click: 35,
  phone_click: 35,
  vcard_download: 30,
  linkedin_click: 20,
  return_visit: 20,
  long_session_2min: 15,
  long_session_5min: 25
};

function loadGoogleAnalytics() {
  if (analyticsLoaded || typeof window.gtag !== "function") return;
  analyticsLoaded = true;

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${analyticsMeasurementId}`;
  document.head.append(script);

  window.gtag("js", new Date());
  window.gtag("config", analyticsMeasurementId);
  updateLeadScore("page_view");
}

function updateAnalyticsConsent(granted) {
  if (typeof window.gtag !== "function") return;
  window.gtag("consent", "update", {
    analytics_storage: granted ? "granted" : "denied"
  });
  if (granted) loadGoogleAnalytics();
}

function trackAnalyticsEvent(name, parameters = {}) {
  if (
    localStorage.getItem(analyticsConsentKey) !== "granted" ||
    typeof window.gtag !== "function"
  ) return;
  window.gtag("event", name, {
    page_path: window.location.pathname,
    page_title: document.title,
    language: document.documentElement.lang || navigator.language,
    ...parameters
  });
}

function getLeadTier(score) {
  if (score >= 60) return "hot";
  if (score >= 25) return "warm";
  return "cold";
}

function recordLeadSignal(name, parameters = {}) {
  trackAnalyticsEvent(name, parameters);
  updateLeadScore(name);
}

function updateLeadScore(name) {
  const points = leadScoreValues[name] || 0;
  if (!points) return;

  const nextScore = Number(sessionStorage.getItem(analyticsLeadScoreKey) || 0) + points;
  sessionStorage.setItem(analyticsLeadScoreKey, String(nextScore));
  trackAnalyticsEvent("lead_score_update", {
    score_value: nextScore,
    score_points_added: points,
    lead_tier: getLeadTier(nextScore),
    signal_name: name
  });
}

function getSafeInterests(form, fieldNames) {
  if (!form) return "not_provided";
  const selector = fieldNames.map((fieldName) => `[name="${fieldName}"]`).join(",");
  const selected = [...form.querySelectorAll(selector)]
    .filter((field) => field.matches("select") || field.checked)
    .map((field) => field.value)
    .filter(Boolean)
    .slice(0, 3);
  return selected.length ? selected.join(" | ") : "not_provided";
}

function configureAnalyticsConsent() {
  const banner = document.querySelector("#analytics-consent");
  const savedConsent = localStorage.getItem(analyticsConsentKey);

  if (savedConsent === "granted") updateAnalyticsConsent(true);
  if (!savedConsent) banner?.removeAttribute("hidden");

  document.querySelector("#accept-analytics")?.addEventListener("click", () => {
    localStorage.setItem(analyticsConsentKey, "granted");
    updateAnalyticsConsent(true);
    banner.hidden = true;
    configureIntentTracking();
  });

  document.querySelector("#reject-analytics")?.addEventListener("click", () => {
    localStorage.setItem(analyticsConsentKey, "denied");
    updateAnalyticsConsent(false);
    banner.hidden = true;
  });

  if (savedConsent === "granted") configureIntentTracking();
}

function configureIntentTracking() {
  if (document.documentElement.dataset.intentTrackingReady === "true") return;
  document.documentElement.dataset.intentTrackingReady = "true";

  const assessmentForm = document.querySelector("#advisory-assessment");
  const submittedForm = new URLSearchParams(window.location.search).get("submitted");
  const visitTimestamp = Number(localStorage.getItem(analyticsVisitKey) || 0);
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;

  if (!sessionStorage.getItem(analyticsSessionVisitKey)) {
    if (visitTimestamp && Date.now() - visitTimestamp <= thirtyDays) {
      recordLeadSignal("return_visit");
    }
    localStorage.setItem(analyticsVisitKey, String(Date.now()));
    sessionStorage.setItem(analyticsSessionVisitKey, "true");
  }

  document.addEventListener("click", (event) => {
    const link = event.target.closest("a, button");
    if (!link) return;

    const href = link.getAttribute("href") || "";
    const buttonText = (link.innerText || link.getAttribute("aria-label") || "")
      .trim()
      .slice(0, 80);
    const sectionName = link.closest("section, footer")?.id || "global";
    const parameters = { button_text: buttonText, section_name: sectionName };

    if (href.startsWith("mailto:")) recordLeadSignal("email_click", parameters);
    if (href.startsWith("tel:")) recordLeadSignal("phone_click", parameters);
    if (href.includes("linkedin.com")) recordLeadSignal("linkedin_click", parameters);
    if (href.endsWith(".vcf")) recordLeadSignal("vcard_download", parameters);
    if (/consult/i.test(buttonText)) recordLeadSignal("consultation_click", parameters);
    if (/advisory brief/i.test(buttonText)) recordLeadSignal("advisory_brief_click", parameters);
    if (href === "#contact" || href.startsWith("mailto:") || href.startsWith("tel:")) {
      trackAnalyticsEvent("contact_click", { ...parameters, link_type: href.split(":")[0] || "anchor" });
    }
  });

  assessmentToggle?.addEventListener("click", () => {
    if (assessmentToggle.getAttribute("aria-expanded") !== "true") {
      recordLeadSignal("assessment_toggle_open", { section_name: "assessment" });
    }
  });

  assessmentForm?.addEventListener("input", () => {
    if (assessmentStarted) return;
    assessmentStarted = true;
    recordLeadSignal("assessment_start", {
      section_name: "assessment",
      form_step: "1"
    });
  });

  assessmentGroups.forEach((group, index) => {
    group.addEventListener("toggle", () => {
      if (!group.open) return;
      trackAnalyticsEvent("assessment_step_progress", {
        section_name: "assessment",
        form_step: String(index + 1)
      });
    });
  });

  document.querySelectorAll("form").forEach((form) => {
    form.addEventListener("invalid", (event) => {
      trackAnalyticsEvent("form_error", {
        form_name: form.id || "unknown",
        field_type: event.target.type || event.target.tagName.toLowerCase()
      });
    }, true);
  });

  assessmentForm?.addEventListener("submit", () => {
    recordLeadSignal("assessment_submit", {
      form_name: "advisory_assessment",
      market_interest: getSafeInterests(assessmentForm, ["assessment_target_market", "assessment_market_support"]),
      service_interest: getSafeInterests(assessmentForm, ["assessment_support_type"])
    });
  });

  document.querySelector("#intake-form")?.addEventListener("submit", () => {
    trackAnalyticsEvent("contact_submit", { form_name: "contact_form" });
  });

  if (submittedForm) {
    trackAnalyticsEvent("form_success", { form_name: submittedForm });
  }

  const sectionEvents = {
    approach: "approach_section_view",
    engagement: "services_section_view",
    contact: "contact_section_view"
  };
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting || entry.target.dataset.analyticsViewed === "true") return;
      entry.target.dataset.analyticsViewed = "true";
      recordLeadSignal(sectionEvents[entry.target.id], { section_name: entry.target.id });
    });
  }, { threshold: 0.45 });
  Object.keys(sectionEvents).forEach((id) => {
    const section = document.querySelector(`#${id}`);
    if (section) sectionObserver.observe(section);
  });

  const scrollMilestones = new Set();
  window.addEventListener("scroll", () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollable <= 0) return;
    const percent = Math.round((window.scrollY / scrollable) * 100);
    [50, 75, 90].forEach((milestone) => {
      if (percent < milestone || scrollMilestones.has(milestone)) return;
      scrollMilestones.add(milestone);
      recordLeadSignal(`scroll_${milestone}`, { percent_scrolled: milestone });
    });
  }, { passive: true });

  window.setTimeout(() => recordLeadSignal("long_session_2min"), 2 * 60 * 1000);
  window.setTimeout(() => recordLeadSignal("long_session_5min"), 5 * 60 * 1000);
}

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
configureAnalyticsConsent();

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
