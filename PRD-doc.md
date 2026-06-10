# PRD Prompt — Alpaca Otomatik Trade Uygulaması (Next.js)

Aşağıdaki metni bir AI kod asistanına (Claude, Cursor, vb.) iletebilirsin.

---

## GÖREV

Aşağıdaki PRD'ye göre eksiksiz, production-ready bir **Next.js (App Router, TypeScript)** uygulaması yaz. Her dosyayı tam olarak oluştur; placeholder bırakma.

---

## PROJE TANIMI

Kişisel kullanıma yönelik, **Alpaca Markets API** üzerinde otomatik hisse senedi alım-satımı yapan, kapalı devre (sadece izin verilen kullanıcılar erişebilir) bir **admin paneli**. Arayüz Vercel Dashboard ile aynı estetik dilde olmalı: koyu arka plan, keskin border'lar, mono font data gösterimleri, minimal ama bilgi yoğun layout.

---

## TEKNOLOJİ YIĞINI

| Katman        | Seçim                                                           |
| ------------- | --------------------------------------------------------------- |
| Framework     | Next.js 16.2.9 (App Router)                                     |
| Dil           | TypeScript (strict mode)                                        |
| Stil          | Tailwind CSS v4 + shadcn/ui                                     |
| Auth          | NextAuth.js v5 (Credentials provider — kapalı kullanıcı havuzu) |
| DB            | PostgreSQL — **Neon** (Prisma ORM)                              |
| Job Scheduler | **Vercel Cron Jobs** (Redis yok)                                |
| Alpaca        | REST fetch wrapper (vanilla fetch, no SDK)                      |
| Client State  | Zustand                                                         |
| Server State  | TanStack Query (React Query v5)                                 |
| Deploy        | Vercel                                                          |

**Test kütüphanesi kullanma.**

### Güncel paket versiyonları

```json
{
  "dependencies": {
    "next": "16.2.9",
    "react": "19.2.4",
    "react-dom": "19.2.4",
    "next-auth": "^5.0.0",
    "@prisma/client": "^6.x",
    "@tanstack/react-query": "^5.x",
    "zustand": "^5.x",
    "zod": "^3.x",
    "bcryptjs": "^2.x"
  },
  "devDependencies": {
    "typescript": "^5",
    "tailwindcss": "^4",
    "@tailwindcss/postcss": "^4",
    "prisma": "^6.x",
    "eslint": "^9",
    "eslint-config-next": "16.2.9",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "@types/bcryptjs": "^2.x"
  }
}
```

---

## KİMLİK DOĞRULAMA & YETKİLENDİRME

### Gereksinimler

- Sisteme yalnızca **admin tarafından önceden eklenmiş** kullanıcılar girebilir.
- Kayıt formu **yoktur**. Kullanıcılar seed script veya admin UI ile oluşturulur.
- NextAuth v5 Credentials provider ile e-posta + şifre (bcryptjs hash).
- Session: JWT, 8 saat geçerlilik.
- Her route (dashboard, stocks, strategies, orders, settings) `middleware.ts` ile korunmalı; oturum yoksa `/login`'e yönlendir.
- Roller: `ADMIN` ve `VIEWER` (VIEWER sadece okuyabilir, emir veremez, settings'e giremez).

### Dosyalar

```
app/
  (auth)/
    login/
      page.tsx
  api/
    auth/
      [...nextauth]/
        route.ts
middleware.ts
lib/
  auth.ts         # NextAuth config + session helper
prisma/
  schema.prisma
```

---

## VERİTABANI ŞEMASI (Prisma + Neon)

`DATABASE_URL` Neon connection string'i olacak. Prisma schema'da `provider = "postgresql"` kullan.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")   // Neon için gerekli (connection pooling bypass)
}

model User {
  id            String   @id @default(cuid())
  email         String   @unique
  passwordHash  String
  name          String?
  role          Role     @default(VIEWER)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model Stock {
  id         String     @id @default(cuid())
  symbol     String     @unique
  name       String?
  active     Boolean    @default(true)
  strategies Strategy[]
  orders     Order[]
  createdAt  DateTime   @default(now())
}

model Strategy {
  id            String       @id @default(cuid())
  name          String
  stockId       String
  stock         Stock        @relation(fields: [stockId], references: [id])
  type          StrategyType
  params        Json
  orderType     OrderType    @default(MARKET)
  qty           Float
  enabled       Boolean      @default(false)
  lastTriggered DateTime?
  createdAt     DateTime     @default(now())
  orders        Order[]
}

model Order {
  id         String      @id @default(cuid())
  alpacaId   String?     @unique
  strategyId String?
  strategy   Strategy?   @relation(fields: [strategyId], references: [id])
  stockId    String
  stock      Stock       @relation(fields: [stockId], references: [id])
  side       OrderSide
  qty        Float
  type       OrderType
  limitPrice Float?
  status     OrderStatus @default(PENDING)
  filledAt   DateTime?
  createdAt  DateTime    @default(now())
}

model Settings {
  id             String  @id @default("singleton")
  alpacaMode     String  @default("paper")    // "paper" | "live"
  alpacaPaperKey String?
  alpacaPaperSecret String?
  alpacaLiveKey  String?
  alpacaLiveSecret String?
  cronExpression String  @default("*/5 * * * *")  // her 5 dakika
  tradeOutsideHours Boolean @default(false)
}

enum Role          { ADMIN VIEWER }
enum StrategyType  { RSI SMA_CROSSOVER MACD CUSTOM }
enum OrderSide     { BUY SELL }
enum OrderType     { MARKET LIMIT STOP }
enum OrderStatus   { PENDING FILLED CANCELLED REJECTED }
```

---

## SAYFA & MODÜL YAPISI

```
app/
  (auth)/
    login/page.tsx
  (dashboard)/
    layout.tsx              # Sidebar + topbar shell
    dashboard/page.tsx
    stocks/
      page.tsx
      [symbol]/page.tsx
    strategies/page.tsx
    orders/page.tsx
    settings/page.tsx
  api/
    auth/[...nextauth]/route.ts
    account/route.ts
    positions/route.ts
    orders/
      route.ts
      [id]/route.ts
    stocks/
      route.ts
      [symbol]/
        route.ts
        bars/route.ts
    strategies/
      route.ts
      [id]/route.ts
    settings/
      route.ts
      test-connection/route.ts
    users/
      route.ts
      [id]/route.ts
    cron/
      strategy-check/route.ts   # Vercel Cron endpoint
middleware.ts
lib/
  alpaca.ts
  auth.ts
  crypto.ts       # AES-256-GCM şifreleme (API key'ler için)
  prisma.ts       # Prisma client singleton
  strategies/
    index.ts
    rsi.ts
    sma-crossover.ts
    macd.ts
    custom.ts
workers/
  strategy-runner.ts    # Cron endpoint'in çağırdığı core logic
vercel.json
```

---

### 1. `/login`

- Merkezi login formu, Vercel login sayfası estetiği.
- E-posta + şifre, submit butonu.
- Hatalı giriş → inline hata mesajı (toast değil).
- Zaten oturum açıksa `/dashboard`'a yönlendir.

---

### 2. `/dashboard`

**Üst metrik kartları (4 adet):**

| Kart             | Kaynak                                   |
| ---------------- | ---------------------------------------- |
| Portfolio Value  | Alpaca `/v2/account` → `portfolio_value` |
| Bugünkü P&L      | `equity - last_equity`                   |
| Açık Pozisyonlar | `/v2/positions` → array.length           |
| Bekleyen Emirler | `/v2/orders?status=open` → array.length  |

**Portfolio grafiği:** son 30 gün equity değişimi. Recharts `LineChart`. Alpaca `/v2/account/portfolio/history?period=1M&timeframe=1D`.

**Son 10 emir tablosu:** sembol, yön rozeti (BUY/SELL), adet, durum rozeti, tarih.

**Aktif stratejiler özeti:** strateji adı, hisse sembolü, son tetiklenme, enabled toggle.

---

### 3. `/stocks`

- Tablo: sembol, ad, son fiyat, günlük değişim %, aktif strateji sayısı, işlemler.
- Son fiyat: Alpaca `/v2/stocks/snapshots?symbols=...` (batch).
- "Hisse Ekle" modalı: sembol text input + Alpaca `/v2/assets?status=active` ile doğrula.
- Satır → `/stocks/[symbol]` detay.

---

### 4. `/stocks/[symbol]`

- Başlık: sembol, şirket adı, canlı fiyat, günlük değişim.
- OHLCV bar grafiği: Recharts `ComposedChart` (candlestick yerine bar + line). Alpaca `/v2/stocks/{symbol}/bars`.
- Timeframe selector: 1D, 1W, 1M, 3M.
- Bu hisseye ait stratejiler tablosu + inline "Yeni Strateji Ekle" butonu.
- Bu hisseye ait emir geçmişi tablosu.

---

### 5. `/strategies`

**Tablo:** strateji adı, hisse, tür, parametreler özeti, enabled toggle, son tetiklenme, sil.

**"Yeni Strateji" drawer/modal — form:**

```
Hisse              → Select (izleme listesi)
Strateji Adı       → Text
Strateji Türü      → Select: RSI | SMA Crossover | MACD | Custom

── RSI ──────────────────────────────
  Period           → Number (default 14)
  Oversold         → Number (default 30)
  Overbought       → Number (default 70)

── SMA Crossover ────────────────────
  Fast Period      → Number (default 10)
  Slow Period      → Number (default 50)

── MACD ─────────────────────────────
  Fast             → Number (default 12)
  Slow             → Number (default 26)
  Signal           → Number (default 9)

── Custom ───────────────────────────
  Logic (JSON)     → Textarea
  (format açıklaması inline gösterilmeli)

Emir Türü          → Market | Limit | Stop
Miktar (Adet)      → Number
Enabled            → Toggle (default: off)
```

---

### 6. `/orders`

- Filtreler: tarih aralığı, sembol, durum, yön.
- Server-side sayfalama, 50 kayıt/sayfa.
- Tablo: sembol, yön rozeti, adet, tür, durum rozeti, fiyat, tarih.
- "Manuel Emir" butonu (sadece ADMIN):
  - Sembol, yön, adet, tür.
  - Onay dialogu.

---

### 7. `/settings` (sadece ADMIN)

**Alpaca API:**

- Paper / Live mod toggle.
- Paper API Key + Secret (masked input).
- Live API Key + Secret (masked input).
- "Bağlantıyı Test Et" → `/api/settings/test-connection`.
- Değerler DB'de AES-256-GCM ile şifreli (`lib/crypto.ts`).

**Kullanıcı Yönetimi:**

- Tablo: ad, e-posta, rol, tarih.
- "Kullanıcı Ekle" modalı.
- Sil (kendini silemez), rol değiştir.

**Cron Ayarı:**

- Strateji kontrol sıklığı (dakika: 1, 5, 15, 30, 60).
- Piyasa saatleri dışında çalıştırma toggle.

---

## ALPACA API WRAPPER (`lib/alpaca.ts`)

```typescript
// API key'leri her çağrıda DB'den çekme — settings'i parametre olarak al
// veya modül başında bir kez yükle.
// Paper: https://paper-api.alpaca.markets
// Live:  https://api.alpaca.markets

export async function alpacaFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T>

// Endpoint wrappers:
export const alpaca = {
  getAccount(): Promise<AlpacaAccount>
  getPositions(): Promise<AlpacaPosition[]>
  getOrders(params?: GetOrdersParams): Promise<AlpacaOrder[]>
  placeOrder(params: PlaceOrderParams): Promise<AlpacaOrder>
  cancelOrder(orderId: string): Promise<void>
  getBars(symbol: string, timeframe: string, start: string, end: string): Promise<Bar[]>
  getSnapshots(symbols: string[]): Promise<Record<string, Snapshot>>
  getAsset(symbol: string): Promise<AlpacaAsset>
  getPortfolioHistory(period: string, timeframe: string): Promise<PortfolioHistory>
}
```

Tüm metodlar `try/catch` ile sarılı olmalı, HTTP hataları `AlpacaError` class'ına dönüştürülmeli.

---

## OTOMATİK TRADE MOTORU

### Vercel Cron Mimarisi

```
vercel.json → cron tanımı
    ↓
Her N dakikada Vercel → POST /api/cron/strategy-check
    ↓
route.ts → CRON_SECRET ile doğrula → strategy-runner.ts'i çağır
    ↓
strategy-runner.ts:
  1. DB'den enabled=true stratejileri çek
  2. Settings'ten piyasa saati kontrolü (opsiyonel)
  3. Her strateji için:
     a. Alpaca'dan geçmiş bar verisi çek
     b. Strateji engine'i çalıştır → Signal
     c. Signal BUY/SELL ise → Alpaca'ya emir gönder
     d. Order'ı DB'ye kaydet
     e. Strategy.lastTriggered güncelle
  4. Sonuçları loglara yaz
```

### `vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/cron/strategy-check",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

### Cron endpoint güvenliği

```typescript
// app/api/cron/strategy-check/route.ts
// Vercel otomatik olarak CRON_SECRET header'ı ekler.
// Authorization: Bearer <CRON_SECRET>
const authHeader = request.headers.get("authorization");
if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}
```

### Strateji Engine Interface (`lib/strategies/index.ts`)

```typescript
export interface Bar {
  t: string; // timestamp
  o: number; // open
  h: number; // high
  l: number; // low
  c: number; // close
  v: number; // volume
}

export type Signal = "BUY" | "SELL" | "HOLD";

export interface StrategyEngine {
  name: StrategyType;
  calculate(bars: Bar[], params: Record<string, unknown>): Signal;
}
```

### RSI (`lib/strategies/rsi.ts`)

- 14 periyot RSI hesapla (Wilder's smoothing).
- Son RSI < oversold → BUY.
- Son RSI > overbought → SELL.
- Arası → HOLD.

### SMA Crossover (`lib/strategies/sma-crossover.ts`)

- Fast SMA ve Slow SMA hesapla.
- Fast, Slow'u yukarı keserse → BUY.
- Fast, Slow'u aşağı keserse → SELL.
- Diğer → HOLD.

### MACD (`lib/strategies/macd.ts`)

- MACD line = EMA(fast) - EMA(slow).
- Signal line = EMA(MACD, signal_period).
- MACD, Signal'ı yukarı keserse → BUY.
- MACD, Signal'ı aşağı keserse → SELL.

### Custom (`lib/strategies/custom.ts`)

- Params içindeki `logic` JSON field'ını parse et.
- Desteklenen format:

```json
{
  "indicator": "price_change",
  "condition": "greater_than",
  "threshold": 0.02,
  "action": "BUY"
}
```

---

## API ROUTE STANDARTLARI

Tüm API route'ları:

```typescript
// 1. Session kontrolü
const session = await getServerSession(authOptions);
if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

// 2. Zod validasyonu
const body = await request.json();
const parsed = schema.safeParse(body);
if (!parsed.success)
  return Response.json({ error: parsed.error }, { status: 400 });

// 3. Standart response
return Response.json({ data: result }); // başarı
return Response.json({ error: message }, { status: xxx }); // hata
```

---

## UI / TASARIM SİSTEMİ

### Renk Paleti (Vercel koyu tema)

```css
--bg-primary: #0a0a0a --bg-secondary: #111111 --bg-tertiary: #1a1a1a
  --border: #2a2a2a --border-subtle: #1f1f1f --text-primary: #ededed
  --text-secondary: #888888 --text-tertiary: #555555 --accent: #0070f3
  --accent-hover: #0060df --success: #00c950 --warning: #f5a623
  --danger: #e5484d;
```

### Tipografi

- UI genel: `Inter` (next/font/google)
- Sayısal data, semboller, ID'ler: `font-mono` (Tailwind) — fiyatlar, P&L, order ID'ler

### Layout

```
┌──────────────────────────────────────────────┐
│  Sidebar (240px, fixed, bg-secondary)        │
│  ┌──────────┐  ┌───────────────────────────┐ │
│  │ Logo     │  │ Topbar (breadcrumb+avatar)│ │
│  │──────────│  │───────────────────────────│ │
│  │ Dashboard│  │                           │ │
│  │ Stocks   │  │   Page Content            │ │
│  │ Strategies│  │                           │ │
│  │ Orders   │  │                           │ │
│  │ Settings │  │                           │ │
│  │          │  │                           │ │
│  │──────────│  │                           │ │
│  │ Market   │  │                           │ │
│  │ Status   │  │                           │ │
│  │ User+    │  │                           │ │
│  │ Logout   │  │                           │ │
│  └──────────┘  └───────────────────────────┘ │
└──────────────────────────────────────────────┘
```

### Komponent Kuralları

- shadcn/ui bileşenlerini kullan: Button, Input, Table, Dialog, Select, Switch, Badge, Tabs, Sheet (drawer).
- Tüm fiyat/sayı gösterimlerinde `font-variant-numeric: tabular-nums`.
- Pozitif değer → `--success` rengi, negatif → `--danger`.
- Tablo/kart yüklenirken → shadcn Skeleton.
- Hata durumu → inline (form altında veya kart içinde), toast yalnızca başarı bildirimi için.
- BUY rozeti → yeşil, SELL → kırmızı, PENDING → sarı, FILLED → yeşil, CANCELLED/REJECTED → gri.
- Sidebar'da piyasa durumu badge: Piyasa Açık (yeşil) / Kapalı (gri) — NYSE saatlerine göre hesapla.

---

## ORTAM DEĞİŞKENLERİ

```env
# .env.local

# Neon PostgreSQL
DATABASE_URL=postgresql://...         # pooled (Prisma için)
DIRECT_URL=postgresql://...           # direct (migration için)

# NextAuth
NEXTAUTH_SECRET=                      # openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000

# Alpaca (DB'de de saklanır ama initial setup için)
ALPACA_MODE=paper

# Cron güvenlik
CRON_SECRET=                          # openssl rand -base64 32

# Şifreleme (API key'ler DB'de AES ile şifreli saklanır)
ENCRYPTION_KEY=                       # 32 byte hex: openssl rand -hex 32
```

---

## SEED (`prisma/seed.ts`)

```typescript
// Çalıştırma: npx prisma db seed
// Env'den okur: SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD

1. Admin kullanıcısı oluştur (bcryptjs hash)
2. Settings singleton oluştur (boş API key'lerle)
3. Örnek hisseler ekle: AAPL, TSLA, NVDA, MSFT, GOOGL
```

---

## README.md İÇERİĞİ

```markdown
## Kurulum

1. Bağımlılıkları yükle: `npm install`
2. `.env.local` oluştur (örnek: `.env.example`)
3. Neon DB bağlantısını ayarla
4. Migration: `npx prisma migrate dev`
5. Seed: `npx prisma db seed`
6. Geliştirme: `npm run dev`

## Deploy (Vercel)

1. Vercel'e push
2. Environment variables'ları Vercel dashboard'a ekle
3. Cron jobs otomatik aktif olur (vercel.json)

## İlk Giriş

Seed'den gelen admin credentials ile `/login`'e gir.
Settings > Alpaca API bölümünden API key'leri ekle.
```

---

## ÇIKTI BEKLENTİSİ

1. Yukarıdaki yapıya uyan **eksiksiz dosya ağacı**.
2. Her `.ts` / `.tsx` dosyası tam implementasyon (mock data yok).
3. Çalışan `prisma/schema.prisma` + migration + seed.
4. `vercel.json` cron tanımı.
5. `workers/strategy-runner.ts` tam implementasyon.
6. `README.md` kurulum adımları.

**Başlangıç sırası:**
`lib/prisma.ts` → `lib/crypto.ts` → `lib/alpaca.ts` → `prisma/schema.prisma` → `lib/auth.ts` → `middleware.ts` → `app/(dashboard)/layout.tsx` → sayfalar → `lib/strategies/` → `workers/strategy-runner.ts` → `app/api/cron/strategy-check/route.ts`
