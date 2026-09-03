# 🧭 COMPASS — Steerable CSR Fund-Allocation Engine with a Conscience

> **"Everyone else builds a ranked list. COMPASS is a living, steerable allocation engine with a conscience — messy proposals go in, and a self-explaining, equity-aware funding portfolio comes out that you can re-steer in real time."**

---

## 🌟 Overview

**COMPASS** is an intelligent decision-support system for corporate social responsibility (CSR) fund allocation. Instead of relying on non-deterministic LLM scorecards or frozen ranked lists, COMPASS couples a **real constrained optimization solver** with an **adaptive narrative AI layer** and a **living frontend interface** that recalculates portfolios in real time as priorities shift.

---

## ✨ Key Features & Frontend Experience

### 1. 🎛️ Live Re-Optimization (The Hero Experience)
- Real-time steerability via 5 dynamic priority sliders: **Impact, Cost-Efficiency, Geographic Equity, Strategic Alignment, Feasibility**.
- Sub-50ms reactive portfolio recalculation with smooth spring animations.
- Instant feedback loops on budget utilization, beneficiary reach, and state coverage.

### 2. 👥 One-Click Portfolio Personas
- **Maximum Reach:** Prioritizes sheer beneficiary volume.
- **Deepest Impact:** Focuses on transformative depth per person.
- **Equity First:** Distributes resources to historically underserved and high-need regions.
- **CFO Mode:** Balances cost-efficiency and partner feasibility.

### 3. 🗺️ Interactive Geographic Bloom Map & Equity Gauge
- Custom SVG India choropleth with data-driven color intensity and bloom transitions.
- Real-time **Herfindahl-Hirschman Concentration Index (HHI)** meter measuring regional dispersion (Well-Spread ↔ Concentrated).

### 4. 📊 Board-Ready Executive Summary & Data Visualizations
- Interactive sector allocation donut charts.
- Regional breakdown and top-budget allocation bar charts via Recharts.
- Auto-generated board narrative explaining allocation rationale.

### 5. 🤖 AI Document Intake & Red-Flag Screener
- Interactive drop-zone for raw proposals.
- Row-by-row extraction streaming with confidence scoring and automated red-flag detection (e.g., *budget concerns, vague outcomes, missing metrics*).

---

## 🎨 Design System & Aesthetics

- **Typography:** Built on **Plus Jakarta Sans** (clean, modern interface) paired with **Instrument Serif** (editorial, authoritative headers).
- **Color Palette:** Warm, impact-domain inspired palette:
  - 🌿 **Sage Green (`#6A9B6E`)**: Funded initiatives, positive equity, balanced coverage.
  - 🌾 **Warm Amber (`#D4973B`)**: Efficiency and budget indicators.
  - 🏺 **Terracotta (`#C4634E`)**: Over-concentration warnings and healthcare metrics.
  - 🌌 **Indigo (`#5C5F99`)**: Education and strategic alignment.
  - 🕊️ **Cream Sand (`#F7F6F3`)**: Refined, eye-friendly light surface.
- **Micro-interactions:** Spring physics via **Framer Motion** (`stiffness: 400-500`, `damping: 25-35`) for natural fluid motion.

---

## 🛠️ Technology Stack

- **Framework:** React 19 + TypeScript
- **Bundler & Tooling:** Vite
- **Animations:** Framer Motion
- **Data Visualization:** Recharts
- **State Management:** Reactive Custom Hooks (`useAllocation`, `useAnimatedCounter`)
- **Optimization Layer:** Client-side Greedy Knapsack Solver (with seamless API swap capability)

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or pnpm / yarn

### Installation & Local Run

```bash
# 1. Navigate to the web frontend directory
cd web

# 2. Install dependencies
npm install

# 3. Launch the development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser to view the application.

### Production Build

```bash
npm run build
```

---

## 📂 Project Structure

```
compass/
├── web/
│   ├── public/                 # Brand assets, favicon, logos
│   ├── src/
│   │   ├── components/         # SliderPanel, IndiaMap, KPIBar, PortfolioList, etc.
│   │   ├── data/               # Seed datasets (proposals, regions, objectives)
│   │   ├── engine/             # Client-side solver and scoring algorithm
│   │   ├── hooks/              # useAllocation & useAnimatedCounter hooks
│   │   ├── pages/              # CommandCenter, IntakePage, ProposalsPage, SummaryPage
│   │   ├── types.ts            # Core TypeScript models
│   │   ├── App.tsx             # Application shell & page transitions
│   │   ├── index.css           # Design system tokens & styles
│   │   └── main.tsx            # Application entrypoint
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
└── README.md
```

---

## ⚖️ License

MIT License. Developed for the Microsoft Innovation Club — Problem Statement 1 Track.
