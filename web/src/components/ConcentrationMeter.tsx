import { motion, AnimatePresence } from 'framer-motion';

interface ConcentrationMeterProps {
  concentration: number; // 0 (well spread) to 1 (concentrated)
}

export default function ConcentrationMeter({ concentration }: ConcentrationMeterProps) {
  const pct = Math.min(Math.max(concentration * 100, 2), 98);
  const isGood = concentration < 0.25;
  const isBad = concentration > 0.5;
  const label = isGood ? 'Well Spread' : isBad ? 'Concentrated' : 'Moderate';

  return (
    <div className="concentration-meter">
      <div className="meter-labels">
        <span className="meter-label" style={{ color: 'var(--accent-sage)' }}>
          Well Spread
        </span>
        <span className="meter-label" style={{ color: 'var(--accent-terracotta)' }}>
          Concentrated
        </span>
      </div>
      <div className="meter-track">
        <motion.div
          className="meter-indicator"
          animate={{ left: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          style={{
            borderColor: isGood
              ? 'var(--accent-sage)'
              : isBad
              ? 'var(--accent-terracotta)'
              : 'var(--accent-amber)',
          }}
        />
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          className="meter-value"
          key={label}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          style={{
            color: isGood
              ? 'var(--accent-sage)'
              : isBad
              ? 'var(--accent-terracotta)'
              : 'var(--accent-amber)',
          }}
        >
          {label} — {(concentration * 100).toFixed(0)}% HHI
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
