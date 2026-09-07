import React, { useEffect, useState } from 'react';
import { Loader2, ShieldCheck } from 'lucide-react';
import CollabEntry from '../components/collab/CollabEntry';
import CollabPanel from '../components/collab/CollabPanel';
import CollabLedger from '../components/collab/CollabLedger';
import { collabApi, COLLAB_TOKEN } from '../lib/early';

const Collab = () => {
  const [manager, setManager] = useState(false);
  const [collab, setCollab] = useState(null);
  const [checking, setChecking] = useState(!!localStorage.getItem(COLLAB_TOKEN));
  const [ledger, setLedger] = useState(null);

  const loadLedger = () => collabApi.get('/collab/ledger').then((r) => setLedger(r.data)).catch(() => setLedger([]));

  useEffect(() => {
    loadLedger();
    if (!localStorage.getItem(COLLAB_TOKEN)) return;
    collabApi.get('/collab/me')
      .then((r) => { setCollab(r.data); setManager(true); })
      .catch(() => localStorage.removeItem(COLLAB_TOKEN))
      .finally(() => setChecking(false));
  }, []);

  const onEnter = () => collabApi.get('/collab/me').then((r) => setCollab(r.data));
  const onChange = (c) => { setCollab(c); loadLedger(); };
  const onLogout = () => { setCollab(null); setManager(false); };

  return (
    <main className="paper-grid min-h-screen">
      <div className="mx-auto max-w-[1100px] px-5 py-14 md:px-10">
        <div className="flex items-center justify-between">
          <div className="label !mb-0">Collab · Whitelist partners</div>
          <button onClick={() => setManager((m) => !m)} className={`${manager ? 'btn-ink' : 'btn-outline'} !px-4 !py-2.5 !text-[10px]`} data-testid="collab-manager-btn">
            <ShieldCheck size={12} /> {manager ? 'CLOSE MANAGER' : 'COLLAB MANAGER'}
          </button>
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_1.15fr] lg:items-start">
          <div>
            <div className="label flex items-center gap-2"><span className="h-2 w-2 bg-[var(--accent)]" /> Secure whitelist system</div>
            <h1 className="font-pixel mt-5 text-4xl leading-[1.15] sm:text-5xl lg:text-6xl" data-testid="collab-title">CONTROL<br />THE<br />ROSTER.</h1>
            <p className="mt-6 max-w-md text-[15px] leading-7 text-[var(--ink-soft)]">
              Admin controls stay separate from collab spot allocation. Limits are checked by the backend before every wallet is saved.
            </p>
            <img src="/collab/warden.png" alt="Arena Warden" className="mt-8 h-32 w-32 border-2 border-transparent [image-rendering:pixelated]" />
          </div>

          <div>
            {checking && <div className="frame-card flex items-center justify-center p-12"><Loader2 className="animate-spin" size={18} /></div>}
            {!checking && manager && !collab && <CollabEntry onEnter={onEnter} />}
            {!checking && manager && collab && <CollabPanel collab={collab} onChange={onChange} onLogout={onLogout} />}
            {!checking && !manager && (
              <div className="frame-card p-7 md:p-9" data-testid="collab-intro">
                <div className="label">How it works</div>
                <ol className="font-mono mt-5 space-y-4 text-[12px] leading-6">
                  <li><span className="font-pixel mr-3 text-[10px]">01</span>GoalHoodz team creates a collab and hands the partner a one-time GH- access code.</li>
                  <li><span className="font-pixel mr-3 text-[10px]">02</span>The partner opens <b>Collab Manager</b>, enters the code and fills GTD / FCFS spots with wallets.</li>
                  <li><span className="font-pixel mr-3 text-[10px]">03</span>Every collab shows up in the ledger below with its announcement post on X.</li>
                </ol>
                <button onClick={() => setManager(true)} className="btn-ink mt-8 w-full !py-4" data-testid="collab-open-manager">I HAVE A CODE</button>
              </div>
            )}
          </div>
        </div>

        {ledger ? <CollabLedger rows={ledger} /> : <div className="mt-20 flex justify-center"><Loader2 className="animate-spin" size={16} /></div>}
      </div>
    </main>
  );
};

export default Collab;
