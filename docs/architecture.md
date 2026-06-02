# Architecture

Matchpartneren.dk er et statisk website hostet på Vercel.

## Struktur

- `index.html` - forside.
- `om-matchpartneren.html` - om Matchpartneren og faglig baggrund.
- `privatlivspolitik.html` - privatlivspolitik.
- `styles.css` - fælles styling.
- `script.js` - fælles frontend-adfærd.
- `assets/` - logoer, portrætter og øvrige billeder.
- `favicon.ico` og `assets/favicon.png` - favicon baseret på logoets ikon uden tekst.
- `robots.txt` - åben crawler-politik for søgemaskiner.
- `sitemap.xml` - sitemap med de publicerede sider.

## Deployment

- GitHub repo: `kennetnc-sys/Matchagenten.dk`.
- Publicering sker via Vercel, når ændringer ligger på `main`.
- Normal vej til live ændringer er feature branch -> PR -> merge til `main`.
- `docs/` er intern dokumentation og ekskluderes fra Vercel via `.vercelignore`.

## Style-principper

- Bevar eksisterende statiske HTML/CSS-struktur.
- Genbrug eksisterende klasser og layoutmønstre.
- Lav tekstændringer direkte i den relevante HTML-fil.
- Gem tekstfiler som UTF-8.
- Undgå nye frameworks eller abstraktioner uden klar grund.
- Opdater `docs/` samtidig, hvis en ændring påvirker arbejdsgang, arkitektur
  eller style-principper.
