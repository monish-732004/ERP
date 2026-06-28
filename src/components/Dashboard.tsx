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
}

export const Dashboard: React.FC<DashboardProps> = ({
  purchases,
  entries,
  productions,
  loadings,
  paddyStockBags,
  riceStockBags
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

  // Custom SVG Bar Chart drawing
  const renderSVGChart = (title: string, data: { label: string; val: number }[], unit: string, barColor = '#3b82f6') => {
    if (data.length === 0) {
      return (
        <div className="flex items-center justify-center p-8 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-semibold text-slate-400">
          No data available yet to draw SVG.
        </div>
      );
    }
    const maxVal = Math.max(...data.map(d => d.val), 1);
    
    return (
      <div className="border border-slate-100 bg-white rounded-2xl p-4 space-y-4">
        <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider">{title}</h4>
        <div className="space-y-3">
          {data.slice(0, 5).map((row, idx) => {
            const pct = Math.max(5, (row.val / maxVal) * 100);
            return (
              <div key={idx} className="grid grid-cols-[100px_1fr_80px] gap-2.5 items-center text-xs">
                <div className="font-bold text-slate-600 truncate" title={row.label}>{row.label}</div>
                <div className="h-3.5 bg-slate-50 rounded-full overflow-hidden border border-slate-100 flex">
                  <div 
                    className="h-full rounded-full transition-all duration-500 ease-out" 
                    style={{ width: `${pct}%`, backgroundColor: barColor }}
                  />
                </div>
                <div className="text-right font-black text-slate-700">
                  {unit === '₹' ? money(row.val) : `${Math.round(row.val).toLocaleString('en-IN')} ${unit}`}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Variety wise aggregates
  const getVarietyTotals = () => {
    const map: Record<string, number> = {};
    purchases.forEach(x => {
      const k = x.variety || 'Unknown';
      map[k] = (map[k] || 0) + (x.net || 0);
    });
    return Object.entries(map).sort((a,b)=>b[1]-a[1]).map(x=>({label:x[0], val:x[1]}));
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
      
      {/* KPI Indicators grid */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 md:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-slate-100 pb-3 mb-6 gap-2">
          <h2 className="font-sans font-bold text-base md:text-lg text-slate-800">{t('Operational Command Center')}</h2>
          <span className="text-xs font-semibold text-slate-400">{t('Date')}: {fmtDate(dateToday)}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
            <span className="text-[10px] text-slate-400 uppercase font-black block">{t('Today Purchase')}</span>
            <b className="block text-xl text-slate-800 font-extrabold mt-1">{money(todayPurchaseValue)}</b>
            <small className="block text-[11px] text-slate-400 mt-1">
              {todaysPurchases.length} {t('loads')} · {(todayPurchaseNet/1000).toFixed(1)} MT
            </small>
          </div>
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
            <span className="text-[10px] text-slate-400 uppercase font-black block">{t('Today Processed')}</span>
            <b className="block text-xl text-slate-800 font-extrabold mt-1">
              {todayProdBags ? `${Math.round(todayProdBags)} ${t('bags')}` : `0 ${t('bags')}`}
            </b>
            <small className="block text-[11px] text-slate-400 mt-1">
              {todaysProduction.length} {t('parboiled batches')}
            </small>
          </div>
          <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl">
            <span className="text-[10px] text-emerald-800 uppercase font-black block">{t('Current Paddy Stock')}</span>
            <b className="block text-xl text-emerald-700 font-extrabold mt-1">
              {Math.round(paddyStockBags).toLocaleString('en-IN')}
            </b>
            <small className="block text-[11px] text-emerald-600 mt-1">{t('available bags in silos/godowns')}</small>
          </div>
          <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl">
            <span className="text-[10px] text-emerald-800 uppercase font-black block">{t('Current Rice Stock')}</span>
            <b className="block text-xl text-emerald-700 font-extrabold mt-1">
              {Math.round(riceStockBags).toLocaleString('en-IN')}
            </b>
            <small className="block text-[11px] text-emerald-600 mt-1">{t('available processed bags')}</small>
          </div>
          <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-xl">
            <span className="text-[10px] text-amber-800 uppercase font-black block">{t('Pending Supplier Balance')}</span>
            <b className="block text-xl text-amber-700 font-extrabold mt-1">{money(pendingAmt)}</b>
            <small className="block text-[11px] text-amber-600 mt-1">
              {pendingPurchases.length} {t('accounts outstanding')}
            </small>
          </div>
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
            <span className="text-[10px] text-slate-400 uppercase font-black block">{t('Shipped Deliveries Today')}</span>
            <b className="block text-xl text-slate-800 font-extrabold mt-1">
              {loadingBags ? `${Math.round(loadingBags)} ${t('bags')}` : `0 ${t('bags')}`}
            </b>
            <small className="block text-[11px] text-slate-400 mt-1">{todaysLoading.length} {t('vehicle loading logs')}</small>
          </div>
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
            <span className="text-[10px] text-slate-400 uppercase font-black block">{t('Highest Volume Supplier')}</span>
            <b className="block text-base text-slate-700 font-extrabold truncate mt-2">
              {bestSupplier ? bestSupplier.name : '-'}
            </b>
            <small className="block text-[11px] text-slate-400 mt-1">
              {bestSupplier ? `${(bestSupplier.net/1000).toFixed(0)} ${t('Tons supplied')}` : t('Need purchase data')}
            </small>
          </div>
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
            <span className="text-[10px] text-slate-400 uppercase font-black block">{t('Est. Gross Profit (Milling)')}</span>
            <b className={`block text-xl font-extrabold mt-1 ${grossProfitVal >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {money(grossProfitVal)}
            </b>
            <small className="block text-[11px] text-slate-400 mt-1">{t('derived from market selling averages')}</small>
          </div>
        </div>
      </div>

      {/* SVG charts, low stock alerts list, and strategic notes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Custom drawn charts */}
        <div className="space-y-4">
          {renderSVGChart(
            t("Top Suppliers (By Supplied weight)"),
            supplierTotals.map(x => ({ label: x.name, val: x.net })),
            "kg",
            "#0284c7"
          )}
          {renderSVGChart(
            t("Variety-wise Procurement (By weight)"),
            getVarietyTotals(),
            "kg",
            "#10b981"
          )}
        </div>

        {/* Alerts & warnings list */}
        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 md:p-6 shadow-sm flex-1">
            <h3 className="font-sans font-bold text-base text-slate-800 border-b border-slate-50 pb-2 mb-4">
              {t("Live Stock & Payable Warnings")}
            </h3>
            <div className="space-y-2">
              {alerts.length === 0 ? (
                <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl font-bold text-xs">
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
                      className="p-3 bg-slate-50 border border-slate-100 text-slate-700 font-bold rounded-xl text-xs leading-relaxed"
                    >
                      {text}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="bg-emerald-900 text-white rounded-2xl p-4 md:p-6 shadow-md shadow-emerald-100/50 flex flex-col justify-center">
            <span className="bg-emerald-600 text-white text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-wider w-fit">
              {t("Strategic Operations Summary")}
            </span>
            <p 
              className="text-sm leading-relaxed text-slate-100 mt-3 font-semibold"
              dangerouslySetInnerHTML={{ 
                __html: language === 'ta' 
                  ? `ஆலையின் தற்போதைய நிலவரப்படி, முக்கிய நெல் ரகங்கள் கொள்முதல் மற்றும் உற்பத்தி சுழற்சி சீராக உள்ளது. நெல் இருப்பு ${Math.round(paddyStockBags)} மூட்டைகளும், அரிசி இருப்பு ${Math.round(riceStockBags)} மூட்டைகளும் உள்ளன. விவசாயிகளுக்கு செலுத்த வேண்டிய நிலுவைத்தொகை ${money(pendingAmt)} ஆகும்.`
                  : getOwnerDecisionNote() 
              }}
            />
          </div>
        </div>

      </div>

    </div>
  );
};
