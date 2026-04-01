import { useState } from 'react';
import HostessBottomNav from '@/components/hostess/HostessBottomNav';
import RoleSwitcher from '@/components/RoleSwitcher';
import { useTablesStore } from '@/stores/tablesStore';
import OpenTableDialog from '@/components/waiter/OpenTableDialog';
import { toast } from 'sonner';

interface WaitlistEntry {
  id: string;
  name: string;
  partySize: number;
  waitingSince: string; // ISO
}

const initialWaitlist: WaitlistEntry[] = [
  { id: 'w1', name: 'García', partySize: 4, waitingSince: new Date(Date.now() - 25 * 60000).toISOString() },
  { id: 'w2', name: 'Martínez', partySize: 2, waitingSince: new Date(Date.now() - 12 * 60000).toISOString() },
  { id: 'w3', name: 'López', partySize: 6, waitingSince: new Date(Date.now() - 8 * 60000).toISOString() },
  { id: 'w4', name: 'Rodríguez', partySize: 3, waitingSince: new Date(Date.now() - 3 * 60000).toISOString() },
];

function minutesAgo(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
}

export default function WaitlistPage() {
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>(initialWaitlist);
  const tables = useTablesStore((s) => s.tables);
  const openTable = useTablesStore((s) => s.openTable);
  const [assigningEntry, setAssigningEntry] = useState<WaitlistEntry | null>(null);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);

  const emptyTables = tables.filter((t) => t.status === 'empty');

  const handleAssignTable = (tableId: string) => {
    if (!assigningEntry) return;
    setSelectedTableId(tableId);
  };

  const selectedTable = tables.find((t) => t.id === selectedTableId);

  return (
    <div className="min-h-screen bg-w-bg pb-20">
      <div className="sticky top-0 z-40 bg-w-bg/95 backdrop-blur-md border-b border-w-border px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-[18px] font-semibold text-w-text">Lista de Espera</h1>
          <RoleSwitcher />
        </div>
      </div>

      <div className="px-4 pt-3 space-y-2.5">
        {waitlist.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-[48px] mb-3">✨</p>
            <p className="text-[18px] font-semibold text-w-text">Sin lista de espera</p>
            <p className="text-[13px] text-w-text-secondary mt-1">Todas las mesas disponibles</p>
          </div>
        ) : (
          waitlist.map((entry) => (
            <div
              key={entry.id}
              className="rounded-xl bg-w-surface border border-w-border p-4 flex items-center justify-between"
            >
              <div>
                <p className="text-[15px] font-semibold text-w-text">{entry.name}</p>
                <p className="text-[12px] text-w-text-secondary">
                  {entry.partySize} personas · {minutesAgo(entry.waitingSince)} min esperando
                </p>
              </div>
              <div className="flex gap-2">
                {emptyTables.length > 0 ? (
                  <button
                    onClick={() => setAssigningEntry(entry)}
                    className="px-3 py-1.5 rounded-lg bg-w-brand text-white text-[12px] font-medium min-h-[36px]"
                  >
                    Asignar mesa
                  </button>
                ) : (
                  <span className="text-[11px] text-w-text-secondary italic">Sin mesas libres</span>
                )}
                <button
                  onClick={() => setWaitlist((w) => w.filter((e) => e.id !== entry.id))}
                  className="px-2 py-1.5 rounded-lg text-w-text-secondary text-[12px] min-h-[36px] hover:text-w-error"
                >
                  ✕
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Table selection for assigning */}
      {assigningEntry && !selectedTableId && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end justify-center">
          <div className="bg-w-surface rounded-t-2xl w-full max-w-md p-4 pb-8">
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
                {emptyTables.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleAssignTable(t.id)}
                    className="rounded-xl border border-w-success/30 bg-w-bg p-3 text-center hover:border-w-success/60"
                  >
                    <p className="text-[16px] font-bold text-w-text">#{t.number}</p>
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

      <HostessBottomNav />
    </div>
  );
}
