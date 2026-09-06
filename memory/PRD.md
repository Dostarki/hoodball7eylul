# GoalHoodz Early (hoodball2) – PRD

## Orijinal İstek
"hoodball2 reposunu çek çalıştır" – Repoyu kur, bağımlılıkları yükle, .env dosyalarını oluştur, frontend + backend'i çalıştır.

## Mimari
- Frontend: React + Wagmi + RainbowKit (Robinhood Chain, id 4663) – `/app/frontend`
- Backend: FastAPI – `/app/backend/server.py`, `/api` prefix
- DB: MongoDB (MONGO_URL / DB_NAME)

## Tamamlananlar
- 2026-06: Bağımlılıklar kuruldu, pip çakışmaları çözüldü (emergentintegrations/litellm)
- 2026-06: `/app/backend/.env` (MONGO_URL, DB_NAME, JWT_SECRET, CHAIN_ID) ve `/app/frontend/.env` oluşturuldu
- 2026-06: Backend /api → 200 OK
- 2026-06: Frontend WalletConnect projectId hatası giderildi – `.env`'e PLACEHOLDER projectId eklendi; ana sayfa render oluyor

- 2026-06: Kullanıcının Reown Dashboard'dan aldığı gerçek WalletConnect Project ID `.env`'e eklendi (placeholder kaldırıldı)
- 2026-06: Mobil okunabilirlik – `--ink-soft` koyulaştırıldı (#45443f), hero etiket + açıklama paragrafı `--ink` rengine alındı
- 2026-06: Etherscan V2 API anahtarı backend `.env`'e eklendi; Verify Volume (POST /api/early/vip/check) 8 zincirde çalışıyor – testing agent ile doğrulandı (iteration_3)
- 2026-06: `.gitignore`'daki `.env` dışlama satırları kaldırıldı – canlı (goalhoodz.fun) 503 'Volume check is not configured' hatasının kökü buydu; kullanıcı yeniden deploy etmeli
- 2026-06: Ana sayfaya "Roadmap" bölümü (#roadmap) + navbar linki eklendi – 5 faz (Early Access LIVE, NFT Access Pass NEXT, $GOALZ Rewards, Clubs, Beyond) bilgilendirme amaçlı; token/NFT üretimi yok. Detay: /app/memory/ROADMAP.md
- Askıya alındı: bot önlemi (kullanıcı kararı)
- 2026-06: Admin > Participants: arama (@x / cüzdan / bilet no) + satır içi puan düzenleme (PUT /api/admin/participants/{id}/points)

## Notlar / Backlog
- P2: ~~ETHERSCAN_API_KEY~~ eklendi (2026-06)
