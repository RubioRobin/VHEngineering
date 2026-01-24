# 🚀 Hoe zet je de Broodjes App online? (Vercel)

Om de applicatie online te zetten en automatisch te laten werken (inclusief de e-mails!), raad ik aan om **Vercel** te gebruiken. Dit is gratis voor hobby-projecten en werkt perfect samen met Next.js.

## Stap 1: GitHub
Zorg dat je project op GitHub staat.
1. Maak een nieuwe repository op GitHub.
2. Push je code naar deze repository.

## Stap 2: Database (Heel Belangrijk!)
Omdat Vercel "serverless" is, kunnen we geen SQLite (bestandje) gebruiken voor de database, want dat bestand wordt gereset bij elke update. We moeten overstappen naar **Postgres**.

Gelukkig heeft Vercel dit ingebouwd.

1. Ga naar [vercel.com](https://vercel.com) en maak een account (inloggen met GitHub).
2. Klik op **"Add New"** -> **"Project"** en importeer je GitHub repo.
3. Tijdens het aanmaken, klik op de tab **"Storage"** (of doe dit na het aanmaken in het dashboard) en voeg een **Vercel Postgres** database toe.
4. Vercel zal automatisch de Environment Variables (`POSTGRES_URL`, etc.) toevoegen aan je project.

## Stap 3: Aanpassen Code voor Productie
Voordat de deploy werkt, moeten we `prisma/schema.prisma` vertellen dat we nu Postgres gebruiken.

1. Open `prisma/schema.prisma`
2. Verander:
   ```prisma
   datasource db {
     provider = "sqlite"
     url      = env("DATABASE_URL")
   }
   ```
   naar:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("POSTGRES_PRISMA_URL") // Of POSTGRES_URL_NON_POOLING
     directUrl = env("POSTGRES_URL_NON_POOLING")
   }
   ```
   *(Let op: Als je dit lokaal verandert, werkt je lokale 'dev.db' niet meer tenzij je de variabelen ook lokaal invult. Je kunt dit het beste pas doen vlak voor je commit naar GitHub)*.

## Stap 4: Environment Variabelen instellen
In het Vercel Dashboard, ga naar **Settings** -> **Environment Variables** en voeg deze toe (als ze er nog niet staan):

*   `RESEND_API_KEY`: Je Resend code (voor de e-mails).
*   `CRON_SECRET`: (Optioneel) Een geheim wachtwoord voor de cronjob.
*   `SCRAPER_URL`: De URL van de broodjeszaak.

## Stap 5: Deployen
Zodra je de wijziging (Postgres provider) naar GitHub pusht, zal Vercel automatisch gaan bouwen.

1. Vercel installeert alles.
2. Het voert `prisma generate` uit.
3. Het bouwt de app.

Als alles goed gaat, is je app live! 🎉

## Stap 6: Cronjob (Automatische E-mails)
Omdat ik `vercel.json` al heb ingesteld, zal Vercel automatisch **elk uur** controleren of er een mail verstuurd moet worden.
*   Je kunt dit zien in het Vercel Dashboard onder het tabje **"Cron Jobs"**.
*   Het script checkt zelf of de deadline binnen 4 uur is.

---

### ⚠️ Let op bij eerste keer
Omdat je overstapt naar een nieuwe database (Postgres), is deze in het begin **leeg**.
Je moet dus even één keer inloggen (als admin) en:
1. De **Producten Scrapen** (via Admin paneel).
2. De **Email Template** controleren/opslaan.
3. Eventueel gebruikers weer toevoegen of laten registreren.
