import { useState, useMemo } from 'react';
import HostessBottomNav from '@/components/hostess/HostessBottomNav';
import RoleSwitcher from '@/components/RoleSwitcher';
import { useTablesStore } from '@/stores/tablesStore';
import OpenTableDialog from '@/components/waiter/OpenTableDialog';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface WaitlistEntry {
  id: string;
  name: string;
  partySize: number;
  waitingSince: string; // ISO
  type: 'walkin' | 'reservation';
  reservationTime?: string; // HH:mm
  notes?: string;
}

const now = new Date();
const hh = (h: number, m: number) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
const currentHour = now.getHours();
const currentMin = now.getMinutes();

const initialWaitlist: WaitlistEntry[] = [
  { id: 'r1', name: 'Familia Hernández', partySize: 5, waitingSince: new Date(Date.now() - 10 * 60000).toISOString(), type: 'reservation', reservationTime: hh(currentHour, currentMin - 10 < 0 ? 0 : currentMin - 10), notes: 'Cumpleaños' },
  { id: 'w1', name: 'García', partySize: 4, waitingSince: new Date(Date.now() - 25 * 60000).toISOString(), type: 'walkin' },
  { id: 'w2', name: 'Martínez', partySize: 2, waitingSince: new Date(Date.now() - 12 * 60000).toISOString(), type: 'walkin' },
  { id: 'r2', name: 'Sr. Domínguez', partySize: 2, waitingSince: new Date(Date.now() - 2 * 60000).toISOString(), type: 'reservation', reservationTime: hh(currentHour, currentMin + 20 > 59 ? 59 : currentMin + 20) },
  { id: 'w3', name: 'López', partySize: 6, waitingSince: new Date(Date.now() - 8 * 60000).toISOString(), type: 'walkin' },
  { id: 'r3', name: 'Sra. Villanueva', partySize: 8, waitingSince: new Date(Date.now() - 1 * 60000).toISOString(), type: 'reservation', reservationTime: hh(currentHour + 1, currentMin), notes: 'Terraza preferida' },
  { id: 'w4', name: 'Rodríguez', partySize: 3, waitingSince: new Date(Date.now() - 3 * 60000).toISOString(), type: 'walkin' },
];

function minutesAgo(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
}

function parseTime(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

const AVG_TURNOVER_MIN = 45;

export default function WaitlistPage() {
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>(initialWaitlist);
  const tables = useTablesStore((s) => s.tables);
  const openTable = useTablesStore((s) => s.openTable);
  const [assigningEntry, setAssigningEntry] = useState<WaitlistEntry | null>(null);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Add form state
  const [newName, setNewName] = useState('');
  const [newSize, setNewSize] = useState('2');
  const [newNotes, setNewNotes] = useState('');
  const [newType, setNewType] = useState<'walkin' | 'reservation'>('walkin');
  const [newResTime, setNewResTime] = useState('');

  const emptyTables = tables.filter((t) => t.status === 'empty');
  const nowMinutes = currentHour * 60 + currentMin;

  // Sort: past-due reservations first, then walk-ins by wait time, then future reservations
  const sortedWaitlist = useMemo(() => {
    return [...waitlist].sort((a, b) => {
      const aIsPastRes = a.type === 'reservation' && a.reservationTime && parseTime(a.reservationTime) <= nowMinutes;
      const bIsPastRes = b.type === 'reservation' && b.reservationTime && parseTime(b.reservationTime) <= nowMinutes;
      if (aIsPastRes && !bIsPastRes) return -1;
      if (!aIsPastRes && bIsPastRes) return 1;
      if (aIsPastRes && bIsPastRes) return parseTime(a.reservationTime!) - parseTime(b.reservationTime!);

      const aIsFutureRes = a.type === 'reservation' && a.reservationTime && parseTime(a.reservationTime) > nowMinutes;
      const bIsFutureRes = b.type === 'reservation' && b.reservationTime && parseTime(b.reservationTime) > nowMinutes;
      if (!aIsFutureRes && bIsFutureRes) return -1;
      if (aIsFutureRes && !bIsFutureRes) return 1;
      if (aIsFutureRes && bIsFutureRes) return parseTime(a.reservationTime!) - parseTime(b.reservationTime!);

      // Both walk-ins: by wait time (oldest first)
      return new Date(a.waitingSince).getTime() - new Date(b.waitingSince).getTime();
    });
  }, [waitlist, nowMinutes]);

  // Estimate wait time for a position in queue
  function estimateWait(position: number): number {
    const freeCount = Math.max(emptyTables.length, 1);
    return Math.max(5, Math.round((position * AVG_TURNOVER_MIN) / freeCount));
  }

  // Estimate for a new entry (would be last)
  const newEntryEstimate = estimateWait(sortedWaitlist.length + 1);

  const handleAssignTable = (tableId: string) => {
    if (!assigningEntry) return;
    setSelectedTableId(tableId);
  };

  const handleAddEntry = () => {
    if (!newName.trim()) return;
    const entry: WaitlistEntry = {
      id: `w-${Date.now()}`,
      name: newName.trim(),
      partySize: parseInt(newSize) || 2,
      waitingSince: new Date().toISOString(),
      type: newType,
      reservationTime: newType === 'reservation' ? newResTime : undefined,
      notes: newNotes.trim() || undefined,
    };
    setWaitlist((w) => [...w, entry]);
    setNewName('');
    setNewSize('2');
    setNewNotes('');
    setNewType('walkin');
    setNewResTime('');
    setShowAddForm(false);
    toast.success(`${entry.name} agregado a la lista`);
  };

  const selectedTable = tables.find((t) => t.id === selectedTableId);

  return (
    <div className="min-h-screen bg-w-bg pb-20">
      <div className="sticky top-0 z-40 bg-w-bg/95 backdrop-blur-md border-b border-w-border px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-[18px] font-semibold text-w-text">Lista de Espera</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddForm(true)}
              className="w-8 h-8 rounded-full bg-w-brand text-white flex items-center justify-center text-[18px] font-bold"
            >
              +
            </button>
            <RoleSwitcher />
          </div>
        </div>
      </div>

      <div className="px-4 pt-3 space-y-2.5">
        {/* Summary bar */}
        <div className="flex gap-2 mb-1">
          <div className="flex-1 rounded-lg bg-w-surface border border-w-border px-3 py-2 text-center">
            <p className="text-[16px] font-bold text-w-text">{sortedWaitlist.length}</p>
            <p className="text-[10px] text-w-text-secondary">En espera</p>
          </div>
          <div className="flex-1 rounded-lg bg-w-surface border border-w-border px-3 py-2 text-center">
            <p className="text-[16px] font-bold text-w-success">{emptyTables.length}</p>
            <p className="text-[10px] text-w-text-secondary">Mesas libres</p>
          </div>
          <div className="flex-1 rounded-lg bg-w-surface border border-w-border px-3 py-2 text-center">
            <p className="text-[16px] font-bold text-w-text">~{estimateWait(sortedWaitlist.length)} min</p>
            <p className="text-[10px] text-w-text-secondary">Espera prom.</p>
          </div>
        </div>

        {sortedWaitlist.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-[48px] mb-3">✨</p>
            <p className="text-[18px] font-semibold text-w-text">Sin lista de espera</p>
            <p className="text-[13px] text-w-text-secondary mt-1">Todas las mesas disponibles</p>
          </div>
        ) : (
          sortedWaitlist.map((entry, idx) => {
            const isReservation = entry.type === 'reservation';
            const isPastDue = isReservation && entry.reservationTime && parseTime(entry.reservationTime) <= nowMinutes;
            const waitEst = estimateWait(idx + 1);

            return (
              <div
                key={entry.id}
                className={`rounded-xl bg-w-surface border p-4 flex items-center justify-between ${
                  isReservation
                    ? isPastDue
                      ? 'border-w-warning/50'
                      : 'border-w-brand/30'
                    : 'border-w-border'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[15px] font-semibold text-w-text">{entry.name}</p>
                    {isReservation && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                        isPastDue
                          ? 'bg-w-warning/20 text-w-warning'
                          : 'bg-w-brand/15 text-w-brand'
                      }`}>
                        🕐 {entry.reservationTime}
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] text-w-text-secondary">
                    {entry.partySize} personas · {minutesAgo(entry.waitingSince)} min esperando
                    {entry.notes && <span className="text-w-text-secondary/70"> · {entry.notes}</span>}
                  </p>
                  <p className="text-[11px] text-w-brand mt-0.5">~{waitEst} min estimado</p>
                </div>
                <div className="flex gap-2 items-center ml-2">
                  {emptyTables.length > 0 ? (
                    <button
                      onClick={() => setAssigningEntry(entry)}
                      className="px-3 py-1.5 rounded-lg bg-w-brand text-white text-[12px] font-medium min-h-[36px]"
                    >
                      Asignar
                    </button>
                  ) : (
                    <span className="text-[11px] text-w-text-secondary italic">Sin mesas</span>
                  )}
                  <button
                    onClick={() => setWaitlist((w) => w.filter((e) => e.id !== entry.id))}
                    className="px-2 py-1.5 rounded-lg text-w-text-secondary text-[12px] min-h-[36px] hover:text-w-error"
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Table selection — centered */}
      {assigningEntry && !selectedTableId && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-w-surface rounded-2xl w-full max-w-md p-4 pb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[16px] font-semibold text-w-text">
                Asignar a {assigningEntry.name} ({assigningEntry.partySize} personas)
              </h2>
              <button onClick={() => setAssigningEntry(null)} className="text-w-text-secondary text-[18px]">✕</button>
            </div>
            {emptyTables.length === 0 ? (
              <p className="text-[13px] text-w-text-secondary">No hay mesas disponibles</p>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {emptyTables.sort((a, b) => a.number - b.number).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleAssignTable(t.id)}
                    className="rounded-xl border border-w-success/30 bg-w-bg p-3 text-center hover:border-w-success/60"
                  >
                    <p className="text-[16px] font-bold text-w-text">#{t.number}</p>
                    {t.assignedWaiter && (
                      <p className="text-[9px] text-w-text-secondary">{t.assignedWaiter}</p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {selectedTable && assigningEntry && (
        <OpenTableDialog
          open={!!selectedTableId}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedTableId(null);
              setAssigningEntry(null);
            }
          }}
          tableNumber={selectedTable.number}
          subtitle={`Para ${assigningEntry.name}`}
          onConfirm={(count) => {
            openTable(selectedTable.id, count);
            setWaitlist((w) => w.filter((e) => e.id !== assigningEntry.id));
            toast.success(`Mesa ${selectedTable.number} asignada a ${assigningEntry.name}`);
            setSelectedTableId(null);
            setAssigningEntry(null);
          }}
        />
      )}

      {/* Add entry dialog */}
      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="bg-w-surface border-w-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-w-text">Agregar a la lista</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {/* Type toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setNewType('walkin')}
                className={`flex-1 py-2 rounded-lg text-[13px] font-medium border transition-colors ${
                  newType === 'walkin'
                    ? 'bg-w-brand text-white border-w-brand'
                    : 'bg-w-bg text-w-text-secondary border-w-border'
                }`}
              >
                Walk-in
              </button>
              <button
                onClick={() => setNewType('reservation')}
                className={`flex-1 py-2 rounded-lg text-[13px] font-medium border transition-colors ${
                  newType === 'reservation'
                    ? 'bg-w-brand text-white border-w-brand'
                    : 'bg-w-bg text-w-text-secondary border-w-border'
                }`}
              >
                Reservación
              </button>
            </div>

            <div>
              <label className="text-[12px] text-w-text-secondary mb-1 block">Nombre</label>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nombre del cliente"
                className="w-full px-3 py-2 rounded-lg border border-w-border bg-w-bg text-w-text text-[14px] placeholder:text-w-text-secondary/50"
              />
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-[12px] text-w-text-secondary mb-1 block">Personas</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={newSize}
                  onChange={(e) => setNewSize(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-w-border bg-w-bg text-w-text text-[14px]"
                />
              </div>
              {newType === 'reservation' && (
                <div className="flex-1">
                  <label className="text-[12px] text-w-text-secondary mb-1 block">Hora</label>
                  <input
                    type="time"
                    value={newResTime}
                    onChange={(e) => setNewResTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-w-border bg-w-bg text-w-text text-[14px]"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="text-[12px] text-w-text-secondary mb-1 block">Notas (opcional)</label>
              <input
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="Cumpleaños, terraza, etc."
                className="w-full px-3 py-2 rounded-lg border border-w-border bg-w-bg text-w-text text-[14px] placeholder:text-w-text-secondary/50"
              />
            </div>

            <p className="text-[12px] text-w-brand">Tiempo estimado de espera: ~{newEntryEstimate} min</p>

            <button
              onClick={handleAddEntry}
              disabled={!newName.trim()}
              className="w-full py-2.5 rounded-lg bg-w-brand text-white text-[14px] font-semibold disabled:opacity-40"
            >
              Agregar
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <HostessBottomNav />
    </div>
  );
}
