# Architecture

Matchpartneren.dk er et statisk website hostet på Vercel.

## Struktur

- `index.html` - forside.
- `om-matchpartneren.html` - om Matchpartneren og faglig baggrund.
- `privatlivspolitik.html` - privatlivspolitik.
- `styles.css` - fælles styling.
- `script.js` - fælles frontend-adfærd.
- `assets/` - logoer, portrætter og øvrige billeder.

## Deployment

- GitHub repo: `kennetnc-sys/Matchagenten.dk`.
- Publicering sker via Vercel, når ændringer ligger på `main`.
- Normal vej til live ændringer er feature branch -> PR -> merge til `main`.

## Style-principper

- Bevar eksisterende statiske HTML/CSS-struktur.
- Genbrug eksisterende klasser og layoutmønstre.
- Lav tekstændringer direkte i den relevante HTML-fil.
- Undgå nye frameworks eller abstraktioner uden klar grund.
