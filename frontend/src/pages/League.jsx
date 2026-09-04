import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, RotateCcw, Trophy } from 'lucide-react';
import PixelSprite from '../components/PixelSprite';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import {
  ALL_TEAMS,
  ARENAS,
  ROUNDS,
  TROPHY_BITMAP,
  getLeague,
  resetLeague,
  nextFixture,
  computeStandings,
  leagueFinished,
  getCharacter,
  getSelectedCharId,
} from '../mock';

const teamChar = (team) => (team.isPlayer ? getCharacter(getSelectedCharId()) : getCharacter(team.charId));

const League = () => {
  const loc = useLocation();
  const [league, setLeague] = useState(getLeague());
  const standings = computeStandings(league);
  const fixture = nextFixture(league);
  const finished = leagueFinished(league);
  const playerRow = standings.findIndex((r) => r.team.isPlayer);
  const lastResult = loc.state?.result;

  const onReset = () => setLeague(resetLeague());

  return (
    <main className="paper-grid min-h-screen">
      <div className="mx-auto max-w-[1400px] px-5 py-14 md:px-10">
        <div className="label mb-4">Sezon 01 &middot; Hafta {Math.min(league.round + 1, ROUNDS.length)} / {ROUNDS.length}</div>
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <h1 className="font-pixel text-[22px] leading-[1.5] md:text-[30px]" data-testid="league-title">Futbot Lig Tablosu</h1>
          <button onClick={onReset} className="btn-outline !px-4 !py-3 !text-[10px]" data-testid="league-reset-btn">
            <RotateCcw size={12} /> LIGI SIFIRLA
          </button>
        </div>

        {lastResult && (
          <div className="font-mono mt-8 border border-[var(--ink)] bg-[var(--paper-2)] px-5 py-4 text-[12px] tracking-wider" data-testid="last-result-banner">
            SON MAC: ARC FC {lastResult.ps} - {lastResult.bs} {lastResult.opp} &middot;{' '}
            {lastResult.ps > lastResult.bs ? 'GALIBIYET (+3)' : lastResult.ps === lastResult.bs ? 'BERABERLIK (+1)' : 'MAGLUBIYET'}
          </div>
        )}

        {finished ? (
          <section className="mt-12 frame-card invert-card p-10 text-center md:p-16" data-testid="champion-screen">
            <div className="flex justify-center">
              <PixelSprite bitmap={TROPHY_BITMAP} scale={7} ink="var(--paper)" className="bob" />
            </div>
            <div className="label mt-8 !text-[var(--paper)] opacity-60">Sezon Tamamlandi</div>
            <h2 className="font-pixel mt-5 text-[20px] leading-[1.6] md:text-[28px]">
              {playerRow === 0 ? 'SAMPIYON: ARC FC' : `SAMPIYON: ${standings[0].team.name}`}
            </h2>
            <p className="mx-auto mt-5 max-w-lg text-[15px] leading-7 opacity-70">
              {playerRow === 0
                ? 'Daire kapandi. Cok zor botlari gecip ligi tepede bitirdin.'
                : `Sezonu ${playerRow + 1}. sirada bitirdin. Yeni sezonda daire yeniden acilir.`}
            </p>
            <button onClick={onReset} className="btn-outline mt-10 !bg-transparent !text-[var(--paper)] !border-[var(--paper)] hover:!bg-[var(--paper)] hover:!text-[var(--ink)]">
              YENI SEZON <ArrowRight size={14} />
            </button>
          </section>
        ) : (
          fixture && (
            <section className="mt-12 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
              <div className="frame-card p-6 md:p-8" data-testid="next-fixture-card">
                <div className="label mb-6">Siradaki Mac &middot; {ARENAS[fixture.arena].name}</div>
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <PixelSprite bitmap={teamChar(fixture.home).bitmap} scale={6} ink="var(--ink)" />
                    <div className="font-pixel text-[11px] md:text-[13px]">{fixture.home.name}</div>
                    <div className="font-mono text-[10px] tracking-widest text-[var(--ink-soft)]">SEN</div>
                  </div>
                  <div className="font-pixel text-[18px] text-[var(--ink-soft)]">VS</div>
                  <div className="flex flex-col items-center gap-3 text-center">
                    <div className="bg-[var(--ink)] p-1">
                      <PixelSprite bitmap={teamChar(fixture.away).bitmap} scale={6} ink="var(--paper)" flip />
                    </div>
                    <div className="font-pixel text-[11px] md:text-[13px]">{fixture.away.name}</div>
                    <div className="font-mono text-[10px] tracking-widest text-[var(--ink-soft)]">BOT &middot; COK ZOR</div>
                  </div>
                </div>
                <div className="mt-8 flex justify-center">
                  <Link to="/oyun?mode=league" className="btn-ink" data-testid="play-next-match-btn">
                    MACA CIK <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
              <div className="frame-card p-6">
                <div className="label mb-4">Rakip Profili</div>
                <div className="font-pixel text-[12px]">{fixture.away.name}</div>
                <p className="mt-3 text-[14px] leading-6 text-[var(--ink-soft)]">{fixture.away.style}. Topun dusus noktasini hesaplar, kaleyi kapatir ve bosluk buldugu an sutu ceker.</p>
                <div className="font-mono mt-6 space-y-2 text-[11px] tracking-wider text-[var(--ink-soft)]">
                  <div className="flex justify-between border-b border-[var(--line)] pb-2"><span>ZORLUK</span><span className="text-[var(--ink)]">COK ZOR</span></div>
                  <div className="flex justify-between border-b border-[var(--line)] pb-2"><span>SURE</span><span className="text-[var(--ink)]">60 SN</span></div>
                  <div className="flex justify-between pb-2"><span>SAHA</span><span className="text-[var(--ink)]">{ARENAS[fixture.arena].name}</span></div>
                </div>
              </div>
            </section>
          )
        )}

        {/* Puan tablosu */}
        <section className="mt-12 frame-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4">
            <div className="label">Puan Durumu</div>
            <div className="font-mono text-[10px] tracking-widest text-[var(--ink-soft)]">G3 &middot; B1 &middot; M0</div>
          </div>
          <Table data-testid="standings-table">
            <TableHeader>
              <TableRow className="font-mono text-[10px] tracking-widest">
                <TableHead className="w-10">#</TableHead>
                <TableHead>TAKIM</TableHead>
                <TableHead className="text-center">O</TableHead>
                <TableHead className="text-center">G</TableHead>
                <TableHead className="text-center">B</TableHead>
                <TableHead className="text-center">M</TableHead>
                <TableHead className="hidden text-center sm:table-cell">A</TableHead>
                <TableHead className="hidden text-center sm:table-cell">Y</TableHead>
                <TableHead className="text-center">AV</TableHead>
                <TableHead className="text-center">P</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {standings.map((r, i) => (
                <TableRow key={r.team.id} className={`font-mono text-[12px] ${r.team.isPlayer ? 'bg-[var(--ink)] text-[var(--paper)] hover:bg-[var(--ink)]' : ''}`} data-testid={`standing-row-${r.team.id}`}>
                  <TableCell className="font-pixel text-[10px]">{i + 1}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <PixelSprite bitmap={teamChar(r.team).bitmap} scale={2} ink={r.team.isPlayer ? 'var(--paper)' : 'var(--ink)'} />
                      <span className="tracking-wider">{r.team.name}</span>
                      {i === 0 && finished && <Trophy size={12} />}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{r.o}</TableCell>
                  <TableCell className="text-center">{r.g}</TableCell>
                  <TableCell className="text-center">{r.b}</TableCell>
                  <TableCell className="text-center">{r.m}</TableCell>
                  <TableCell className="hidden text-center sm:table-cell">{r.a}</TableCell>
                  <TableCell className="hidden text-center sm:table-cell">{r.y}</TableCell>
                  <TableCell className="text-center">{r.av > 0 ? `+${r.av}` : r.av}</TableCell>
                  <TableCell className="font-pixel text-center text-[10px]">{r.p}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>

        {/* Fikstur */}
        <section className="mt-12">
          <div className="label mb-6">Fikstur &amp; Sonuclar</div>
          <div className="grid gap-4 md:grid-cols-5">
            {ROUNDS.map((pairs, r) => {
              const res = league.results[r];
              const current = r === league.round && !finished;
              return (
                <div key={r} className={`frame-card p-4 ${current ? '!border-[var(--ink)]' : ''}`} data-testid={`round-card-${r + 1}`}>
                  <div className="flex items-center justify-between">
                    <div className="font-pixel text-[10px]">HAFTA {r + 1}</div>
                    <div className="font-mono text-[9px] tracking-widest text-[var(--ink-soft)]">{res ? 'BITTI' : current ? 'SIRADA' : 'BEKLIYOR'}</div>
                  </div>
                  <div className="mt-4 space-y-2">
                    {pairs.map(([h, a], i) => {
                      const m = res?.[i];
                      return (
                        <div key={i} className="font-mono flex items-center justify-between gap-2 text-[11px] tracking-wider">
                          <span className={ALL_TEAMS[h].isPlayer ? 'font-semibold' : ''}>{ALL_TEAMS[h].short}</span>
                          <span className="bg-[var(--paper)] px-2 py-[2px] text-[var(--ink)]">{m ? `${m.hs} - ${m.as}` : '-'}</span>
                          <span className={ALL_TEAMS[a].isPlayer ? 'font-semibold' : ''}>{ALL_TEAMS[a].short}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
};

export default League;
