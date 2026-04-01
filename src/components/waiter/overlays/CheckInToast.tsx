import { useCallback } from 'react';
import { motion } from 'framer-motion';
import { X, Star, TrendingUp } from 'lucide-react';
import TimerBar from '@/components/waiter/TimerBar';
import type { LoyaltyInfo } from '@/stores/notificationsStore';

interface CheckInToastProps {
  onDismiss: () => void;
  tableName?: string;
  loyalty?: LoyaltyInfo;
}

const tierColors: Record<string, { bg: string; text: string; label: string }> = {
  gold: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'Gold' },
  silver: { bg: 'bg-gray-400/20', text: 'text-gray-300', label: 'Silver' },
  bronze: { bg: 'bg-orange-700/20', text: 'text-orange-400', label: 'Bronze' },
};

export default function CheckInToast({ onDismiss, tableName, loyalty }: CheckInToastProps) {
  const handleExpire = useCallback(() => onDismiss(), [onDismiss]);

  const isLoyalty = !!loyalty;
  const tier = loyalty ? tierColors[loyalty.tier] : null;

  return (
    <motion.div
      initial={{ y: -120 }}
      animate={{ y: 0 }}
      exit={{ y: -120, opacity: 0 }}
      className={`fixed top-0 left-0 right-0 z-[70] border-b rounded-b-[12px] px-4 py-3 ${
        isLoyalty
          ? 'bg-gradient-to-br from-w-elevated to-amber-950/30 border-amber-500/30 border-l-[4px] border-l-amber-500'
          : 'bg-w-elevated border-w-border border-l-[4px] border-l-w-warning'
      }`}
    >
      {/* Header row */}
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[16px] shrink-0 ${
          isLoyalty ? 'bg-amber-500/20' : 'bg-w-warning/20'
        }`}>
          {isLoyalty ? '🌟' : '💡'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-[13px] font-semibold text-w-text truncate">
              {tableName || 'Mesa 7'} — {isLoyalty ? loyalty.memberName : 'buen momento para pasar 🥃'}
            </p>
            {tier && (
              <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${tier.bg} ${tier.text}`}>
                {tier.label}
              </span>
            )}
          </div>
          <p className="text-[11px] text-w-text-secondary">
            {isLoyalty
              ? `${loyalty.visits} visitas · Última: hace ${loyalty.lastVisit} · Gasto prom: $${loyalty.avgSpend}`
              : 'Llevan 22 min sin pedir'
            }
          </p>
        </div>
        <button onClick={onDismiss} className="w-11 h-11 flex items-center justify-center shrink-0">
          <X size={16} className="text-w-text-secondary" />
        </button>
      </div>

      {/* Loyalty details */}
      {isLoyalty && loyalty && (
        <div className="mt-2.5 space-y-2">
          {/* Suggestion banner */}
          <div className="flex items-start gap-2 bg-amber-500/10 rounded-[8px] px-3 py-2.5 border border-amber-500/20">
            <TrendingUp size={14} className="text-amber-400 mt-0.5 shrink-0" />
            <p className="text-[12px] text-amber-200 font-medium leading-snug">{loyalty.suggestion}</p>
          </div>

          {/* Favorites */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <Star size={11} className="text-amber-400" />
            <span className="text-[10px] text-w-text-secondary font-medium">Favoritos:</span>
            {loyalty.favoriteItems.map((item, i) => (
              <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-w-surface border border-w-border text-w-text">
                {item}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-2">
        <TimerBar totalSeconds={isLoyalty ? 45 : 30} onExpire={handleExpire} color="warning" showCountdown={false} />
      </div>
    </motion.div>
  );
}
