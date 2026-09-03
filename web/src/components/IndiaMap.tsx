import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';

interface IndiaMapProps {
  coverage: Record<string, number>;
}

// Simplified India state paths (state-level SVG)
// Using simplified bounding-box approximations for a clean, modern look
const STATES: { id: string; name: string; d: string }[] = [
  { id: 'JK', name: 'Jammu & Kashmir', d: 'M195,25 L220,20 L240,35 L235,55 L215,60 L200,50 Z' },
  { id: 'HP', name: 'Himachal Pradesh', d: 'M215,60 L235,55 L245,65 L235,78 L218,75 Z' },
  { id: 'PB', name: 'Punjab', d: 'M200,70 L218,75 L220,90 L205,92 L195,82 Z' },
  { id: 'HR', name: 'Haryana', d: 'M205,92 L220,90 L228,100 L222,112 L208,108 Z' },
  { id: 'UK', name: 'Uttarakhand', d: 'M235,78 L260,72 L272,82 L265,95 L245,92 L228,85 Z' },
  { id: 'DL', name: 'Delhi', d: 'M215,104 L222,102 L224,108 L218,110 Z' },
  { id: 'RJ', name: 'Rajasthan', d: 'M150,100 L205,95 L210,112 L215,140 L200,170 L155,165 L140,135 Z' },
  { id: 'UP', name: 'Uttar Pradesh', d: 'M222,100 L272,85 L310,95 L320,120 L300,140 L260,148 L240,135 L215,140 L210,112 Z' },
  { id: 'BR', name: 'Bihar', d: 'M310,120 L340,115 L355,125 L345,140 L320,142 L310,135 Z' },
  { id: 'SK', name: 'Sikkim', d: 'M345,105 L355,102 L358,112 L350,115 Z' },
  { id: 'AR', name: 'Arunachal Pradesh', d: 'M380,85 L420,80 L430,95 L415,105 L385,100 Z' },
  { id: 'NL', name: 'Nagaland', d: 'M415,105 L430,100 L435,112 L425,118 Z' },
  { id: 'MN', name: 'Manipur', d: 'M420,118 L435,115 L438,130 L425,133 Z' },
  { id: 'MZ', name: 'Mizoram', d: 'M418,133 L432,130 L435,148 L422,150 Z' },
  { id: 'TR', name: 'Tripura', d: 'M408,138 L418,135 L420,148 L410,150 Z' },
  { id: 'ML', name: 'Meghalaya', d: 'M370,118 L395,115 L400,125 L375,128 Z' },
  { id: 'AS', name: 'Assam', d: 'M355,100 L380,95 L415,105 L420,118 L400,125 L370,118 L355,125 L345,115 Z' },
  { id: 'WB', name: 'West Bengal', d: 'M340,135 L360,125 L375,128 L380,145 L370,175 L355,185 L342,165 L330,150 Z' },
  { id: 'JH', name: 'Jharkhand', d: 'M310,135 L340,130 L345,150 L330,160 L308,155 Z' },
  { id: 'OD', name: 'Odisha', d: 'M295,155 L330,150 L345,165 L355,185 L335,200 L310,195 L290,175 Z' },
  { id: 'CG', name: 'Chhattisgarh', d: 'M260,150 L300,145 L310,160 L295,185 L275,195 L255,180 Z' },
  { id: 'MP', name: 'Madhya Pradesh', d: 'M175,135 L245,130 L265,145 L260,170 L255,185 L220,195 L190,190 L170,170 Z' },
  { id: 'GJ', name: 'Gujarat', d: 'M100,140 L155,135 L170,160 L165,185 L140,200 L115,210 L95,195 L85,170 Z' },
  { id: 'MH', name: 'Maharashtra', d: 'M140,195 L195,185 L230,195 L260,200 L270,225 L250,250 L210,260 L170,255 L135,235 L125,215 Z' },
  { id: 'TG', name: 'Telangana', d: 'M220,230 L265,220 L280,235 L275,255 L250,260 L230,250 Z' },
  { id: 'AP', name: 'Andhra Pradesh', d: 'M230,250 L275,255 L295,240 L310,260 L300,290 L280,310 L260,300 L240,280 L220,270 Z' },
  { id: 'KA', name: 'Karnataka', d: 'M155,250 L210,255 L225,270 L240,295 L230,320 L200,340 L170,330 L150,300 L145,270 Z' },
  { id: 'GA', name: 'Goa', d: 'M140,275 L152,270 L155,285 L143,288 Z' },
  { id: 'KL', name: 'Kerala', d: 'M175,330 L195,340 L205,360 L200,390 L185,400 L172,380 L168,350 Z' },
  { id: 'TN', name: 'Tamil Nadu', d: 'M200,320 L240,300 L270,310 L280,330 L265,360 L240,380 L215,385 L200,370 L195,345 Z' },
];

// Map state names used in proposals to SVG state IDs
const NAME_TO_ID: Record<string, string> = {
  'Andhra Pradesh': 'AP',
  'Assam': 'AS',
  'Bihar': 'BR',
  'Chhattisgarh': 'CG',
  'Delhi': 'DL',
  'Gujarat': 'GJ',
  'Haryana': 'HR',
  'Jharkhand': 'JH',
  'Karnataka': 'KA',
  'Kerala': 'KL',
  'Madhya Pradesh': 'MP',
  'Maharashtra': 'MH',
  'Manipur': 'MN',
  'Odisha': 'OD',
  'Rajasthan': 'RJ',
  'Tamil Nadu': 'TN',
  'Uttar Pradesh': 'UP',
  'Uttarakhand': 'UK',
  'West Bengal': 'WB',
};

export default function IndiaMap({ coverage }: IndiaMapProps) {
  const [tooltip, setTooltip] = useState<{
    name: string;
    count: number;
    x: number;
    y: number;
  } | null>(null);

  // Build a map from SVG id → count
  const idCoverage = useMemo(() => {
    const map: Record<string, number> = {};
    for (const [name, count] of Object.entries(coverage)) {
      const id = NAME_TO_ID[name];
      if (id) map[id] = count;
    }
    return map;
  }, [coverage]);

  const maxCount = Math.max(1, ...Object.values(idCoverage));

  return (
    <div className="india-map-container">
      <svg viewBox="60 10 400 400" xmlns="http://www.w3.org/2000/svg">
        {STATES.map((state, i) => {
          const count = idCoverage[state.id] || 0;
          const intensity = count > 0 ? 0.2 + 0.8 * (count / maxCount) : 0;
          const fill = count > 0
            ? `rgba(106, 155, 110, ${intensity})`
            : '#F0EFEC';

          return (
            <motion.path
              key={state.id}
              d={state.d}
              fill={fill}
              initial={{ opacity: 0 }}
              animate={{
                opacity: 1,
                fill,
              }}
              transition={{
                fill: { duration: 0.5, ease: 'easeOut', delay: i * 0.02 },
                opacity: { duration: 0.4, delay: i * 0.015 },
              }}
              onMouseEnter={(e) => {
                const rect = (e.target as SVGPathElement).getBoundingClientRect();
                const container = (e.target as SVGPathElement).closest('.india-map-container')?.getBoundingClientRect();
                if (container) {
                  setTooltip({
                    name: state.name,
                    count,
                    x: rect.left - container.left + rect.width / 2,
                    y: rect.top - container.top - 8,
                  });
                }
              }}
              onMouseLeave={() => setTooltip(null)}
              style={{ cursor: 'pointer' }}
            />
          );
        })}
      </svg>

      {tooltip && (
        <motion.div
          className="map-tooltip"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ left: tooltip.x, top: tooltip.y, transform: 'translate(-50%, -100%)' }}
        >
          <span style={{ color: 'var(--text-primary)' }}>{tooltip.name}</span>
          {tooltip.count > 0 && (
            <span style={{ color: 'var(--accent-sage)', marginLeft: 8 }}>
              {tooltip.count} project{tooltip.count > 1 ? 's' : ''}
            </span>
          )}
        </motion.div>
      )}
    </div>
  );
}
