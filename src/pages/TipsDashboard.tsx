import { useState } from 'react';
import WaiterBottomNav from '@/components/waiter/WaiterBottomNav';
import RoundBadge from '@/components/waiter/RoundBadge';
import { useTipsStore } from '@/stores/tipsStore';
import { motion } from 'framer-motion';

const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export default function TipsDashboard() {
  const { todayTotal, timeline, weeklyTotals, propinaModeActive, togglePropinaMode, addTip } = useTipsStore();
  const [tab, setTab] = useState<'today' | 'week'>('today');

  const simulateTip = () => {
    const names = ['Pedro', 'Ana', 'Diego', 'Sofía'];
    const tables = [2, 4, 6, 7];
    addTip({
      tableNumber: tables[Math.floor(Math.random() * tables.length)],
      round: Math.floor(Math.random() * 3) + 1,
      amount: Math.floor(Math.random() * 80) + 20,
      timestamp: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
      guestName: names[Math.floor(Math.random() * names.length)],
    });
  };

  const maxWeekly = Math.max(...weeklyTotals, 1);

  return (
    <div className="min-h-screen bg-w-bg pb-20">
      <div className="sticky top-0 z-40 bg-w-bg/95 backdrop-blur-md border-b border-w-border px-4 py-3 flex items-center justify-between">
        <h1 className="text-[18px] font-semibold text-w-text">Propinas · Hoy</h1>
        <span className="font-mono text-[12px] text-w-text-secondary">30 Mar 2026</span>
      </div>

      <div className="px-4 pt-6 space-y-4">
        {/* Hero */}
        <div className="text-center">
          <motion.p
            key={todayTotal}
            initial={{ scale: 1.1, opacity: 0.7 }}
            animate={{ scale: 1, opacity: 1 }}
            className="font-mono text-[40px] font-bold text-w-tip"
          >
            ${todayTotal} MXN
          </motion.p>
          <p className="text-[14px] text-w-text-secondary">en {timeline.length} mesas atendidas hoy</p>
        </div>

        {/* Tab selector */}
        <div className="flex bg-w-surface rounded-[8px] p-1">
          {(['today', 'week'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 text-[13px] font-medium rounded-[6px] transition-colors ${tab === t ? 'bg-w-elevated text-w-brand' : 'text-w-text-secondary'}`}
            >
              {t === 'today' ? 'Hoy' : 'Esta semana'}
            </button>
          ))}
        </div>

        {/* Modo Propina */}
        <div className={`rounded-[10px] border-l-[3px] border-w-tip p-3.5 ${propinaModeActive ? 'bg-w-tip/10 border border-r border-t border-b border-w-tip/30' : 'bg-w-surface border border-r border-t border-b border-w-border'}`}>
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-bold text-w-text">Modo Propina Activo 🔥</span>
            <button
              onClick={togglePropinaMode}
              className={`w-11 h-6 rounded-full relative transition-colors ${propinaModeActive ? 'bg-w-tip' : 'bg-w-border'}`}
            >
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${propinaModeActive ? 'left-[22px]' : 'left-0.5'}`} />
            </button>
          </div>
          <p className="text-[12px] text-w-text-secondary mt-1">
            {propinaModeActive ? 'Activado — recibirás más sugerencias de check-in.' : 'Desactivado · Sugerencias de check-in reducidas.'}
          </p>
        </div>

        {tab === 'today' ? (
          /* Timeline */
          <div className="space-y-2">
            {timeline.map((entry, i) => (
              <div key={i} className="rounded-[10px] bg-w-surface border border-w-border p-3 flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[13px] text-w-text">Mesa {entry.tableNumber}</span>
                    <RoundBadge round={entry.round} />
                    <span className="font-mono text-[11px] text-w-text-secondary">{entry.timestamp}</span>
                  </div>
                  <p className="text-[11px] text-w-text-secondary mt-0.5">de {entry.guestName}</p>
                </div>
                <div className="text-right">
                  <span className="font-mono text-[14px] text-w-tip font-medium">${entry.amount} MXN</span>
                  <span className="ml-1 text-[12px]">♥</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Weekly chart */
          <div>
            <div className="flex items-end gap-2 h-[160px] px-2">
              {weeklyTotals.map((val, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="font-mono text-[10px] text-w-text-secondary">{val > 0 ? `$${val}` : ''}</span>
                  <div
                    className={`w-full rounded-t-[4px] transition-all ${i === 0 ? 'bg-w-tip border border-w-brand' : 'bg-w-tip/40'}`}
                    style={{ height: `${Math.max((val / maxWeekly) * 120, 4)}px` }}
                  />
                  <span className="font-mono text-[10px] text-w-text-secondary">{days[i]}</span>
                </div>
              ))}
            </div>
            <p className="text-center font-mono text-[13px] text-w-text-secondary mt-3">${weeklyTotals.reduce((a, b) => a + b, 0)} MXN esta semana</p>
          </div>
        )}

        {/* Simulate */}
        <button
          onClick={simulateTip}
          className="w-full h-11 rounded-[8px] border border-w-border text-[13px] text-w-text-secondary font-medium active:bg-w-elevated transition-colors"
        >
          Simular propina nueva
        </button>
      </div>

      <WaiterBottomNav />
    </div>
  );
}
