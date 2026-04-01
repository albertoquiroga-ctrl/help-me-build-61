import HostessBottomNav from '@/components/hostess/HostessBottomNav';
import RoleSwitcher from '@/components/RoleSwitcher';
import OpenTableDialog from '@/components/waiter/OpenTableDialog';
import { useTablesStore } from '@/stores/tablesStore';
import { deriveTableStatus } from '@/stores/tablesStore';
import { useState } from 'react';
import { toast } from 'sonner';

export default function HostessDashboard() {
  const tables = useTablesStore((s) => s.tables);
  const openTable = useTablesStore((s) => s.openTable);
  const [dialogTable, setDialogTable] = useState<string | null>(null);

  const selectedTable = tables.find((t) => t.id === dialogTable);

  return (
    <div className="min-h-screen bg-w-bg pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-w-bg/95 backdrop-blur-md border-b border-w-border px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-[18px] font-semibold text-w-text">Mapa de Mesas</h1>
          <RoleSwitcher />
        </div>
      </div>

      <div className="px-4 pt-3">
        {/* Summary */}
        <div className="flex gap-2 mb-4">
          {(() => {
            const empty = tables.filter((t) => t.status === 'empty').length;
            const occupied = tables.filter((t) => t.status !== 'empty').length;
            return (
              <>
                <div className="flex-1 rounded-xl bg-w-surface border border-w-border p-3 text-center">
                  <p className="text-[24px] font-bold text-w-success">{empty}</p>
                  <p className="text-[11px] text-w-text-secondary">Libres</p>
                </div>
                <div className="flex-1 rounded-xl bg-w-surface border border-w-border p-3 text-center">
                  <p className="text-[24px] font-bold text-w-text">{occupied}</p>
                  <p className="text-[11px] text-w-text-secondary">Ocupadas</p>
                </div>
                <div className="flex-1 rounded-xl bg-w-surface border border-w-border p-3 text-center">
                  <p className="text-[24px] font-bold text-w-text">{tables.length}</p>
                  <p className="text-[11px] text-w-text-secondary">Total</p>
                </div>
              </>
            );
          })()}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-3 gap-2.5">
          {tables.map((table) => {
            const { status, statusText } = deriveTableStatus(table);
            const isEmpty = status === 'empty';
            const guestCount = table.guests?.length ?? 0;

            return (
              <button
                key={table.id}
                onClick={() => isEmpty && setDialogTable(table.id)}
                disabled={!isEmpty}
                className={`rounded-xl border p-3 text-center transition-colors ${
                  isEmpty
                    ? 'bg-w-surface border-w-success/30 hover:border-w-success/60 cursor-pointer'
                    : status === 'paying'
                    ? 'bg-w-surface border-w-warning/30 cursor-default'
                    : status === 'problem'
                    ? 'bg-w-surface border-w-error/30 cursor-default'
                    : 'bg-w-surface border-w-border cursor-default'
                }`}
              >
                <p className="text-[20px] font-bold text-w-text">#{table.number}</p>
                {isEmpty ? (
                  <p className="text-[11px] text-w-success font-medium mt-1">Libre</p>
                ) : (
                  <>
                    <p className="text-[11px] text-w-text-secondary mt-1">{guestCount} 👤</p>
                    <p className="text-[10px] text-w-text-secondary">{statusText}</p>
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {selectedTable && (
        <OpenTableDialog
          open={!!dialogTable}
          onOpenChange={(open) => !open && setDialogTable(null)}
          tableNumber={selectedTable.number}
          onConfirm={(count) => {
            openTable(selectedTable.id, count);
            setDialogTable(null);
            toast.success(`Mesa ${selectedTable.number} abierta · ${count} personas`);
          }}
        />
      )}

      <HostessBottomNav />
    </div>
  );
}
