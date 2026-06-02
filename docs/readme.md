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
2. Tjek lokale branches, remote branches og åbne PRs før ny feature.
3. Der må kun være én aktiv/uafsluttet feature branch ad gangen.
4. Hvis der allerede er en aktiv feature branch, fortsæt på den eller spørg
   brugeren, før en ny oprettes.
5. En feature branch må gerne indeholde flere beslægtede ændringer.
6. Hold ændringer små og tæt på den konkrete opgave.
7. Verificer lokalt i HTML-filen eller browseren.
8. Commit og push feature branchen.
9. Merge først ved direkte anmodning, eller når arbejdet er markeret færdigt.
10. Når ændringen skal fremgå på hjemmesiden, opret og merge PR til `main`.

Vercel deployer fra `main`.

`docs/` er undtaget fra Vercel deployment via `.vercelignore`, så mappen bliver
i repoet uden at blive publiceret på hjemmesiden.
