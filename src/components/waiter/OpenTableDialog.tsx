import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface OpenTableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tableNumber: number;
  subtitle?: string;
  onConfirm: () => void;
}

export default function OpenTableDialog({ open, onOpenChange, tableNumber, subtitle, onConfirm }: OpenTableDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[320px] bg-w-surface border-w-border">
        <DialogHeader>
          <DialogTitle className="text-w-text text-center">Abrir Mesa {tableNumber}</DialogTitle>
        </DialogHeader>
        <p className="text-[13px] text-w-text-secondary text-center">{subtitle || '¿Abrir esta mesa?'}</p>
        <div className="flex gap-2 pt-2">
          <button
            onClick={() => onOpenChange(false)}
            className="flex-1 h-11 rounded-[8px] border border-w-border text-w-text-secondary text-[13px] font-semibold active:scale-95 transition-transform"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 h-11 rounded-[8px] bg-w-brand text-white text-[13px] font-semibold active:scale-95 transition-transform"
          >
            Abrir ✓
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
