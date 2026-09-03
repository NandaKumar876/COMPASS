import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import type { Proposal, Sector, Weights, ExplainResponse } from '../types';
import { explainProject } from '../api/client';

interface ProjectCardProps {
  proposal: Proposal;
  score: number;
  index: number;
  weights: Weights;
  budget: number;
  allocationState: { funded: string[]; spent: number };
}

const SECTOR_COLORS: Record<Sector, string> = {
  education: '#5C5F99',
  healthcare: '#C4634E',
  environment: '#6A9B6E',
  community: '#D4973B',
};

const SECTOR_BG: Record<Sector, string> = {
  education: '#ECEDF5',
  healthcare: '#FCEAE6',
  environment: '#E8F0E8',
  community: '#FDF3E0',
};

function formatBudget(n: number): string {
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(1)}Cr`;
  if (n >= 100_000) return `₹${(n / 100_000).toFixed(1)}L`;
  return `₹${n.toLocaleString('en-IN')}`;
}

type ExplainStatus = 'idle' | 'loading' | 'error';

export default function ProjectCard({
  proposal,
  score,
  index,
  weights,
  budget,
  allocationState,
}: ProjectCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [explainStatus, setExplainStatus] = useState<ExplainStatus>('idle');
  const [explanation, setExplanation] = useState<ExplainResponse | null>(null);
  const color = SECTOR_COLORS[proposal.sector];
  const bg = SECTOR_BG[proposal.sector];

  useEffect(() => {
    if (!expanded || explanation || explainStatus === 'loading') return;
    setExplainStatus('loading');
    explainProject(proposal.id, weights, budget, allocationState)
      .then((res) => {
        setExplanation(res);
        setExplainStatus('idle');
      })
      .catch(() => setExplainStatus('error'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, y: -8 }}
      transition={{
        opacity: { duration: 0.22, ease: [0.22, 1, 0.36, 1], delay: index * 0.02 },
        scale: { type: 'spring', stiffness: 500, damping: 35, delay: index * 0.02 },
        y: { type: 'spring', stiffness: 500, damping: 35, delay: index * 0.02 },
        layout: { type: 'spring', stiffness: 320, damping: 32 },
      }}
      style={{ borderRadius: 12, overflow: 'hidden' }}
    >
      <motion.div
        className="project-card"
        onClick={() => setExpanded(!expanded)}
        whileHover={{ y: -1 }}
        transition={{ type: 'spring', stiffness: 600, damping: 30 }}
      >
        <span className="project-sector-bar" style={{ background: color }} />
        <span className="project-info">
          <span className="project-title">{proposal.title}</span>
          <span className="project-meta">
            <span>{proposal.partner}</span>
            <span>·</span>
            <span>{proposal.region}</span>
          </span>
        </span>
        <span
          className="project-score"
          style={{ background: bg, color }}
        >
          {(score * 100).toFixed(0)}
        </span>
        <span className="project-budget-tag">{formatBudget(proposal.budget)}</span>
      </motion.div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            className="project-expanded"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            style={{
              background: 'var(--bg-elevated)',
              borderLeft: `3px solid ${color}`,
              marginLeft: 0,
            }}
          >
            <p className="project-outcome">"{proposal.expected_outcome}"</p>

            {/* AI Explanation and Counterfactual Rescue Banner */}
            {explanation && explanation.reason && (
              <div
                style={{
                  background: 'var(--bg-sunken)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 8,
                  padding: '10px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--text-muted)',
                  }}
                >
                  ⚡ Decision Explanation
                </span>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                  {explanation.reason}
                </p>
                {explanation.rescue && (
                  <div
                    style={{
                      marginTop: 4,
                      padding: '6px 8px',
                      background: 'var(--accent-amber-light)',
                      borderRadius: 6,
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      color: 'var(--accent-amber)',
                    }}
                  >
                    🛠️ <strong>Rescue:</strong> Drop {explanation.rescue.drop.join(', ')} or add{' '}
                    {formatBudget(explanation.rescue.or_add_budget)}
                  </div>
                )}
              </div>
            )}

            {loadingExplain && (
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Loading AI explanation…
              </span>
            )}

            <div className="project-expanded-row">
              <span className="project-expanded-label">Sector</span>
              <span
                className="project-expanded-value"
                style={{ textTransform: 'capitalize' }}
              >
                {proposal.sector}
              </span>
            </div>
            <div className="project-expanded-row">
              <span className="project-expanded-label">Reach</span>
              <span className="project-expanded-value">
                {proposal.beneficiaries.toLocaleString('en-IN')} beneficiaries
              </span>
            </div>
            <div className="project-expanded-row">
              <span className="project-expanded-label">Depth</span>
              <span className="project-expanded-value">
                {(proposal.outcome_depth * 100).toFixed(0)}% transformative
              </span>
            </div>
            <div className="project-expanded-row">
              <span className="project-expanded-label">Timeline</span>
              <span className="project-expanded-value">
                {proposal.timeline_months} months
              </span>
            </div>
            {proposal.must_fund && (
              <div
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  color: '#6A9B6E',
                  padding: '4px 10px',
                  background: '#E8F0E8',
                  borderRadius: 6,
                  alignSelf: 'flex-start',
                }}
              >
                ✦ Must-Fund Commitment
              </div>
            )}

            <div className="project-expanded-row" style={{ alignItems: 'flex-start', marginTop: 4 }}>
              <span className="project-expanded-label">Why</span>
              <span className="project-expanded-value">
                {explainStatus === 'loading' && 'Asking the AI layer…'}
                {explainStatus === 'error' && 'Could not reach the explanation service.'}
                {explainStatus === 'idle' && explanation && (
                  <>
                    {explanation.reason}
                    {explanation.rescue && (
                      <div style={{ marginTop: 6, fontWeight: 600, color: 'var(--accent-amber)' }}>
                        Rescue: drop {explanation.rescue.drop.join(' + ')} or add{' '}
                        ₹{(explanation.rescue.or_add_budget / 100000).toFixed(1)}L
                      </div>
                    )}
                  </>
                )}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
