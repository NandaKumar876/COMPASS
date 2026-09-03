import { motion } from 'framer-motion';
import type { Weights } from '../types';

interface SliderPanelProps {
  weights: Weights;
  onWeightChange: (key: keyof Weights, value: number) => void;
}

const SLIDERS: {
  key: keyof Weights;
  label: string;
  color: string;
  icon: string;
}[] = [
  { key: 'impact', label: 'Impact', color: '#5C5F99', icon: '◆' },
  { key: 'efficiency', label: 'Efficiency', color: '#D4973B', icon: '◈' },
  { key: 'equity', label: 'Equity', color: '#6A9B6E', icon: '⬡' },
  { key: 'alignment', label: 'Alignment', color: '#C4634E', icon: '◎' },
  { key: 'feasibility', label: 'Feasibility', color: '#B06878', icon: '▣' },
];

export default function SliderPanel({ weights, onWeightChange }: SliderPanelProps) {
  return (
    <div className="slider-panel">
      {SLIDERS.map((s, i) => {
        const value = weights[s.key];
        const pct = Math.round(value * 100);

        return (
          <motion.div
            key={s.key}
            className="weight-slider"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 30,
              delay: i * 0.05,
            }}
            style={{ color: s.color }}
          >
            <div className="weight-slider-header">
              <span className="weight-slider-label">
                <span className="weight-slider-dot" style={{ background: s.color }} />
                {s.label}
              </span>
              <motion.span
                className="weight-slider-value"
                key={pct}
                initial={{ opacity: 0.5, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              >
                {pct}%
              </motion.span>
            </div>
            <div className="weight-slider-track" style={{ position: 'relative' }}>
              <div
                className="weight-slider-fill"
                style={{
                  width: `${pct}%`,
                  background: s.color,
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  height: '100%',
                  borderRadius: '9999px',
                  zIndex: 1,
                  opacity: 0.8,
                  pointerEvents: 'none',
                }}
              />
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={value}
                onChange={(e) => onWeightChange(s.key, parseFloat(e.target.value))}
                style={{ position: 'relative', zIndex: 2, color: s.color }}
              />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
