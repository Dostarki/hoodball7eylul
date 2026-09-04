import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';
import PixelSprite from '../components/PixelSprite';
import {
  CHARACTERS,
  BALL_BITMAP,
  ARENAS,
  CONTROLS,
  FEATURES,
  BOT_TEAMS,
  getSelectedCharId,
  setSelectedCharId,
  getCharacter,
} from '../mock';

const StatBar = ({ label, value }) => (
  <div className="flex items-center gap-2">
    <span className="font-mono w-14 text-[10px] uppercase tracking-widest text-[var(--ink-soft)]">{label}</span>
    <div className="flex gap-[3px]">
      {Array.from({ length: 10 }).map((_, i) => (
        <span key={i} className={`h-2 w-2 ${i < value ? 'bg-[var(--ink)]' : 'bg-[var(--line)]'}`} />
      ))}
    </div>
  </div>
);

const ArenaPreview = ({ arena }) => (
  <div className="relative h-40 w-full overflow-hidden border-2" style={{ background: arena.bg, borderColor: arena.ink }}>
    <div
      className="absolute inset-0 opacity-10"
      style={{
        backgroundImage: `linear-gradient(${arena.ink} 1px, transparent 1px), linear-gradient(90deg, ${arena.ink} 1px, transparent 1px)`,
        backgroundSize: '16px 16px',
      }}
    />
    <div className="absolute bottom-6 left-0 right-0 h-[3px]" style={{ background: arena.ink }} />
    <div className="absolute bottom-0 left-0 right-0 h-6 opacity-40" style={{ backgroundImage: `radial-gradient(${arena.ink} 1px, transparent 1px)`, backgroundSize: '6px 6px' }} />
    <div className="absolute bottom-6 left-3 h-16 w-10 border-r-[3px] border-t-[3px]" style={{ borderColor: arena.ink }} />
    <div className="absolute bottom-6 right-3 h-16 w-10 border-l-[3px] border-t-[3px]" style={{ borderColor: arena.ink }} />
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
      <PixelSprite bitmap={CHARACTERS[0].bitmap} scale={3} ink={arena.ink} />
    </div>
    <div className="absolute bottom-16 left-[60%] ball-bounce">
      <PixelSprite bitmap={BALL_BITMAP} scale={2} ink={arena.ink} />
    </div>
  </div>
);

const Home = () => {
  const [charId, setCharId] = useState(getSelectedCharId());
  const selected = getCharacter(charId);

  const choose = (id) => {
    setCharId(id);
    setSelectedCharId(id);
  };

  return (
    <main className="paper-grid relative">
      {/* HERO */}
      <section className="paper-noise relative mx-auto max-w-[1400px] px-5 pb-16 pt-20 md:px-10 md:pt-28">
        <div className="mx-auto max-w-3xl text-center">
          <div className="label reveal reveal-1 mb-6 flex items-center justify-center gap-3">
            <span className="inline-block h-2 w-2 bg-[var(--accent)]" />
            Sezon 01 &middot; 6 takim &middot; 60 saniye
          </div>
          <h1 className="font-pixel reveal reveal-2 text-[34px] leading-[1.15] tracking-tight sm:text-[48px] md:text-[64px]" data-testid="hero-title">
            FUTBOT LIG
          </h1>
          <p className="reveal reveal-3 mx-auto mt-7 max-w-2xl text-[17px] leading-8 text-[var(--ink-soft)]">
            Bir bit, iki renk, tek top. Pixel futbolcunu sec, 60 saniyelik kafa topu maclarinda cok zor bota karsi
            sahaya cik ve ligi tepede bitir. Tarayicida, PC ve mobilde oynanir.
          </p>
          <div className="reveal reveal-4 mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link to="/lig" className="btn-ink" data-testid="hero-league-btn">
              LIGE BASLA <ArrowRight size={14} />
            </Link>
            <Link to="/oyun?mode=quick" className="btn-outline" data-testid="hero-quick-btn">
              HIZLI MAC
            </Link>
          </div>
        </div>

        {/* Onizleme karti */}
        <div className="reveal reveal-4 mx-auto mt-16 w-full max-w-[340px]">
          <div className="frame-card p-5">
            <div className="pixel-frame relative flex h-[280px] items-end justify-center overflow-hidden">
              <div className="absolute left-0 right-0 top-0 h-[3px] bg-[var(--ink)] opacity-0" />
              <div className="absolute bottom-10 left-3 h-20 w-12 border-r-[3px] border-t-[3px] border-[var(--ink)]" />
              <div className="absolute bottom-10 right-3 h-20 w-12 border-l-[3px] border-t-[3px] border-[var(--ink)]" />
              <div className="absolute bottom-10 left-0 right-0 h-[3px] bg-[var(--ink)]" />
              <div className="absolute bottom-[40px] right-[38%] ball-bounce">
                <PixelSprite bitmap={BALL_BITMAP} scale={3} ink="var(--ink)" />
              </div>
              <div className="bob relative z-10 mb-10 flex flex-col items-center">
                <PixelSprite key={selected.id} bitmap={selected.bitmap} scale={9} ink="var(--ink)" />
                <div className="mt-1 flex gap-3">
                  <span className="h-4 w-3 bg-[var(--ink)]" />
                  <span className="h-4 w-3 bg-[var(--ink)]" />
                </div>
              </div>
            </div>
            <div className="font-mono mt-4 flex items-center justify-center gap-2 text-[11px] tracking-[0.18em] text-[var(--ink-soft)]">
              <span className="inline-block h-[6px] w-[6px] bg-[var(--accent)]" />
              FUTBOT #{String(CHARACTERS.findIndex((c) => c.id === selected.id) + 1).padStart(4, '0')} &middot; {selected.name}
            </div>
          </div>
        </div>

        {/* Istatistik seridi */}
        <div className="mx-auto mt-12 grid max-w-[560px] grid-cols-3 border border-[var(--line)] bg-[var(--paper-2)]">
          {[
            ['8', 'PIXEL KARAKTER'],
            ['60 SN', 'MAC SURESI'],
            ['2', 'SAHA'],
          ].map(([v, l]) => (
            <div key={l} className="stat-cell px-4 py-5 text-center">
              <div className="font-pixel text-[15px] md:text-[18px]">{v}</div>
              <div className="label mt-2 text-[9px] md:text-[10px]">{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Kayan serit */}
      <div className="overflow-hidden border-y border-[var(--line)] bg-[var(--ink)] py-3 text-[var(--paper)]">
        <div className="marquee font-mono text-[12px] tracking-[0.25em]">
          {Array.from({ length: 2 }).map((_, k) => (
            <span key={k}>
              {BOT_TEAMS.map((t) => (
                <span key={t.id + k} className="mx-8">
                  {t.name} &middot; {t.style.toUpperCase()}
                </span>
              ))}
              <span className="mx-8">ARC FC &middot; SENIN TAKIMIN</span>
            </span>
          ))}
        </div>
      </div>

      {/* Hakkinda */}
      <section className="mx-auto max-w-[1400px] px-5 py-24 md:px-10">
        <h2 className="font-pixel max-w-3xl text-[20px] leading-[1.6] md:text-[26px]">Kucuk bir arc topun pesine dustu.</h2>
        <div className="mt-14 grid gap-10 md:grid-cols-3">
          {FEATURES.map((f, i) => (
            <div key={f.title} className="border-t-2 border-[var(--ink)] pt-6">
              <div className="label mb-3">0{i + 1}</div>
              <h3 className="font-pixel text-[13px] leading-6">{f.title}</h3>
              <p className="mt-4 text-[15px] leading-7 text-[var(--ink-soft)]">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Karakterler */}
      <section id="karakterler" className="border-t border-[var(--line)] bg-[var(--paper-2)]">
        <div className="mx-auto max-w-[1400px] px-5 py-24 md:px-10">
          <div className="label mb-4">Karakter Sec</div>
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <h2 className="font-pixel text-[20px] leading-[1.6] md:text-[26px]">Pixel futbolcunu sec.</h2>
            <p className="max-w-md text-[15px] leading-7 text-[var(--ink-soft)]">
              Her karakter 12x14 monokrom bir bitmap. Secimin tarayicinda saklanir ve tum maclarda seninle sahaya cikar.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4">
            {CHARACTERS.map((c, i) => {
              const sel = c.id === charId;
              return (
                <button
                  key={c.id}
                  onClick={() => choose(c.id)}
                  className={`char-card relative p-5 text-left ${sel ? 'selected' : ''}`}
                  data-testid={`char-card-${c.id}`}
                >
                  {sel && (
                    <span className="font-mono absolute right-3 top-3 flex items-center gap-1 bg-[var(--ink)] px-2 py-1 text-[9px] tracking-widest text-[var(--paper)]">
                      <Check size={10} /> SECILDI
                    </span>
                  )}
                  <div className="font-mono text-[10px] tracking-widest text-[var(--ink-soft)]">#{String(i + 1).padStart(4, '0')}</div>
                  <div className="my-5 flex h-[100px] items-center justify-center">
                    <PixelSprite bitmap={c.bitmap} scale={6} ink="var(--ink)" />
                  </div>
                  <div className="font-pixel text-[12px]">{c.name}</div>
                  <div className="font-mono mt-1 text-[11px] tracking-wider text-[var(--ink-soft)]">{c.title}</div>
                  <div className="mt-4 space-y-1.5">
                    <StatBar label="Hiz" value={c.stats.hiz} />
                    <StatBar label="Zipla" value={c.stats.ziplama} />
                    <StatBar label="Vurus" value={c.stats.vurus} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Sahalar */}
      <section id="sahalar" className="border-t border-[var(--line)]">
        <div className="mx-auto max-w-[1400px] px-5 py-24 md:px-10">
          <div className="label mb-4">Sahalar</div>
          <h2 className="font-pixel text-[20px] leading-[1.6] md:text-[26px]">Iki saha, iki mod.</h2>
          <div className="mt-12 grid gap-8 md:grid-cols-2">
            {Object.values(ARENAS).map((a) => (
              <div key={a.id} className="frame-card p-5" data-testid={`arena-card-${a.id}`}>
                <ArenaPreview arena={a} />
                <div className="mt-5 flex items-start justify-between gap-4">
                  <div>
                    <div className="font-pixel text-[12px]">{a.name}</div>
                    <p className="mt-2 text-[14px] leading-6 text-[var(--ink-soft)]">{a.desc}</p>
                  </div>
                  <Link to={`/oyun?mode=quick&arena=${a.id}`} className="btn-outline shrink-0 !px-4 !py-3 !text-[10px]">
                    OYNA
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Nasil oynanir */}
      <section id="nasil-oynanir" className="border-t border-[var(--line)] bg-[var(--paper-2)]">
        <div className="mx-auto max-w-[1400px] px-5 py-24 md:px-10">
          <div className="label mb-4">Nasil Oynanir</div>
          <h2 className="font-pixel text-[20px] leading-[1.6] md:text-[26px]">Kurallar basit. Bot degil.</h2>
          <div className="mt-12 grid gap-10 lg:grid-cols-[1.2fr_1fr]">
            <div className="border border-[var(--line)] bg-[var(--paper)]">
              {CONTROLS.map((c, i) => (
                <div key={c.action} className={`grid grid-cols-[1.2fr_1fr_1fr] items-center gap-4 px-5 py-4 ${i > 0 ? 'border-t border-[var(--line)]' : ''}`}>
                  <div className="font-mono text-[12px] tracking-wider">{c.action}</div>
                  <div className="flex flex-wrap gap-2">
                    {c.keys.map((k) => <span key={k} className="kbd">{k}</span>)}
                    {c.alt.map((k) => <span key={k} className="kbd opacity-60">{k}</span>)}
                  </div>
                  <div className="font-mono text-[11px] text-[var(--ink-soft)]">{c.mobile}</div>
                </div>
              ))}
            </div>
            <ul className="space-y-5 text-[15px] leading-7 text-[var(--ink-soft)]">
              <li><span className="font-pixel text-[11px] text-[var(--ink)]">01</span> &nbsp; Mac 60 saniye surer. Sure bitince en cok gol atan kazanir; esitlikte beraberlik.</li>
              <li><span className="font-pixel text-[11px] text-[var(--ink)]">02</span> &nbsp; Kafanla topa vurabilir, ziplayip yon verebilir, X ile sert sut cekebilirsin.</li>
              <li><span className="font-pixel text-[11px] text-[var(--ink)]">03</span> &nbsp; Lig 5 hafta: her hafta bir rakip. Galibiyet 3, beraberlik 1 puan. Sezon sonunda sampiyonluk ekrani.</li>
              <li><span className="font-pixel text-[11px] text-[var(--ink)]">04</span> &nbsp; Bot cok zor: topun dususunu hesaplar ve kaleyi kapatir. Onu ziplatip altindan gecmeyi dene.</li>
            </ul>
          </div>
          <div className="mt-14 flex justify-center">
            <Link to="/lig" className="btn-ink">SEZONA BASLA <ArrowRight size={14} /></Link>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Home;
