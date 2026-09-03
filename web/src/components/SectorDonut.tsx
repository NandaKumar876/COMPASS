import { motion } from 'framer-motion';
import type { Sector } from '../types';

interface SectorDonutProps {
  sectorSplit: Record<Sector, number>;
  total: number;
}

const SECTORS: { key: Sector; label: string; color: string }[] = [
  { key: 'education', label: 'Education', color: '#5C5F99' },
  { key: 'healthcare', label: 'Healthcare', color: '#C4634E' },
  { key: 'environment', label: 'Environment', color: '#6A9B6E' },
  { key: 'community', label: 'Community', color: '#D4973B' },
];

const RADIUS = 45;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function SectorDonut({ sectorSplit, total }: SectorDonutProps) {
  const safeTotal = total || 1;
  let offset = 0;

  return (
    <div className="sector-donut-container">
      <div className="sector-donut">
        <svg viewBox="0 0 120 120">
          {SECTORS.map((sector) => {
            const count = sectorSplit[sector.key] || 0;
            const fraction = count / safeTotal;
            const dash = fraction * CIRCUMFERENCE;
            const currentOffset = offset;
            offset += dash;

            return (
              <motion.circle
                key={sector.key}
                cx="60"
                cy="60"
                r={RADIUS}
                fill="none"
                stroke={sector.color}
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray={`${dash} ${CIRCUMFERENCE - dash}`}
                strokeDashoffset={-currentOffset}
                transform="rotate(-90 60 60)"
                initial={{ opacity: 0 }}
                animate={{ opacity: count > 0 ? 1 : 0.1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            );
          })}
          <text
            x="60"
            y="56"
            textAnchor="middle"
            fill="var(--text-primary)"
            fontFamily="var(--font-display)"
            fontSize="20"
          >
            {total}
          </text>
          <text
            x="60"
            y="72"
            textAnchor="middle"
            fill="var(--text-muted)"
            fontFamily="var(--font-body)"
            fontSize="8"
            fontWeight="600"
          >
            PROJECTS
          </text>
        </svg>
      </div>

      <div className="sector-legend">
        {SECTORS.map((sector) => (
          <div key={sector.key} className="sector-legend-item">
            <span className="sector-legend-dot" style={{ background: sector.color }} />
            <span>{sector.label}</span>
            <motion.span
              className="sector-legend-count"
              key={sectorSplit[sector.key]}
              initial={{ scale: 1.3, opacity: 0.5 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            >
              {sectorSplit[sector.key] || 0}
            </motion.span>
          </div>
        ))}
      </div>
    </div>
  );
}
