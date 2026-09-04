import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, ChevronUp, Pause, Play, RotateCcw, Zap } from 'lucide-react';
import { createMatch, step, W, H } from '../game/engine';
import { render } from '../game/renderer';
import { Sfx } from '../game/sound';
import PixelSprite from '../components/PixelSprite';
import {
  ARENAS,
  BOT_TEAMS,
  PLAYER_TEAM,
  MATCH_SECONDS,
  getCharacter,
  getSelectedCharId,
  getLeague,
  nextFixture,
  recordPlayerResult,
  getSoundEnabled,
  pushHistory,
} from '../mock';

const KEYMAP = {
  ArrowLeft: 'left',
  a: 'left',
  A: 'left',
  ArrowRight: 'right',
  d: 'right',
  D: 'right',
  ArrowUp: 'jump',
  w: 'jump',
  W: 'jump',
  ' ': 'jump',
  x: 'kick',
  X: 'kick',
  k: 'kick',
  K: 'kick',
  ArrowDown: 'kick',
};

const Game = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const mode = params.get('mode') === 'league' ? 'league' : 'quick';

  // rakip / saha secimi
  const setupRef = useRef(null);
  if (!setupRef.current) {
    const league = getLeague();
    const fixture = mode === 'league' ? nextFixture(league) : null;
    const opp = fixture ? fixture.away : BOT_TEAMS[Math.floor(Math.random() * BOT_TEAMS.length)];
    const arenaId = fixture ? fixture.arena : params.get('arena') || (Math.random() < 0.5 ? 'paper' : 'inverted');
    setupRef.current = {
      opp,
      arena: ARENAS[arenaId] || ARENAS.paper,
      playerChar: getCharacter(getSelectedCharId()),
      botChar: getCharacter(opp.charId),
      leagueRound: fixture ? fixture.round : null,
    };
  }
  const setup = setupRef.current;

  const canvasRef = useRef(null);
  const stateRef = useRef(createMatch({ duration: MATCH_SECONDS }));
  const inputRef = useRef({ left: false, right: false, jump: false, kick: false });
  const sfxRef = useRef(new Sfx());
  const recordedRef = useRef(false);

  const [hud, setHud] = useState({ time: MATCH_SECONDS, score: [0, 0], phase: 'countdown', paused: false });
  const [result, setResult] = useState(null);
  const [pressed, setPressed] = useState({});

  sfxRef.current.enabled = getSoundEnabled();

  const finish = useCallback(
    (st) => {
      if (recordedRef.current) return;
      recordedRef.current = true;
      const [ps, bs] = st.score;
      const outcome = ps > bs ? 'win' : ps < bs ? 'lose' : 'draw';
      pushHistory({ opp: setup.opp.name, ps, bs, arena: setup.arena.id, mode, at: Date.now() });
      if (mode === 'league') recordPlayerResult(getLeague(), ps, bs);
      setResult({ ps, bs, outcome });
    },
    [mode, setup]
  );

  // ana dongu
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    const STEP = 1000 / 60;
    let alive = true;

    const fontsReady = document.fonts ? document.fonts.load('16px "Press Start 2P"').catch(() => {}) : Promise.resolve();

    const loop = (now) => {
      if (!alive) return;
      acc += Math.min(100, now - last);
      last = now;
      const st = stateRef.current;
      while (acc >= STEP) {
        step(st, inputRef.current);
        st.events.forEach((e) => sfxRef.current.play(e));
        acc -= STEP;
      }
      render(ctx, st, {
        arena: setup.arena,
        playerBitmap: setup.playerChar.bitmap,
        botBitmap: setup.botChar.bitmap,
        playerName: PLAYER_TEAM.name,
        botName: setup.opp.name,
      });
      const t = Math.ceil(st.time);
      setHud((h) =>
        h.time !== t || h.score[0] !== st.score[0] || h.score[1] !== st.score[1] || h.phase !== st.phase || h.paused !== st.paused
          ? { time: t, score: [...st.score], phase: st.phase, paused: st.paused }
          : h
      );
      if (st.phase === 'end') finish(st);
      raf = requestAnimationFrame(loop);
    };
    fontsReady.then(() => {
      last = performance.now();
      raf = requestAnimationFrame(loop);
    });

    const onSound = (e) => {
      sfxRef.current.enabled = e.detail;
    };
    window.addEventListener('futbot-sound', onSound);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('futbot-sound', onSound);
    };
  }, [setup, finish]);

  // klavye
  useEffect(() => {
    const down = (e) => {
      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        const st = stateRef.current;
        if (st.phase === 'play' || st.paused) st.paused = !st.paused;
        return;
      }
      const k = KEYMAP[e.key];
      if (k) {
        e.preventDefault();
        inputRef.current[k] = true;
        sfxRef.current.ensure();
      }
    };
    const up = (e) => {
      const k = KEYMAP[e.key];
      if (k) inputRef.current[k] = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  const press = (k, v) => (e) => {
    if (e && e.preventDefault) e.preventDefault();
    inputRef.current[k] = v;
    setPressed((p) => ({ ...p, [k]: v }));
    if (v) sfxRef.current.ensure();
  };

  const togglePause = () => {
    const st = stateRef.current;
    if (st.phase === 'play' || st.paused) st.paused = !st.paused;
  };

  const restart = () => {
    stateRef.current = createMatch({ duration: MATCH_SECONDS });
    recordedRef.current = false;
    setResult(null);
  };

  const goLeague = () => {
    navigate('/lig', { state: { result: result ? { ps: result.ps, bs: result.bs, opp: setup.opp.name } : null } });
  };

  const touchBtn = (k, Icon, label) => (
    <button
      className={`touch-btn ${pressed[k] ? 'pressed' : ''}`}
      onPointerDown={press(k, true)}
      onPointerUp={press(k, false)}
      onPointerLeave={press(k, false)}
      onPointerCancel={press(k, false)}
      onContextMenu={(e) => e.preventDefault()}
      aria-label={label}
      data-testid={`touch-${k}`}
    >
      <Icon size={24} />
    </button>
  );

  const outcomeText = result ? (result.outcome === 'win' ? 'KAZANDIN!' : result.outcome === 'lose' ? 'KAYBETTIN' : 'BERABERE') : '';

  return (
    <main className="paper-grid min-h-screen">
      <div className="mx-auto max-w-[1100px] px-4 py-6 md:px-10 md:py-10">
        {/* ust bilgi */}
        <div className="mb-4 flex items-center justify-between">
          <Link to={mode === 'league' ? '/lig' : '/'} className="nav-link flex items-center gap-2" data-testid="game-back-link">
            <ArrowLeft size={14} /> {mode === 'league' ? 'Lig' : 'Ana Sayfa'}
          </Link>
          <div className="label">
            {mode === 'league' ? `Hafta ${setup.leagueRound + 1}` : 'Hizli Mac'} &middot; {setup.arena.name} &middot; Cok Zor
          </div>
        </div>

        {/* skor tablosu */}
        <div className="frame-card grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 py-3 md:px-6" data-testid="scoreboard">
          <div className="flex items-center gap-3">
            <PixelSprite bitmap={setup.playerChar.bitmap} scale={2} ink="var(--ink)" />
            <div className="font-pixel text-[10px] md:text-[12px]">{PLAYER_TEAM.name}</div>
          </div>
          <div className="flex items-center gap-3 md:gap-5">
            <div className="font-pixel text-[22px] md:text-[30px]" data-testid="score-player">{hud.score[0]}</div>
            <div className="border-2 border-[var(--ink)] bg-[var(--ink)] px-3 py-2 text-[var(--paper)]">
              <div className={`font-pixel text-[14px] md:text-[18px] ${hud.time <= 10 && hud.phase === 'play' ? 'blink' : ''}`} data-testid="timer">
                {String(Math.floor(hud.time / 60)).padStart(1, '0')}:{String(hud.time % 60).padStart(2, '0')}
              </div>
            </div>
            <div className="font-pixel text-[22px] md:text-[30px]" data-testid="score-bot">{hud.score[1]}</div>
          </div>
          <div className="flex items-center justify-end gap-3">
            <div className="font-pixel text-right text-[10px] md:text-[12px]">{setup.opp.name}</div>
            <div className="bg-[var(--ink)] p-[2px]">
              <PixelSprite bitmap={setup.botChar.bitmap} scale={2} ink="var(--paper)" flip />
            </div>
          </div>
        </div>

        {/* saha */}
        <div className="relative mt-4 border-[3px] border-[var(--ink)] shadow-[8px_8px_0_rgba(28,28,34,0.15)]">
          <canvas ref={canvasRef} width={W} height={H} className="game-canvas" data-testid="game-canvas" />

          {result && (
            <div className="absolute inset-0 flex items-center justify-center bg-[rgba(239,237,228,0.9)] p-4" data-testid="result-overlay">
              <div className="frame-card w-full max-w-md p-6 text-center md:p-10">
                <div className="label">Mac Bitti</div>
                <h2 className="font-pixel mt-4 text-[20px] md:text-[26px]" data-testid="result-title">{outcomeText}</h2>
                <div className="font-pixel mt-5 text-[30px] md:text-[40px]" data-testid="result-score">
                  {result.ps} - {result.bs}
                </div>
                <div className="font-mono mt-2 text-[11px] tracking-widest text-[var(--ink-soft)]">
                  {PLAYER_TEAM.name} vs {setup.opp.name}
                </div>
                <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                  {mode === 'league' ? (
                    <button onClick={goLeague} className="btn-ink" data-testid="result-league-btn">
                      LIGE DON <ArrowRight size={14} />
                    </button>
                  ) : (
                    <button onClick={restart} className="btn-ink" data-testid="result-restart-btn">
                      <RotateCcw size={14} /> TEKRAR OYNA
                    </button>
                  )}
                  <Link to="/" className="btn-outline">ANA SAYFA</Link>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* alt kontroller */}
        <div className="mt-4 flex items-center justify-between">
          <div className="font-mono hidden text-[11px] tracking-wider text-[var(--ink-soft)] md:block">
            <span className="kbd">&larr;</span> <span className="kbd">&rarr;</span> hareket &nbsp; <span className="kbd">&uarr;</span> zipla &nbsp; <span className="kbd">X</span> vur &nbsp; <span className="kbd">P</span> duraklat
          </div>
          <div className="font-mono text-[11px] tracking-wider text-[var(--ink-soft)] md:hidden">Yatay mod onerilir</div>
          <button onClick={togglePause} className="btn-outline !px-4 !py-3 !text-[10px]" data-testid="pause-btn" disabled={!!result}>
            {hud.paused ? <Play size={12} /> : <Pause size={12} />} {hud.paused ? 'DEVAM' : 'DURAKLAT'}
          </button>
        </div>

        {/* mobil dokunmatik */}
        <div className="mt-6 flex items-center justify-between md:hidden" data-testid="touch-controls">
          <div className="flex gap-3">
            {touchBtn('left', ChevronLeft, 'Sol')}
            {touchBtn('right', ChevronRight, 'Sag')}
          </div>
          <div className="flex gap-3">
            {touchBtn('kick', Zap, 'Vur')}
            {touchBtn('jump', ChevronUp, 'Zipla')}
          </div>
        </div>
      </div>
    </main>
  );
};

export default Game;
