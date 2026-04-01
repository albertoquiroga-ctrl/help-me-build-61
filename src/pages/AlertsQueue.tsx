import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Volume2, VolumeX } from 'lucide-react';
import WaiterBottomNav from '@/components/waiter/WaiterBottomNav';
import NotificationCard from '@/components/waiter/NotificationCard';
import { useNotificationsStore, type NotifChannel } from '@/stores/notificationsStore';
import { useTablesStore } from '@/stores/tablesStore';
import { toast } from 'sonner';
import OpenTableDialog from '@/components/waiter/OpenTableDialog';

type Filter = 'all' | 'active' | 'resolved';

const priorityIcons: Record<string, string> = {
  urgent: '🔴', medium: '🔵', high: '🟢', low: '🟡',
};

const channelIcons: Record<NotifChannel, string> = {
  mesas: '🪑',
  gerente: '👨‍💼',
  cocina: '🍳',
  barra: '🍸',
  hostess: '💁',
};

const channelLabels: Record<NotifChannel, string> = {
  mesas: 'Mesas',
  gerente: 'Gerente',
  cocina: 'Cocina',
  barra: 'Barra',
  hostess: 'Hostess',
};

const channelKeys: ('all' | NotifChannel)[] = ['all', 'mesas', 'gerente', 'cocina', 'barra', 'hostess'];

export default function AlertsQueue() {
  const { queue, markAllRead, resolve } = useNotificationsStore();
  const openTable = useTablesStore((s) => s.openTable);
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>('all');
  const [channelFilter, setChannelFilter] = useState<'all' | NotifChannel>('all');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [qrOpenDialog, setQrOpenDialog] = useState<{ notifId: string; tableId: string; tableNumber: number } | null>(null);

  const tables = useTablesStore((s) => s.tables);

  useState(() => { markAllRead(); });

  const filtered = queue.filter((n) => {
    if (filter === 'active' && n.resolved) return false;
    if (filter === 'resolved' && !n.resolved) return false;
    if (channelFilter !== 'all' && (n.channel || 'mesas') !== channelFilter) return false;
    return true;
  });

  const filters: { key: Filter; label: string }[] = [
    { key: 'all', label: 'Todas' },
    { key: 'active', label: 'Activas' },
    { key: 'resolved', label: 'Resueltas' },
  ];

  const handleAlertClick = (n: typeof queue[0]) => {
    if (n.type === 'qr-open-request' && !n.resolved) {
      const t = tables.find((t) => t.id === n.tableId);
      if (t) setQrOpenDialog({ notifId: n.id, tableId: n.tableId, tableNumber: t.number });
      return;
    }
    if (n.tableId) {
      navigate(`/waiter/table/${n.tableId}`);
    }
  };

  const handleConfirmQrOpen = (guestCount: number) => {
    if (!qrOpenDialog) return;
    openTable(qrOpenDialog.tableId, guestCount);
    resolve(qrOpenDialog.notifId, 'Mesa abierta ✓');
    toast.success(`✓ Mesa ${qrOpenDialog.tableNumber} abierta · ${guestCount} silla${guestCount > 1 ? 's' : ''}`);
    setQrOpenDialog(null);
    navigate(`/waiter/table/${qrOpenDialog.tableId}`);
  };

  const hasSpeechSupport = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const toggleReadAloud = useCallback(() => {
    if (!hasSpeechSupport) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const activeAlerts = queue.filter((n) => !n.resolved);
    if (activeAlerts.length === 0) return;

    const text = activeAlerts.map((n) => {
      const ch = n.channel ? channelLabels[n.channel] : '';
      return `${ch}: ${n.title}. ${n.subtitle}`;
    }).join('. ');

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-MX';
    utterance.rate = 1.1;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }, [isSpeaking, queue, hasSpeechSupport]);

  return (
    <div className="min-h-screen bg-w-bg pb-20">
      <div className="sticky top-0 z-40 bg-w-bg/95 backdrop-blur-md border-b border-w-border px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-[18px] font-semibold text-w-text">Alertas</h1>
          <div className="flex items-center gap-2">
            {hasSpeechSupport && (
              <button
                onClick={toggleReadAloud}
                className={`w-9 h-9 flex items-center justify-center rounded-[8px] transition-colors ${isSpeaking ? 'bg-w-brand/15 text-w-brand' : 'text-w-text-secondary'}`}
              >
                {isSpeaking ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
            )}
            <div className="flex gap-1.5">
              {filters.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`px-2.5 py-1 text-[11px] rounded-[6px] font-medium transition-colors ${filter === f.key ? 'bg-w-brand/15 text-w-brand' : 'text-w-text-secondary'}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        {/* Channel filters */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {channelKeys.map((ch) => (
            <button
              key={ch}
              onClick={() => setChannelFilter(ch)}
              className={`flex items-center gap-1 px-2.5 py-1 text-[11px] rounded-[6px] font-medium transition-colors whitespace-nowrap ${channelFilter === ch ? 'bg-w-brand/15 text-w-brand' : 'text-w-text-secondary'}`}
            >
              {ch === 'all' ? '📋' : channelIcons[ch]} {ch === 'all' ? 'Todos' : channelLabels[ch]}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-3 space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[32px] mb-2">😌</p>
            <p className="text-[16px] font-semibold text-w-text">Todo tranquilo por ahora</p>
            <p className="text-[13px] text-w-text-secondary mt-1">Las notificaciones de tus mesas aparecerán aquí.</p>
          </div>
        ) : (
          filtered.map((n) => {
            const isInternal = ['manager-msg', 'kitchen-msg', 'bar-msg', 'host-msg'].includes(n.type);
            const icon = isInternal && n.channel ? channelIcons[n.channel] : priorityIcons[n.priority];
            return (
              <NotificationCard
                key={n.id}
                priority={n.priority}
                title={`${icon} ${n.title}`}
                channel={n.channel}
                className={n.resolved ? 'opacity-60' : ''}
                onClick={n.tableId ? () => handleAlertClick(n) : undefined}
              >
                <div className="flex items-center justify-between mt-1.5">
                  <span className="font-mono text-[10px] text-w-text-secondary">
                    {new Date(n.timestamp).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {n.resolution && (
                    <span className="text-[10px] text-w-text-secondary">{n.resolution}</span>
                  )}
                </div>
              </NotificationCard>
            );
          })
        )}
      </div>

      <WaiterBottomNav />

      <OpenTableDialog
        open={!!qrOpenDialog}
        onOpenChange={(open) => !open && setQrOpenDialog(null)}
        tableNumber={qrOpenDialog?.tableNumber ?? 0}
        subtitle="Un cliente escaneó el QR. ¿Cuántos comensales?"
        onConfirm={handleConfirmQrOpen}
      />
    </div>
  );
}
