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
const analyticsMeasurementId = "G-3RNHB3J5TY";
let analyticsLoaded = false;

function loadGoogleAnalytics() {
  if (analyticsLoaded || typeof window.gtag !== "function") return;
  analyticsLoaded = true;

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${analyticsMeasurementId}`;
  document.head.append(script);

  window.gtag("js", new Date());
  window.gtag("config", analyticsMeasurementId);
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
  window.gtag("event", name, parameters);
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
  });

  document.querySelector("#reject-analytics")?.addEventListener("click", () => {
    localStorage.setItem(analyticsConsentKey, "denied");
    updateAnalyticsConsent(false);
    banner.hidden = true;
  });

  document.querySelectorAll('a[href$=".vcf"]').forEach((link) => {
    link.addEventListener("click", () => {
      trackAnalyticsEvent("contact_download", { file_name: "luca-mirone-contact.vcf" });
    });
  });

  document.querySelector("#advisory-assessment")?.addEventListener("submit", () => {
    trackAnalyticsEvent("generate_lead", { form_name: "advisory_assessment" });
  });
  document.querySelector("#intake-form")?.addEventListener("submit", () => {
    trackAnalyticsEvent("generate_lead", { form_name: "contact_form" });
  });
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
    addHiddenField(assessmentForm, "_next", "https://lucamirone.com/it/?submitted=assessment#assessment");
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
      toolbarText.innerHTML = "<strong>Compila le informazioni che ritieni più rilevanti.</strong> Sono richiesti solo nome ed email; ogni altro campo è facoltativo.";
    }

    const closing = assessmentForm.querySelector(".assessment-closing");
    const closingTitle = closing?.querySelector("summary strong");
    const closingSummary = closing?.querySelector("summary small");
    const closingHeading = closing?.querySelector(".assessment-cta h3");
    const closingParagraphs = closing?.querySelectorAll(".assessment-cta p");
    if (closingTitle) closingTitle.textContent = "Invia richiesta";
    if (closingSummary) closingSummary.textContent = "Invia le informazioni direttamente a Luca";
    if (closingHeading) closingHeading.textContent = "Invia la richiesta quando sei pronto.";
    if (closingParagraphs?.[0]) closingParagraphs[0].textContent = `Le informazioni saranno inviate direttamente a ${deliveryEmail}.`;
    if (closingParagraphs?.[1]) closingParagraphs[1].textContent = "Sono richiesti solo nome ed email. Compila gli altri campi che ritieni utili.";

    const existingAssessmentAction = closing?.querySelector(".button");
    if (existingAssessmentAction?.tagName !== "BUTTON") {
      const submitButton = document.createElement("button");
      submitButton.className = "button button-gold";
      submitButton.type = "submit";
      submitButton.textContent = "Invia richiesta";
      existingAssessmentAction?.replaceWith(submitButton);
    }

    addSubmissionConfirmation(
      assessmentForm,
      "assessment-submission-confirmation",
      "<strong>Assessment inviato.</strong> Grazie. Luca esaminerà le informazioni e risponderà via email.",
      true
    );
  }

  const intakeForm = document.querySelector("#intake-form");
  if (intakeForm) {
    intakeForm.action = `https://formsubmit.co/${deliveryEmail}`;
    intakeForm.method = "POST";
    addHiddenField(intakeForm, "_subject", "New Consultation Request from lucamirone.com");
    addHiddenField(intakeForm, "_template", "table");
    addHiddenField(intakeForm, "_next", "https://lucamirone.com/it/?submitted=contact#consultation");
    if (!intakeForm.querySelector('[name="_honey"]')) {
      const honey = document.createElement("input");
      honey.className = "form-honey";
      honey.name = "_honey";
      honey.tabIndex = -1;
      honey.autocomplete = "off";
      intakeForm.prepend(honey);
    }

    const submitButton = intakeForm.querySelector('button[type="submit"]');
    if (submitButton) submitButton.textContent = "Invia messaggio";
    const privacyNote = intakeForm.querySelector(".form-privacy-note");
    if (privacyNote) privacyNote.innerHTML = 'Le informazioni inviate tramite questo modulo sono gestite secondo la <a href="../privacy-policy/">Privacy Policy</a>.';
    intakeForm.querySelector(".form-success")?.remove();
    addSubmissionConfirmation(
      intakeForm,
      "contact-submission-confirmation",
      "<strong>Messaggio inviato.</strong> Grazie. Luca risponderà via email."
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
      ? "Nascondi Assessment iniziale"
      : "Apri Assessment iniziale";
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
