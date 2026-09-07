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

- 2026-09: Repo yeniden çekilip çalıştırıldı. `.env` dosyaları (gitignore'da olduğu için) yeniden oluşturuldu: backend/.env (MONGO_URL local, DB_NAME, JWT_SECRET, CHAIN_ID=4663, CORS_ORIGINS, ADMIN_PASSWORD=admin123, ETHERSCAN_API_KEY boş) ve frontend/.env (REACT_APP_BACKEND_URL preview, WALLETCONNECT_PROJECT_ID placeholder). Bağımlılıklar kuruldu (emergentintegrations/litellm çakışması: backend bunları kullanmadığı için hariç bırakıldı). Tüm servisler RUNNING, ana sayfa render oluyor, /api 200 OK.

- 2026-09: Admin > Participants düzeltildi (frontend eski dizi formatını bekliyordu → `{rows,total,completed,matched}` okunuyor). Puan sıralaması + RANK sütunu, ALL/COMPLETED/PENDING filtresi (`?status=`), sunucu taraflı arama, onaylı kullanıcı silme (`DELETE /api/admin/participants/{id}`).
- 2026-09: Bot engeli: `POST /api/early/register` aynı IP **ve** aynı tarayıcı (`X-Client-Id`, localStorage `futbot.cid`) için 60 sn'de 1 gönderim → 429. `rate_limits` koleksiyonu TTL indeksli. Geçersiz giriş (400) limiti tüketmez. Testing agent iteration_4 ✅

- 2026-09: **Toplu bot silme** (Admin > Participants): arama yanında CONTAINS / STARTS WITH (`?mode=prefix`) seçici; satır checkbox + tümünü seç → "DELETE N SELECTED"; arama metni varken "DELETE ALL N MATCHING" (aranan metni yazarak onay, aktif ALL/COMPLETED/PENDING filtresi de uygulanır, limit'ten bağımsız tüm DB eşleşmeleri silinir). API: `POST /api/admin/participants/bulk-delete` `{ids:[..]}` veya `{q,status,mode,confirm}`; `matched` artık gerçek DB sayısı. Testing agent iteration_5 ✅ (11/11 pytest + UI)

- 2026-09: **Collab (whitelist partner) sistemi** — Navbar "COLLAB" → `/collab`. Admin > COLLABS sekmesi: collab adı + sahibinin X adı + GTD/FCFS kontenjan + opsiyonel X post linki → tek seferlik `GH-…` kod (bcrypt hash'li, lookup 8 karakter), SAVE / ROTATE CODE (eski oturumlar `ver` claim ile düşer) / DELETE / WALLETS. Public sayfa: "CONTROL THE ROSTER." hero, sağ üst **Collab Manager** → kod girişi → Partner Allocation paneli (kalan GTD/FCFS, cüzdan ekle/sil, limit sunucuda, aynı collab'da tekrar yok, farklı collab'da serbest, duyuru postu linki). Alt kısımda **FULL COLLAB LEDGER**: renkli kartlar, unavatar.io X avatarı, "N NFTS ALLOCATED", COLLAB APPROVED damgası, resmi X widget embed (yalnız sayılar, cüzdan yok). Backend `/app/backend/collab.py`; koleksiyonlar `collabs`, `collab_wallets`. Login brute-force 5/15dk (naive datetime bug düzeltildi, admin login'e de uygulandı). Testing agent iteration_6 ✅ (18/18 pytest + UI)
- Not: X'te "@goalhoodz" etiketli postları otomatik arama yok (ücretli X API) — post linki admin/partner tarafından yapıştırılır (kullanıcı kararı).

## Notlar / Backlog
- P2: ~~ETHERSCAN_API_KEY~~ eklendi (2026-06) — YENİDEN ÇEKİMDE KAYBOLDU, kullanıcıdan tekrar alınmalı (Verify Volume için)
- P1: REACT_APP_WALLETCONNECT_PROJECT_ID şu an placeholder — WalletConnect (mobil) için gerçek ID gerekli
