// frontend/src/components/investlab/EducationalInsights.jsx
import React, { useState } from 'react';
import { BookOpen, Shield, TrendingUp, PiggyBank, Target, ChevronDown, ChevronUp } from 'lucide-react';

const EducationalInsights = ({ readiness, portfolio, postActivity }) => {
  const [expandedId, setExpandedId] = useState(null);
  const [hasPostedActivity, setHasPostedActivity] = useState(false);

  const getInsights = () => {
    const insights = [];
    const score = readiness?.score || 0;
    const breakdown = readiness?.breakdown || {};
    const savingsRate = breakdown.savingsRate?.raw || 0; // 0-1 scale
    const budgetAdherence = breakdown.budgetAdherence?.raw || 0;
    const subscriptionBurden = breakdown.subscriptionBurden?.raw || 0;
    const spendingConsistency = breakdown.spendingConsistency?.raw || 0;

    const holdingsCount = portfolio?.holdings?.length || 0;
    
    // Check concentration
    let isConcentrated = false;
    if (holdingsCount > 0) {
      let totalValue = 0;
      let maxHoldValue = 0;
      portfolio.holdings.forEach(h => {
        const val = h.quantity * h.avgBuyPrice; // Approx using avgBuyPrice if prices missing
        totalValue += val;
        if (val > maxHoldValue) maxHoldValue = val;
      });
      if (totalValue > 0 && maxHoldValue / totalValue > 0.5) isConcentrated = true;
    }

    // 1. Beginner investing lessons
    if (holdingsCount === 0) {
      insights.push({
        id: 'beginner',
        icon: <TrendingUp size={20} />,
        title: 'Getting Started with Investing',
        summary: 'Your first step into the market.',
        content: 'Investing might seem intimidating, but the best way to learn is by doing. You have virtual cash ready. Try buying a single share of a company you know and use every day. Watch how its price moves to understand market volatility safely.'
      });
    }

    // 2. Budgeting lessons (Low readiness / low adherence)
    if (score < 50 || budgetAdherence < 0.6) {
      insights.push({
        id: 'budget',
        icon: <BookOpen size={20} />,
        title: 'Mastering the Budget',
        summary: 'Control your money before investing it.',
        content: 'Your budget discipline needs some work. Before taking risks in the stock market, you need a predictable cash flow. Try using the 50/30/20 rule: 50% for needs, 30% for wants, and 20% for savings and investments. Stick to your category limits strictly this month.'
      });
    }

    // 3. Saving habits lessons (Low savings rate)
    if (savingsRate < 0.15) {
      insights.push({
        id: 'save',
        icon: <PiggyBank size={20} />,
        title: 'Building a Savings Habit',
        summary: 'Pay yourself first to build wealth.',
        content: 'Your savings rate is currently below the recommended 20%. Try automating your savings. Set up an automatic transfer on the day you get paid so you "pay yourself first". Even small amounts like ₹500/month build up rapidly due to compound interest.'
      });
    }

    // 4. Subscription management (High burden)
    if (subscriptionBurden > 0.1) {
      insights.push({
        id: 'subs',
        icon: <Target size={20} />,
        title: 'Managing Subscription Creep',
        summary: 'Hidden costs are eating your investment capital.',
        content: 'Subscriptions are taking up a significant portion of your income. It is easy to sign up and forget. Audit your subscriptions this week. Cancel any service you haven\'t used in the last 14 days. The money you save can be directly redirected into your investment portfolio.'
      });
    }

    // 5. Spending control (Poor consistency)
    if (spendingConsistency < 0.6) {
      insights.push({
        id: 'consist',
        icon: <Target size={20} />,
        title: 'Smoothing Your Spending',
        summary: 'Avoid the rollercoaster of discretionary spending.',
        content: 'Your month-over-month spending fluctuates a lot. This unpredictability makes it hard to commit to a monthly investment plan (SIP). Identify your variable expenses (like eating out or entertainment) and set a strict cap for them to smooth out your cash flow.'
      });
    }

    // 6. Diversification lessons
    if (isConcentrated || holdingsCount === 1) {
      insights.push({
        id: 'div',
        icon: <Shield size={20} />,
        title: 'Understanding Diversification',
        summary: "Don't put all your eggs in one basket.",
        content: "A large portion of your portfolio is in a single stock. This exposes you to significant risk if that specific company performs poorly. Diversification means spreading investments across multiple companies or sectors to lower your overall risk."
      });
    }

    // Fallback if they are doing everything perfectly
    if (insights.length === 0) {
      insights.push({
        id: 'comp',
        icon: <Target size={20} />,
        title: 'The Magic of Compounding',
        summary: 'How your money makes its own money.',
        content: 'You have excellent financial habits! Compound interest is the interest on savings calculated on both the initial principal and the accumulated interest from previous periods. Keep investing consistently and let time do the heavy lifting.'
      });
    }

    return insights;
  };

  const insights = getInsights();

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
    if (expandedId !== id && !hasPostedActivity && postActivity) {
      postActivity('READ_LESSON');
      setHasPostedActivity(true);
    }
  };

  return (
    <div className="investlab-card">
      <h2 className="investlab-title" style={{ marginBottom: '16px' }}>
        <BookOpen size={24} color="#7cb342" /> Learning Center
      </h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {insights.map((insight) => (
          <div 
            key={insight.id} 
            style={{ 
              border: '1px solid #eee', 
              borderRadius: '8px', 
              overflow: 'hidden',
              transition: 'all 0.2s'
            }}
          >
            <div 
              onClick={() => toggleExpand(insight.id)}
              style={{ 
                padding: '16px', 
                background: expandedId === insight.id ? '#f4f8ef' : '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ color: '#7cb342' }}>{insight.icon}</div>
                <div>
                  <div style={{ fontWeight: 600, color: '#333' }}>{insight.title}</div>
                  <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '2px' }}>{insight.summary}</div>
                </div>
              </div>
              <div style={{ color: '#888' }}>
                {expandedId === insight.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
            </div>
            
            {expandedId === insight.id && (
              <div style={{ padding: '16px', paddingTop: '0', background: '#f4f8ef', borderTop: '1px solid #e0ebcc' }}>
                <p style={{ margin: 0, marginTop: '16px', fontSize: '0.9rem', color: '#444', lineHeight: '1.5' }}>
                  {insight.content}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default EducationalInsights;
