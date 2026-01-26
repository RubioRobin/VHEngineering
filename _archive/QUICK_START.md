# 🚀 Quick Start Guide - Broodjes Bestellen

## Voor Gebruikers (Collega's)

### Broodjes Bestellen

1. **Open de website**: `http://localhost:3000` (of je bedrijfs-URL)

2. **Check de timer**: 
   - Groen = Je kunt nog bestellen
   - Rood = Te laat, deadline verstreken

3. **Zoek je broodje**:
   - Gebruik de zoekbalk
   - Scroll door het assortiment

4. **Voeg toe aan winkelmandje**:
   - Klik op "Toevoegen" knop
   - Je kunt hetzelfde broodje meerdere keren toevoegen

5. **Ga naar winkelmandje**:
   - Klik op "🛒 Winkelmandje" rechtsboven

6. **Pas je bestelling aan**:
   - Verander aantallen met +/- knoppen
   - Voeg opmerkingen toe (bijv. "zonder saus")
   - Verwijder items die je niet meer wilt

7. **Plaats bestelling**:
   - Vul je naam in (verplicht)
   - Vul afdeling in (optioneel)
   - Klik "✓ Bestelling plaatsen"

8. **Bevestiging**:
   - Je ziet een bevestigingsmelding
   - Je winkelmandje wordt geleegd

### Deadline

⏰ **Donderdag 14:00** - Daarna is bestellen gesloten tot volgende week

## Voor Administrators

### Inloggen

1. Klik op "🔐 Admin" knop
2. Voer admin code in (standaard: `admin123`)
3. Klik "Login"

### Bestellingen Bekijken

**Periode selecteren:**
- Gebruik dropdown "Periode" om week te kiezen
- Standaard: huidige week

**Groepering:**
- **Per Persoon**: Zie wie wat heeft besteld
- **Per Broodje**: Zie totaal aantal per broodje

### Excel Exporteren

1. Selecteer de juiste periode
2. Klik "📥 Excel Export"
3. Bestand wordt gedownload
4. Open in Excel/LibreOffice

**Excel bevat:**
- Tab 1: Per persoon (naam, broodje, aantal, opmerking)
- Tab 2: Totalen (broodje, totaal aantal, totaalbedrag)

### Producten Verversen

Als het assortiment op de website is gewijzigd:

1. Klik "🔄 Ververs Assortiment"
2. Wacht op bevestiging
3. Nieuwe broodjes worden toegevoegd
4. Bestaande broodjes worden bijgewerkt

## Installatie (IT Afdeling)

### Eerste Keer Setup

```bash
# Windows - Gebruik het batch bestand:
start.bat

# Of handmatig:
npm install
npm run db:push
npm run db:seed
npm run dev
```

### Configuratie Aanpassen

**Admin code wijzigen:**

Bewerk `.env.local`:
```bash
ADMIN_CODE="jouw_veilige_code_hier"
```

**Deadline wijzigen:**

Bewerk `lib/orderPeriod.ts` voor andere dag/tijd

### Problemen Oplossen

**"Port 3000 already in use"**
```bash
# Gebruik andere port:
$env:PORT=3001
npm run dev
```

**Database reset nodig**
```bash
Remove-Item prisma\dev.db
npm run db:push
npm run db:seed
```

**Scraper vindt geen producten**
- Website structuur mogelijk veranderd
- Check `lib/scraper.ts` en update selectors

## Tips & Tricks

### Voor Gebruikers

- ✅ Je kunt meerdere van hetzelfde broodje bestellen met verschillende opmerkingen
- ✅ Gebruik opmerkingen voor speciale wensen (zonder ui, extra kaas, etc.)
- ✅ Check altijd de countdown timer voordat je begint
- ✅ Je kunt je bestelling aanpassen tot je op "Bestelling plaatsen" klikt

### Voor Admins

- ✅ Exporteer vroeg op donderdag om tijdige levering te garanderen
- ✅ Check beide groupering modes voor volledig overzicht
- ✅ Ververs producten wekelijks of maandelijks
- ✅ Bewaar oude Excel exports als backup

## Support

**Vragen of problemen?**
Contact: VH Engineering IT Afdeling

**Veelgestelde Vragen:**

Q: Kan ik mijn bestelling wijzigen na plaatsing?
A: Nee, neem contact op met de admin

Q: Tot wanneer kan ik bestellen?
A: Elke donderdag tot 14:00 uur

Q: Kan ik zien wat anderen hebben besteld?
A: Nee, alleen admins zien alle bestellingen

Q: Wat als de website crasht?
A: Neem contact op met IT afdeling

---

**Veel bestel plezier! 🥖**
