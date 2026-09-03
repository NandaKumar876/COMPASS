import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import type { Weights, AllocationResult, PersonaKey, Proposal } from '../types';
import QueryBar from '../components/QueryBar';
import KPIBar from '../components/KPIBar';
import SliderPanel from '../components/SliderPanel';
import PersonaBar from '../components/PersonaBar';
import PortfolioList from '../components/PortfolioList';
import IndiaMap from '../components/IndiaMap';
import ConcentrationMeter from '../components/ConcentrationMeter';
import SectorDonut from '../components/SectorDonut';
import { submitQuery } from '../api/client';

interface CommandCenterProps {
  weights: Weights;
  onWeightChange: (key: keyof Weights, value: number) => void;
  budget: number;
  result: AllocationResult;
  activePersona: PersonaKey | null;
  onPersonaSelect: (key: PersonaKey, weights: Weights) => void;
  onQueryResult: (weights: Weights, allocation: AllocationResult) => void;
  proposals: Proposal[];
}

export default function CommandCenter({
  weights,
  onWeightChange,
  budget,
  result,
  activePersona,
  onPersonaSelect,
  onQueryResult,
  proposals,
}: CommandCenterProps) {
  const [queryStatus, setQueryStatus] = useState<'idle' | 'loading' | 'error'>('idle');

  const handleQuery = useCallback(
    async (text: string) => {
      setQueryStatus('loading');
      try {
        const { parsed_weights, allocation } = await submitQuery(text);
        onQueryResult(parsed_weights, allocation);
        setQueryStatus('idle');
      } catch {
        setQueryStatus('error');
      }
    },
    [onQueryResult]
  );

  return (
    <>
      {/* Query Bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        <QueryBar onQuery={handleQuery} busy={queryStatus === 'loading'} error={queryStatus === 'error'} />
      </motion.div>

      {/* Header */}
      <div className="header-bar">
        <div className="header-title">
          <h2>Command Centre</h2>
          <p>Steer your portfolio in real time — every slider move re-optimises instantly</p>
        </div>
      </div>

      {/* KPIs */}
      <KPIBar
        count={result.totals.count}
        spent={result.totals.spent}
        beneficiaries={result.totals.beneficiaries}
        states={result.totals.states}
      />

      {/* Main Grid: Sliders | Portfolio | Map+Charts */}
      <div className="command-grid">
        {/* Left: Sliders + Personas */}
        <motion.div
          style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.1 }}
        >
          <div className="card">
            <div className="card-header">
              <h3>Priority Weights</h3>
            </div>
            <div className="card-body">
              <SliderPanel weights={weights} onWeightChange={onWeightChange} />
            </div>
          </div>

          <div className="card">
            <div className="card-body" style={{ padding: '16px' }}>
              <PersonaBar activePersona={activePersona} onSelect={onPersonaSelect} />
            </div>
          </div>
        </motion.div>

        {/* Center: Portfolio List */}
        <motion.div
          style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.15 }}
        >
          <PortfolioList proposals={proposals} result={result} weights={weights} budget={budget} />
        </motion.div>

        {/* Right: Map + Meter + Donut */}
        <motion.div
          className="right-panel"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.2 }}
        >
          <div className="card">
            <div className="card-header">
              <h3>Geographic Coverage</h3>
            </div>
            <div className="card-body">
              <IndiaMap coverage={result.coverage} />
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3>Equity Gauge</h3>
            </div>
            <div className="card-body">
              <ConcentrationMeter concentration={result.concentration} />
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3>Sector Mix</h3>
            </div>
            <div className="card-body">
              <SectorDonut
                sectorSplit={result.sector_split}
                total={result.totals.count}
              />
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}
