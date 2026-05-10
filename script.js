const dialog = document.querySelector("#contact-dialog");
const form = document.querySelector("#contact-form");
const triggerButtons = document.querySelectorAll("[data-contact-trigger]");
const closeButton = document.querySelector("[data-contact-close]");
const errorMessage = document.querySelector("[data-form-error]");
const successMessage = document.querySelector("[data-form-success]");

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

form?.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  const hasName = String(formData.get("name") || "").trim().length > 0;
  const hasMunicipality = String(formData.get("municipality") || "").trim().length > 0;
  const hasPhone = String(formData.get("phone") || "").trim().length > 0;
  const hasEmail = String(formData.get("email") || "").trim().length > 0;
  const hasDescription = String(formData.get("caseDescription") || "").trim().length > 0;
  const isValid = hasName && hasMunicipality && (hasPhone || hasEmail) && hasDescription;

  errorMessage.hidden = isValid;

  if (!isValid) {
    return;
  }

  // TODO: Connect this form to a secure backend or mail service before collecting live submissions.
  form.hidden = true;
  successMessage.hidden = false;
});
