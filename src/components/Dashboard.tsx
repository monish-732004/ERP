import React from 'react';
import { PaddyPurchase, PaddyEntry, ProductionBatch, Loading } from '../types';
import { useTranslation } from '../context/LanguageContext';

interface DashboardProps {
  purchases: PaddyPurchase[];
  entries: PaddyEntry[];
  productions: ProductionBatch[];
  loadings: Loading[];
  paddyStockBags: number;
  riceStockBags: number;
  paddyBalances: any[];
  riceBalances: any[];
}

export const Dashboard: React.FC<DashboardProps> = ({
  purchases,
  entries,
  productions,
  loadings,
  paddyStockBags,
  riceStockBags,
  paddyBalances,
  riceBalances
}) => {
  const { t, language } = useTranslation();
  const money = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN');
  const today = () => new Date().toISOString().slice(0, 10);
  const fmtDate = (v: string) => {
    if (!v) return '';
    const parts = v.split('-');
    if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
    return v;
  };

  const dateToday = today();
  
  // Today's Purchases
  const todaysPurchases = purchases.filter(x => x.date === dateToday);
  const todayPurchaseValue = todaysPurchases.reduce((sum, x) => sum + (x.total || 0), 0);
  const todayPurchaseNet = todaysPurchases.reduce((sum, x) => sum + (x.net || 0), 0);

  // Today's Production
  const todaysProduction = productions.filter(x => x.date === dateToday || x.completionDate === dateToday);
  const todayProdBags = todaysProduction.reduce((sum, x) => sum + (x.paddyBags || 0), 0);

  // Supplier liabilities
  const pendingPurchases = purchases.filter(x => x.balance > 0);
  const pendingAmt = pendingPurchases.reduce((sum, x) => sum + (x.balance || 0), 0);

  // Today's Loading deliveries
  const todaysLoading = loadings.filter(x => x.date === dateToday);
  const loadingBags = todaysLoading.reduce((sum, x) => sum + (x.bags || 0), 0);

  // Supplier totals by quantity
  const getSupplierTotals = () => {
    const map: Record<string, { name: string; net: number; value: number }> = {};
    purchases.forEach(x => {
      const k = x.party || 'Unknown';
      map[k] = map[k] || { name: k, net: 0, value: 0 };
      map[k].net += x.net || 0;
      map[k].value += x.total || 0;
    });
    return Object.values(map).sort((a,b)=>b.net - a.net);
  };

  const supplierTotals = getSupplierTotals();
  const bestSupplier = supplierTotals[0];

  // Financial gross profit projection
  const headRate = 1500; // Average Head rice selling rate
  const brokenRate = 1000; // Average Broken rice selling rate
  const procRate = 60; // Parboiling processing overhead cost per paddy bag

  const purchaseTotalVal = purchases.reduce((sum, x) => sum + (x.total || 0), 0);
  const totalPaddyProcessed = productions.reduce((sum, x) => sum + (x.paddyBags || 0), 0);
  const processingTotalExpense = totalPaddyProcessed * procRate;
  const producedRiceTotalVal = productions.reduce((sum, x) => {
    if (x.status !== 'Completed') return sum;
    return sum + (x.headBags * headRate) + (x.brokenBags * brokenRate);
  }, 0);
  const grossProfitVal = producedRiceTotalVal - purchaseTotalVal - processingTotalExpense;

  // Variety wise aggregates
  const getVarietyTotals = () => {
    const map: Record<string, number> = {};
    purchases.forEach(x => {
      const k = x.variety || 'Unknown';
      map[k] = (map[k] || 0) + (x.net || 0);
    });
    return Object.entries(map).sort((a,b)=>b[1]-a[1]).map(x=>({label:x[0], val:x[1]}));
  };

  // Grouped Stock Chart: Paddy vs Rice bags
  const renderGroupedStockChart = () => {
    const stockMap: Record<string, { paddy: number; rice: number }> = {};
    
    // Aggregate Paddy stock
    (paddyBalances || []).forEach(pb => {
      const variety = pb.variety || 'RNR';
      const key = variety.includes('Rice') ? variety : `${variety} Rice`;
      if (!stockMap[key]) stockMap[key] = { paddy: 0, rice: 0 };
      stockMap[key].paddy += pb.balanceBags || 0;
    });

    // Aggregate Rice stock
    (riceBalances || []).forEach(rb => {
      const variety = rb.variety || 'RNR';
      const key = variety.includes('Rice') ? variety : `${variety} Rice`;
      if (!stockMap[key]) stockMap[key] = { paddy: 0, rice: 0 };
      stockMap[key].rice += rb.balanceBags || 0;
    });

    const data = Object.entries(stockMap)
      .map(([variety, data]) => ({ variety, paddy: Math.max(0, data.paddy), rice: Math.max(0, data.rice) }))
      .filter(d => d.paddy > 0 || d.rice > 0);

    if (data.length === 0) {
      return (
        <div className="flex items-center justify-center p-8 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-semibold text-slate-400">
          {t("No stock data available yet.")}
        </div>
      );
    }
    
    const maxVal = Math.max(...data.flatMap(d => [d.paddy, d.rice]), 1);
    
    return (
      <div className="border border-slate-200 bg-white rounded-2xl p-6 space-y-6 shadow-xs">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wider">{t("Raw vs Milled Inventory")}</h4>
          <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-teal-500 block" />
              <span className="text-slate-500">{t("Paddy Stock")}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 block" />
              <span className="text-slate-500">{t("Rice Stock")}</span>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          {data.map((row, idx) => {
            const paddyPct = Math.max(0, (row.paddy / maxVal) * 100);
            const ricePct = Math.max(0, (row.rice / maxVal) * 100);
            return (
              <div key={idx} className="space-y-1.5">
                <div className="font-bold text-xs text-slate-700 truncate">{t(row.variety)}</div>
                <div className="space-y-2 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100/80">
                  {/* Paddy Bar */}
                  <div className="flex items-center gap-3">
                    <div className="h-2 bg-slate-200/50 rounded-full overflow-hidden flex-1 flex">
                      <div 
                        className="h-full rounded-full transition-all duration-500 ease-out bg-teal-600" 
                        style={{ width: `${paddyPct}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-black text-teal-700 w-16 text-right">
                      {Math.round(row.paddy).toLocaleString('en-IN')} {t("bags")}
                    </span>
                  </div>
                  {/* Rice Bar */}
                  <div className="flex items-center gap-3">
                    <div className="h-2 bg-slate-200/50 rounded-full overflow-hidden flex-1 flex">
                      <div 
                        className="h-full rounded-full transition-all duration-500 ease-out bg-emerald-600" 
                        style={{ width: `${ricePct}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-black text-emerald-700 w-16 text-right">
                      {Math.round(row.rice).toLocaleString('en-IN')} {t("bags")}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Vertical Yield Performance Chart
  const renderYieldPerformanceChart = () => {
    const completedBatches = productions
      .filter(p => p.status === 'Completed' && p.yieldPercent > 0)
      .slice(-5); // Get last 5 completed batches
       
    if (completedBatches.length === 0) {
      return (
        <div className="flex items-center justify-center p-8 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-semibold text-slate-400">
          {t("No completed batches available for yield performance.")}
        </div>
      );
    }
    
    return (
      <div className="border border-slate-200 bg-white rounded-2xl p-6 space-y-6 shadow-xs">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wider">{t("Milling Yield Performance")}</h4>
          <span className="text-[10px] font-extrabold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full uppercase border border-emerald-100">
            {t("Last 5 Batches")}
          </span>
        </div>
        
        {/* Vertical Bar Chart area */}
        <div className="h-48 flex items-end justify-around relative pt-8 border-b border-slate-200 px-2">
          {/* Target Line at 78% */}
          <div 
            className="absolute left-0 right-0 border-t border-dashed border-red-400/80 z-10 flex items-center justify-end"
            style={{ bottom: '78%' }}
          >
            <span className="bg-red-50 text-red-700 font-extrabold text-[8px] md:text-[9px] px-1.5 py-0.5 rounded border border-red-200 mr-2 -mt-3 shadow-3xs">
              {t("Target Yield")} (78%)
            </span>
          </div>
          
          {completedBatches.map((b, idx) => {
            const heightPct = Math.min(100, b.yieldPercent);
            return (
              <div key={idx} className="flex flex-col items-center gap-2 group relative z-20">
                {/* Tooltip on hover */}
                <div className="absolute bottom-full mb-2 bg-slate-900 text-white text-[10px] p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg pointer-events-none whitespace-nowrap z-30">
                  <p className="font-bold">{t("Batch")}: #{b.batchNo}</p>
                  <p>{t("Paddy")}: {b.paddyBags} {t("bags")}</p>
                  <p>{t("Output")}: {b.totalRice} {t("bags")}</p>
                </div>
                
                {/* Bar */}
                <div className="w-8 md:w-10 bg-slate-100 rounded-t-lg relative h-36 flex items-end">
                  <div 
                    className="w-full rounded-t-lg bg-emerald-600 group-hover:bg-emerald-500 transition-all duration-300 relative"
                    style={{ height: `${heightPct}%` }}
                  >
                    {/* Text value inside or on top of bar */}
                    <span className="absolute -top-5 left-0 right-0 text-center font-black text-[9px] md:text-[10px] text-slate-800">
                      {b.yieldPercent.toFixed(1)}%
                    </span>
                  </div>
                </div>
                {/* Batch Label */}
                <span className="text-[9px] md:text-[10px] font-black text-slate-500 truncate w-14 text-center">
                  #{b.batchNo}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Daily Procurement Trend Chart (current month)
  const renderProcurementTrendChart = () => {
    const currentMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"
    const dailyMap: Record<string, number> = {};
    
    purchases
      .filter(p => p.date && p.date.startsWith(currentMonth))
      .forEach(p => {
        const day = p.date.slice(8, 10); // "DD"
        dailyMap[day] = (dailyMap[day] || 0) + p.full;
      });
      
    const data = Object.entries(dailyMap)
      .map(([day, val]) => ({ label: `${t("Day")} ${day}`, val }))
      .sort((a, b) => Number(a.label.replace(/[^0-9]/g, '')) - Number(b.label.replace(/[^0-9]/g, '')));

    if (data.length === 0) {
      return (
        <div className="flex items-center justify-center p-8 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-semibold text-slate-400">
          {t("No purchases recorded in the current month.")}
        </div>
      );
    }
    
    const maxVal = Math.max(...data.map(d => d.val), 1);
    
    return (
      <div className="border border-slate-200 bg-white rounded-2xl p-6 space-y-6 shadow-xs">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wider">{t("Daily Procurement Trend")}</h4>
          <span className="text-[10px] font-extrabold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full uppercase border border-amber-100">
            {new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })}
          </span>
        </div>
        
        <div className="space-y-3.5">
          {data.slice(-5).map((row, idx) => {
            const pct = Math.max(5, (row.val / maxVal) * 100);
            return (
              <div key={idx} className="grid grid-cols-[80px_1fr_70px] gap-3 items-center text-xs">
                <div className="font-bold text-slate-600 truncate">{t(row.label)}</div>
                <div className="h-3 bg-slate-50 rounded-full overflow-hidden border border-slate-100 flex">
                  <div 
                    className="h-full rounded-full transition-all duration-500 ease-out bg-amber-500" 
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="text-right font-black text-slate-700">
                  {row.val.toLocaleString('en-IN')} {t("bags")}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Automated warnings lists
  const alerts: string[] = [];
  if (paddyStockBags < 600) {
    alerts.push(`Paddy stock is critically low: only ${Math.round(paddyStockBags)} bags available (minimum 600 needed for one parboiled batch).`);
  }
  if (riceStockBags < 100) {
    alerts.push(`Rice stock in loading bays is low: only ${Math.round(riceStockBags)} bags remaining.`);
  }
  if (pendingAmt > 300000) {
    alerts.push(`Supplier liabilities exceed limit: outstanding balance is ${money(pendingAmt)}.`);
  }
  if (todaysPurchases.length === 0) {
    alerts.push('No purchase invoices have been recorded yet today.');
  }

  // Decision note logic
  const getOwnerDecisionNote = () => {
    let note = '';
    const vTotals = getVarietyTotals();
    if (bestSupplier) {
      note += `Your top contributor is <b>${bestSupplier.name}</b>, bringing in <b>${(bestSupplier.net/1000).toFixed(1)} MT</b>. `;
    }
    if (vTotals.length > 0) {
      note += `Consumers favored the <b>${vTotals[0].label}</b> variety, accounting for major milling throughput. `;
    }
    if (pendingAmt > 0) {
      note += `Schedule outstanding payables of <b>${money(pendingAmt)}</b> to maintain priority supply lines. `;
    }
    if (paddyStockBags < 600) {
      note += `A paddy shortage is imminent. Initiate buying orders immediately. `;
    }
    if (!note) {
      note = 'Input more purchases, completed parboiled yields, and customer loadings to compile deeper strategic command notes.';
    }
    return note;
  };

  return (
    <div className="space-y-6">
      
      {/* Primary KPI Indicators Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Current Paddy Stock */}
        <div className="p-5 bg-[#f0fdf4] border border-emerald-200 rounded-2xl shadow-xs">
          <span className="text-[10px] text-emerald-800 uppercase font-black tracking-wider block">{t('Current Paddy Stock')}</span>
          <b className="block text-2xl text-emerald-955 font-black mt-1.5">
            {Math.round(paddyStockBags).toLocaleString('en-IN')}
          </b>
          <small className="block text-[11px] text-emerald-700 mt-1.5 font-medium">{t('available bags in silos/godowns')}</small>
        </div>
        {/* Current Rice Stock */}
        <div className="p-5 bg-[#ecfdf5] border border-teal-200 rounded-2xl shadow-xs">
          <span className="text-[10px] text-teal-800 uppercase font-black tracking-wider block">{t('Current Rice Stock')}</span>
          <b className="block text-2xl text-teal-955 font-black mt-1.5">
            {Math.round(riceStockBags).toLocaleString('en-IN')}
          </b>
          <small className="block text-[11px] text-teal-700 mt-1.5 font-medium">{t('available processed bags')}</small>
        </div>
        {/* Est. Gross Profit */}
        <div className={`p-5 rounded-2xl border shadow-xs ${grossProfitVal >= 0 ? 'bg-[#f0fdf4] border-emerald-200' : 'bg-[#fef2f2] border-red-200'}`}>
          <span className={`text-[10px] uppercase font-black tracking-wider block ${grossProfitVal >= 0 ? 'text-emerald-800' : 'text-red-800'}`}>{t('Est. Gross Profit (Milling)')}</span>
          <b className={`block text-2xl font-black mt-1.5 ${grossProfitVal >= 0 ? 'text-emerald-955' : 'text-red-955'}`}>
            {money(grossProfitVal)}
          </b>
          <small className={`block text-[11px] mt-1.5 font-medium ${grossProfitVal >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{t('derived from market selling averages')}</small>
        </div>
        {/* Pending Supplier Balance */}
        <div className="p-5 bg-[#fffbeb] border border-amber-200 rounded-2xl shadow-xs">
          <span className="text-[10px] text-amber-800 uppercase font-black tracking-wider block">{t('Pending Supplier Balance')}</span>
          <b className="block text-2xl text-amber-955 font-black mt-1.5">{money(pendingAmt)}</b>
          <small className="block text-[11px] text-amber-700 mt-1.5 font-medium">
            {pendingPurchases.length} {t('accounts outstanding')}
          </small>
        </div>
      </div>

      {/* Secondary Compact KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {/* Today Purchase */}
        <div className="py-3 px-4 bg-[#f8fafc] border border-slate-205 rounded-xl flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">{t('Today Purchase')}</span>
            <b className="block text-lg text-slate-800 font-extrabold mt-0.5">{money(todayPurchaseValue)}</b>
          </div>
          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">
            {todaysPurchases.length} L
          </span>
        </div>
        {/* Today Processed */}
        <div className="py-3 px-4 bg-[#fafaf9] border border-stone-200 rounded-xl flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[10px] text-stone-500 uppercase font-bold tracking-wider block">{t('Today Processed')}</span>
            <b className="block text-lg text-stone-800 font-extrabold mt-0.5">
              {todayProdBags ? `${Math.round(todayProdBags)} bags` : `0 bags`}
            </b>
          </div>
          <span className="text-[10px] bg-stone-100/80 text-stone-600 px-2 py-0.5 rounded font-bold">
            {todaysProduction.length} B
          </span>
        </div>
        {/* Shipped Deliveries Today */}
        <div className="py-3 px-4 bg-[#f8fafc] border border-slate-205 rounded-xl flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">{t('Shipped Deliveries Today')}</span>
            <b className="block text-lg text-slate-800 font-extrabold mt-0.5">
              {loadingBags ? `${Math.round(loadingBags)} bags` : `0 bags`}
            </b>
          </div>
          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">
            {todaysLoading.length} V
          </span>
        </div>
        {/* Highest Volume Supplier */}
        <div className="py-3 px-4 bg-[#f5f5f4] border border-stone-200 rounded-xl flex items-center justify-between shadow-2xs">
          <div className="overflow-hidden mr-1">
            <span className="text-[10px] text-stone-500 uppercase font-bold tracking-wider block">{t('Top Supplier')}</span>
            <b className="block text-xs text-stone-800 font-black truncate mt-0.5" title={bestSupplier ? bestSupplier.name : '-'}>
              {bestSupplier ? bestSupplier.name : '-'}
            </b>
          </div>
          {bestSupplier && (
            <span className="text-[9px] bg-stone-200/60 text-stone-700 px-1.5 py-0.5 rounded font-bold shrink-0">
              {(bestSupplier.net/1000).toFixed(0)}T
            </span>
          )}
        </div>
      </div>

      {/* Main Charts & Strategic Summary Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Stocks and Procurement Trends */}
        <div className="space-y-6">
          {renderGroupedStockChart()}
          {renderProcurementTrendChart()}
        </div>

        {/* Right Column - Yield Chart & Strategic Summary Card */}
        <div className="space-y-6 flex flex-col">
          {renderYieldPerformanceChart()}
          
          <div className="bg-emerald-900 text-white rounded-2xl p-6 shadow-md shadow-emerald-100/40 flex-1 flex flex-col justify-center min-h-[160px]">
            <span className="bg-emerald-600 text-white text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-wider w-fit">
              {t("Strategic Operations Summary")}
            </span>
            <p 
              className="text-sm leading-relaxed text-slate-100 mt-4 font-semibold"
              dangerouslySetInnerHTML={{ 
                __html: language === 'ta' 
                  ? `ஆலையின் தற்போதைய நிலவரப்படி, முக்கிய நெல் ரகங்கள் கொள்முதல் மற்றும் உற்பத்தி சுழற்சி சீராக உள்ளது. நெல் இருப்பு ${Math.round(paddyStockBags)} மூட்டைகளும், அரிசி இருப்பு ${Math.round(riceStockBags)} மூட்டைகளும் உள்ளன. விவசாயிகளுக்கு செலுத்த வேண்டிய நிலுவைத்தொகை ${money(pendingAmt)} ஆகும்.`
                  : getOwnerDecisionNote() 
              }}
            />
          </div>
        </div>
      </div>

      {/* Full Width Live Stock & Payable Warnings (Bottom) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <h3 className="font-sans font-bold text-base text-slate-800 border-b border-slate-100 pb-2.5 mb-4">
          {t("Live Stock & Payable Warnings")}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {alerts.length === 0 ? (
            <div className="col-span-2 p-3 bg-emerald-50 text-emerald-800 rounded-xl font-bold text-xs">
              {t("Stock balances and payables are in safe thresholds.")}
            </div>
          ) : (
            alerts.map((a, idx) => {
              // Translate key low-stock alarm phrases
              let text = String(a).replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDC00-\uDFFF]/g, '');
              if (language === 'ta') {
                if (text.includes("Paddy stock is critically low")) {
                  text = `நெல் இருப்பு மிகவும் குறைவாக உள்ளது: தற்பொழுது ${Math.round(paddyStockBags)} மூட்டைகள் மட்டுமே உள்ளன (ஒரு தொகுதிக்கு குறைந்தபட்சம் 600 மூட்டைகள் தேவை).`;
                } else if (text.includes("Rice stock in loading bays is low")) {
                  text = `அரிசி இருப்பு குறைவாக உள்ளது: ${Math.round(riceStockBags)} மூட்டைகள் மட்டுமே இருப்பு உள்ளன.`;
                } else if (text.includes("Supplier liabilities exceed limit")) {
                  text = `விவசாயிகள் நிலுவை வரம்பு தாண்டியுள்ளது: செலுத்த வேண்டிய தொகை ${money(pendingAmt)}.`;
                } else if (text.includes("No purchase invoices have been recorded")) {
                  text = `இன்று இதுவரை கொள்முதல் பில்கள் எதுவும் பதிவு செய்யப்படவில்லை.`;
                }
              }
              return (
                <div 
                  key={idx} 
                  className="p-3 bg-slate-50 border border-slate-100 text-slate-700 font-semibold rounded-xl text-xs leading-relaxed"
                >
                  {text}
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
};
