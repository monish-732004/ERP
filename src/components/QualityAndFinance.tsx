import React, { useState } from 'react';
import { 
  QualityRecord, 
  PaddyPurchase, 
  ProductionBatch, 
  Loading 
} from '../types';
import { useTranslation } from '../context/LanguageContext';

interface QualityAndFinanceProps {
  purchases: PaddyPurchase[];
  productions: ProductionBatch[];
  loadings: Loading[];
  qualityRecords: QualityRecord[];
  onAddQualityRecord: (qr: Omit<QualityRecord, 'id'>) => Promise<void>;
  onDeleteDoc: (col: string, id: string) => Promise<void>;
  onAddLoading?: (l: Omit<Loading, 'id'>) => Promise<void>;
  activeTab?: string;
  varieties?: string[];
}

export const QualityAndFinance: React.FC<QualityAndFinanceProps> = ({
  purchases,
  productions,
  loadings,
  qualityRecords,
  onAddQualityRecord,
  onDeleteDoc,
  onAddLoading,
  activeTab = 'quality_finance',
  varieties = ['RNR', 'Sona Masuri', 'BPT']
}) => {
  const { t } = useTranslation();
  const money = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN');
  const fmtDate = (v: string) => {
    if (!v) return '';
    const parts = v.split('-');
    if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
    return v;
  };

  // State Quality Form
  const [qyDate, setQyDate] = useState(new Date().toISOString().slice(0, 10));
  const [qyBatch, setQyBatch] = useState('');
  const [qySupplier, setQySupplier] = useState('');
  const [qyVariety, setQyVariety] = useState('');
  const [qyMonth, setQyMonth] = useState(new Date().toISOString().slice(0, 7));
  const [qyPaddyBags, setQyPaddyBags] = useState(0);
  const [qyHeadBags, setQyHeadBags] = useState(0);
  const [qyBrokenBags, setQyBrokenBags] = useState(0);
  const [qyMoisture, setQyMoisture] = useState('');
  const [qyCooking, setQyCooking] = useState('Excellent');
  const [qyStickiness, setQyStickiness] = useState('Low');
  const [qyElongation, setQyElongation] = useState('Excellent');
  const [qyFeedback, setQyFeedback] = useState('');
  const [qyRemarks, setQyRemarks] = useState('');

  // Filters Quality List
  const [qySearch, setQySearch] = useState('');
  const [subTab, setSubTab] = useState<'quality_tracking' | 'cashflow_dashboard' | 'loading_dispatch'>('quality_tracking');
  const [qyVarietyFilter, setQyVarietyFilter] = useState('');
  const [qyMonthFilter, setQyMonthFilter] = useState('');

  // State Finance Form
  const [finMonth, setFinMonth] = useState(new Date().toISOString().slice(0, 7));
  const [finHeadRate, setFinHeadRate] = useState(1500);
  const [finBrokenRate, setFinBrokenRate] = useState(1000);
  const [finProcessCost, setFinProcessCost] = useState(60); // Rs 60 processing cost per paddy bag

  // State Loading Form
  const [ldDate, setLdDate] = useState(new Date().toISOString().slice(0, 10));
  const [ldType, setLdType] = useState<'Customer Delivery' | 'Godown Transfer'>('Customer Delivery');
  const [ldParty, setLdParty] = useState('');
  const [ldToGodown, setLdToGodown] = useState('');
  const [ldLorry, setLdLorry] = useState('');
  const [ldStorage, setLdStorage] = useState('Rice Storage 1');
  const [ldLot, setLdLot] = useState('');
  const [ldVariety, setLdVariety] = useState('RNR');
  const [ldProduct, setLdProduct] = useState('Head Rice 26kg');
  const [ldBags, setLdBags] = useState(0);

  const handleSaveLoading = async () => {
    if (!ldBags || ldBags <= 0) {
      alert("Please enter a valid number of bags.");
      return;
    }
    if (ldType === 'Customer Delivery' && !ldParty) {
      alert("Please enter a party/customer name.");
      return;
    }
    if (ldType === 'Godown Transfer' && !ldToGodown) {
      alert("Please enter a target godown.");
      return;
    }
    if (onAddLoading) {
      await onAddLoading({
        date: ldDate,
        movementType: ldType,
        party: ldType === 'Customer Delivery' ? ldParty : '',
        toGodown: ldType === 'Godown Transfer' ? ldToGodown : '',
        lorry: ldLorry,
        storage: ldStorage,
        lot: ldLot,
        variety: ldVariety,
        product: ldProduct,
        bags: ldBags
      });
      // reset form
      setLdParty('');
      setLdToGodown('');
      setLdLorry('');
      setLdBags(0);
      setLdLot('');
      alert("Dispatch loading registered successfully!");
    }
  };

  // Yield calculator math
  const getYieldValues = () => {
    const paddy = Number(qyPaddyBags || 0);
    const head = Number(qyHeadBags || 0);
    const broken = Number(qyBrokenBags || 0);
    const total = head + broken;
    const headPct = paddy ? (head / paddy) * 100 : 0;
    const brokenPct = paddy ? (broken / paddy) * 100 : 0;
    const totalPct = paddy ? (total / paddy) * 100 : 0;

    return { paddy, head, broken, total, headPct, brokenPct, totalPct };
  };

  const handleBatchChange = (batchId: string) => {
    setQyBatch(batchId);
    const p = productions.find(x => x.id === batchId);
    if (!p) {
      setQySupplier('');
      setQyVariety('');
      setQyPaddyBags(0);
      setQyHeadBags(0);
      setQyBrokenBags(0);
      setQyMoisture('');
      return;
    }
    setQySupplier(p.lotSummary || p.source || '');
    setQyVariety(p.variety || '');
    setQyPaddyBags(p.paddyBags || 0);
    setQyHeadBags(p.headBags || 0);
    setQyBrokenBags(p.brokenBags || 0);
    setQyMoisture(String(p.finalMoisture || ''));
    if (p.date) {
      setQyMonth(p.date.slice(0, 7));
    }
  };

  const handleSaveQuality = async () => {
    if (!qyBatch) {
      alert("Please select a production batch first.");
      return;
    }
    const y = getYieldValues();
    const newRecord: Omit<QualityRecord, 'id'> = {
      date: qyDate,
      productionId: qyBatch,
      batchNo: productions.find(x => x.id === qyBatch)?.batchNo || qyBatch,
      supplier: qySupplier,
      variety: qyVariety,
      purchaseMonth: qyMonth,
      paddyBags: y.paddy,
      headBags: y.head,
      brokenBags: y.broken,
      totalRiceBags: y.total,
      headPct: Number(y.headPct.toFixed(2)),
      brokenPct: Number(y.brokenPct.toFixed(2)),
      totalPct: Number(y.totalPct.toFixed(2)),
      moisture: Number(qyMoisture || 0),
      cooking: qyCooking,
      stickiness: qyStickiness,
      elongation: qyElongation,
      feedback: qyFeedback,
      remarks: qyRemarks
    };

    try {
      await onAddQualityRecord(newRecord);
      setQyFeedback('');
      setQyRemarks('');
      setQyBatch('');
      setQySupplier('');
      setQyVariety('');
      setQyPaddyBags(0);
      setQyHeadBags(0);
      setQyBrokenBags(0);
      alert("Quality record saved successfully!");
    } catch(err) {
      console.error(err);
      alert("Error saving quality log.");
    }
  };

  const cleanText = (s: string) => String(s || '').toLowerCase().trim();

  const getFilteredQuality = () => {
    const q = cleanText(qySearch);
    return qualityRecords.filter(x => {
      const hay = cleanText([x.date, x.batchNo, x.supplier, x.variety, x.cooking, x.stickiness, x.elongation, x.feedback, x.remarks].join(' '));
      return (!q || hay.includes(q)) && 
             (!qyVarietyFilter || x.variety === qyVarietyFilter) && 
             (!qyMonthFilter || x.purchaseMonth === qyMonthFilter || x.date.startsWith(qyMonthFilter));
    });
  };

  const clearQualityFilters = () => {
    setQySearch('');
    setQyVarietyFilter('');
    setQyMonthFilter('');
  };

  const exportQualityExcel = () => {
    const list = getFilteredQuality();
    downloadExcel('SKP_Milling_Quality_Register.xls', 
      ['Date', 'Batch', 'Month', 'Supplier / Lot Source', 'Variety', 'Paddy Bags', 'Head Bags', 'Broken Bags', 'Total Output Bags', 'Head %', 'Broken %', 'Moisture', 'Cooking', 'Stickiness', 'Elongation', 'Feedback/Remarks'],
      list.map(x => [x.date, x.batchNo, x.purchaseMonth, x.supplier, x.variety, x.paddyBags, x.headBags, x.brokenBags, x.totalRiceBags, x.headPct + '%', x.brokenPct + '%', x.moisture + '%', x.cooking, x.stickiness, x.elongation, x.remarks || x.feedback])
    );
  };

  const exportFinanceExcel = () => {
    downloadExcel('SKP_Financial_Ledger_' + (finMonth || 'All') + '.xls',
      ['Category', 'Value (INR)'],
      [
        ['Month Filter', finMonth || 'All'],
        ['Paddy Purchase Value', f.purchaseVal],
        ['Paid to Suppliers', f.paidVal],
        ['Outstanding Liabilities', f.balanceVal],
        ['Processing Overheads', f.processingVal],
        ['Milled Output Value', f.producedVal],
        ['Available Stock Value', f.stockVal],
        ['Shipped Loaded Value', f.loadedVal],
        ['Estimated Gross Profit', f.grossProfitVal]
      ]
    );
  };

  const downloadExcel = (filename: string, heads: string[], rows: any[][]) => {
    const esc = (v: any) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const html = `<html><head><meta charset="UTF-8"></head><body><table border="1"><tr>${heads.map(h => `<th>${esc(h)}</th>`).join('')}</tr>${rows.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</table></body></html>`;
    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  // Live Finance Calculations
  const inFinMonth = (d: string) => {
    if (!finMonth) return true;
    return String(d || '').startsWith(finMonth);
  };

  const getFinanceMetrics = () => {
    const pp = purchases.filter(x => inFinMonth(x.date));
    const prod = productions.filter(x => inFinMonth(x.date) || inFinMonth(x.completionDate || ''));
    const load = loadings.filter(x => inFinMonth(x.date));

    const purchaseVal = pp.reduce((sum, x) => sum + (x.total || 0), 0);
    const paidVal = pp.reduce((sum, x) => sum + (x.paid || 0), 0);
    const balanceVal = pp.reduce((sum, x) => sum + (x.balance || 0), 0);

    const processedPaddyBags = prod.reduce((sum, x) => sum + (x.paddyBags || 0), 0);
    const processingVal = processedPaddyBags * finProcessCost;

    const producedVal = prod.reduce((sum, x) => {
      if (x.status !== 'Completed') return sum;
      return sum + (x.headBags * finHeadRate) + (x.brokenBags * finBrokenRate);
    }, 0);

    const loadedVal = load.reduce((sum, x) => {
      const rate = x.product === 'Broken 26kg' ? finBrokenRate : finHeadRate;
      return sum + (x.bags * rate);
    }, 0);

    // Calculate live remaining rice stock in monthly batches
    const completedProd = productions.filter(p => p.status === 'Completed' && inFinMonth(p.completionDate || p.date));
    let headStock = completedProd.reduce((sum, x) => sum + (x.headBags || 0), 0);
    let brokenStock = completedProd.reduce((sum, x) => sum + (x.brokenBags || 0), 0);

    // Subtract deliveries for same month
    loadings.filter(l => inFinMonth(l.date)).forEach(l => {
      if (l.product === 'Broken 26kg') brokenStock = Math.max(0, brokenStock - l.bags);
      else headStock = Math.max(0, headStock - l.bags);
    });

    const stockVal = (headStock * finHeadRate) + (brokenStock * finBrokenRate);
    const grossProfitVal = producedVal - purchaseVal - processingVal;

    // Supplier aggregates
    const supMap: Record<string, { party: string; purchase: number; paid: number; balance: number; count: number }> = {};
    pp.forEach(x => {
      const k = x.party || 'Unknown';
      supMap[k] = supMap[k] || { party: k, purchase: 0, paid: 0, balance: 0, count: 0 };
      supMap[k].purchase += x.total || 0;
      supMap[k].paid += x.paid || 0;
      supMap[k].balance += x.balance || 0;
      supMap[k].count++;
    });

    return {
      purchaseVal, paidVal, balanceVal, processingVal, producedVal, loadedVal, stockVal, grossProfitVal,
      suppliersLedger: Object.values(supMap).sort((a,b)=>b.balance - a.balance),
      batches: prod
    };
  };

  const q = getFilteredQuality();
  const f = getFinanceMetrics();
  const y = getYieldValues();

  // Average quality statistics
  const avgHeadPct = q.length ? q.reduce((s, x) => s + x.headPct, 0) / q.length : 0;
  const avgBrokenPct = q.length ? q.reduce((s, x) => s + x.brokenPct, 0) / q.length : 0;

  // Best supplier / month logic based on highest avg Head %
  const getBestMetric = (key: 'supplier' | 'purchaseMonth') => {
    const map: Record<string, { sum: number; count: number }> = {};
    q.forEach(x => {
      const k = x[key] || '-';
      map[k] = map[k] || { sum: 0, count: 0 };
      map[k].sum += x.headPct;
      map[k].count++;
    });
    const sorted = Object.entries(map).sort((a,b) => (b[1].sum / b[1].count) - (a[1].sum / a[1].count));
    return sorted[0] ? sorted[0][0] : '-';
  };

  const varietyList = [...new Set([
    ...productions.map(p => p.variety),
    ...qualityRecords.map(qr => qr.variety)
  ].filter(Boolean))].sort();

  return (
    <div className="space-y-6">
      
      {/* Sub Tab Switcher (Professional Polish, No Blue) */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-4">
        {[
          { id: 'quality_tracking', label: '🔬 ' + t('Quality Control Logs') },
          { id: 'cashflow_dashboard', label: '💰 ' + t('Cashflow Dashboard') },
          { id: 'loading_dispatch', label: '🚚 ' + t('Loading Dispatches') }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setSubTab(tab.id as any)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-150 ${
              subTab === tab.id
                ? 'bg-emerald-600 text-white shadow'
                : 'bg-white hover:bg-slate-100 border border-slate-200 text-slate-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ================= QUALITY & YIELD TRACKING ================= */}
      {(subTab === 'quality_tracking') && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="font-sans font-bold text-lg text-slate-800 mb-2">{t("Quality & Yield Tracking")}</h2>
          <p className="text-xs text-slate-500 mb-6">
            {t("Trace parboiled rice moisture levels, stickiness, head recovery ratios, and client cooking logs directly linked to production batches.")}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t("Select Batch")}</label>
              <select 
                value={qyBatch}
                onChange={(e) => handleBatchChange(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl focus:border-emerald-500 text-sm font-semibold text-slate-800"
              >
                <option value="">{t("Select milling batch")}</option>
                {productions.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.date} | {p.batchNo} | {p.variety}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t("Date Recorded")}</label>
              <input 
                type="date"
                value={qyDate}
                onChange={(e) => setQyDate(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t("Supplier Source Lots")}</label>
              <input 
                type="text"
                value={qySupplier}
                readOnly
                className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm font-semibold text-slate-500 text-slate-800"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t("Variety")}</label>
              <input 
                type="text"
                value={qyVariety}
                readOnly
                className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm font-semibold text-slate-500 text-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t("Paddy Bags Input")}</label>
              <input 
                type="number"
                value={qyPaddyBags || ''}
                readOnly
                className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm font-semibold text-slate-500 text-slate-800"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t("Head Rice Bags (26kg)")}</label>
              <input 
                type="number"
                value={qyHeadBags || ''}
                onChange={(e) => setQyHeadBags(Number(e.target.value))}
                placeholder="400"
                className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t("Broken Rice Bags (26kg)")}</label>
              <input 
                type="number"
                value={qyBrokenBags || ''}
                onChange={(e) => setQyBrokenBags(Number(e.target.value))}
                placeholder="80"
                className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t("Moisture %")}</label>
              <input 
                type="number"
                step="0.1"
                value={qyMoisture}
                onChange={(e) => setQyMoisture(e.target.value)}
                placeholder="12.5"
                className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t("Cooking Quality")}</label>
              <select 
                value={qyCooking}
                onChange={(e) => setQyCooking(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800"
              >
                <option value="Excellent">{t("Excellent")}</option>
                <option value="Good">{t("Good")}</option>
                <option value="Average">{t("Average")}</option>
                <option value="Needs Improvement">{t("Needs Improvement")}</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t("Stickiness")}</label>
              <select 
                value={qyStickiness}
                onChange={(e) => setQyStickiness(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800"
              >
                <option value="Low">{t("Low")}</option>
                <option value="Medium">{t("Medium")}</option>
                <option value="High">{t("High")}</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t("Elongation / Rice Length")}</label>
              <select 
                value={qyElongation}
                onChange={(e) => setQyElongation(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800"
              >
                <option value="Excellent">{t("Excellent")}</option>
                <option value="Good">{t("Good")}</option>
                <option value="Average">{t("Average")}</option>
                <option value="Poor">{t("Poor")}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t("Customer / Wholesaler Feedback")}</label>
              <input 
                type="text"
                value={qyFeedback}
                onChange={(e) => setQyFeedback(e.target.value)}
                placeholder="e.g., Rice color is perfectly white, swelling is high"
                className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t("Milling General Notes")}</label>
              <input 
                type="text"
                value={qyRemarks}
                onChange={(e) => setQyRemarks(e.target.value)}
                placeholder="e.g., Boiler temperature was stable, parboiling was perfect"
                className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800"
              />
            </div>
          </div>

          {/* Local Calculation Preview box */}
          {qyBatch && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-6 text-sm grid grid-cols-1 sm:grid-cols-3 gap-2 text-emerald-800">
              <div>{t("Head Yield Recovery")}: <b className="text-emerald-700 text-base">{y.headPct.toFixed(2)}%</b></div>
              <div>{t("Broken Recovery")}: <b className="text-emerald-700 text-base">{y.brokenPct.toFixed(2)}%</b></div>
              <div>{t("Total Recovered")}: <b className="text-emerald-700 text-base">{y.totalPct.toFixed(2)}%</b></div>
            </div>
          )}

          <div className="flex gap-2">
            <button 
              onClick={handleSaveQuality}
              className="py-3 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow transition"
            >
              {t("Save Quality Log")}
            </button>
            <button 
              onClick={clearQualityFilters}
              className="py-3 px-6 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 font-semibold text-sm border border-slate-200"
            >
              {t("Reset Form")}
            </button>
          </div>
        </div>

        {/* Quality Registers & Insights list */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
            <div>
              <h3 className="font-sans font-bold text-base text-slate-800">{t("Quality History & Traceability Logs")}</h3>
              <p className="text-xs text-slate-400">{t("View overall average recovery and traces to best parboiling months.")}</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={exportQualityExcel}
                className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
              >
                {t("Export Quality Excel")}
              </button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[11px] text-slate-400 uppercase font-black">{t("Avg Head Recovery")}</span>
              <b className="block text-xl text-slate-700 font-extrabold mt-1">{avgHeadPct.toFixed(2)}%</b>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[11px] text-slate-400 uppercase font-black">{t("Avg Broken Recovery")}</span>
              <b className="block text-xl text-slate-700 font-extrabold mt-1">{avgBrokenPct.toFixed(2)}%</b>
            </div>
            <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
              <span className="text-[11px] text-emerald-800 uppercase font-black">{t("Best Supplier Lot")}</span>
              <b className="block text-sm text-emerald-800 font-black truncate mt-2">{getBestMetric('supplier')}</b>
            </div>
            <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
              <span className="text-[11px] text-emerald-800 uppercase font-black">{t("Best Purchase Month")}</span>
              <b className="block text-sm text-emerald-800 font-black mt-2">{getBestMetric('purchaseMonth')}</b>
            </div>
          </div>

          {/* Table Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-4">
            <input 
              type="text"
              placeholder={t("Search quality / batch / lot / feedback")}
              value={qySearch}
              onChange={(e) => setQySearch(e.target.value)}
              className="p-2 border border-slate-200 rounded-lg text-xs text-slate-800"
            />
            <select 
              value={qyVarietyFilter}
              onChange={(e) => setQyVarietyFilter(e.target.value)}
              className="p-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 text-slate-800"
            >
              <option value="">{t("All Varieties")}</option>
              {varietyList.map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
            <input 
              type="month"
              value={qyMonthFilter}
              onChange={(e) => setQyMonthFilter(e.target.value)}
              className="p-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 text-slate-800"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-slate-600 border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold text-center">
                  <th className="p-3 text-left">{t("Date")}</th>
                  <th className="p-3 text-left">{t("Batch No")}</th>
                  <th className="p-3 text-left">{t("Source Storage")}</th>
                  <th className="p-3 text-left">{t("Variety")}</th>
                  <th className="p-3 text-right">{t("Paddy")}</th>
                  <th className="p-3 text-right">{t("Head Bags")}</th>
                  <th className="p-3 text-right">{t("Broken Bags")}</th>
                  <th className="p-3 text-right">{t("Head %")}</th>
                  <th className="p-3 text-right">{t("Broken %")}</th>
                  <th className="p-3">{t("Moisture")}</th>
                  <th className="p-3 text-left">{t("Feedback/Notes")}</th>
                  <th className="p-3">{t("Action")}</th>
                </tr>
              </thead>
              <tbody>
                {q.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="p-4 text-center text-slate-400 font-medium">{t("No matching quality records logged.")}</td>
                  </tr>
                ) : (
                  q.map((x, idx) => (
                    <tr key={x.id || idx} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="p-3 whitespace-nowrap font-medium">{fmtDate(x.date)}</td>
                      <td className="p-3 font-bold text-slate-800">{x.batchNo}</td>
                      <td className="p-3 truncate max-w-[140px]" title={x.supplier}>{x.supplier}</td>
                      <td className="p-3 font-semibold">{x.variety}</td>
                      <td className="p-3 text-right font-semibold">{x.paddyBags}</td>
                      <td className="p-3 text-right font-black text-slate-700">{x.headBags}</td>
                      <td className="p-3 text-right font-black text-slate-700">{x.brokenBags}</td>
                      <td className="p-3 text-right font-black text-emerald-600">{x.headPct.toFixed(2)}%</td>
                      <td className="p-3 text-right font-bold text-slate-600">{x.brokenPct.toFixed(2)}%</td>
                      <td className="p-3 text-center font-bold">{x.moisture}%</td>
                      <td className="p-3 truncate max-w-[160px]" title={x.remarks || x.feedback}>{x.remarks || x.feedback || '-'}</td>
                      <td className="p-3 text-center">
                        <button 
                          onClick={() => onDeleteDoc('qualityRecords', x.id)}
                          className="text-red-500 font-bold hover:text-red-700"
                        >
                          {t("Delete")}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )}

      {/* ================= FINANCIAL LEDGER DASHBOARD ================= */}
      {(subTab === 'cashflow_dashboard') && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
        <div>
          <h2 className="font-sans font-bold text-lg text-slate-800 mb-1">{t("Financial Cashflow Dashboard")}</h2>
          <p className="text-xs text-slate-500">
            {t("Owner Command View: Tracks live cash flows, processing expenditures, finished stock valuation, and gross profit estimates.")}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">{t("Filter Month")}</label>
            <input 
              type="month"
              value={finMonth}
              onChange={(e) => setFinMonth(e.target.value)}
              className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">{t("Head Selling Rate / 26kg")}</label>
            <input 
              type="number"
              value={finHeadRate}
              onChange={(e) => setFinHeadRate(Number(e.target.value))}
              placeholder="1500"
              className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-emerald-800"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">{t("Broken Selling Rate / 26kg")}</label>
            <input 
              type="number"
              value={finBrokenRate}
              onChange={(e) => setFinBrokenRate(Number(e.target.value))}
              placeholder="1000"
              className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-emerald-800"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">{t("Processing Cost / Paddy Bag")}</label>
            <input 
              type="number"
              value={finProcessCost}
              onChange={(e) => setFinProcessCost(Number(e.target.value))}
              placeholder="60"
              className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-red-800"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={exportFinanceExcel}
            className="py-2.5 px-5 rounded-xl bg-emerald-600 text-white font-bold text-xs"
          >
            {t("Export Financial Ledger")}
          </button>
          <button 
            onClick={() => setFinMonth('')}
            className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 text-xs font-bold border border-slate-200"
          >
            {t("Clear Month")}
          </button>
        </div>

        {/* Financial KPI stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] text-slate-400 uppercase font-black block">{t("Paddy Purchase Value")}</span>
            <b className="block text-lg text-slate-800 font-extrabold mt-1">{money(f.purchaseVal)}</b>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] text-slate-400 uppercase font-black block">{t("Paid to Suppliers")}</span>
            <b className="block text-lg text-slate-800 font-extrabold mt-1">{money(f.paidVal)}</b>
          </div>
          <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-100">
            <span className="text-[10px] text-amber-800 uppercase font-black block">{t("Outstanding Liabilities")}</span>
            <b className="block text-lg text-amber-800 font-extrabold mt-1">{money(f.balanceVal)}</b>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] text-slate-400 uppercase font-black block">{t("Processing Overheads")}</span>
            <b className="block text-lg text-slate-800 font-extrabold mt-1">{money(f.processingVal)}</b>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] text-slate-400 uppercase font-black block">{t("Milled Output Value")}</span>
            <b className="block text-lg text-slate-800 font-extrabold mt-1">{money(f.producedVal)}</b>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] text-slate-400 uppercase font-black block">{t("Available Stock Value")}</span>
            <b className="block text-lg text-slate-800 font-extrabold mt-1">{money(f.stockVal)}</b>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] text-slate-400 uppercase font-black block">{t("Shipped Loaded Value")}</span>
            <b className="block text-lg text-slate-800 font-extrabold mt-1">{money(f.loadedVal)}</b>
          </div>
          <div className={`p-4 rounded-xl border ${f.grossProfitVal >= 0 ? 'bg-emerald-50/50 border-emerald-100' : 'bg-red-50/50 border-red-100'}`}>
            <span className={`text-[10px] uppercase font-black block ${f.grossProfitVal >= 0 ? 'text-emerald-800' : 'text-red-800'}`}>{t("Est. Monthly Gross Profit")}</span>
            <b className={`block text-lg font-black mt-1 ${f.grossProfitVal >= 0 ? 'text-emerald-800' : 'text-red-800'}`}>
              {money(f.grossProfitVal)}
            </b>
          </div>
        </div>

        {/* Supplier Outstanding Ledgers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
          <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50">
            <h3 className="font-sans font-bold text-sm text-slate-800 mb-3">👤 {t("Supplier Outstanding Balance Ledger")}</h3>
            <div className="overflow-y-auto max-h-[300px]">
              <table className="w-full text-xs text-slate-600 border-collapse bg-white rounded-xl">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-500 font-bold text-center">
                    <th className="p-2 text-left">{t("Supplier")}</th>
                    <th className="p-2">{t("Loads")}</th>
                    <th className="p-2 text-right">{t("Purchase Value")}</th>
                    <th className="p-2 text-right">{t("Cash Paid")}</th>
                    <th className="p-2 text-right">{t("Outstanding")}</th>
                  </tr>
                </thead>
                <tbody>
                  {f.suppliersLedger.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-slate-400 font-medium">{t("No supplier balances logged.")}</td>
                    </tr>
                  ) : (
                    f.suppliersLedger.map((x, idx) => (
                      <tr key={idx} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50">
                        <td className="p-2 font-bold text-slate-800">{x.party}</td>
                        <td className="p-2 text-center font-bold">{x.count}</td>
                        <td className="p-2 text-right font-semibold">{money(x.purchase)}</td>
                        <td className="p-2 text-right font-semibold text-emerald-600">{money(x.paid)}</td>
                        <td className="p-2 text-right font-black text-red-600">{money(x.balance)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50">
            <h3 className="font-sans font-bold text-sm text-slate-800 mb-3">{t("Milling Batch Profitability Estimates")}</h3>
            <div className="overflow-y-auto max-h-[300px]">
              <table className="w-full text-xs text-slate-600 border-collapse bg-white rounded-xl">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-500 font-bold text-center">
                    <th className="p-2 text-left">{t("Batch")}</th>
                    <th className="p-2">{t("Variety")}</th>
                    <th className="p-2 text-right">{t("Paddy (Bags)")}</th>
                    <th className="p-2 text-right">{t("Output Value")}</th>
                    <th className="p-2 text-right">{t("Process Overheads")}</th>
                  </tr>
                </thead>
                <tbody>
                  {f.batches.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-slate-400 font-medium">{t("No completed batches in filtered date scope.")}</td>
                    </tr>
                  ) : (
                    f.batches.map((x, idx) => {
                      const outVal = (x.headBags * finHeadRate) + (x.brokenBags * finBrokenRate);
                      const procOverhead = x.paddyBags * finProcessCost;
                      return (
                        <tr key={idx} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50">
                          <td className="p-2 font-bold text-slate-800">{x.batchNo}</td>
                          <td className="p-2 font-semibold">{x.variety}</td>
                          <td className="p-2 text-center font-bold">{x.paddyBags}</td>
                          <td className="p-2 text-right font-bold text-emerald-600">{money(outVal)}</td>
                          <td className="p-2 text-right font-bold text-red-600">{money(procOverhead)}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    )}

      {/* ================= LOADING DISPATCH TRACKER ================= */}
      {(subTab === 'loading_dispatch') && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div>
            <h2 className="font-sans font-bold text-lg text-slate-800 mb-1">{t("Loading Dispatch Tracker")}</h2>
            <p className="text-xs text-slate-500">
              {t("Record customer sales deliveries and godown stock transfer dispatches of processed rice bags.")}
            </p>
          </div>

          {/* Form */}
          <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50 space-y-6">
            <h3 className="font-sans font-bold text-sm text-slate-800">{t("Dispatch / Loading Form")}</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">{t("Date")}</label>
                <input 
                  type="date"
                  value={ldDate}
                  onChange={(e) => setLdDate(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">{t("Movement Type")}</label>
                <select 
                  value={ldType}
                  onChange={(e) => setLdType(e.target.value as any)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800"
                >
                  <option value="Customer Delivery">{t("Customer Delivery (Sale)")}</option>
                  <option value="Godown Transfer">{t("Godown Transfer")}</option>
                </select>
              </div>

              {ldType === 'Customer Delivery' ? (
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1">{t("Customer / Party Name")}</label>
                  <input 
                    type="text"
                    value={ldParty}
                    onChange={(e) => setLdParty(e.target.value)}
                    placeholder="e.g. Balaji Traders"
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800"
                  />
                </div>
              ) : (
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1">{t("To Storage Godown")}</label>
                  <input 
                    type="text"
                    value={ldToGodown}
                    onChange={(e) => setLdToGodown(e.target.value)}
                    placeholder="e.g. Godown B / Chennai Warehouse"
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-semibold"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">{t("Lorry / Vehicle Number")}</label>
                <input 
                  type="text"
                  value={ldLorry}
                  onChange={(e) => setLdLorry(e.target.value)}
                  placeholder="e.g. AP21TU4567"
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">{t("From Storage Source")}</label>
                <input 
                  type="text"
                  value={ldStorage}
                  onChange={(e) => setLdStorage(e.target.value)}
                  placeholder="e.g. Rice Storage 1"
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">{t("Lot No / Batch Ref")}</label>
                <input 
                  type="text"
                  value={ldLot}
                  onChange={(e) => setLdLot(e.target.value)}
                  placeholder="e.g. B-012"
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">{t("Rice Variety")}</label>
                <select 
                  value={ldVariety}
                  onChange={(e) => setLdVariety(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800"
                >
                  {varieties.map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">{t("Product Grade / Packing")}</label>
                <input 
                  type="text"
                  value={ldProduct}
                  onChange={(e) => setLdProduct(e.target.value)}
                  placeholder="e.g. Head Rice 26kg"
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">{t("Bags Count")}</label>
                <input 
                  type="number"
                  value={ldBags || ''}
                  onChange={(e) => setLdBags(Number(e.target.value))}
                  placeholder="e.g. 250"
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-800"
                />
              </div>
            </div>

            <div className="flex">
              <button 
                onClick={handleSaveLoading}
                className="py-2.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow transition"
              >
                {t("Save Dispatch Record")}
              </button>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* List of loading entries */}
          <div>
            <h3 className="font-sans font-bold text-base text-slate-800 mb-3">{t("Historic Loading Dispatches")}</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-slate-600 border-collapse bg-slate-50/50 rounded-xl border border-slate-100">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-500 font-bold text-center">
                    <th className="p-2 text-left">{t("Date")}</th>
                    <th className="p-2 text-left">{t("Type")}</th>
                    <th className="p-2 text-left">{t("Destination / Party")}</th>
                    <th className="p-2 text-left">{t("Lorry No")}</th>
                    <th className="p-2 text-left">{t("Storage Source")}</th>
                    <th className="p-2 text-left">{t("Variety")}</th>
                    <th className="p-2 text-left">{t("Product")}</th>
                    <th className="p-2 text-right">{t("Bags")}</th>
                    <th className="p-2 text-center">{t("Action")}</th>
                  </tr>
                </thead>
                <tbody>
                  {loadings.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-4 text-center text-slate-400 font-medium">{t("No loading dispatches recorded yet.")}</td>
                    </tr>
                  ) : (
                    loadings.map((x) => (
                      <tr key={x.id} className="border-b border-slate-100 last:border-b-0 hover:bg-white bg-white/70">
                        <td className="p-2 font-semibold">{fmtDate(x.date)}</td>
                        <td className="p-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            x.movementType === 'Customer Delivery' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {t(x.movementType)}
                          </span>
                        </td>
                        <td className="p-2 font-bold text-slate-800">{x.party || x.toGodown || '-'}</td>
                        <td className="p-2 font-mono font-medium text-slate-500">{x.lorry || '-'}</td>
                        <td className="p-2 text-slate-500">{x.storage || '-'}</td>
                        <td className="p-2 font-bold text-slate-600">{x.variety}</td>
                        <td className="p-2 text-slate-600">{x.product}</td>
                        <td className="p-2 text-right font-black text-slate-800">{x.bags}</td>
                        <td className="p-2 text-center">
                          <button 
                            onClick={() => onDeleteDoc('loadings', x.id)}
                            className="text-red-500 font-bold hover:text-red-700"
                          >
                            {t("Delete")}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
};
