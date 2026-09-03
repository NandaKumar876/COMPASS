import { useAnimatedCounter } from '../hooks/useAnimatedCounter';
import { motion } from 'framer-motion';

interface KPIBarProps {
  count: number;
  spent: number;
  beneficiaries: number;
  states: number;
}

function formatCurrency(n: number): string {
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(1)}Cr`;
  if (n >= 100_000) return `₹${(n / 100_000).toFixed(1)}L`;
  return `₹${n.toLocaleString('en-IN')}`;
}

function formatNumber(n: number): string {
  if (n >= 100_000) return `${(n / 1000).toFixed(0)}K`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toLocaleString('en-IN');
}

const KPIS = [
  { key: 'count', label: 'Projects Funded', icon: '◆', format: (n: number) => n.toString() },
  { key: 'spent', label: 'Total Allocated', icon: '◈', format: formatCurrency },
  { key: 'beneficiaries', label: 'Lives Reached', icon: '◎', format: formatNumber },
  { key: 'states', label: 'States Covered', icon: '⬡', format: (n: number) => n.toString() },
] as const;

export default function KPIBar({ count, spent, beneficiaries, states }: KPIBarProps) {
  const animCount = useAnimatedCounter(count, 500);
  const animSpent = useAnimatedCounter(spent, 600);
  const animBen = useAnimatedCounter(beneficiaries, 700);
  const animStates = useAnimatedCounter(states, 400);

  const values = { count: animCount, spent: animSpent, beneficiaries: animBen, states: animStates };

  return (
    <div className="kpi-bar">
      {KPIS.map((kpi, i) => (
        <motion.div
          key={kpi.key}
          className="kpi-card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            type: 'spring',
            stiffness: 400,
            damping: 30,
            delay: i * 0.06,
          }}
        >
          <span className="kpi-label">
            <span className="kpi-icon">{kpi.icon}</span>
            {kpi.label}
          </span>
          <span className="kpi-value">{kpi.format(values[kpi.key])}</span>
        </motion.div>
      ))}
    </div>
  );
}
