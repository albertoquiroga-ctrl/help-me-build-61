import WaiterBottomNav from '@/components/waiter/WaiterBottomNav';
import HostessBottomNav from '@/components/hostess/HostessBottomNav';
import BarBottomNav from '@/components/bar/BarBottomNav';
import RoleSwitcher from '@/components/RoleSwitcher';
import { useRoleStore } from '@/stores/roleStore';
import { useWaiterSession } from '@/stores/waiterSessionStore';
import { useTipsStore } from '@/stores/tipsStore';
import { useState } from 'react';
import { toast } from 'sonner';

export default function WaiterProfile() {
  const { waiterName, shiftDuration } = useWaiterSession();
  const { todayTotal, propinaModeActive, togglePropinaMode } = useTipsStore();
  const activeRole = useRoleStore((s) => s.activeRole);
  const [checkInNotifs, setCheckInNotifs] = useState(true);
  const [soundAlerts, setSoundAlerts] = useState(true);
  const [showCloseDialog, setShowCloseDialog] = useState(false);

  const h = Math.floor(shiftDuration / 3600);
  const m = Math.floor((shiftDuration % 3600) / 60);

  return (
    <div className="min-h-screen bg-w-bg pb-20">
      <div className="sticky top-0 z-40 bg-w-bg/95 backdrop-blur-md border-b border-w-border px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-[18px] font-semibold text-w-text">Mi Perfil</h1>
          <RoleSwitcher />
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Profile card */}
        <div className="rounded-[10px] bg-w-surface border border-w-border p-4 flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-w-brand flex items-center justify-center text-white font-bold text-[18px]">CM</div>
          <div>
            <p className="text-[18px] font-semibold text-w-text">{waiterName}</p>
            <p className="text-[13px] text-w-text-secondary">Mesero · La Piazza — Polanco</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-2 h-2 rounded-full bg-w-success" />
              <span className="font-mono text-[12px] text-w-success">Turno activo: {h}h {m}m</span>
            </div>
          </div>
        </div>

        {/* Shift summary */}
        <div className="rounded-[10px] bg-w-surface border border-w-border p-4">
          <p className="text-[14px] font-semibold text-w-text mb-3">Resumen de turno</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Mesas atendidas', value: '6' },
              { label: 'Propinas hoy', value: `$${todayTotal}`, color: 'text-w-tip' },
              { label: 'Órdenes procesadas', value: '14' },
              { label: 'Rating promedio', value: '⭐ 4.6' },
            ].map((s, i) => (
              <div key={i}>
                <p className={`font-mono text-[16px] font-bold ${s.color || 'text-w-text'}`}>{s.value}</p>
                <p className="text-[11px] text-w-text-secondary">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Settings */}
        <div className="rounded-[10px] bg-w-surface border border-w-border divide-y divide-w-border">
          {[
            { label: 'Modo Propina Activo 🔥', value: propinaModeActive, toggle: togglePropinaMode },
            { label: 'Notificaciones de check-in', value: checkInNotifs, toggle: () => setCheckInNotifs(!checkInNotifs) },
            { label: 'Sonido de alertas', value: soundAlerts, toggle: () => setSoundAlerts(!soundAlerts) },
          ].map((s, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3 min-h-[44px]">
              <span className="text-[13px] text-w-text">{s.label}</span>
              <button
                onClick={s.toggle}
                className={`w-11 h-6 rounded-full relative transition-colors ${s.value ? 'bg-w-brand' : 'bg-w-border'}`}
              >
                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${s.value ? 'left-[22px]' : 'left-0.5'}`} />
              </button>
            </div>
          ))}
        </div>

        {/* Actions */}
        <button className="w-full h-11 rounded-[8px] border border-w-border text-[13px] text-w-text-secondary font-medium">
          Ver historial de turnos
        </button>
        <button
          onClick={() => setShowCloseDialog(true)}
          className="w-full h-11 rounded-[8px] border border-w-error/50 text-[13px] text-w-error font-medium"
        >
          Cerrar turno
        </button>
      </div>

      {/* Close dialog */}
      {showCloseDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-w-elevated rounded-[16px] border border-w-border p-5 mx-6 max-w-sm w-full">
            <p className="text-[16px] font-semibold text-w-text">¿Cerrar turno?</p>
            <p className="text-[13px] text-w-text-secondary mt-1">Se guardarán tus propinas y estadísticas.</p>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowCloseDialog(false)} className="flex-1 h-11 rounded-[8px] border border-w-border text-[13px] text-w-text-secondary">Cancelar</button>
              <button onClick={() => { setShowCloseDialog(false); toast.success('Turno cerrado'); }} className="flex-1 h-11 rounded-[8px] bg-w-error text-white text-[13px] font-semibold">Cerrar turno</button>
            </div>
          </div>
        </div>
      )}

      <WaiterBottomNav />
    </div>
  );
}
