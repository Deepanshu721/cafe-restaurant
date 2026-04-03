const menuToggle = document.querySelector(".menu-toggle");
const nav = document.querySelector(".nav");
const siteHeader = document.querySelector(".site-header");
const yearNode = document.querySelector("#year");
const viewLinks = document.querySelectorAll("[data-view-link]");
const sectionLinks = document.querySelectorAll("[data-section-link]");
const viewPanels = document.querySelectorAll("[data-view]");
const galleryTabs = document.querySelectorAll("[data-gallery-filter]");
const galleryPanels = document.querySelectorAll("[data-gallery-panel]");
const contactForm = document.querySelector("#contact-form");
const contactStatus = document.querySelector("#contact-form-status");
const formToast = document.querySelector("#form-toast");
const contactPopupTrigger = document.querySelector("[data-contact-popup-trigger]");
const contactPopup = document.querySelector("#contact-popup");
const contactPopupCloseNodes = document.querySelectorAll("[data-contact-popup-close]");
let toastTimer;
let contactPopupTimer;

if (yearNode) {
  yearNode.textContent = new Date().getFullYear();
}

const setView = (viewName) => {
  viewPanels.forEach((panel) => {
    panel.hidden = panel.getAttribute("data-view") !== viewName;
  });

  viewLinks.forEach((link) => {
    const isActive = link.getAttribute("data-view-link") === viewName;
    link.classList.toggle("is-active", isActive);
  });
};

const setGalleryTab = (tabName) => {
  galleryTabs.forEach((tab) => {
    const isActive = tab.getAttribute("data-gallery-filter") === tabName;
    tab.classList.toggle("is-active", isActive);
    tab.setAttribute("aria-selected", String(isActive));
  });

  galleryPanels.forEach((panel) => {
    const isActive = panel.getAttribute("data-gallery-panel") === tabName;
    panel.hidden = !isActive;
    panel.classList.toggle("is-active", isActive);
  });
};

const showToast = (message) => {
  if (!formToast) {
    return;
  }

  window.clearTimeout(toastTimer);
  formToast.textContent = message;
  formToast.hidden = false;
  formToast.classList.add("is-visible");

  toastTimer = window.setTimeout(() => {
    formToast.hidden = true;
    formToast.classList.remove("is-visible");
  }, 3500);
};

const setContactStatus = (message, type = "") => {
  if (!contactStatus) {
    return;
  }

  contactStatus.textContent = message;
  contactStatus.classList.remove("is-error", "is-success");
  if (type) {
    contactStatus.classList.add(type);
  }
};

const openContactPopup = () => {
  if (!contactPopup) {
    return;
  }

  window.clearTimeout(contactPopupTimer);
  contactPopup.hidden = false;
  window.requestAnimationFrame(() => {
    contactPopup.classList.add("is-open");
  });
  document.body.style.overflow = "hidden";
};

const closeContactPopup = () => {
  if (!contactPopup) {
    return;
  }

  contactPopup.classList.remove("is-open");
  document.body.style.overflow = "";
  window.clearTimeout(contactPopupTimer);
  contactPopupTimer = window.setTimeout(() => {
    contactPopup.hidden = true;
  }, 320);
};

const closeMobileHeader = () => {
  if (!menuToggle || !nav || !siteHeader) {
    return;
  }

  nav.classList.remove("is-open");
  siteHeader.classList.remove("is-expanded");
  menuToggle.setAttribute("aria-expanded", "false");
};

const clearFieldErrors = (form) => {
  form.querySelectorAll(".is-invalid").forEach((field) => {
    field.classList.remove("is-invalid");
  });
};

const markInvalid = (field, message) => {
  field.classList.add("is-invalid");
  setContactStatus(message, "is-error");
};

const looksSuspicious = (value) => {
  const suspiciousPatterns = [
    /https?:\/\//i,
    /www\./i,
    /<script/i,
    /select\s+.+from/i,
    /union\s+select/i,
    /drop\s+table/i,
    /--/,
    /\b(?:bitcoin|crypto|casino|loan|viagra)\b/i,
  ];

  return suspiciousPatterns.some((pattern) => pattern.test(value));
};

const validateContactForm = (form) => {
  clearFieldErrors(form);
  setContactStatus("");

  const nameField = form.elements.namedItem("name");
  const emailField = form.elements.namedItem("email");
  const phoneField = form.elements.namedItem("phone");
  const messageField = form.elements.namedItem("message");
  const trapField = form.elements.namedItem("_gotcha");

  const name = nameField.value.trim();
  const email = emailField.value.trim();
  const phone = phoneField.value.trim();
  const message = messageField.value.trim();

  if (trapField && trapField.value.trim() !== "") {
    setContactStatus("Submission blocked as suspicious.", "is-error");
    return false;
  }

  if (name.length < 2 || !/^[a-zA-Z\s.'-]+$/.test(name)) {
    markInvalid(nameField, "Please enter a valid name.");
    return false;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    markInvalid(emailField, "Please enter a valid email address.");
    return false;
  }

  if (!/^\+?[0-9()\s-]{8,20}$/.test(phone)) {
    markInvalid(phoneField, "Please enter a valid phone number.");
    return false;
  }

  if (message.length < 15) {
    markInvalid(messageField, "Please enter a message with at least 15 characters.");
    return false;
  }

  if (message.length > 1500) {
    markInvalid(messageField, "Your message is too long.");
    return false;
  }

  if (looksSuspicious(name) || looksSuspicious(email) || looksSuspicious(message)) {
    setContactStatus("Your message looks suspicious. Please remove links or unusual code-like text.", "is-error");
    [nameField, emailField, messageField].forEach((field) => field.classList.add("is-invalid"));
    return false;
  }

  return true;
};

const submitContactForm = async (form) => {
  const submitButton = form.querySelector(".contact-form__submit");
  const recipient = form.getAttribute("data-recipient");

  if (!recipient) {
    setContactStatus("Form recipient is missing.", "is-error");
    return;
  }

  const formData = new FormData();
  formData.append("name", form.elements.namedItem("name").value.trim());
  formData.append("email", form.elements.namedItem("email").value.trim());
  formData.append("phone", form.elements.namedItem("phone").value.trim());
  formData.append("message", form.elements.namedItem("message").value.trim());
  formData.append("_subject", "New website enquiry from Dilli Brew House");
  formData.append("_template", "table");
  formData.append("_captcha", "false");

  submitButton.disabled = true;
  submitButton.textContent = "Sending...";
  setContactStatus("Checking and sending your message...");

  try {
    const response = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(recipient)}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
      body: formData,
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok || result.success === "false") {
      throw new Error(result.message || "Unable to send the message right now.");
    }

    form.reset();
    clearFieldErrors(form);
    setContactStatus("Your message has been sent successfully.", "is-success");
    showToast("Thanks. Your message was sent successfully.");
  } catch (error) {
    setContactStatus(error.message || "Unable to send your message right now. Please try again.", "is-error");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Send";
  }
};

if (menuToggle && nav) {
  menuToggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    if (siteHeader) {
      siteHeader.classList.toggle("is-expanded", isOpen);
    }
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });
}

if (contactPopupTrigger) {
  contactPopupTrigger.addEventListener("click", () => {
    openContactPopup();
  });
}

contactPopupCloseNodes.forEach((node) => {
  node.addEventListener("click", () => {
    closeContactPopup();
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && contactPopup && !contactPopup.hidden) {
    closeContactPopup();
  }
});

viewLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    const viewName = link.getAttribute("data-view-link");
    if (!viewName) {
      return;
    }

    setView(viewName);
    if (viewName === "gallery") {
      setGalleryTab(link.getAttribute("data-gallery-tab") || "food");
    }
    closeMobileHeader();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
});

sectionLinks.forEach((link) => {
  link.addEventListener("click", () => {
    setView("home");
    closeMobileHeader();
  });
});

galleryTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    setGalleryTab(tab.getAttribute("data-gallery-filter") || "food");
  });
});

if (contactForm) {
  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!validateContactForm(contactForm)) {
      return;
    }

    await submitContactForm(contactForm);
  });
}

setGalleryTab("food");
setView("home");
