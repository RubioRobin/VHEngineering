# 🥖 Broodjes Bestellen - VH Engineering

Complete web application voor het bestellen van belegde broodjes voor collega's. Gebouwd met Next.js 14, TypeScript, Prisma, en SQLite.

## ✨ Features

- **Product Scraping**: Automatisch broodjes inladen van brood-shop.nl
- **Winkelmandje**: Meerdere broodjes toevoegen met opmerkingen per item
- **Bestelvenster**: Automatische deadline op vrijdag 16:00 (Europe/Amsterdam)
- **Countdown Timer**: Live teller tot de deadline
- **Mijn Bestellingen**: Bekijk, wijzig of annuleer eigen bestellingen (voor deadline)
- **Persoonsgegevens Onthouden**: Naam en afdeling worden opgeslagen voor volgende keer
- **Admin Dashboard**: Overzicht van alle bestellingen met groepering
- **Excel Export**: Multi-tab .xlsx export (per persoon & totalen)
- **Responsive Design**: Werkt perfect op desktop en mobiel
- **Modern UI**: Premium design met animaties en glassmorphism effecten

## 🚀 Quick Start

### Vereisten

- Node.js 18+ en npm
- Windows/Mac/Linux

### Installatie

1. **Installeer dependencies**
   ```bash
   npm install
   ```

2. **Database setup**
   ```bash
   npm run db:push
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   ```
   http://localhost:3000
   ```

## 📁 Project Structuur

```
Brood/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Assortiment pagina (home)
│   ├── cart/page.tsx      # Winkelmandje
│   ├── my-orders/page.tsx # Gebruiker bestelhistorie & beheer
│   ├── admin/page.tsx     # Admin dashboard
│   ├── api/               # API routes
│   │   ├── products/      # Producten endpoint
│   │   ├── orders/        # Bestellingen endpoint
│   │   ├── status/        # Order status endpoint
│   │   └── admin/         # Admin endpoints
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── CountdownTimer.tsx # Deadline countdown
│   ├── ProductCard.tsx    # Broodje card
│   └── CartItem.tsx       # Winkelmandje item
├── lib/                   # Utility libraries
│   ├── scraper.ts         # Web scraper (Cheerio)
│   ├── orderPeriod.ts     # Periode management
│   ├── auth.ts            # Admin authenticatie
│   └── excel.ts           # Excel export (ExcelJS)
├── prisma/
│   └── schema.prisma      # Database schema
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.ts
└── .env.local             # Environment variabelen
```

## ⚙️ Configuratie

### Environment Variables (.env.local)

```bash
# Database
DATABASE_URL="file:./dev.db"

# Admin authenticatie
ADMIN_CODE="admin123"          # ⚠️ Wijzig dit!

# Scraper
SCRAPER_URL="https://www.brood-shop.nl/assortiment/belegde-broodjes/"

# Timezone
TZ="Europe/Amsterdam"
```

**BELANGRIJK**: Wijzig `ADMIN_CODE` naar een veilige waarde voor productie!

## 🔧 How It Works

### Web Scraping

De scraper haalt broodjes op van brood-shop.nl en slaat ze op in de database:

```bash
# Handmatig scrapen (via admin dashboard)
# Klik op "Ververs Assortiment" knop
```

De scraper is robuust gebouwd met meerdere selector fallbacks en error handling.

### Bestelvenster & Deadline

- Bestellingen kunnen tot **donderdag 14:00** (Europe/Amsterdam timezone)
- Na de deadline wordt bestellen automatisch geblokkeerd
- Nieuwe periode start automatisch na donderdag 14:00
- Elk periode krijgt een unieke ID: `YYYY-WW` (ISO week nummer)

### Order Flow

1. **Klant**: Bladert door assortiment → voegt broodjes toe aan winkelmandje
2. **Klant**: Vult naam in → plaatst bestelling
3. **Admin**: Bekijkt overzicht → exporteert naar Excel
4. **Admin**: Bestelt broodjes bij de winkel

### Excel Export

Genereert een `.xlsx` bestand met 2 tabbladen:

- **Tab 1 - Per Persoon**: Naam, Afdeling, Broodje, Aantal, Opmerking, Besteld op
- **Tab 2 - Totalen**: Broodje, Totaal Aantal, Opmerkingen, Prijs, Totaal Bedrag

## 📊 Database Schema

**Product** - Belegde broodjes (gescraped)
- name, price, description, imageUrl, sourceUrl

**OrderPeriod** - Wekelijkse bestelperiodes
- weekId (YYYY-WW), startDate, endDate, deadline

**Order** - Individuele bestellingen
- personName, department, orderPeriodId, createdAt

**OrderItem** - Broodjes in een bestelling
- quantity, comment, productId, orderId

**ScraperLog** - Scraping historie
- status, message, productsFound, createdAt

## 🎨 UI/UX Features

- **Modern Design**: Gradient backgrounds, glassmorphism, shadows
- **Animations**: Smooth hover effects, fade-in animations
- **Responsive Grid**: 1 kolom (mobiel) → 4 kolommen (desktop)
- **Premium Styling**: Inter font, custom color palette
- **Real-time Updates**: Countdown timer update elke seconde
- **Loading States**: Spinners en disabled buttons
- **Validatie**: Client-side en server-side validatie

## 🔐 Admin Toegang

1. Ga naar `/admin`
2. Voer admin code in (standaard: `admin123`)
3. Code wordt opgeslagen in localStorage

**Admin Functies:**
- Bekijk alle bestellingen per periode
- Groepeer per persoon of per broodje
- Exporteer naar Excel
- Ververs product assortiment
- Wissel tussen periodes

## 📦 Deployment

### Optie 1: Vercel (Aanbevolen)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

⚠️ **Let op**: SQLite werkt niet op Vercel. Gebruik PostgreSQL voor productie:

1. Maak PostgreSQL database aan (bijv. Vercel Postgres, Neon, Supabase)
2. Update `DATABASE_URL` in environment variables
3. Wijzig `provider` in `schema.prisma` naar `postgresql`
4. Run `npx prisma migrate dev`

### Optie 2: VPS (Linux)

```bash
# Installeer Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone project
cd /var/www
git clone <repository-url> broodjes
cd broodjes

# Installeer en build
npm install
npm run build

# Start met PM2
npm install -g pm2
pm2 start npm --name "broodjes" -- start
pm2 save
pm2 startup

# Setup Nginx reverse proxy
# Nginx config voorbeeld:
# server {
#     listen 80;
#     server_name broodjes.example.com;
#     location / {
#         proxy_pass http://localhost:3000;
#         proxy_http_version 1.1;
#         proxy_set_header Upgrade $http_upgrade;
#         proxy_set_header Connection 'upgrade';
#         proxy_set_header Host $host;
#         proxy_cache_bypass $http_upgrade;
#     }
# }
```

### Optie 3: Windows Server

```powershell
# Installeer Node.js van nodejs.org

# Clone en installeer
cd C:\inetpub\wwwroot
git clone <repository-url> broodjes
cd broodjes
npm install
npm run build

# Start met PM2
npm install -g pm2
pm2 start npm --name "broodjes" -- start
pm2 save
pm2-startup install
```

## 🐛 Troubleshooting

### Scraper vindt geen producten

- Website structuur kan zijn gewijzigd
- Check console logs: `npm run dev`
- Update selectors in `lib/scraper.ts`
- Test scraper handmatig via admin dashboard

### Database errors

```bash
# Reset database
rm prisma/dev.db
npm run db:push
```

### Port 3000 already in use

```bash
# Gebruik andere port
PORT=3001 npm run dev
```

## 🔄 Maintenance

### Wekelijkse taken

1. Check of bestellingen correct worden geplaatst
2. Exporteer Excel voor huidige week
3. Optioneel: ververs product assortiment

### Database backup

```bash
# Backup SQLite database
cp prisma/dev.db prisma/dev.db.backup

# Voor PostgreSQL
pg_dump database_url > backup.sql
```

## 📝 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
npm run db:push      # Push schema to database
npm run db:seed      # Seed database (optional)
```

### Adding Features

1. **New API endpoint**: Add to `app/api/`
2. **New page**: Add to `app/`
3. **New component**: Add to `components/`
4. **Database changes**: Update `prisma/schema.prisma` → run `npm run db:push`

## 📄 License

Proprietary - VH Engineering

## 🤝 Support

Voor vragen of problemen, contact VH Engineering IT afdeling.

---

**Made with ❤️ for VH Engineering**
