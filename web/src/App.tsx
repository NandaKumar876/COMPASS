import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './index.css';
import Sidebar from './components/Sidebar';
import type { Page } from './components/Sidebar';
import CommandCenter from './pages/CommandCenter';
import IntakePage from './pages/IntakePage';
import ProposalsPage from './pages/ProposalsPage';
import SummaryPage from './pages/SummaryPage';
import { useAllocation } from './hooks/useAllocation';

export default function App() {
  const [activePage, setActivePage] = useState<Page>('command');

  const {
    weights,
    setWeights,
    budget,
    setBudget,
    result,
    activePersona,
    applyPersona,
    applyQueryResult,
    proposals,
    isBackendConnected,
  } = useAllocation();

  return (
    <div className="app-layout">
      <Sidebar
        budget={budget}
        onBudgetChange={setBudget}
        activePage={activePage}
        onNavigate={setActivePage}
      />
      <main className="main-content">
        <AnimatePresence mode="wait">
          {activePage === 'command' && (
            <motion.div
              key="command"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              style={{ display: 'contents' }}
            >
              <CommandCenter
                weights={weights}
                onWeightChange={setWeights}
                budget={budget}
                result={result}
                activePersona={activePersona}
                onPersonaSelect={applyPersona}
                onQueryResult={applyQueryResult}
                proposals={proposals}
                isBackendConnected={isBackendConnected}
              />
            </motion.div>
          )}

          {activePage === 'intake' && (
            <motion.div
              key="intake"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
            >
              <IntakePage />
            </motion.div>
          )}

          {activePage === 'proposals' && (
            <motion.div
              key="proposals"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
            >
              <ProposalsPage proposals={proposals} result={result} />
            </motion.div>
          )}

          {activePage === 'summary' && (
            <motion.div
              key="summary"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
            >
              <SummaryPage proposals={proposals} result={result} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
