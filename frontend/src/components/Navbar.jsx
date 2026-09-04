import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, Volume2, VolumeX } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import PixelSprite from './PixelSprite';
import { ConnectPill } from './WalletGate';
import { BALL_BITMAP, getSoundEnabled, setSoundEnabled } from '../mock';

const LINKS = [
  { to: '/', label: 'Home' },
  { to: '/league', label: 'League' },
  { to: '/leaderboard', label: 'Leaderboard' },
  { to: '/#characters', label: 'Characters' },
  { to: '/#how-to-play', label: 'How to Play' },
];

const Navbar = () => {
  const loc = useLocation();
  const [sound, setSound] = useState(getSoundEnabled());
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (loc.hash) {
      const el = document.querySelector(loc.hash);
      if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
    }
  }, [loc]);

  const toggleSound = () => {
    const v = !sound;
    setSound(v);
    setSoundEnabled(v);
    window.dispatchEvent(new CustomEvent('futbot-sound', { detail: v }));
  };

  const isActive = (to) => (to === '/' ? loc.pathname === '/' && !loc.hash : loc.pathname + loc.hash === to || loc.pathname === to);

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[rgba(239,237,228,0.85)] backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-5 md:px-10">
        <Link to="/" className="flex items-center gap-3" data-testid="nav-logo">
          <div className="flex h-9 w-9 items-center justify-center border-2 border-[var(--ink)] bg-[var(--paper-2)]">
            <PixelSprite bitmap={BALL_BITMAP} scale={3} ink="var(--ink)" />
          </div>
          <div className="leading-none">
            <div className="font-pixel text-[13px] tracking-wide">FUTBOT LEAGUE</div>
            <div className="font-mono mt-1 text-[10px] tracking-[0.18em] text-[var(--ink-soft)]">1-Bit Head Soccer on Robinhood Chain</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {LINKS.map((l) => (
            <Link key={l.to} to={l.to} className={`nav-link ${isActive(l.to) ? 'active' : ''}`} data-testid={`nav-${l.label.toLowerCase().replace(/\s/g, '-')}`}>
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <button onClick={toggleSound} className="text-[var(--ink-soft)] transition-colors hover:text-[var(--ink)]" aria-label="Sound" data-testid="sound-toggle">
            {sound ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
          <div className="hidden sm:block">
            <ConnectPill />
          </div>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button className="lg:hidden" aria-label="Menu" data-testid="mobile-menu-btn">
                <Menu size={22} />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 border-l border-[var(--line)] bg-[var(--paper)]">
              <div className="font-pixel mb-8 mt-2 text-xs">FUTBOT LEAGUE</div>
              <div className="flex flex-col gap-6">
                {LINKS.map((l) => (
                  <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="nav-link text-sm">
                    {l.label}
                  </Link>
                ))}
                <div className="mt-4">
                  <ConnectPill />
                </div>
                <Link to="/play?mode=quick" onClick={() => setOpen(false)} className="btn-ink">
                  QUICK MATCH
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
