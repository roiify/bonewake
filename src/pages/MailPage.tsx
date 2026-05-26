import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, type MailMessage } from '../lib/db';
import { claimMail, markRead } from '../lib/mail';
import { useItems } from '../store/items';
import PageHeader from '../components/ui/PageHeader';

function rewardsLabel(r: MailMessage['rewards']) {
  const parts: string[] = [];
  if (r.gold) parts.push(`${r.gold} 🪙`);
  if (r.gems) parts.push(`${r.gems} 💎`);
  if (r.friendPoints) parts.push(`${r.friendPoints} 🤝`);
  if (r.soulshard) parts.push(`${r.soulshard} 💠`);
  if (r.energy) parts.push(`${r.energy} ⚡`);
  return parts.join(' · ');
}

function timeAgo(ms: number): string {
  const diff = Date.now() - ms;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export default function MailPage() {
  const navigate = useNavigate();
  const refreshItems = useItems(s => s.refresh);
  const [messages, setMessages] = useState<MailMessage[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);

  const load = async () => {
    const all = await db.mail.toArray();
    setMessages(all.sort((a, b) => b.sentAt - a.sentAt));
  };
  useEffect(() => { load(); }, []);

  async function onClaim(id: number) {
    const ok = await claimMail(id);
    if (ok) {
      setToast('Rewards claimed!');
      setTimeout(() => setToast(null), 1800);
      await refreshItems();
      await load();
    }
  }

  async function onExpand(id: number, current: boolean) {
    setExpanded(expanded === id ? null : id);
    if (!current) { await markRead(id); await load(); }
  }

  async function claimAll() {
    let claimed = 0;
    for (const m of messages) {
      if (!m.claimed && m.id != null) {
        const ok = await claimMail(m.id);
        if (ok) claimed++;
      }
    }
    setToast(`Claimed ${claimed} rewards`);
    setTimeout(() => setToast(null), 1800);
    await refreshItems();
    await load();
  }

  const unclaimed = messages.filter(m => !m.claimed).length;

  return (
    <div className="p-3 space-y-3">
      <button onClick={() => navigate(-1)} className="text-xs text-zinc-400">← Back</button>
      <PageHeader
        title="Mailbox"
        tagline="Reward inbox & system messages"
        glow="#34d399"
        rightSlot={unclaimed > 0 ? <button className="btn-pixel primary" onClick={claimAll}>Claim All</button> : undefined}
      />

      {messages.length === 0 ? (
        <div className="text-center text-xs text-zinc-500 py-12">No mail.</div>
      ) : (
        <div className="space-y-2">
          {messages.map(m => (
            <div
              key={m.id}
              className={`rounded-md border p-3 ${m.claimed ? 'border-zinc-800 bg-zinc-900/40 opacity-60' : m.read ? 'border-zinc-700 bg-zinc-900' : 'border-amber-700 bg-amber-900/15'}`}
            >
              <button
                onClick={() => onExpand(m.id!, !!m.read)}
                className="w-full text-left flex items-start gap-2"
              >
                <span className="text-xl">{m.claimed ? '📭' : m.read ? '📨' : '📬'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="text-xs font-pixel truncate">{m.subject}</div>
                    <div className="text-[9px] text-zinc-500 shrink-0">{timeAgo(m.sentAt)}</div>
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-0.5">{rewardsLabel(m.rewards)}</div>
                </div>
              </button>
              {expanded === m.id && (
                <div className="mt-2 pt-2 border-t border-zinc-800">
                  <div className="text-[11px] text-zinc-300 whitespace-pre-wrap">{m.body}</div>
                  {!m.claimed && (
                    <button className="btn-pixel success w-full mt-2" onClick={() => onClaim(m.id!)}>
                      Claim {rewardsLabel(m.rewards)}
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {toast && (
        <div className="fixed bottom-20 left-0 right-0 max-w-[420px] mx-auto px-3 z-50">
          <div className="rounded-md border border-emerald-700 bg-emerald-900/80 text-emerald-100 text-[11px] font-pixel p-2 text-center">{toast}</div>
        </div>
      )}
    </div>
  );
}
