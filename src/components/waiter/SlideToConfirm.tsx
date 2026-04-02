import { useRef, useState, useCallback } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

interface Props {
  label: string;
  confirmLabel?: string;
  icon?: string;
  onConfirm: () => void;
  disabled?: boolean;
  className?: string;
  trackColor?: string;
  thumbColor?: string;
}

const THUMB_W = 52;

export default function SlideToConfirm({
  label,
  confirmLabel = '¡Listo!',
  icon,
  onConfirm,
  disabled = false,
  className = '',
  trackColor = 'bg-w-success/20',
  thumbColor = 'bg-w-success',
}: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [confirmed, setConfirmed] = useState(false);
  const x = useMotionValue(0);

  const maxX = useCallback(() => {
    if (!trackRef.current) return 200;
    return trackRef.current.clientWidth - THUMB_W;
  }, []);

  const opacity = useTransform(x, [0, 60], [1, 0]);
  const bgWidth = useTransform(x, (v) => v + THUMB_W);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const threshold = maxX() * 0.75;
    if (info.point.x !== 0 && x.get() >= threshold) {
      setConfirmed(true);
      x.set(maxX());
      onConfirm();
    } else {
      x.set(0);
    }
  };

  if (disabled) {
    return (
      <div className={`relative h-12 rounded-[8px] ${trackColor} flex items-center justify-center opacity-40 ${className}`}>
        <span className="text-[13px] text-w-text-secondary font-medium">{label}</span>
      </div>
    );
  }

  return (
    <div
      ref={trackRef}
      className={`relative h-12 rounded-[8px] ${trackColor} overflow-hidden select-none ${className}`}
    >
      {/* Filled background behind thumb */}
      <motion.div
        className={`absolute inset-y-0 left-0 rounded-[8px] ${thumbColor}/30`}
        style={{ width: bgWidth }}
      />

      {/* Label */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{ opacity }}
      >
        <span className="text-[13px] text-w-text font-medium">
          {icon && <>{icon} </>}Desliza → {label}
        </span>
      </motion.div>

      {/* Confirmed label */}
      {confirmed && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <CheckCircle size={16} className="text-white mr-1.5" />
          <span className="text-[13px] text-white font-semibold">{confirmLabel}</span>
        </motion.div>
      )}

      {/* Draggable thumb */}
      {!confirmed && (
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: maxX() }}
          dragElastic={0}
          dragMomentum={false}
          onDragEnd={handleDragEnd}
          style={{ x }}
          className={`absolute top-1 bottom-1 left-1 w-11 rounded-[6px] ${thumbColor} flex items-center justify-center cursor-grab active:cursor-grabbing shadow-lg`}
          whileTap={{ scale: 1.05 }}
        >
          <span className="text-white text-[16px] font-bold">→</span>
        </motion.div>
      )}
    </div>
  );
}
