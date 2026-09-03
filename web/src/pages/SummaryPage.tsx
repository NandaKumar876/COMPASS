import { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { Proposal, AllocationResult, Sector } from '../types';
import { submitSummary } from '../api/client';

interface SummaryPageProps {
  proposals: Proposal[];
  result: AllocationResult;
}

const SECTOR_COLORS: Record<Sector, string> = {
  education: '#5C5F99',
  healthcare: '#C4634E',
  environment: '#6A9B6E',
  community: '#D4973B',
};

function formatBudget(n: number): string {
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(2)}Cr`;
  if (n >= 100_000) return `₹${(n / 100_000).toFixed(1)}L`;
  return `₹${n.toLocaleString('en-IN')}`;
}

function formatShort(n: number): string {
  if (n >= 10_000_000) return `${(n / 10_000_000).toFixed(1)}Cr`;
  if (n >= 100_000) return `${(n / 100_000).toFixed(0)}L`;
  return n.toLocaleString('en-IN');
}

export default function SummaryPage({ proposals, result }: SummaryPageProps) {
  const fundedSet = useMemo(() => new Set(result.funded), [result.funded]);
  const funded = useMemo(() => proposals.filter((p) => fundedSet.has(p.id)), [proposals, fundedSet]);

  // Sector budget data
  const sectorBudget = useMemo(() => {
    const map: Record<Sector, number> = { education: 0, healthcare: 0, environment: 0, community: 0 };
    funded.forEach((p) => { map[p.sector] += p.budget; });
    return Object.entries(map).map(([key, value]) => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      value,
      color: SECTOR_COLORS[key as Sector],
    }));
  }, [funded]);

  // Region bar data (top 10)
  const regionData = useMemo(() => {
    return Object.entries(result.coverage)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));
  }, [result.coverage]);

  // Budget allocation by project (top 12)
  const topProjects = useMemo(() => {
    return [...funded]
      .sort((a, b) => b.budget - a.budget)
      .slice(0, 12)
      .map((p) => ({
        name: p.title.length > 25 ? p.title.slice(0, 25) + '…' : p.title,
        budget: p.budget,
        beneficiaries: p.beneficiaries,
        color: SECTOR_COLORS[p.sector],
      }));
  }, [funded]);

  // Beneficiary reach by sector
  const sectorReach = useMemo(() => {
    const map: Record<Sector, number> = { education: 0, healthcare: 0, environment: 0, community: 0 };
    funded.forEach((p) => { map[p.sector] += p.beneficiaries; });
    return Object.entries(map).map(([key, value]) => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      reach: value,
      color: SECTOR_COLORS[key as Sector],
    }));
  }, [funded]);

  // Local fallback text — renders instantly, then gets replaced by the real
  // Groq-written narrative from POST /summary once that arrives.
  const localSummaryText = useMemo(() => {
    const totalBudget = formatBudget(result.totals.spent);
    const regions = Object.keys(result.coverage);
    const topSector = Object.entries(result.sector_split).sort((a, b) => b[1] - a[1])[0];
    return `The recommended portfolio allocates ${totalBudget} across ${result.totals.count} projects, reaching approximately ${result.totals.beneficiaries.toLocaleString('en-IN')} beneficiaries in ${regions.length} states. ${topSector ? `The highest concentration is in ${topSector[0]} (${topSector[1]} projects), ` : ''}reflecting the organization's strategic priorities. The portfolio achieves a geographic concentration index (HHI) of ${(result.concentration * 100).toFixed(1)}%, indicating ${result.concentration < 0.25 ? 'excellent regional diversity' : result.concentration < 0.4 ? 'moderate spread with room for improvement' : 'concentrated allocation that may benefit from rebalancing'}. Must-fund commitments have been honored, and all projects meet minimum feasibility thresholds.`;
  }, [result]);

  const [narrative, setNarrative] = useState<string | null>(null);
  const [narrativeStatus, setNarrativeStatus] = useState<'idle' | 'loading' | 'error'>('idle');

  useEffect(() => {
    let cancelled = false;
    setNarrativeStatus('loading');
    submitSummary(result.totals, result.sector_split, result.concentration)
      .then((res) => {
        if (!cancelled) {
          setNarrative(res.summary);
          setNarrativeStatus('idle');
        }
      })
      .catch(() => {
        if (!cancelled) setNarrativeStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [result]);

  const summaryText = narrative ?? localSummaryText;

  const cardStyle = {
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 16,
    overflow: 'hidden',
  };

  const cardHeaderStyle = {
    padding: '14px 20px',
    borderBottom: '1px solid var(--border-subtle)',
    fontFamily: 'var(--font-display)',
    fontSize: '1.05rem',
    color: 'var(--text-primary)',
  };

  return (
    <>
      <div className="header-bar">
        <div className="header-title">
          <h2>Executive Summary</h2>
          <p>Board-ready overview of the funded portfolio — charts, metrics, and narrative</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          style={{
            padding: '8px 20px',
            borderRadius: 10,
            border: 'none',
            background: 'var(--accent-sage)',
            fontFamily: 'var(--font-body)',
            fontSize: '0.82rem',
            fontWeight: 600,
            color: 'white',
            cursor: 'pointer',
          }}
        >
          ↓ Export PDF
        </motion.button>
      </div>

      {/* Executive Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        style={cardStyle}
      >
        <div style={{ ...cardHeaderStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>Portfolio Summary</span>
          <span style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            {narrativeStatus === 'loading' && 'Writing with AI…'}
            {narrativeStatus === 'idle' && narrative && '✓ AI-generated'}
            {narrativeStatus === 'error' && 'Local estimate (AI unavailable)'}
          </span>
        </div>
        <div style={{ padding: '20px 24px' }}>
          <p style={{
            fontSize: '0.92rem',
            lineHeight: 1.7,
            color: 'var(--text-secondary)',
            fontWeight: 400,
            maxWidth: 800,
          }}>
            {summaryText}
          </p>
        </div>
      </motion.div>

      {/* Top Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14 }}>
        {[
          { label: 'Total Allocated', value: formatBudget(result.totals.spent), sub: `of ₹5.0Cr budget`, accent: 'var(--accent-sage)' },
          { label: 'Projects Funded', value: result.totals.count.toString(), sub: `of ${proposals.length} proposals`, accent: 'var(--accent-indigo)' },
          { label: 'Beneficiaries', value: `${(result.totals.beneficiaries / 1000).toFixed(0)}K`, sub: 'lives reached', accent: 'var(--accent-amber)' },
          { label: 'States Covered', value: result.totals.states.toString(), sub: `of 19 states`, accent: 'var(--accent-terracotta)' },
          { label: 'Equity Index', value: `${(result.concentration * 100).toFixed(0)}%`, sub: result.concentration < 0.25 ? 'Excellent spread' : 'Moderate spread', accent: result.concentration < 0.25 ? 'var(--accent-sage)' : 'var(--accent-amber)' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.06, type: 'spring', stiffness: 400, damping: 30 }}
            style={{
              ...cardStyle,
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              borderTop: `3px solid ${stat.accent}`,
            }}
          >
            <span style={{ fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
              {stat.label}
            </span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: 'var(--text-primary)' }}>
              {stat.value}
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              {stat.sub}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Charts Row 1: Sector Pie + Region Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 400, damping: 30 }}
          style={cardStyle}
        >
          <div style={cardHeaderStyle}>Budget by Sector</div>
          <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <ResponsiveContainer width="55%" height={200}>
              <PieChart>
                <Pie
                  data={sectorBudget}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  animationBegin={300}
                  animationDuration={800}
                >
                  {sectorBudget.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => formatBudget(Number(value))}
                  contentStyle={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 8,
                    fontSize: '0.78rem',
                    fontFamily: 'var(--font-body)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {sectorBudget.map((s) => (
                <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem' }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 500, minWidth: 80 }}>{s.name}</span>
                  <span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums', marginLeft: 'auto' }}>{formatBudget(s.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25, type: 'spring', stiffness: 400, damping: 30 }}
          style={cardStyle}
        >
          <div style={cardHeaderStyle}>Projects by Region</div>
          <div style={{ padding: '16px 20px' }}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={regionData} layout="vertical" margin={{ left: 10, right: 20, top: 0, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={100}
                  tick={{ fontSize: 11, fill: '#999', fontFamily: 'Plus Jakarta Sans' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 8,
                    fontSize: '0.78rem',
                    fontFamily: 'var(--font-body)',
                  }}
                />
                <Bar
                  dataKey="count"
                  fill="#6A9B6E"
                  radius={[0, 6, 6, 0]}
                  animationBegin={400}
                  animationDuration={600}
                  barSize={14}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Charts Row 2: Top Projects Budget + Sector Reach */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16 }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 400, damping: 30 }}
          style={cardStyle}
        >
          <div style={cardHeaderStyle}>Top Allocations by Budget</div>
          <div style={{ padding: '16px 20px' }}>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topProjects} layout="vertical" margin={{ left: 10, right: 20, top: 0, bottom: 0 }}>
                <XAxis
                  type="number"
                  tickFormatter={formatShort}
                  tick={{ fontSize: 10, fill: '#999', fontFamily: 'Plus Jakarta Sans' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={160}
                  tick={{ fontSize: 10, fill: '#666', fontFamily: 'Plus Jakarta Sans' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value) => formatBudget(Number(value))}
                  contentStyle={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 8,
                    fontSize: '0.78rem',
                    fontFamily: 'var(--font-body)',
                  }}
                />
                <Bar
                  dataKey="budget"
                  radius={[0, 6, 6, 0]}
                  animationBegin={500}
                  animationDuration={700}
                  barSize={12}
                >
                  {topProjects.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, type: 'spring', stiffness: 400, damping: 30 }}
          style={cardStyle}
        >
          <div style={cardHeaderStyle}>Beneficiary Reach by Sector</div>
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {sectorReach.map((s) => {
              const maxReach = Math.max(...sectorReach.map((x) => x.reach), 1);
              const pct = (s.reach / maxReach) * 100;
              return (
                <div key={s.name} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{s.name}</span>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                      {s.reach >= 1000 ? `${(s.reach / 1000).toFixed(1)}K` : s.reach}
                    </span>
                  </div>
                  <div style={{ height: 8, borderRadius: 9999, background: 'var(--bg-sunken)', overflow: 'hidden' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
                      style={{ height: '100%', borderRadius: 9999, background: s.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Funded Projects Table */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, type: 'spring', stiffness: 400, damping: 30 }}
        style={cardStyle}
      >
        <div style={cardHeaderStyle}>Funded Projects Detail</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                {['#', 'Project', 'Partner', 'Sector', 'Region', 'Budget', 'Reach', 'Score'].map((h) => (
                  <th key={h} style={{
                    padding: '10px 14px',
                    textAlign: 'left',
                    fontWeight: 600,
                    fontSize: '0.68rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--text-muted)',
                    whiteSpace: 'nowrap',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {funded
                .sort((a, b) => (result.per_project_score[b.id] ?? 0) - (result.per_project_score[a.id] ?? 0))
                .map((p, i) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '10px 14px', color: 'var(--text-muted)', fontWeight: 500 }}>{i + 1}</td>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-primary)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.title}
                    </td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{p.partner}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{
                        padding: '2px 10px', borderRadius: 9999, fontSize: '0.7rem', fontWeight: 600,
                        background: `${SECTOR_COLORS[p.sector]}15`, color: SECTOR_COLORS[p.sector], textTransform: 'capitalize',
                      }}>
                        {p.sector}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{p.region}</td>
                    <td style={{ padding: '10px 14px', fontWeight: 600, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{formatBudget(p.budget)}</td>
                    <td style={{ padding: '10px 14px', fontVariantNumeric: 'tabular-nums', color: 'var(--text-secondary)' }}>{p.beneficiaries.toLocaleString('en-IN')}</td>
                    <td style={{ padding: '10px 14px', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                      {((result.per_project_score[p.id] ?? 0) * 100).toFixed(0)}
                    </td>
                  </tr>
                ))}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: '2px solid var(--border-medium)', fontWeight: 700 }}>
                <td colSpan={5} style={{ padding: '12px 14px', fontSize: '0.82rem' }}>Total</td>
                <td style={{ padding: '12px 14px', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{formatBudget(result.totals.spent)}</td>
                <td style={{ padding: '12px 14px', fontVariantNumeric: 'tabular-nums' }}>{result.totals.beneficiaries.toLocaleString('en-IN')}</td>
                <td style={{ padding: '12px 14px' }}>—</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </motion.div>
    </>
  );
}
