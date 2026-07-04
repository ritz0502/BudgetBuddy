// frontend/src/pages/InvestLabPage.jsx
import React, { useState } from 'react';
import './investlab.css';
import InvestLabHero from '../components/investlab/InvestLabHero';
import ReadinessCard from '../components/investlab/ReadinessCard';
import Watchlist from '../components/investlab/Watchlist';
import PortfolioMetrics from '../components/investlab/PortfolioMetrics';
import BuyStockCard from '../components/investlab/BuyStockCard';
import HoldingsTable from '../components/investlab/HoldingsTable';
import SellModal from '../components/investlab/SellModal';
import TradeHistory from '../components/investlab/TradeHistory';
import AICoachCard from '../components/investlab/AICoachCard';
import FutureWealthPlanner from '../components/investlab/FutureWealthPlanner';
import AllocationChart from '../components/investlab/AllocationChart';
import PerformanceChart from '../components/investlab/PerformanceChart';
import EducationalInsights from '../components/investlab/EducationalInsights';
import PortfolioHealthCard from '../components/investlab/PortfolioHealthCard';
import ConcentrationRiskCard from '../components/investlab/ConcentrationRiskCard';
import ProgressHub from '../components/investlab/ProgressHub';
import AchievementShowcase from '../components/investlab/AchievementShowcase';

import { usePortfolio } from '../hooks/usePortfolio';
import { useReadiness } from '../hooks/useReadiness';
import { useMarketPrices } from '../hooks/useMarketPrices';
import { useTradeHistory } from '../hooks/useTradeHistory';
import { useInvestLabXP } from '../hooks/useInvestLabXP';

const InvestLabPage = () => {
  const { portfolio, loading: portfolioLoading, refreshPortfolio } = usePortfolio();
  const { readiness, loading: readinessLoading } = useReadiness();
  const { trades, refreshTrades } = useTradeHistory();
  const { prices, connected } = useMarketPrices();
  const [sellModalOpen, setSellModalOpen] = useState(false);
  const [sellData, setSellData] = useState(null);
  const [toast, setToast] = useState(null);

  const handleXPEvent = React.useCallback((event) => {
    setToast({ message: event.message, type: 'success' });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const { xpData, streakData, achievements, refreshGamification, postActivity } = useInvestLabXP(handleXPEvent);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleRefresh = async () => {
    refreshPortfolio();
    refreshTrades();
    await refreshGamification();
  };

  const openSellModal = (symbol, maxQuantity, currentPrice) => {
    setSellData({ symbol, maxQuantity, currentPrice });
    setSellModalOpen(true);
  };

  if (portfolioLoading || readinessLoading) {
    return (
      <div className="investlab-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <p style={{ color: '#888' }}>Loading InvestLab...</p>
      </div>
    );
  }

  return (
    <div className="investlab-container">
      <div className="investlab-inner">
        
        {/* Section 0: Gamification Progress */}
        <ProgressHub xpData={xpData} streakData={streakData} achievements={achievements} />

        {/* Section 1: Top Dashboard Overview */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <InvestLabHero portfolio={portfolio} readiness={readiness} />
            <AICoachCard />
            <ConcentrationRiskCard portfolio={portfolio} prices={prices} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <PortfolioMetrics portfolio={portfolio} />
            <ReadinessCard readiness={readiness} />
            <PortfolioHealthCard />
          </div>
        </div>

        {/* Section 2: Primary Chart Area (Full Width) */}
        <div>
          <PerformanceChart />
        </div>

        {/* Section 3: Wealth Builder */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <AllocationChart />
          <FutureWealthPlanner readiness={readiness} postActivity={postActivity} />
        </div>

        {/* Section 4: Portfolio Holdings (Full Width) */}
        <div>
          <HoldingsTable 
            portfolio={portfolio} 
            prices={prices} 
            onSellClick={openSellModal} 
          />
        </div>

        {/* Section 5: Live Market & Trading */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <Watchlist prices={prices} />
            <BuyStockCard prices={prices} onBuySuccess={handleRefresh} />
          </div>
          <div>
            <TradeHistory trades={trades} />
          </div>
        </div>

        {/* Section 6: Education (Full Width) */}
        <div>
          <EducationalInsights readiness={readiness} portfolio={portfolio} postActivity={postActivity} />
        </div>

        {/* Section 7: Gamification Showcase */}
        <div>
          <AchievementShowcase achievements={achievements} />
        </div>

      </div>

      <SellModal 
        isOpen={sellModalOpen} 
        onClose={() => setSellModalOpen(false)}
        sellData={sellData}
        onSellSuccess={handleRefresh}
      />

      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          background: toast.type === 'success' ? '#2e7d32' : '#d32f2f',
          color: '#fff',
          padding: '12px 24px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 9999,
          fontWeight: 600,
          animation: 'slideUp 0.3s ease-out'
        }}>
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default InvestLabPage;
