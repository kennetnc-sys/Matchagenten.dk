# Docs for Matchpartneren.dk

Formålet med denne mappe er at fastholde en enkel, ensartet arbejdsgang for
ændringer på hjemmesiden.

Læs altid disse filer før nye features eller større tekstændringer:

- `architecture.md` - hvordan sitet er bygget og deployes.
- `lessons.md` - erfaringer fra tidligere arbejde.

Hold filerne ajour under udvikling, når arbejdsgang, arkitektur, deployment,
style-principper eller konkrete erfaringer ændrer sig.

## Arbejdsgang

1. Start fra seneste `origin/main`.
2. Opret en ny feature branch med `codex/`-prefix.
3. Hold ændringer små og tæt på den konkrete opgave.
4. Verificer lokalt i HTML-filen eller browseren.
5. Commit og push feature branchen.
6. Når ændringen skal fremgå på hjemmesiden, opret og merge PR til `main`.

Vercel deployer fra `main`.

`docs/` er undtaget fra Vercel deployment via `.vercelignore`, så mappen bliver
i repoet uden at blive publiceret på hjemmesiden.
