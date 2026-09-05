# Futbot League (hoodball) — PRD

## Orijinal Problem
"hoodball reposunu çek çalıştır" — Web3 tabanlı, 1-bit pixel art stilinde futbol oyunu (React + FastAPI + MongoDB). Kullanıcı dili: Türkçe.

## Mimari
- frontend/ (React, Tailwind, wagmi/RainbowKit) — `REACT_APP_WALLETCONNECT_PROJECT_ID` zorunlu
- backend/ (FastAPI, Motor, eth_account) — `server.py` (oyun/auth) + `early.py` (Early List & admin router)
- MongoDB — koleksiyonlar: users, matches, leagues, nonces, early_participants, early_settings, early_daily_tasks, counters, login_attempts
- Bayrak: `frontend/src/lib/flags.js` `GAME_LOCKED=true` → oyun rotaları ComingSoon, nav linkleri kilitli, CONNECT butonu gizli. `false` yapılınca oyun geri açılır.

## Yapılanlar
- 2026-06: Repo çekildi, .env dosyaları oluşturuldu, servisler çalışıyor, WalletConnect yapılandırıldı.
- 2026-06: Yeşil "meshy pixel" arka plan + kart halesi + fare/tıklama etkileşimi (`PixelMesh.jsx`).
- 2026-06 (Early List kampanyası):
  - Oyun kapatıldı (kod duruyor): League/Leaderboard nav linkleri kilitli + "Coming soon" toast; /league,/play,/leaderboard → ComingSoon sayfası; hero "CONNECT & PLAY · SOON" disabled, "JOIN EARLY LIST" eklendi; arena PLAY ve START THE SEASON disabled.
  - Early Access akışı (Home `#early`, `components/early/EarlyAccess.jsx`): X kullanıcı adı → cüzdan (0x) → 3 X görevi (Follow +50, RT&Like +50, Quote +100; onur sistemi: linki aç → 6 sn → "I'VE DONE IT") → canvas bilet PNG (`ticketCanvas.js`) + SHARE ON X (Web Share API ile dosya paylaşımı, yoksa indir + tweet intent) + DOWNLOAD.
  - Günlük görevler: admin ekler, katılımcı günde 1 kez tamamlar (UTC).
  - /early-list sayfası: tamamlayanlar puana göre sıralı, YOU işareti.
  - /admin paneli: şifre (`ADMIN_PASSWORD` env) → X görev ayarları (URL/metin/puan), günlük görev CRUD, katılımcı tablosu. 5 hatalı denemede 15 dk kilit.
  - API: /api/early/{config,register,me,tasks/{t}/complete,daily/{id}/complete,list}; /api/admin/{login,me,settings,daily-tasks,participants}
  - Test: /app/test_reports/iteration_1.json — 16/16 backend + tüm frontend akışları geçti.

## Backlog
- P1 (kampanya sonrası): `GAME_LOCKED=false` ile oyunu geri aç
- P1: Gol tekrarı (slow-motion replay)
- P1: Penaltı serisi (beraberlikte)
- P1: Özel takım adı girişi
- P2: Early List puanlarını oyun içi hesaba (cüzdan eşleşmesi) aktarma
- P2: Admin şifresini panelden değiştirme
