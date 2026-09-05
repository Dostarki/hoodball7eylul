# Futbot League (hoodball) — PRD

## Orijinal Problem
"hoodball reposunu çek çalıştır" — Web3 tabanlı, 1-bit pixel art stilinde futbol oyunu (React + FastAPI + MongoDB). Kullanıcı dili: Türkçe.

## Mimari
- frontend/ (React, Tailwind, wagmi/RainbowKit) — `REACT_APP_WALLETCONNECT_PROJECT_ID` zorunlu
- backend/ (FastAPI, Motor, eth_account)
- MongoDB

## Yapılanlar
- 2026-06: Repo çekildi, .env dosyaları oluşturuldu, servisler çalışıyor, WalletConnect yapılandırıldı.
- 2026-06: Yeşil "meshy pixel" arka plan eklendi — `frontend/src/components/PixelMesh.jsx` (canvas, üstte yoğun aşağı doğru seyrelen yeşil pikseller), `App.js` içine sabit (fixed, z-index -1) olarak yerleştirildi; stil `App.css` `.pixel-mesh`.

## Backlog
- P1: Gol tekrarı (slow-motion replay)
- P1: Penaltı serisi (beraberlikte)
- P1: Özel takım adı girişi
