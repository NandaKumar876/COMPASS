import { motion } from 'framer-motion';
import type { PersonaKey, Weights } from '../types';
import { PERSONAS } from '../data/objectives';

interface PersonaBarProps {
  activePersona: PersonaKey | null;
  onSelect: (key: PersonaKey, weights: Weights) => void;
}

export default function PersonaBar({ activePersona, onSelect }: PersonaBarProps) {
  return (
    <div className="persona-bar">
      <span className="persona-bar-title">Quick Presets</span>
      {PERSONAS.map((p, i) => (
        <motion.button
          key={p.key}
          className={`persona-btn ${activePersona === p.key ? 'active' : ''}`}
          style={{ color: p.color }}
          onClick={() => onSelect(p.key, p.weights)}
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ x: 3 }}
          whileTap={{ scale: 0.97 }}
          transition={{
            type: 'spring',
            stiffness: 400,
            damping: 25,
            delay: 0.3 + i * 0.06,
          }}
        >
          <span className="persona-icon" style={{ background: p.color }}>
            {p.icon}
          </span>
          <span className="persona-info">
            <span className="persona-name">{p.label}</span>
            <span className="persona-desc">{p.description}</span>
          </span>
        </motion.button>
      ))}
    </div>
  );
}
