import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface OpenTableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tableNumber: number;
  subtitle?: string;
  onConfirm: (guestCount?: number) => void;
  showGuestCount?: boolean;
}

export default function OpenTableDialog({ open, onOpenChange, tableNumber, subtitle, onConfirm, showGuestCount = false }: OpenTableDialogProps) {
  const [customMode, setCustomMode] = useState(false);
  const [customValue, setCustomValue] = useState('');

  const handleClose = (v: boolean) => {
    if (!v) { setCustomMode(false); setCustomValue(''); }
    onOpenChange(v);
  };

  const handleCustomSubmit = () => {
    const n = parseInt(customValue, 10);
    if (n >= 1 && n <= 50) onConfirm(n);
  };

  if (!showGuestCount) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-[320px] bg-w-surface border-w-border">
          <DialogHeader>
            <DialogTitle className="text-w-text text-center">Abrir Mesa {tableNumber}</DialogTitle>
          </DialogHeader>
          <p className="text-[13px] text-w-text-secondary text-center">{subtitle || '¿Abrir esta mesa?'}</p>
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => handleClose(false)}
              className="flex-1 h-11 rounded-[8px] border border-w-border text-w-text-secondary text-[13px] font-semibold active:scale-95 transition-transform"
            >
              Cancelar
            </button>
            <button
              onClick={() => onConfirm()}
              className="flex-1 h-11 rounded-[8px] bg-w-brand text-white text-[13px] font-semibold active:scale-95 transition-transform"
            >
              Abrir ✓
            </button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[320px] bg-w-surface border-w-border">
        <DialogHeader>
          <DialogTitle className="text-w-text text-center">Abrir Mesa {tableNumber}</DialogTitle>
        </DialogHeader>
        <p className="text-[13px] text-w-text-secondary text-center">{subtitle || '¿Cuántas personas?'}</p>

        {!customMode ? (
          <div className="flex justify-center gap-2 flex-wrap py-2">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <button
                key={n}
                onClick={() => onConfirm(n)}
                className="w-11 h-11 rounded-[8px] border border-w-border bg-w-bg text-w-text font-semibold text-[14px] active:scale-95 transition-transform hover:border-w-brand hover:text-w-brand"
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => setCustomMode(true)}
              className="w-11 h-11 rounded-[8px] border border-dashed border-w-text-secondary/40 bg-w-bg text-w-text-secondary font-semibold text-[12px] active:scale-95 transition-transform hover:border-w-brand hover:text-w-brand"
            >
              +
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 justify-center py-2">
            <input
              autoFocus
              type="number"
              min="1"
              max="50"
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCustomSubmit()}
              placeholder="Ej: 12"
              className="w-20 h-11 rounded-[8px] border border-w-border bg-w-bg px-3 text-[14px] text-w-text text-center placeholder:text-w-text-secondary/50 focus:outline-none focus:border-w-brand"
            />
            <button
              onClick={handleCustomSubmit}
              className="h-11 px-4 rounded-[8px] bg-w-brand text-white text-[13px] font-semibold active:scale-95 transition-transform"
            >
              Abrir
            </button>
            <button
              onClick={() => { setCustomMode(false); setCustomValue(''); }}
              className="h-11 px-2 text-w-text-secondary text-[13px]"
            >
              ✕
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
