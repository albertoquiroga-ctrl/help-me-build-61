import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function PaymentFailedAlert({ onDismiss }: { onDismiss: () => void }) {
  const navigate = useNavigate();
  const [elapsed, setElapsed] = useState(45);
  const [waitPhase, setWaitPhase] = useState<'none' | 'choosing' | 'counting'>('none');
  const [waitRemaining, setWaitRemaining] = useState(0);
  const [waitExpired, setWaitExpired] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (waitPhase === 'counting' && waitRemaining > 0) {
      const t = setInterval(() => setWaitRemaining((r) => r - 1), 1000);
      return () => clearInterval(t);
    }
    if (waitPhase === 'counting' && waitRemaining <= 0) {
      setWaitExpired(true);
      setWaitPhase('none');
    }
  }, [waitPhase, waitRemaining]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  const timerColor = elapsed < 60 ? 'text-w-text-secondary' : elapsed < 120 ? 'text-w-warning' : 'text-w-error';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70"
      /* No onClick to dismiss — non-dismissable */
    >
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-w-elevated rounded-[16px] border border-w-border border-l-[4px] border-l-w-error mx-4 max-w-[360px] w-full p-5 bg-w-error/[0.08]">
        <p className="text-[20px] font-semibold text-w-text mb-1">⚠️ Pago fallido · Mesa 6</p>
        <p className="text-[14px] text-w-text-secondary">C2 · $285 MXN · Tarjeta rechazada</p>

        <div className="mt-3 mb-1">
          <span className={`font-mono text-[18px] font-bold ${timerColor}`}>Hace: {formatTime(elapsed)}</span>
          {elapsed >= 120 && <span className="text-[12px] text-w-error ml-2">— intervención recomendada ⚠️</span>}
          {elapsed >= 60 && elapsed < 120 && <span className="text-[12px] text-w-warning ml-2 block mt-0.5">— el comensal tiene opciones en su cel</span>}
        </div>
        <p className="text-[12px] text-w-text-secondary mb-4">El comensal está viendo opciones de recuperación en su celular.</p>

        {/* Wait countdown */}
        {waitPhase === 'counting' && !waitExpired && (
          <div className="bg-w-surface rounded-[8px] p-3 mb-3 text-center">
            <p className="text-[12px] text-w-text-secondary">Esperando:</p>
            <p className="font-mono text-[20px] text-w-text-secondary">{formatTime(waitRemaining)}</p>
          </div>
        )}

        {waitExpired && (
          <div className="bg-w-warning/10 rounded-[8px] p-3 mb-3 text-center">
            <p className="text-[13px] text-w-warning font-semibold">⏰ Se acabó el tiempo de espera</p>
            <p className="text-[12px] text-w-text-secondary mt-1">¿Vas a la mesa?</p>
          </div>
        )}

        {/* Primary action — always visible */}
        <button
          onClick={() => { onDismiss(); navigate('/waiter/table/6'); }}
          className="w-full h-12 rounded-[8px] border border-w-error text-w-error font-semibold text-[14px] mb-2"
        >
          Ir a la mesa ahora →
        </button>

        {/* Wait flow: step 1 — tap to show time options */}
        {waitPhase === 'none' && !waitExpired && (
          <button
            onClick={() => setWaitPhase('choosing')}
            className="w-full text-center text-[12px] text-w-text-secondary py-2"
          >
            El comensal lo está resolviendo — esperar
          </button>
        )}

        {/* Wait flow: step 2 — choose time */}
        {waitPhase === 'choosing' && (
          <div className="mt-1">
            <p className="text-[12px] text-w-text-secondary text-center mb-2">¿Cuánto tiempo esperar?</p>
            <div className="flex gap-2">
              <button
                onClick={() => { setWaitPhase('counting'); setWaitRemaining(120); }}
                className="flex-1 h-10 rounded-[8px] border border-w-border text-[12px] text-w-text-secondary"
              >
                2 minutos
              </button>
              <button
                onClick={() => { setWaitPhase('counting'); setWaitRemaining(300); }}
                className="flex-1 h-10 rounded-[8px] border border-w-border text-[12px] text-w-text-secondary"
              >
                5 minutos
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
