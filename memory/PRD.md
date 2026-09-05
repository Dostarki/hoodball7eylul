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

## Notlar / Backlog
- P1: Gerçek WalletConnect Project ID (cloud.reown.com) → `REACT_APP_WALLETCONNECT_PROJECT_ID` (şu an placeholder; QR/mobil cüzdanlar çalışmaz, tarayıcı cüzdanları çalışır)
- P2: `ETHERSCAN_API_KEY` backend .env'e eklenmeli (opsiyonel, VIP tier / tx verisi)
