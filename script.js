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

const demoDialog = document.querySelector("#demo-dialog");
const demoForm = document.querySelector("#demo-form");
const demoTriggerButtons = document.querySelectorAll("[data-demo-trigger]");
const demoCloseButton = document.querySelector("[data-demo-close]");
const demoErrorMessage = document.querySelector("[data-demo-error]");
const demoSuccessMessage = document.querySelector("[data-demo-success]");
const demoSubmitButton = demoForm?.querySelector('button[type="submit"]');
const demoValidationMessage = "Udfyld navn, kommune og en gyldig e-mail.";

function openDemoDialog() {
  if (!demoDialog) return;

  if (demoForm && demoSuccessMessage && !demoSuccessMessage.hidden) {
    demoForm.reset();
    demoForm.hidden = false;
    demoSuccessMessage.hidden = true;
    demoErrorMessage.hidden = true;
  }

  if (typeof demoDialog.showModal === "function") {
    demoDialog.showModal();
  } else {
    demoDialog.setAttribute("open", "");
  }
}

function closeDemoDialog() {
  if (!demoDialog) return;

  if (typeof demoDialog.close === "function") {
    demoDialog.close();
  } else {
    demoDialog.removeAttribute("open");
  }
}

demoTriggerButtons.forEach((button) => {
  button.addEventListener("click", openDemoDialog);
});

demoCloseButton?.addEventListener("click", closeDemoDialog);

demoDialog?.addEventListener("click", (event) => {
  if (event.target === demoDialog) {
    closeDemoDialog();
  }
});

demoForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(demoForm);
  const hasName = String(formData.get("name") || "").trim().length > 0;
  const hasMunicipality = String(formData.get("municipality") || "").trim().length > 0;
  const email = String(formData.get("email") || "").trim();
  const hasValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValid = hasName && hasMunicipality && hasValidEmail;

  demoErrorMessage.textContent = demoValidationMessage;
  demoErrorMessage.hidden = isValid;

  if (!isValid) {
    return;
  }

  const payload = {
    name: String(formData.get("name") || ""),
    municipality: String(formData.get("municipality") || ""),
    email,
    requestType: "Demo-rapport",
    pageUrl: window.location.href,
    userAgent: navigator.userAgent,
  };

  const originalButtonText = demoSubmitButton?.textContent || "";

  if (demoSubmitButton) {
    demoSubmitButton.disabled = true;
    demoSubmitButton.textContent = "Sender...";
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
      throw new Error("Demo request failed");
    }

    demoForm.hidden = true;
    demoSuccessMessage.hidden = false;
  } catch (error) {
    demoErrorMessage.textContent = submitErrorMessage;
    demoErrorMessage.hidden = false;
  } finally {
    if (demoSubmitButton) {
      demoSubmitButton.disabled = false;
      demoSubmitButton.textContent = originalButtonText;
    }
  }
});
