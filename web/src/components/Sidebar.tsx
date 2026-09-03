import { motion } from 'framer-motion';

export type Page = 'command' | 'proposals' | 'intake' | 'summary';

interface SidebarProps {
  budget: number;
  onBudgetChange: (v: number) => void;
  activePage: Page;
  onNavigate: (page: Page) => void;
}

const NAV_ITEMS: { icon: string; label: string; id: Page }[] = [
  { icon: '⬡', label: 'Command Center', id: 'command' },
  { icon: '◈', label: 'All Proposals', id: 'proposals' },
  { icon: '◉', label: 'Intake', id: 'intake' },
  { icon: '▤', label: 'Summary', id: 'summary' },
];

function formatCrore(n: number): string {
  const cr = n / 10_000_000;
  return `₹${cr.toFixed(1)} Cr`;
}

export default function Sidebar({ budget, onBudgetChange, activePage, onNavigate }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <h1>
          <motion.div
            whileHover={{ rotate: 15, scale: 1.08 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              overflow: 'hidden',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <img
              src="/logo.jpg"
              alt="Compass"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          </motion.div>
          Compass
        </h1>
        <p>Steerable CSR Allocation</p>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <motion.button
            key={item.id}
            className={`sidebar-link ${activePage === item.id ? 'active' : ''}`}
            onClick={() => onNavigate(item.id)}
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            <span className="sidebar-link-icon">{item.icon}</span>
            {item.label}
          </motion.button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-budget">
          <label>Total Budget</label>
          <motion.span
            className="sidebar-budget-value"
            key={budget}
            initial={{ opacity: 0.6, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            {formatCrore(budget)}
          </motion.span>
          <input
            type="range"
            className="budget-slider"
            min={10_000_000}
            max={100_000_000}
            step={5_000_000}
            value={budget}
            onChange={(e) => onBudgetChange(Number(e.target.value))}
          />
        </div>
      </div>
    </aside>
  );
}
