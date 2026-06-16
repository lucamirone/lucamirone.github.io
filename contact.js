const menuButton = document.querySelector(".menu-button");
const nav = document.querySelector("#site-nav");

menuButton?.addEventListener("click", () => {
  const open = nav?.classList.toggle("open");
  menuButton.setAttribute("aria-expanded", String(Boolean(open)));
});

nav?.addEventListener("click", () => {
  nav.classList.remove("open");
  menuButton?.setAttribute("aria-expanded", "false");
});

const contactParts = {
  phone: ["+1", "917", "370", "4886"],
  email: ["Luca", "LucaMirone.com"]
};

document.querySelectorAll("[data-contact-action]").forEach((link) => {
  const action = link.dataset.contactAction;
  if (action === "call") {
    link.href = `tel:${contactParts.phone.join("")}`;
  }
  if (action === "text") {
    link.href = `sms:${contactParts.phone.join("")}`;
  }
  if (action === "email") {
    link.href = `mailto:${contactParts.email.join("@")}`;
  }
});

document.querySelectorAll("[data-current-year]").forEach((element) => {
  element.textContent = String(new Date().getFullYear());
});
