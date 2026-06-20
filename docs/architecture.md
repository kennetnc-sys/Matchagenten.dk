# Architecture

Matchpartneren.dk er et statisk website hostet på Vercel.

Kontaktformularen bruger en lille Vercel serverless API-funktion til at sende
mail sikkert fra backend. Frontend må ikke indeholde SMTP-koder, API-nøgler
eller andre hemmeligheder.

## Struktur

- `index.html` - forside.
- `om-matchpartneren.html` - om Matchpartneren og faglig baggrund.
- `privatlivspolitik.html` - privatlivspolitik.
- `styles.css` - fælles styling.
- `script.js` - fælles frontend-adfærd.
- `api/contact.js` - serverless endpoint for både kontaktformular og demo-rapport.
- `api/_assets/demo-rapport.pdf` - demo-rapporten der sendes automatisk ved
  bestilling. Ligger under `api/` (ikke `assets/`), så Vercel ikke serverer den
  offentligt. `vercel.json` (`includeFiles`) sikrer, at filen bundtes med
  funktionen.
- `api/_assets/signatur.png` - mailsignatur, der vedhæftes som inline-billede
  (cid) i hilsen-mailen til bestilleren.
- `vercel.json` - bundter `api/_assets/**` med serverless-funktionen.
- `assets/` - logoer, portrætter og øvrige billeder (offentligt tilgængelige).
- `favicon.ico` og `assets/favicon.png` - favicon baseret på logoets ikon uden tekst.
- `robots.txt` - åben crawler-politik for søgemaskiner.
- `sitemap.xml` - sitemap med de publicerede sider.

## Deployment

- GitHub repo: `kennetnc-sys/Matchagenten.dk`.
- Publicering sker via Vercel, når ændringer ligger på `main`.
- Normal vej til live ændringer er feature branch -> PR -> merge til `main`.
- `docs/` er intern dokumentation og ekskluderes fra Vercel via `.vercelignore`.

## Kontaktformular

- Frontend sender formular-data til `/api/contact`.
- Serverless funktionen sender mail via Microsoft Graph.
- Modtager er `CONTACT_TO_EMAIL`, med fallback til `knc@matchpartneren.dk`.
- Afsender-mailbox er `CONTACT_FROM_EMAIL` og skal være en adresse/mailbox på
  `matchpartneren.dk`, fx `knc@matchpartneren.dk`.
- Brugerens indtastede e-mail bruges kun som `Reply-To`.
- Graph credentials skal ligge som Vercel environment variables:
  `MS_GRAPH_TENANT_ID`, `MS_GRAPH_CLIENT_ID` og `MS_GRAPH_CLIENT_SECRET`.
- `.env.example` viser de nødvendige variabelnavne uden secrets.
- Secrets må aldrig committes i repoet.

## Demo-rapport

- Knappen "Bestil demo-rapport" på forsiden åbner en kort formular (navn,
  kommune, e-mail) i en dialog. Frontend sender med `requestType: "Demo-rapport"`.
- Serverless funktionen sender to mails via Microsoft Graph fra
  `CONTACT_FROM_EMAIL`:
  1. En hilsen til bestilleren med `api/_assets/demo-rapport.pdf` vedhæftet
     (gemmes i Sendt post via `saveToSentItems`).
  2. En orientering til ejeren (`CONTACT_TO_EMAIL`).
- Demo-bestillinger kræver gyldig e-mail, men ikke sagsbeskrivelse. Den
  eksisterende sparrings-formular er uændret.
- Rapporten indeholder reelle kontaktoplysninger på tilbud og må derfor ikke
  lægges i `assets/` eller på anden måde gøres offentligt tilgængelig.
- Opdater PDF'en ved at erstatte `api/_assets/demo-rapport.pdf`.

## Style-principper

- Bevar eksisterende statiske HTML/CSS-struktur.
- Genbrug eksisterende klasser og layoutmønstre.
- Lav tekstændringer direkte i den relevante HTML-fil.
- Gem tekstfiler som UTF-8.
- Undgå nye frameworks eller abstraktioner uden klar grund.
- Opdater `docs/` samtidig, hvis en ændring påvirker arbejdsgang, arkitektur
  eller style-principper.
