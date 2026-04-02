import { Star } from 'lucide-react';
import type { LoyaltyGuest } from '@/stores/tablesStore';

const tierStyle: Record<string, { bg: string; text: string; label: string }> = {
  gold: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'Oro' },
  silver: { bg: 'bg-gray-400/20', text: 'text-gray-300', label: 'Plata' },
  bronze: { bg: 'bg-orange-700/20', text: 'text-orange-400', label: 'Bronce' },
};

interface LoyaltyBannerProps {
  guest: LoyaltyGuest;
}

export default function LoyaltyBanner({ guest }: LoyaltyBannerProps) {
  const tier = tierStyle[guest.tier] || tierStyle.bronze;

  return (
    <div className="rounded-[10px] border border-amber-500/25 bg-gradient-to-br from-w-surface to-amber-950/10 p-3 space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-[16px]">🌟</span>
        <span className="text-[13px] font-semibold text-w-text">{guest.name}</span>
        <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${tier.bg} ${tier.text}`}>
          {tier.label}
        </span>
        <span className="text-[10px] text-w-text-secondary ml-auto">{guest.visits} visitas · Prom ${guest.avgSpend}</span>
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        <Star size={11} className="text-amber-400 shrink-0" />
        <span className="text-[10px] text-w-text-secondary font-medium">Favoritos:</span>
        {guest.favoriteItems.map((item, i) => (
          <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-w-surface border border-w-border text-w-text">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
