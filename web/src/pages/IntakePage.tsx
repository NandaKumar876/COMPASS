import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Simulated extraction results
const SIMULATED_EXTRACTIONS = [
  { id: 'EX01', title: 'Women empowerment through handicrafts', partner: 'Self Employed Women\'s Association', sector: 'community', region: 'Gujarat', budget: 1850000, beneficiaries: 2200, confidence: 0.94, redflags: [] },
  { id: 'EX02', title: 'Mobile veterinary units for pastoralists', partner: 'BAIF Development Research', sector: 'community', region: 'Rajasthan', budget: 2700000, beneficiaries: 8000, confidence: 0.88, redflags: ['budget_unrealistic'] },
  { id: 'EX03', title: 'Watershed management — Deccan Plateau', partner: 'Watershed Organisation Trust', sector: 'environment', region: 'Maharashtra', budget: 4100000, beneficiaries: 15000, confidence: 0.91, redflags: [] },
  { id: 'EX04', title: 'Night school for migrant children', partner: 'Pratham Mumbai', sector: 'education', region: 'Maharashtra', budget: 980000, beneficiaries: 600, confidence: 0.96, redflags: [] },
  { id: 'EX05', title: 'Sickle cell screening drive', partner: 'National Health Mission Partner', sector: 'healthcare', region: 'Chhattisgarh', budget: 1500000, beneficiaries: 30000, confidence: 0.72, redflags: ['vague_outcome', 'missing_metrics'] },
  { id: 'EX06', title: 'Biogas units for dairy farmers', partner: 'SKG Sangha', sector: 'environment', region: 'Karnataka', budget: 3200000, beneficiaries: 1200, confidence: 0.85, redflags: ['budget_unrealistic'] },
  { id: 'EX07', title: 'Adolescent mental health program', partner: 'Sangath', sector: 'healthcare', region: 'Goa', budget: 1100000, beneficiaries: 5000, confidence: 0.93, redflags: [] },
  { id: 'EX08', title: 'Rural broadband connectivity pilot', partner: 'Digital Empowerment Foundation', sector: 'community', region: 'Madhya Pradesh', budget: 5500000, beneficiaries: 25000, confidence: 0.67, redflags: ['budget_unrealistic', 'no_timeline'] },
];

const RED_FLAG_LABELS: Record<string, { label: string; color: string }> = {
  vague_outcome: { label: 'Vague Outcome', color: '#D4725C' },
  budget_unrealistic: { label: 'Budget Concern', color: '#E8A849' },
  missing_metrics: { label: 'Missing Metrics', color: '#B06878' },
  no_timeline: { label: 'No Timeline', color: '#C4634E' },
  weak_partner: { label: 'Weak Track Record', color: '#999' },
};

const SECTOR_COLORS: Record<string, string> = {
  education: '#5C5F99',
  healthcare: '#C4634E',
  environment: '#6A9B6E',
  community: '#D4973B',
};

function formatBudget(n: number): string {
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(1)}Cr`;
  if (n >= 100_000) return `₹${(n / 100_000).toFixed(1)}L`;
  return `₹${n.toLocaleString('en-IN')}`;
}

type Phase = 'idle' | 'uploading' | 'extracting' | 'done';

interface ExtractedRow {
  id: string;
  title: string;
  partner: string;
  sector: string;
  region: string;
  budget: number;
  beneficiaries: number;
  confidence: number;
  redflags: string[];
  revealed: boolean;
}

export default function IntakePage() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [dragOver, setDragOver] = useState(false);
  const [rows, setRows] = useState<ExtractedRow[]>([]);
  const [progress, setProgress] = useState(0);
  const [fileCount, setFileCount] = useState(0);

  const simulateExtraction = useCallback(() => {
    setFileCount(SIMULATED_EXTRACTIONS.length);
    setPhase('uploading');
    setProgress(0);

    // Phase 1: Upload animation (1s)
    setTimeout(() => {
      setPhase('extracting');
      setProgress(0);

      // Phase 2: Extract rows one by one
      SIMULATED_EXTRACTIONS.forEach((ex, i) => {
        setTimeout(() => {
          setRows((prev) => [...prev, { ...ex, revealed: true }]);
          setProgress(((i + 1) / SIMULATED_EXTRACTIONS.length) * 100);

          if (i === SIMULATED_EXTRACTIONS.length - 1) {
            setTimeout(() => setPhase('done'), 400);
          }
        }, 400 + i * 350);
      });
    }, 1200);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (phase !== 'idle') return;
      setRows([]);
      simulateExtraction();
    },
    [phase, simulateExtraction]
  );

  const handleClick = useCallback(() => {
    if (phase !== 'idle') return;
    setRows([]);
    simulateExtraction();
  }, [phase, simulateExtraction]);

  const handleReset = useCallback(() => {
    setPhase('idle');
    setRows([]);
    setProgress(0);
    setFileCount(0);
  }, []);

  return (
    <>
      <div className="header-bar">
        <div className="header-title">
          <h2>AI Intake</h2>
          <p>Drop messy proposals — get a structured, comparable table in seconds</p>
        </div>
        {phase === 'done' && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleReset}
            style={{
              padding: '8px 20px',
              borderRadius: 10,
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-elevated)',
              fontFamily: 'var(--font-body)',
              fontSize: '0.82rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            ↻ New Batch
          </motion.button>
        )}
      </div>

      {/* Drop Zone */}
      <AnimatePresence mode="wait">
        {phase === 'idle' && (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={handleClick}
            style={{
              border: `2px dashed ${dragOver ? 'var(--accent-sage)' : 'var(--border-medium)'}`,
              borderRadius: 20,
              padding: '64px 40px',
              textAlign: 'center',
              cursor: 'pointer',
              background: dragOver ? 'var(--accent-sage-subtle)' : 'var(--bg-elevated)',
              transition: 'all 200ms ease',
            }}
          >
            <motion.div
              animate={{ y: dragOver ? -4 : 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              style={{ fontSize: '3rem', marginBottom: 16, opacity: 0.5 }}
            >
              ⬆
            </motion.div>
            <p style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
              Drop proposal files here
            </p>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: 400, margin: '0 auto', lineHeight: 1.5 }}>
              PDFs, Word documents, emails — any format. The AI layer extracts structured fields and flags red flags automatically.
            </p>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 16, fontWeight: 500 }}>
              or click anywhere to run a demo extraction
            </p>
          </motion.div>
        )}

        {(phase === 'uploading' || phase === 'extracting') && rows.length === 0 && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 20,
              padding: '48px 40px',
              textAlign: 'center',
            }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              style={{ fontSize: '2rem', marginBottom: 20, display: 'inline-block' }}
            >
              ◎
            </motion.div>
            <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
              {phase === 'uploading' ? `Uploading ${fileCount} proposals…` : 'Extracting structured data…'}
            </p>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {phase === 'uploading' ? 'Preparing documents for AI extraction' : 'Running LLM extraction pipeline via Groq'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Bar */}
      {(phase === 'extracting' || phase === 'done') && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ display: 'flex', alignItems: 'center', gap: 12 }}
        >
          <div style={{
            flex: 1,
            height: 4,
            borderRadius: 9999,
            background: 'var(--bg-sunken)',
            overflow: 'hidden',
          }}>
            <motion.div
              animate={{ width: `${progress}%` }}
              transition={{ type: 'spring', stiffness: 200, damping: 30 }}
              style={{
                height: '100%',
                borderRadius: 9999,
                background: phase === 'done' ? 'var(--accent-sage)' : 'var(--accent-amber)',
              }}
            />
          </div>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', minWidth: 60, textAlign: 'right' }}>
            {rows.length} / {SIMULATED_EXTRACTIONS.length}
          </span>
        </motion.div>
      )}

      {/* Extracted Table */}
      {rows.length > 0 && (
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        >
          <div className="card-header">
            <h3>Extracted Proposals</h3>
            {phase === 'done' && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  padding: '4px 12px',
                  borderRadius: 9999,
                  background: 'var(--accent-sage-light)',
                  color: 'var(--accent-sage)',
                }}
              >
                ✓ Extraction complete
              </motion.span>
            )}
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  {['Title', 'Partner', 'Sector', 'Region', 'Budget', 'Reach', 'Confidence', 'Flags'].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '10px 14px',
                        textAlign: 'left',
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: 'var(--text-muted)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {rows.map((row, i) => (
                    <motion.tr
                      key={row.id}
                      initial={{ opacity: 0, x: -20, backgroundColor: 'rgba(106, 155, 110, 0.08)' }}
                      animate={{ opacity: 1, x: 0, backgroundColor: 'transparent' }}
                      transition={{
                        type: 'spring',
                        stiffness: 500,
                        damping: 35,
                        backgroundColor: { duration: 1.5, delay: 0.3 },
                      }}
                      style={{ borderBottom: '1px solid var(--border-subtle)' }}
                    >
                      <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-primary)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {row.title}
                      </td>
                      <td style={{ padding: '10px 14px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {row.partner}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{
                          padding: '2px 10px',
                          borderRadius: 9999,
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          background: `${SECTOR_COLORS[row.sector]}15`,
                          color: SECTOR_COLORS[row.sector],
                          textTransform: 'capitalize',
                        }}>
                          {row.sector}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {row.region}
                      </td>
                      <td style={{ padding: '10px 14px', fontWeight: 600, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                        {formatBudget(row.budget)}
                      </td>
                      <td style={{ padding: '10px 14px', fontVariantNumeric: 'tabular-nums', color: 'var(--text-secondary)' }}>
                        {row.beneficiaries.toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{
                            width: 48,
                            height: 4,
                            borderRadius: 9999,
                            background: 'var(--bg-sunken)',
                            overflow: 'hidden',
                          }}>
                            <div style={{
                              width: `${row.confidence * 100}%`,
                              height: '100%',
                              borderRadius: 9999,
                              background: row.confidence > 0.85 ? 'var(--accent-sage)' : row.confidence > 0.7 ? 'var(--accent-amber)' : 'var(--accent-terracotta)',
                            }} />
                          </div>
                          <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                            {(row.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {row.redflags.length === 0 && (
                            <span style={{ fontSize: '0.68rem', color: 'var(--accent-sage)', fontWeight: 600 }}>Clean</span>
                          )}
                          {row.redflags.map((flag) => {
                            const info = RED_FLAG_LABELS[flag];
                            return (
                              <span
                                key={flag}
                                style={{
                                  fontSize: '0.65rem',
                                  fontWeight: 600,
                                  padding: '2px 8px',
                                  borderRadius: 9999,
                                  background: `${info?.color || '#999'}15`,
                                  color: info?.color || '#999',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                ⚑ {info?.label || flag}
                              </span>
                            );
                          })}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Summary strip after done */}
      {phase === 'done' && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 400, damping: 30 }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 16,
          }}
        >
          {[
            { label: 'Proposals Extracted', value: rows.length, icon: '◆', accent: 'var(--accent-sage)' },
            { label: 'Red Flags Detected', value: rows.reduce((s, r) => s + r.redflags.length, 0), icon: '⚑', accent: 'var(--accent-terracotta)' },
            { label: 'Avg. Confidence', value: `${(rows.reduce((s, r) => s + r.confidence, 0) / rows.length * 100).toFixed(0)}%`, icon: '◎', accent: 'var(--accent-indigo)' },
            { label: 'Total Requested', value: formatBudget(rows.reduce((s, r) => s + r.budget, 0)), icon: '◈', accent: 'var(--accent-amber)' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.08, type: 'spring', stiffness: 400, damping: 30 }}
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 14,
                padding: '16px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              <span style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                <span style={{ marginRight: 6 }}>{stat.icon}</span>{stat.label}
              </span>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--text-primary)' }}>
                {stat.value}
              </span>
            </motion.div>
          ))}
        </motion.div>
      )}
    </>
  );
}
