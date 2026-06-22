const fs = require("fs");
const path = require("path");

const GRAPH_SCOPE = "https://graph.microsoft.com/.default";
const GRAPH_TOKEN_URL_BASE = "https://login.microsoftonline.com";
const GRAPH_SENDMAIL_URL_BASE = "https://graph.microsoft.com/v1.0/users";

const OWNER_FALLBACK_EMAIL = "knc@matchpartneren.dk";
const DEMO_REPORT_PATH = path.join(__dirname, "_assets", "demo-rapport.pdf");
const DEMO_REPORT_FILENAME = "Demo-rapport - Matchpartneren.pdf";

const SIGNATURE_PATH = path.join(__dirname, "_assets", "signatur.png");
const SIGNATURE_CONTENT_ID = "signatur-matchpartneren";

let cachedDemoReportBase64 = null;
let cachedSignatureBase64 = null;

function getDemoReportBase64() {
  if (cachedDemoReportBase64 === null) {
    cachedDemoReportBase64 = fs.readFileSync(DEMO_REPORT_PATH).toString("base64");
  }

  return cachedDemoReportBase64;
}

function getSignatureBase64() {
  if (cachedSignatureBase64 === null) {
    cachedSignatureBase64 = fs.readFileSync(SIGNATURE_PATH).toString("base64");
  }

  return cachedSignatureBase64;
}

const FIELD_LIMITS = {
  name: 120,
  municipality: 120,
  phone: 60,
  email: 160,
  caseDescription: 3000,
  contactPreference: 40,
  requestType: 40,
  pageUrl: 500,
  userAgent: 500,
};

const DEMO_REQUEST_TYPE = "Demo-rapport";

// Hidden form field that real users never see. Bots that fill every input
// will populate it, which lets us reject them without a visible challenge.
const HONEYPOT_FIELD = "website";

// Best-effort, per-instance rate limiting. On serverless this caps floods that
// hit a warm instance; for hard guarantees across instances use a shared store
// (e.g. Vercel KV / Upstash) keyed by IP.
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const rateLimitHits = new Map();

const REQUIRED_ENV_VARS = [
  "MS_GRAPH_TENANT_ID",
  "MS_GRAPH_CLIENT_ID",
  "MS_GRAPH_CLIENT_SECRET",
  "CONTACT_FROM_EMAIL",
];

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];

  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0].trim();
  }

  return (req.socket && req.socket.remoteAddress) || "unknown";
}

function isRateLimited(ip) {
  const now = Date.now();
  const hits = (rateLimitHits.get(ip) || []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

  hits.push(now);
  rateLimitHits.set(ip, hits);

  // Keep the map from growing unbounded by dropping stale buckets.
  if (rateLimitHits.size > 5000) {
    for (const [key, timestamps] of rateLimitHits) {
      const fresh = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

      if (fresh.length === 0) {
        rateLimitHits.delete(key);
      } else {
        rateLimitHits.set(key, fresh);
      }
    }
  }

  return hits.length > RATE_LIMIT_MAX;
}

function isHoneypotTriggered(body) {
  return String((body && body[HONEYPOT_FIELD]) || "").trim().length > 0;
}

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
    requestType: normalizeField(body.requestType, FIELD_LIMITS.requestType) === DEMO_REQUEST_TYPE
      ? DEMO_REQUEST_TYPE
      : "Sagssparring",
    pageUrl: normalizeField(body.pageUrl, FIELD_LIMITS.pageUrl),
    userAgent: normalizeField(body.userAgent, FIELD_LIMITS.userAgent),
  };

  return submission;
}

function isDemoRequest(submission) {
  return submission.requestType === DEMO_REQUEST_TYPE;
}

function validateSubmission(submission) {
  const errors = [];

  if (!submission.name) errors.push("name");
  if (!submission.municipality) errors.push("municipality");

  if (isDemoRequest(submission)) {
    if (!submission.email || !isValidEmail(submission.email)) errors.push("email");
    return errors;
  }

  if (!submission.caseDescription) errors.push("caseDescription");
  if (!submission.phone && !submission.email) errors.push("contact");
  if (submission.email && !isValidEmail(submission.email)) errors.push("email");

  return errors;
}

function buildMessageText(submission) {
  if (isDemoRequest(submission)) {
    return [
      "Ny bestilling af demo-rapport fra Matchpartneren.dk",
      "",
      `Navn: ${submission.name}`,
      `Kommune: ${submission.municipality}`,
      `E-mail: ${submission.email || "Ikke oplyst"}`,
      "",
      "Demo-rapporten er automatisk sendt til bestillerens e-mail.",
      "",
      `Side: ${submission.pageUrl || "Ikke oplyst"}`,
      `Browser: ${submission.userAgent || "Ikke oplyst"}`,
    ].join("\n");
  }

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

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildDemoReportHtml(submission) {
  const firstName = submission.name.trim().split(/\s+/)[0];

  return [
    "<div style=\"font-family: Arial, Helvetica, sans-serif; font-size: 15px; line-height: 1.6; color: #122f35;\">",
    `<p>Kære ${escapeHtml(firstName)}</p>`,
    "<p>Tak for din interesse i Matchpartneren.dk. Vedhæftet finder du en demo-rapport, der viser, hvordan en færdig matchvurdering og tilbudsafdækning ser ud. Den indeholder faglig problemforståelse, målgruppevurdering, en anonymiseret matchforespørgsel og en prioriteret liste over de bedst egnede tilbud.</p>",
    "<p>Rapporten er udarbejdet på en fiktiv borger og er alene tænkt som illustration af form og indhold.</p>",
    "<p>Har du en konkret sag, du gerne vil vende, er du meget velkommen til at kontakte mig. Så aftaler vi næste skridt og sikker fremsendelse af relevant materiale.</p>",
    `<img src="cid:${SIGNATURE_CONTENT_ID}" alt="Med venlig hilsen, Kennet Nygaard Christoffersen, Indehaver, Matchpartneren.dk. Tlf: +45 22 84 46 01. Mail: knc@matchpartneren.dk" width="440" height="115" style="display: block; margin-top: 28px; width: 440px; max-width: 100%; height: auto; border: 0;" />`,
    "</div>",
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

  const responseText = await response.text();
  const payload = JSON.parse(responseText || "{}");

  if (!response.ok || !payload.access_token) {
    throw new Error(`Graph token request failed with status ${response.status}: ${responseText}`);
  }

  return payload.access_token;
}

async function postGraphSendMail(env, accessToken, message, saveToSentItems) {
  const fromEmail = env.CONTACT_FROM_EMAIL;

  const response = await fetch(`${GRAPH_SENDMAIL_URL_BASE}/${encodeURIComponent(fromEmail)}/sendMail`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
      saveToSentItems,
    }),
  });

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(`Graph sendMail failed with status ${response.status}: ${responseText}`);
  }
}

function buildOwnerMessage(submission, env) {
  const toEmail = env.CONTACT_TO_EMAIL || OWNER_FALLBACK_EMAIL;
  const subject = isDemoRequest(submission)
    ? `Demo-rapport bestilt: ${submission.municipality}`
    : `Ny kontaktformular: ${submission.municipality}`;
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

  return message;
}

function buildDemoReportMessage(submission) {
  return {
    subject: "Din demo-rapport fra Matchpartneren.dk",
    body: {
      contentType: "HTML",
      content: buildDemoReportHtml(submission),
    },
    toRecipients: [
      {
        emailAddress: {
          address: submission.email,
          name: submission.name,
        },
      },
    ],
    attachments: [
      {
        "@odata.type": "#microsoft.graph.fileAttachment",
        name: DEMO_REPORT_FILENAME,
        contentType: "application/pdf",
        contentBytes: getDemoReportBase64(),
      },
      {
        "@odata.type": "#microsoft.graph.fileAttachment",
        name: "signatur.png",
        contentType: "image/png",
        contentBytes: getSignatureBase64(),
        isInline: true,
        contentId: SIGNATURE_CONTENT_ID,
      },
    ],
  };
}

async function sendSubmissionMails(submission, env) {
  const accessToken = await getGraphAccessToken(env);

  if (isDemoRequest(submission)) {
    // Send the demo report to the orderer first, and keep a copy in the
    // mailbox's Sent Items so the owner has a record of what went out.
    await postGraphSendMail(env, accessToken, buildDemoReportMessage(submission), true);
  }

  // Always notify the owner about the new submission.
  await postGraphSendMail(env, accessToken, buildOwnerMessage(submission, env), false);
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

  if (isRateLimited(getClientIp(req))) {
    sendJson(res, 429, { error: "rate_limited" });
    return;
  }

  try {
    const body = await readJsonBody(req);

    if (isHoneypotTriggered(body)) {
      // Pretend success so bots do not learn the submission was rejected.
      sendJson(res, 200, { ok: true });
      return;
    }

    const submission = sanitizeSubmission(body);
    const validationErrors = validateSubmission(submission);

    if (validationErrors.length > 0) {
      sendJson(res, 400, { error: "invalid_submission", fields: validationErrors });
      return;
    }

    await sendSubmissionMails(submission, process.env);
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
  buildDemoReportHtml,
  buildOwnerMessage,
  buildDemoReportMessage,
  sanitizeSubmission,
  validateSubmission,
  isHoneypotTriggered,
  isRateLimited,
  getClientIp,
};
