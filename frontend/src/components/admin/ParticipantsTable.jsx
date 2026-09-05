import React, { useEffect, useState } from 'react';
import { Loader2, Check, Minus } from 'lucide-react';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { adminApi, padTicket, TIERS, fmtUsd } from '../../lib/early';
import { errMsg } from '../../lib/api';

const Mark = ({ ok }) => (ok ? <Check size={12} className="mx-auto" /> : <Minus size={12} className="mx-auto opacity-30" />);

const ParticipantsTable = () => {
  const [rows, setRows] = useState(null);

  useEffect(() => {
    adminApi.get('/admin/participants').then((r) => setRows(r.data)).catch((e) => toast.error(errMsg(e)));
  }, []);

  if (!rows) return <Loader2 className="animate-spin" size={16} />;

  return (
    <div className="overflow-x-auto border border-[var(--line)] bg-[var(--paper)]" data-testid="admin-participants">
      <div className="font-mono border-b border-[var(--line)] px-5 py-3 text-[11px] tracking-widest text-[var(--ink-soft)]">
        {rows.length} REGISTERED · {rows.filter((r) => r.completed).length} COMPLETED
      </div>
      <Table>
        <TableHeader>
          <TableRow className="font-mono text-[10px] tracking-widest">
            <TableHead>TICKET</TableHead>
            <TableHead>X</TableHead>
            <TableHead>WALLET</TableHead>
            <TableHead className="text-center">F</TableHead>
            <TableHead className="text-center">RT</TableHead>
            <TableHead className="text-center">Q</TableHead>
            <TableHead>TIER</TableHead>
            <TableHead className="text-right">VOL</TableHead>
            <TableHead className="text-right">REFS</TableHead>
            <TableHead className="text-right">PTS</TableHead>
            <TableHead>JOINED</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id} className="font-mono text-[12px]" data-testid={`participant-${r.ticket_no}`}>
              <TableCell className="font-pixel text-[10px]">{padTicket(r.ticket_no)}</TableCell>
              <TableCell>@{r.x_username}</TableCell>
              <TableCell className="text-[11px]" title={r.wallet}>{r.wallet}</TableCell>
              <TableCell><Mark ok={r.tasks.follow} /></TableCell>
              <TableCell><Mark ok={r.tasks.rt} /></TableCell>
              <TableCell><Mark ok={r.tasks.quote} /></TableCell>
              <TableCell className="font-pixel text-[9px]" style={{ color: r.tier ? TIERS[r.tier].color : 'var(--ink-soft)' }}>{r.tier ? TIERS[r.tier].label : '—'}</TableCell>
              <TableCell className="text-right text-[11px]">{r.volume_usd != null ? fmtUsd(r.volume_usd) : '—'}</TableCell>
              <TableCell className="text-right">{r.referrals}{r.referred_by ? <span className="ml-1 text-[10px] text-[var(--ink-soft)]">← @{r.referred_by}</span> : null}</TableCell>
              <TableCell className="text-right">{r.points}</TableCell>
              <TableCell className="text-[var(--ink-soft)]">{new Date(r.created_at).toISOString().slice(0, 10)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ParticipantsTable;
