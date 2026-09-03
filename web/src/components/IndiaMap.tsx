import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { geoMercator, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import type { FeatureCollection, Geometry } from 'geojson';

interface IndiaMapProps {
  coverage: Record<string, number>;
}

interface StateFeature {
  id: string;
  name: string;
  d: string;
}

// The bundled topology uses a few pre-2011 state names — map them onto the
// names used throughout the rest of the app (proposals, regions.json).
const NAME_ALIASES: Record<string, string> = {
  Orissa: 'Odisha',
  Uttaranchal: 'Uttarakhand',
};

const VIEW_WIDTH = 420;
const VIEW_HEIGHT = 480;

export default function IndiaMap({ coverage }: IndiaMapProps) {
  const [states, setStates] = useState<StateFeature[] | null>(null);
  const [tooltip, setTooltip] = useState<{
    name: string;
    count: number;
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/data/india-states.topo.json')
      .then((res) => res.json())
      .then((topology: Topology) => {
        if (cancelled) return;
        const objectKey = Object.keys(topology.objects)[0];
        const geometryCollection = topology.objects[objectKey] as GeometryCollection;
        const geojson = feature(topology, geometryCollection) as unknown as FeatureCollection<
          Geometry,
          { NAME_1: string }
        >;

        const projection = geoMercator().fitSize([VIEW_WIDTH, VIEW_HEIGHT], geojson);
        const pathGenerator = geoPath(projection);

        const built = geojson.features
          .map((f) => {
            const rawName = f.properties.NAME_1;
            const name = NAME_ALIASES[rawName] ?? rawName;
            const d = pathGenerator(f);
            return d ? { id: rawName, name, d } : null;
          })
          .filter((s): s is StateFeature => s !== null);

        setStates(built);
      })
      .catch(() => {
        // leave states null — render nothing rather than a broken map
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const maxCount = useMemo(() => Math.max(1, ...Object.values(coverage)), [coverage]);

  if (!states) {
    return <div className="india-map-container india-map-loading">Loading map…</div>;
  }

  return (
    <div className="india-map-container">
      <svg viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`} xmlns="http://www.w3.org/2000/svg">
        {states.map((state, i) => {
          const count = coverage[state.name] || 0;
          const intensity = count > 0 ? 0.2 + 0.8 * (count / maxCount) : 0;
          const fill = count > 0 ? `rgba(106, 155, 110, ${intensity})` : '#F0EFEC';

          return (
            <motion.path
              key={state.id}
              d={state.d}
              fill={fill}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, fill }}
              transition={{
                fill: { duration: 0.5, ease: 'easeOut', delay: i * 0.01 },
                opacity: { duration: 0.4, delay: i * 0.008 },
              }}
              onMouseEnter={(e) => {
                const rect = (e.target as SVGPathElement).getBoundingClientRect();
                const container = (e.target as SVGPathElement)
                  .closest('.india-map-container')
                  ?.getBoundingClientRect();
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
