import { useCallback } from 'react';
import { motion } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';
import TimerBar from '@/components/waiter/TimerBar';
import type { SmartSuggestionData } from '@/lib/smartSuggestions';

export type { SmartSuggestionData };

interface SmartSuggestionProps {
  suggestion: SmartSuggestionData;
  onDismiss: (id: string) => void;
}

export default function SmartSuggestion({ suggestion, onDismiss }: SmartSuggestionProps) {
  const handleExpire = useCallback(() => onDismiss(suggestion.id), [onDismiss, suggestion.id]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      className="rounded-[10px] border border-w-brand/25 bg-gradient-to-r from-w-brand/5 to-w-surface p-3 space-y-1.5"
    >
      <div className="flex items-start gap-2">
        <div className="w-7 h-7 rounded-full bg-w-brand/15 flex items-center justify-center text-[13px] shrink-0 mt-0.5">
          {suggestion.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <Sparkles size={12} className="text-w-brand shrink-0" />
            <p className="text-[12px] font-semibold text-w-text leading-snug">{suggestion.text}</p>
          </div>
          <p className="text-[10px] text-w-text-secondary mt-0.5">{suggestion.reason}</p>
        </div>
        <button onClick={() => onDismiss(suggestion.id)} className="w-8 h-8 flex items-center justify-center shrink-0">
          <X size={14} className="text-w-text-secondary" />
        </button>
      </div>
      <TimerBar totalSeconds={60} onExpire={handleExpire} color="brand" showCountdown={false} />
    </motion.div>
  );
}
