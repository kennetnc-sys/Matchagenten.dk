const dialog = document.querySelector("#contact-dialog");
const form = document.querySelector("#contact-form");
const triggerButtons = document.querySelectorAll("[data-contact-trigger]");
const closeButton = document.querySelector("[data-contact-close]");
const errorMessage = document.querySelector("[data-form-error]");
const successMessage = document.querySelector("[data-form-success]");
const submitButton = form?.querySelector('button[type="submit"]');
const validationMessage = "Udfyld navn, kommune, kort beskrivelse samt enten telefon eller e-mail.";
const submitErrorMessage = "Der opstod en fejl ved afsendelse. Prøv igen, eller kontakt mig direkte på telefon.";

function openContactDialog() {
  if (!dialog) return;

  if (form && successMessage && !successMessage.hidden) {
    form.reset();
    form.hidden = false;
    successMessage.hidden = true;
    errorMessage.hidden = true;
  }

  if (typeof dialog.showModal === "function") {
    dialog.showModal();
  } else {
    dialog.setAttribute("open", "");
  }
}

function closeContactDialog() {
  if (!dialog) return;

  if (typeof dialog.close === "function") {
    dialog.close();
  } else {
    dialog.removeAttribute("open");
  }
}

triggerButtons.forEach((button) => {
  button.addEventListener("click", openContactDialog);
});

closeButton?.addEventListener("click", closeContactDialog);

dialog?.addEventListener("click", (event) => {
  if (event.target === dialog) {
    closeContactDialog();
  }
});

form?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  const hasName = String(formData.get("name") || "").trim().length > 0;
  const hasMunicipality = String(formData.get("municipality") || "").trim().length > 0;
  const hasPhone = String(formData.get("phone") || "").trim().length > 0;
  const hasEmail = String(formData.get("email") || "").trim().length > 0;
  const hasDescription = String(formData.get("caseDescription") || "").trim().length > 0;
  const isValid = hasName && hasMunicipality && (hasPhone || hasEmail) && hasDescription;

  errorMessage.textContent = validationMessage;
  errorMessage.hidden = isValid;

  if (!isValid) {
    return;
  }

  const payload = {
    name: String(formData.get("name") || ""),
    municipality: String(formData.get("municipality") || ""),
    phone: String(formData.get("phone") || ""),
    email: String(formData.get("email") || ""),
    caseDescription: String(formData.get("caseDescription") || ""),
    contactPreference: String(formData.get("contactPreference") || "Telefon"),
    pageUrl: window.location.href,
    userAgent: navigator.userAgent,
  };

  const originalButtonText = submitButton?.textContent || "";

  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "Sender...";
  }

  try {
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error("Contact form request failed");
    }

    form.hidden = true;
    successMessage.hidden = false;
  } catch (error) {
    errorMessage.textContent = submitErrorMessage;
    errorMessage.hidden = false;
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
    }
  }
});
