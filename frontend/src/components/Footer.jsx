import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => (
  <footer className="border-t border-[var(--line)] bg-[var(--paper)]">
    <div className="mx-auto grid max-w-[1400px] gap-10 px-5 py-14 md:grid-cols-[1.6fr_1fr_1fr] md:px-10">
      <div>
        <div className="label mb-4">Futbot Lig</div>
        <p className="font-mono text-[12px] leading-6 text-[var(--ink-soft)]">
          1-bit kafa topu ligi. Kagit uzerine murekkep, murekkep uzerine top.
          <br />
          &copy; 2025 Futbot Lig. Tum pixel karakterler orijinal ciizimdir.
        </p>
      </div>
      <div>
        <div className="label mb-4">Oyun</div>
        <ul className="font-mono space-y-2 text-[12px] text-[var(--ink-soft)]">
          <li><Link className="hover:text-[var(--ink)]" to="/lig">Lig Tablosu</Link></li>
          <li><Link className="hover:text-[var(--ink)]" to="/oyun?mode=quick">Hizli Mac</Link></li>
          <li><Link className="hover:text-[var(--ink)]" to="/#karakterler">Karakterler</Link></li>
        </ul>
      </div>
      <div>
        <div className="label mb-4">Proje</div>
        <ul className="font-mono space-y-2 text-[12px] text-[var(--ink-soft)]">
          <li><Link className="hover:text-[var(--ink)]" to="/#nasil-oynanir">Nasil Oynanir</Link></li>
          <li><Link className="hover:text-[var(--ink)]" to="/#sahalar">Sahalar</Link></li>
          <li><a className="hover:text-[var(--ink)]" href="#">Iletisim</a></li>
        </ul>
      </div>
    </div>
  </footer>
);

export default Footer;
