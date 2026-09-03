import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Proposal, Sector, AllocationResult } from '../types';

interface ProposalsPageProps {
  proposals: Proposal[];
  result: AllocationResult;
}

const SECTORS: { key: Sector | 'all'; label: string; color: string }[] = [
  { key: 'all', label: 'All Sectors', color: 'var(--text-primary)' },
  { key: 'education', label: 'Education', color: '#5C5F99' },
  { key: 'healthcare', label: 'Healthcare', color: '#C4634E' },
  { key: 'environment', label: 'Environment', color: '#6A9B6E' },
  { key: 'community', label: 'Community', color: '#D4973B' },
];

const SORT_OPTIONS = [
  { key: 'score', label: 'Score' },
  { key: 'budget', label: 'Budget' },
  { key: 'beneficiaries', label: 'Reach' },
  { key: 'region', label: 'Region' },
] as const;

type SortKey = (typeof SORT_OPTIONS)[number]['key'];

function formatBudget(n: number): string {
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(1)}Cr`;
  if (n >= 100_000) return `₹${(n / 100_000).toFixed(1)}L`;
  return `₹${n.toLocaleString('en-IN')}`;
}

const SECTOR_BG: Record<Sector, string> = {
  education: '#ECEDF5',
  healthcare: '#FCEAE6',
  environment: '#E8F0E8',
  community: '#FDF3E0',
};

const SECTOR_COLOR: Record<Sector, string> = {
  education: '#5C5F99',
  healthcare: '#C4634E',
  environment: '#6A9B6E',
  community: '#D4973B',
};

export default function ProposalsPage({ proposals, result }: ProposalsPageProps) {
  const [search, setSearch] = useState('');
  const [sectorFilter, setSectorFilter] = useState<Sector | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortKey>('score');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fundedSet = useMemo(() => new Set(result.funded), [result.funded]);

  const filtered = useMemo(() => {
    let list = [...proposals];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.partner.toLowerCase().includes(q) ||
          p.region.toLowerCase().includes(q)
      );
    }

    // Sector filter
    if (sectorFilter !== 'all') {
      list = list.filter((p) => p.sector === sectorFilter);
    }

    // Sort
    list.sort((a, b) => {
      switch (sortBy) {
        case 'score':
          return (result.per_project_score[b.id] ?? 0) - (result.per_project_score[a.id] ?? 0);
        case 'budget':
          return b.budget - a.budget;
        case 'beneficiaries':
          return b.beneficiaries - a.beneficiaries;
        case 'region':
          return a.region.localeCompare(b.region);
        default:
          return 0;
      }
    });

    return list;
  }, [proposals, search, sectorFilter, sortBy, result.per_project_score]);

  return (
    <>
      <div className="header-bar">
        <div className="header-title">
          <h2>All Proposals</h2>
          <p>{proposals.length} proposals across {new Set(proposals.map((p) => p.region)).size} states — search, filter, and explore</p>
        </div>
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}
      >
        {/* Search */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 10,
          padding: '6px 14px',
          flex: '1 1 240px',
          maxWidth: 360,
          transition: 'border-color 150ms ease',
        }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>⌕</span>
          <input
            type="text"
            placeholder="Search proposals…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              border: 'none',
              background: 'transparent',
              fontFamily: 'var(--font-body)',
              fontSize: '0.82rem',
              color: 'var(--text-primary)',
              outline: 'none',
              width: '100%',
              padding: '4px 0',
            }}
          />
        </div>

        {/* Sector pills */}
        <div style={{ display: 'flex', gap: 4 }}>
          {SECTORS.map((s) => (
            <motion.button
              key={s.key}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setSectorFilter(s.key)}
              style={{
                padding: '6px 14px',
                borderRadius: 9999,
                border: `1px solid ${sectorFilter === s.key ? s.color : 'var(--border-subtle)'}`,
                background: sectorFilter === s.key ? `${s.color}12` : 'var(--bg-elevated)',
                color: sectorFilter === s.key ? s.color : 'var(--text-muted)',
                fontSize: '0.75rem',
                fontWeight: 600,
                fontFamily: 'var(--font-body)',
                cursor: 'pointer',
                transition: 'all 150ms ease',
              }}
            >
              {s.label}
            </motion.button>
          ))}
        </div>

        {/* Sort */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Sort</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-elevated)',
              fontFamily: 'var(--font-body)',
              fontSize: '0.78rem',
              fontWeight: 500,
              color: 'var(--text-secondary)',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.key} value={o.key}>{o.label}</option>
            ))}
          </select>
        </div>
      </motion.div>

      {/* Results count */}
      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
        Showing {filtered.length} of {proposals.length} proposals
      </span>

      {/* Proposal Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
        gap: 16,
      }}>
        <AnimatePresence mode="popLayout">
          {filtered.map((p, i) => {
            const score = result.per_project_score[p.id] ?? 0;
            const isFunded = fundedSet.has(p.id);
            const isExpanded = expandedId === p.id;
            const color = SECTOR_COLOR[p.sector];
            const bg = SECTOR_BG[p.sector];

            return (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, y: 16, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 450, damping: 30, delay: i * 0.015 }}
                onClick={() => setExpandedId(isExpanded ? null : p.id)}
                style={{
                  background: 'var(--bg-elevated)',
                  border: `1px solid ${isExpanded ? color : 'var(--border-subtle)'}`,
                  borderRadius: 16,
                  padding: 20,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  transition: 'border-color 200ms ease, box-shadow 200ms ease',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Status chip */}
                <div style={{ position: 'absolute', top: 16, right: 16 }}>
                  <span style={{
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: 9999,
                    background: isFunded ? 'var(--accent-sage-light)' : 'var(--bg-sunken)',
                    color: isFunded ? 'var(--accent-sage)' : 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}>
                    {isFunded ? '✓ Funded' : 'Not Funded'}
                  </span>
                </div>

                {/* Sector + Score row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    padding: '3px 10px',
                    borderRadius: 9999,
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    background: bg,
                    color: color,
                    textTransform: 'capitalize',
                  }}>
                    {p.sector}
                  </span>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    marginLeft: 'auto',
                    fontVariantNumeric: 'tabular-nums',
                    paddingRight: 72,
                  }}>
                    Score: {(score * 100).toFixed(0)}
                  </span>
                </div>

                {/* Title */}
                <h4 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.08rem',
                  fontWeight: 400,
                  color: 'var(--text-primary)',
                  lineHeight: 1.3,
                }}>
                  {p.title}
                </h4>

                {/* Partner + Region */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                  <span>{p.partner}</span>
                  <span>·</span>
                  <span>{p.region}</span>
                </div>

                {/* Stats row */}
                <div style={{ display: 'flex', gap: 16, paddingTop: 4, borderTop: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Budget</span>
                    <span style={{ fontSize: '0.88rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{formatBudget(p.budget)}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Reach</span>
                    <span style={{ fontSize: '0.88rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{p.beneficiaries.toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Depth</span>
                    <span style={{ fontSize: '0.88rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{(p.outcome_depth * 100).toFixed(0)}%</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Timeline</span>
                    <span style={{ fontSize: '0.88rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{p.timeline_months}mo</span>
                  </div>
                </div>

                {/* Expanded detail */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div style={{
                        paddingTop: 12,
                        borderTop: '1px solid var(--border-subtle)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 10,
                      }}>
                        <p style={{
                          fontSize: '0.8rem',
                          color: 'var(--text-secondary)',
                          fontStyle: 'italic',
                          lineHeight: 1.5,
                          padding: '8px 12px',
                          background: 'var(--bg-sunken)',
                          borderRadius: 8,
                        }}>
                          "{p.expected_outcome}"
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: '0.78rem' }}>
                          <div>
                            <span style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Partner Track Record</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                              <div style={{ width: 60, height: 4, borderRadius: 9999, background: 'var(--bg-sunken)' }}>
                                <div style={{ width: `${p.partner_track_record * 100}%`, height: '100%', borderRadius: 9999, background: 'var(--accent-sage)' }} />
                              </div>
                              <span style={{ fontWeight: 600 }}>{(p.partner_track_record * 100).toFixed(0)}%</span>
                            </div>
                          </div>
                          <div>
                            <span style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Budget Realism</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                              <div style={{ width: 60, height: 4, borderRadius: 9999, background: 'var(--bg-sunken)' }}>
                                <div style={{ width: `${p.budget_realism * 100}%`, height: '100%', borderRadius: 9999, background: 'var(--accent-amber)' }} />
                              </div>
                              <span style={{ fontWeight: 600 }}>{(p.budget_realism * 100).toFixed(0)}%</span>
                            </div>
                          </div>
                        </div>
                        {p.must_fund && (
                          <span style={{
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            color: 'var(--accent-sage)',
                            padding: '4px 10px',
                            background: 'var(--accent-sage-light)',
                            borderRadius: 6,
                            alignSelf: 'flex-start',
                          }}>
                            ✦ Must-Fund Commitment
                          </span>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </>
  );
}
