import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import WaiterBottomNav from '@/components/waiter/WaiterBottomNav';
import NotificationCard from '@/components/waiter/NotificationCard';
import { useNotificationsStore } from '@/stores/notificationsStore';

type Filter = 'all' | 'active' | 'resolved';

const priorityIcons: Record<string, string> = {
  urgent: '🔴', medium: '🔵', high: '🟢', low: '🟡',
};

export default function AlertsQueue() {
  const { queue, markAllRead } = useNotificationsStore();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => { markAllRead(); }, []);

  const filtered = queue.filter((n) => {
    if (filter === 'active') return !n.resolved;
    if (filter === 'resolved') return n.resolved;
    return true;
  });

  const filters: { key: Filter; label: string }[] = [
    { key: 'all', label: 'Todas' },
    { key: 'active', label: 'Activas' },
    { key: 'resolved', label: 'Resueltas' },
  ];

  const handleAlertClick = (n: typeof queue[0]) => {
    if (n.tableId) {
      navigate(`/waiter/table/${n.tableId}`);
    }
  };

  return (
    <div className="min-h-screen bg-w-bg pb-20">
      <div className="sticky top-0 z-40 bg-w-bg/95 backdrop-blur-md border-b border-w-border px-4 py-3 flex items-center justify-between">
        <h1 className="text-[18px] font-semibold text-w-text">Alertas</h1>
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

      <div className="px-4 pt-3 space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[32px] mb-2">😌</p>
            <p className="text-[16px] font-semibold text-w-text">Todo tranquilo por ahora</p>
            <p className="text-[13px] text-w-text-secondary mt-1">Las notificaciones de tus mesas aparecerán aquí.</p>
          </div>
        ) : (
          filtered.map((n) => (
            <NotificationCard
              key={n.id}
              priority={n.priority}
              title={`${priorityIcons[n.priority]} ${n.title}`}
              className={n.resolved ? 'opacity-60' : ''}
              onClick={() => handleAlertClick(n)}
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
          ))
        )}
      </div>

      <WaiterBottomNav />
    </div>
  );
}
