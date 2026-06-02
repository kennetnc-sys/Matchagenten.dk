const GRAPH_SCOPE = "https://graph.microsoft.com/.default";
const GRAPH_TOKEN_URL_BASE = "https://login.microsoftonline.com";
const GRAPH_SENDMAIL_URL_BASE = "https://graph.microsoft.com/v1.0/users";

const FIELD_LIMITS = {
  name: 120,
  municipality: 120,
  phone: 60,
  email: 160,
  caseDescription: 3000,
  contactPreference: 40,
  pageUrl: 500,
  userAgent: 500,
};

const REQUIRED_ENV_VARS = [
  "MS_GRAPH_TENANT_ID",
  "MS_GRAPH_CLIENT_ID",
  "MS_GRAPH_CLIENT_SECRET",
  "CONTACT_FROM_EMAIL",
];

function normalizeField(value, limit) {
  return String(value || "")
    .trim()
    .slice(0, limit);
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function sanitizeSubmission(body = {}) {
  const submission = {
    name: normalizeField(body.name, FIELD_LIMITS.name),
    municipality: normalizeField(body.municipality, FIELD_LIMITS.municipality),
    phone: normalizeField(body.phone, FIELD_LIMITS.phone),
    email: normalizeField(body.email, FIELD_LIMITS.email),
    caseDescription: normalizeField(body.caseDescription, FIELD_LIMITS.caseDescription),
    contactPreference: normalizeField(body.contactPreference, FIELD_LIMITS.contactPreference) || "Telefon",
    pageUrl: normalizeField(body.pageUrl, FIELD_LIMITS.pageUrl),
    userAgent: normalizeField(body.userAgent, FIELD_LIMITS.userAgent),
  };

  return submission;
}

function validateSubmission(submission) {
  const errors = [];

  if (!submission.name) errors.push("name");
  if (!submission.municipality) errors.push("municipality");
  if (!submission.caseDescription) errors.push("caseDescription");
  if (!submission.phone && !submission.email) errors.push("contact");
  if (submission.email && !isValidEmail(submission.email)) errors.push("email");

  return errors;
}

function buildMessageText(submission) {
  return [
    "Ny henvendelse fra kontaktformularen på Matchpartneren.dk",
    "",
    `Navn: ${submission.name}`,
    `Kommune: ${submission.municipality}`,
    `Telefon: ${submission.phone || "Ikke oplyst"}`,
    `E-mail: ${submission.email || "Ikke oplyst"}`,
    `Ønsket kontaktform: ${submission.contactPreference}`,
    "",
    "Kort beskrivelse af sagen:",
    submission.caseDescription,
    "",
    `Side: ${submission.pageUrl || "Ikke oplyst"}`,
    `Browser: ${submission.userAgent || "Ikke oplyst"}`,
  ].join("\n");
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === "object") {
    return req.body;
  }

  if (typeof req.body === "string") {
    return JSON.parse(req.body || "{}");
  }

  const chunks = [];

  for await (const chunk of req) {
    chunks.push(chunk);
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
}

function getMissingEnvVars(env) {
  return REQUIRED_ENV_VARS.filter((key) => !env[key]);
}

async function getGraphAccessToken(env) {
  const tokenUrl = `${GRAPH_TOKEN_URL_BASE}/${encodeURIComponent(env.MS_GRAPH_TENANT_ID)}/oauth2/v2.0/token`;
  const tokenBody = new URLSearchParams({
    client_id: env.MS_GRAPH_CLIENT_ID,
    client_secret: env.MS_GRAPH_CLIENT_SECRET,
    scope: GRAPH_SCOPE,
    grant_type: "client_credentials",
  });

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: tokenBody,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok || !payload.access_token) {
    throw new Error(`Graph token request failed with status ${response.status}`);
  }

  return payload.access_token;
}

async function sendGraphMail(submission, env) {
  const accessToken = await getGraphAccessToken(env);
  const toEmail = env.CONTACT_TO_EMAIL || "knc@matchpartneren.dk";
  const fromEmail = env.CONTACT_FROM_EMAIL;
  const subject = `Ny kontaktformular: ${submission.municipality}`;
  const message = {
    subject,
    body: {
      contentType: "Text",
      content: buildMessageText(submission),
    },
    toRecipients: [
      {
        emailAddress: {
          address: toEmail,
        },
      },
    ],
  };

  if (submission.email) {
    message.replyTo = [
      {
        emailAddress: {
          address: submission.email,
          name: submission.name,
        },
      },
    ];
  }

  const response = await fetch(`${GRAPH_SENDMAIL_URL_BASE}/${encodeURIComponent(fromEmail)}/sendMail`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
      saveToSentItems: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`Graph sendMail failed with status ${response.status}`);
  }
}

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    sendJson(res, 405, { error: "method_not_allowed" });
    return;
  }

  const missingEnvVars = getMissingEnvVars(process.env);

  if (missingEnvVars.length > 0) {
    sendJson(res, 500, { error: "mail_not_configured" });
    return;
  }

  try {
    const body = await readJsonBody(req);
    const submission = sanitizeSubmission(body);
    const validationErrors = validateSubmission(submission);

    if (validationErrors.length > 0) {
      sendJson(res, 400, { error: "invalid_submission", fields: validationErrors });
      return;
    }

    await sendGraphMail(submission, process.env);
    sendJson(res, 200, { ok: true });
  } catch (error) {
    console.error("Contact form mail failed", {
      message: error instanceof Error ? error.message : "Unknown error",
    });

    sendJson(res, 502, { error: "mail_send_failed" });
  }
}

module.exports = handler;
module.exports._internals = {
  buildMessageText,
  sanitizeSubmission,
  validateSubmission,
};
