# Lessons

## Git og GitHub

- Repoet er forbundet til `git@github.com:kennetnc-sys/Matchagenten.dk.git`.
- Git bruger SSH-nøglen `C:/Users/Kenne/.ssh/codex-github`.
- Hver arbejdsopgave skal ligge på en ny `codex/` feature branch.
- `gh` findes på `C:\Program Files\GitHub CLI\gh.exe` og har admin-adgang til repoet.

## Hjemmesideændringer

- Når brugeren siger, at en ændring skal fremgå på hjemmesiden, betyder det:
  commit, push, opret PR og merge til `main`, så Vercel deployer.
- Undgå direct push til `main`, medmindre brugeren eksplicit beder om det.
- Efter HTML-ændringer skal der gives et klikbart link til den ændrede lokale fil.

## Udført arbejde

- Teksten i `om-matchpartneren.html` er ændret, så den organisatoriske og
  ledelsesmæssige baggrund nu handler om rammer og kvalitet for at sikre
  bæredygtighed i indsatsen.
- PR `#2` blev merged til `main`, hvilket trigger Vercel-deploy.

## Browser

- Den indbyggede Codex-browser kan være åben på lokale `file:///`-sider.
- Hvis browserstyring fejler, verificer filindholdet lokalt og giv brugeren
  et link til HTML-filen.
