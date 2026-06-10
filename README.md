# The Rader — Alpaca Otomatik Trade Admin Paneli

Alpaca Markets API üzerinde otomatik hisse senedi alım-satımı yapan, Vercel Dashboard estetiğinde koyu temalı bir admin paneli.

## Özellikler
- **Dashboard:** Portfolio Value, Günlük P&L, Açık Pozisyonlar, Bekleyen Emirler metrik kartları ve 30 günlük equity grafiği.
- **Hisse Yönetimi:** İzleme listesi ve Alpaca uyumlu sembol ekleme doğrulama modülü.
- **Otomatik Stratejiler:** RSI, SMA Crossover, MACD ve Custom (yüzdesel fiyat değişimi) stratejileriyle alım-satım tetikleyicileri.
- **Emir Takibi:** Tüm emirlerin durum, yön, miktar detayları ile filtrelenmesi ve manuel emir girişi (sadece ADMIN).
- **Gelişmiş Ayarlar:** Canlı/Paper modları için Alpaca API credential şifreli kaydı ve bağlantı testi, kullanıcı yetkilendirmesi (ADMIN/VIEWER) ve cron çalışma kuralları.

## Kurulum ve Çalıştırma

1. Bağımlılıkları yükleyin:
   ```bash
   yarn install
   ```

2. `.env` dosyasını oluşturun ve verilerinizi ekleyin (`.env.example` referans alınabilir):
   ```bash
   cp .env.example .env
   ```

3. Veritabanını güncelleyin ve seed verilerini yükleyin:
   ```bash
   yarn prisma db push
   yarn prisma db seed
   ```

4. Uygulamayı geliştirme modunda çalıştırın:
   ```bash
   yarn dev
   ```

5. Tarayıcıda `http://localhost:3000` adresini açarak aşağıdaki varsayılan kullanıcı bilgileriyle giriş yapın:
   - **E-posta:** `admin@therader.app`
   - **Şifre:** `changeme123`
