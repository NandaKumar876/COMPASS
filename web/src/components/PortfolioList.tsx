import { AnimatePresence, LayoutGroup } from 'framer-motion';
import { useState, useMemo } from 'react';
import type { Proposal, AllocationResult, Weights } from '../types';
import ProjectCard from './ProjectCard';

interface PortfolioListProps {
  proposals: Proposal[];
  result: AllocationResult;
  weights: Weights;
  budget: number;
}

export default function PortfolioList({ proposals, result, weights, budget }: PortfolioListProps) {
  const [showFunded, setShowFunded] = useState(true);

  const fundedSet = useMemo(() => new Set(result.funded), [result.funded]);

  const displayProposals = useMemo(() => {
    const filtered = proposals.filter((p) =>
      showFunded ? fundedSet.has(p.id) : !fundedSet.has(p.id)
    );
    // Sort by score descending
    return filtered.sort(
      (a, b) => (result.per_project_score[b.id] ?? 0) - (result.per_project_score[a.id] ?? 0)
    );
  }, [proposals, fundedSet, showFunded, result.per_project_score]);

  return (
    <div className="card" style={{ minHeight: 0, flex: 1 }}>
      <div className="card-header">
        <h3>{showFunded ? 'Funded Portfolio' : 'Not Funded'}</h3>
        <div className="portfolio-toggle">
          <button
            className={`portfolio-toggle-btn ${showFunded ? 'active' : ''}`}
            onClick={() => setShowFunded(true)}
          >
            Funded ({result.funded.length})
          </button>
          <button
            className={`portfolio-toggle-btn ${!showFunded ? 'active' : ''}`}
            onClick={() => setShowFunded(false)}
          >
            Rejected ({result.unfunded.length})
          </button>
        </div>
      </div>
      <div className="card-body" style={{ padding: '8px 12px' }}>
        <LayoutGroup>
          <div className="portfolio-list">
            <AnimatePresence mode="popLayout">
              {displayProposals.map((p, i) => (
                <ProjectCard
                  key={p.id}
                  proposal={p}
                  score={result.per_project_score[p.id] ?? 0}
                  index={i}
                  weights={weights}
                  budget={budget}
                  allocationState={{ funded: result.funded, spent: result.totals.spent }}
                />
              ))}
            </AnimatePresence>
            {displayProposals.length === 0 && (
              <div className="empty-state">
                <span className="empty-state-icon">◇</span>
                <span className="empty-state-text">
                  {showFunded
                    ? 'No projects funded with current settings'
                    : 'All proposals are funded!'}
                </span>
              </div>
            )}
          </div>
        </LayoutGroup>
      </div>
    </div>
  );
}
