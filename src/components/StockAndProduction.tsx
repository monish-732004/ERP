import React, { useState } from 'react';
import { 
  PaddyEntry, 
  PaddyPurchase, 
  PaddyMovement, 
  OpeningStock, 
  ProductionBatch, 
  Loading,
  ProductionSourceLine
} from '../types';
import { downloadExcel } from '../utils';
import { useTranslation } from '../context/LanguageContext';

interface StockAndProductionProps {
  entries: PaddyEntry[];
  purchases: PaddyPurchase[];
  paddyMovements: PaddyMovement[];
  openingStocks: OpeningStock[];
  productions: ProductionBatch[];
  loadings: Loading[];
  varieties: string[];
  paddyStorages: string[];
  onAddMovement: (m: Omit<PaddyMovement, 'id'>) => Promise<void>;
  onAddOpeningStock: (o: Omit<OpeningStock, 'id'>) => Promise<void>;
  onAddProductionBatch: (p: Omit<ProductionBatch, 'id'>) => Promise<void>;
  onUpdateProductionBatch: (id: string, p: Partial<ProductionBatch>) => Promise<void>;
  onDeleteDoc: (col: string, id: string) => Promise<void>;
  onViewProductionReport: (id: string) => void;
  activeTab?: string;
}

export const StockAndProduction: React.FC<StockAndProductionProps> = ({
  entries,
  purchases,
  paddyMovements,
  openingStocks,
  productions,
  loadings,
  varieties,
  paddyStorages,
  onAddMovement,
  onAddOpeningStock,
  onAddProductionBatch,
  onUpdateProductionBatch,
  onDeleteDoc,
  onViewProductionReport,
  activeTab = 'stock_milling'
}) => {
  const { t } = useTranslation();
  const money = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN');
  const today = () => new Date().toISOString().slice(0, 10);
  const fmtDate = (v: string) => {
    if (!v) return '';
    const parts = v.split('-');
    if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
    return v;
  };

  // State Opening Stock
  const [osDate, setOsDate] = useState(today());
  const [osStorage, setOsStorage] = useState('SILO 1');
  const [osVariety, setOsVariety] = useState('RNR');
  const [osBags, setOsBags] = useState('');
  const [osSupplier, setOsSupplier] = useState('');
  const [osRemarks, setOsRemarks] = useState('');

  // State Paddy Transfer
  const [pmDate, setPmDate] = useState(today());
  const [pmFrom, setPmFrom] = useState('');
  const [pmVariety, setPmVariety] = useState('');
  const [pmTo, setPmTo] = useState('SILO 1');
  const [pmBags, setPmBags] = useState('');
  const [pmRemarks, setPmRemarks] = useState('');

  // State Production Start
  const [prodDate, setProdDate] = useState(today());
  const [prodBatch, setProdBatch] = useState('');
  const [prodTargetBags, setProdTargetBags] = useState(600);
  const [prodSourceSelect, setProdSourceSelect] = useState('');
  const [prodVarietySelect, setProdVarietySelect] = useState('');
  const [prodSourceBags, setProdSourceBags] = useState('');
  const [prodPreSteam, setProdPreSteam] = useState('');
  const [prodHoldingTemper, setProdHoldingTemper] = useState('');
  const [prodLCUTemper, setProdLCUTemper] = useState('');
  const [prodSoak, setProdSoak] = useState('');
  const [prodRemarks, setProdRemarks] = useState('');
  const [prodSourceLines, setProdSourceLines] = useState<ProductionSourceLine[]>([]);

  // State Production Completion
  const [prodCompleteSelect, setProdCompleteSelect] = useState('');
  const [prodCompleteDate, setProdCompleteDate] = useState(today());
  const [prodCompleteBatchNo, setProdCompleteBatchNo] = useState('');
  const [prodCompleteHeadBags, setProdCompleteHeadBags] = useState('');
  const [prodCompleteBrokenBags, setProdCompleteBrokenBags] = useState('');
  const [prodCompleteRiceStorage, setProdCompleteRiceStorage] = useState('Rice Storage 1');
  const [prodCompleteMoisture, setProdCompleteMoisture] = useState('');
  const [prodCompleteQuality, setProdCompleteQuality] = useState('Good');
  const [prodCompletePostSteam, setProdCompletePostSteam] = useState('');
  const [prodCompleteDrying, setProdCompleteDrying] = useState('');
  const [prodCompleteRemarks, setProdCompleteRemarks] = useState('');

  // Sub Tab Selector State
  const [subTab, setSubTab] = useState<'stock_overview' | 'opening_stock' | 'transfers' | 'milling_batches'>('stock_overview');

  // Stock lists filters
  const [stockSearch, setStockSearch] = useState('');
  const [stockVarietyFilter, setStockVarietyFilter] = useState('');
  const [prodSearch, setProdSearch] = useState('');

  // Live Paddy Stock Computations
  const getPaddyStockBalances = () => {
    const map: Record<string, { storage: string; variety: string; inBags: number; openingBags: number; transferInBags: number; transferOutBags: number; usedBags: number; balanceBags: number }> = {};
    
    const ensure = (storage: string, variety: string) => {
      const key = `${storage || 'Paddy Storage 1'}||${variety || 'RNR'}`;
      if (!map[key]) {
        map[key] = {
          storage: storage || 'Paddy Storage 1',
          variety: variety || 'RNR',
          inBags: 0,
          openingBags: 0,
          transferInBags: 0,
          transferOutBags: 0,
          usedBags: 0,
          balanceBags: 0
        };
      }
      return map[key];
    };

    entries.forEach(e => {
      const r = ensure(e.destination || 'Paddy Storage 1', e.variety || 'RNR');
      r.inBags += e.bags || e.calcBags || 0;
    });

    openingStocks.forEach(o => {
      const r = ensure(o.storage, o.variety);
      r.openingBags += o.bags || 0;
    });

    paddyMovements.forEach(m => {
      ensure(m.fromStorage, m.variety).transferOutBags += m.bags || 0;
      ensure(m.toStorage, m.variety).transferInBags += m.bags || 0;
    });

    productions.forEach(p => {
      if (p.sourceLines && p.sourceLines.length) {
        p.sourceLines.forEach(sl => {
          ensure(sl.source, sl.variety).usedBags += sl.bags || 0;
        });
      } else {
        ensure(p.source, p.variety).usedBags += p.paddyBags || 0;
      }
    });

    return Object.values(map).map(r => ({
      ...r,
      balanceBags: r.inBags + r.openingBags + r.transferInBags - r.transferOutBags - r.usedBags
    })).sort((a,b) => (a.storage + a.variety).localeCompare(b.storage + b.variety));
  };

  // Live Rice Stock Computations
  const getRiceStockBalances = () => {
    const map: Record<string, { storage: string; variety: string; product: string; producedBags: number; loadedBags: number; balanceBags: number }> = {};
    
    const add = (storage: string, variety: string, product: string, bags: number) => {
      const key = `${storage}||${variety || 'RNR'}||${product}`;
      if (!map[key]) {
        map[key] = { storage, variety: variety || 'RNR', product, producedBags: 0, loadedBags: 0, balanceBags: 0 };
      }
      map[key].producedBags += bags;
    };

    productions.filter(p => p.status === 'Completed').forEach(p => {
      const storage = p.riceStorage || 'Rice Storage 1';
      add(storage, p.variety, 'Head Rice 26kg', p.headBags || 0);
      add(storage, p.variety, 'Broken 26kg', p.brokenBags || 0);
    });

    loadings.forEach(l => {
      const storage = l.storage || 'Rice Storage 1';
      const key = `${storage}||${l.variety || 'RNR'}||${l.product || 'Head Rice 26kg'}`;
      if (!map[key]) {
        map[key] = { storage, variety: l.variety || 'RNR', product: l.product || 'Head Rice 26kg', producedBags: 0, loadedBags: 0, balanceBags: 0 };
      }
      map[key].loadedBags += l.bags || 0;
    });

    return Object.values(map).map(r => ({
      ...r,
      balanceBags: r.producedBags - r.loadedBags
    })).sort((a,b) => (a.storage + a.variety).localeCompare(b.storage + b.variety));
  };

  const paddyBalances = getPaddyStockBalances();
  const riceBalances = getRiceStockBalances();

  // Selected paddy stock availability for movement
  const getSelectedPaddyAvailable = () => {
    const row = paddyBalances.find(r => r.storage === pmFrom && r.variety === pmVariety);
    return row ? row.balanceBags : 0;
  };

  // Filter lists
  const filteredPaddy = paddyBalances.filter(r => {
    const q = stockSearch.toLowerCase().trim();
    return (!stockVarietyFilter || r.variety === stockVarietyFilter) &&
           (!q || r.storage.toLowerCase().includes(q) || r.variety.toLowerCase().includes(q));
  });

  const filteredRice = riceBalances.filter(r => {
    const q = stockSearch.toLowerCase().trim();
    return (!stockVarietyFilter || r.variety === stockVarietyFilter) &&
           (!q || r.storage.toLowerCase().includes(q) || r.variety.toLowerCase().includes(q) || r.product.toLowerCase().includes(q));
  });

  const filteredProd = productions.filter(p => {
    const q = prodSearch.toLowerCase().trim();
    return !q || p.batchNo.toLowerCase().includes(q) || p.status.toLowerCase().includes(q) || p.source.toLowerCase().includes(q) || p.variety.toLowerCase().includes(q);
  });

  // Action: Save Opening Stock
  const handleSaveOpeningStock = async () => {
    const b = Number(osBags);
    if (!osStorage || !b) {
      alert("Please fill Storage/Silo, Variety, and Bags.");
      return;
    }
    await onAddOpeningStock({
      date: osDate,
      storage: osStorage,
      variety: osVariety,
      bags: b,
      supplier: osSupplier,
      remarks: osRemarks
    });
    setOsBags('');
    setOsSupplier('');
    setOsRemarks('');
    alert("Opening stock recorded!");
  };

  // Action: Save Paddy Movement
  const handleSaveMovement = async () => {
    const b = Number(pmBags);
    const av = getSelectedPaddyAvailable();
    if (!pmFrom || !pmTo || !b || !pmVariety) {
      alert("Fill source, target, variety and bags.");
      return;
    }
    if (b > av) {
      alert(`Transfer request exceeds available stock. Available: ${av} Bags.`);
      return;
    }

    await onAddMovement({
      date: pmDate,
      fromStorage: pmFrom,
      toStorage: pmTo,
      variety: pmVariety,
      bags: b,
      remarks: pmRemarks
    });
    setPmBags('');
    setPmRemarks('');
    alert("Stock movement completed!");
  };

  // Action: Add Production Source Line
  const handleAddProdSourceLine = () => {
    const b = Number(prodSourceBags);
    if (!prodSourceSelect || !prodVarietySelect || !b) {
      alert("Select source silo/yard, variety and bags count.");
      return;
    }
    const avRow = paddyBalances.find(r => r.storage === prodSourceSelect && r.variety === prodVarietySelect);
    const available = avRow ? avRow.balanceBags : 0;
    
    const already = prodSourceLines.filter(x => x.source === prodSourceSelect && x.variety === prodVarietySelect).reduce((s,x)=>s+x.bags, 0);
    if (b + already > available) {
      alert(`Bags exceed currently available stock. Available: ${available} Bags.`);
      return;
    }

    const existingIdx = prodSourceLines.findIndex(x => x.source === prodSourceSelect && x.variety === prodVarietySelect);
    if (existingIdx >= 0) {
      const updated = [...prodSourceLines];
      updated[existingIdx].bags += b;
      setProdSourceLines(updated);
    } else {
      setProdSourceLines([...prodSourceLines, { source: prodSourceSelect, variety: prodVarietySelect, bags: b, available }]);
    }
    setProdSourceBags('');
  };

  const handleRemoveSourceLine = (idx: number) => {
    setProdSourceLines(prodSourceLines.filter((_, i) => i !== idx));
  };

  // Start Batch
  const handleStartBatch = async () => {
    const totalBags = prodSourceLines.reduce((s,x)=>s+x.bags, 0);
    if (totalBags === 0) {
      alert("Please add at least one source line.");
      return;
    }
    if (totalBags !== prodTargetBags) {
      alert(`Total selected paddy bags (${totalBags}) must match the target batch size (${prodTargetBags} Bags).`);
      return;
    }

    const bNo = prodBatch.trim() || `PROCESS-${Date.now().toString().slice(-6)}`;
    const sources = [...new Set(prodSourceLines.map(x=>x.source))].join(' + ');
    const vars = [...new Set(prodSourceLines.map(x=>x.variety))].join(' + ');
    const lotSummary = prodSourceLines.map(x=>`${x.source} | ${x.variety} | ${x.bags} Bags`).join(' || ');

    const batchObj: Omit<ProductionBatch, 'id'> = {
      date: prodDate,
      batchNo: bNo,
      status: 'In Process',
      source: sources,
      variety: vars,
      sourceLines: prodSourceLines,
      paddyBags: totalBags,
      targetBags: prodTargetBags,
      headBags: 0,
      brokenBags: 0,
      totalRice: 0,
      ricePerPaddy: 0,
      yieldPercent: 0,
      riceStorage: '',
      finalMoisture: 0,
      quality: '',
      preSteam: Number(prodPreSteam || 0),
      holdingTemper: Number(prodHoldingTemper || 0),
      lcuTemper: Number(prodLCUTemper || 0),
      soak: Number(prodSoak || 0),
      postSteam: 0,
      drying: 0,
      lotSummary,
      remarks: prodRemarks
    };

    await onAddProductionBatch(batchObj);
    // Reset form
    setProdBatch('');
    setProdSourceLines([]);
    setProdPreSteam('');
    setProdHoldingTemper('');
    setProdLCUTemper('');
    setProdSoak('');
    setProdRemarks('');
    alert(`Production Batch ${bNo} started successfully! Paddy stock is now blocked.`);
  };

  // Completion selection trigger
  const handleLoadBatchForCompletion = (id: string) => {
    setProdCompleteSelect(id);
    const p = productions.find(x=>x.id===id);
    if(!p) return;
    setProdCompleteBatchNo(p.batchNo);
    setProdCompleteRiceStorage(p.riceStorage || 'Rice Storage 1');
    setProdCompleteHeadBags(String(p.headBags || ''));
    setProdCompleteBrokenBags(String(p.brokenBags || ''));
    setProdCompleteMoisture(String(p.finalMoisture || ''));
    setProdCompleteQuality(p.quality || 'Good');
    setProdCompletePostSteam(String(p.postSteam || ''));
    setProdCompleteDrying(String(p.drying || ''));
    setProdCompleteRemarks(p.completionRemarks || '');
  };

  // Completion
  const handleCompleteBatch = async () => {
    if (!prodCompleteSelect) {
      alert("Please select an in-process batch.");
      return;
    }
    const p = productions.find(x=>x.id===prodCompleteSelect);
    if (!p) return;

    const head = Number(prodCompleteHeadBags || 0);
    const broken = Number(prodCompleteBrokenBags || 0);
    const total = head + broken;
    const paddy = p.paddyBags;
    
    if (total === 0) {
      alert("Please fill Head/Broken output rice bags.");
      return;
    }

    const yieldPct = paddy ? (total / paddy) * 100 : 0;
    const ricePer = paddy ? total / paddy : 0;

    await onUpdateProductionBatch(p.id, {
      batchNo: prodCompleteBatchNo.trim() || p.batchNo,
      status: 'Completed',
      completionDate: prodCompleteDate,
      headBags: head,
      brokenBags: broken,
      totalRice: total,
      ricePerPaddy: ricePer,
      yieldPercent: yieldPct,
      riceStorage: prodCompleteRiceStorage,
      finalMoisture: Number(prodCompleteMoisture || 0),
      quality: prodCompleteQuality,
      postSteam: Number(prodCompletePostSteam || 0),
      drying: Number(prodCompleteDrying || 0),
      completionRemarks: prodCompleteRemarks
    });

    setProdCompleteSelect('');
    setProdCompleteBatchNo('');
    setProdCompleteHeadBags('');
    setProdCompleteBrokenBags('');
    setProdCompleteMoisture('');
    setProdCompletePostSteam('');
    setProdCompleteDrying('');
    setProdCompleteRemarks('');
    alert("Production batch milling output recorded. Rice stock has been populated!");
  };

  const exportProductionExcel = () => {
    downloadExcel('SKP_Milling_Batches_Log.xls',
      ['Start Date', 'Completion Date', 'Batch No', 'Stage/Status', 'Source Stock', 'Variety', 'Paddy Bags', 'Head Rice Bags', 'Broken Bags', 'Yield %', 'Rice Storage'],
      filteredProd.map(x => [x.date, x.completionDate || '-', x.batchNo, x.status, x.source, x.variety, x.paddyBags, x.headBags || 0, x.brokenBags || 0, Number(x.yieldPercent || 0).toFixed(2) + '%', x.riceStorage || '-'])
    );
  };

  const sourceBagsTotal = prodSourceLines.reduce((s,x)=>s+x.bags,0);

  // Paddy sources options dropdown lists
  const availableSilos = paddyBalances.filter(x=>x.balanceBags > 0.1);
  const activeInProcess = productions.filter(p => p.status === 'In Process');

  return (
    <div className="space-y-6">
      
      {/* Sub Tab Switcher (Professional Polish, No Blue) */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-4">
        {[
          { id: 'stock_overview', label: t('📊 Stock Overview') },
          { id: 'opening_stock', label: t('➕ Record Opening Stock') },
          { id: 'transfers', label: t('🔁 Storage Transfers') },
          { id: 'milling_batches', label: t('⚙️ Production Milling') }
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

      {/* ================= STOCK OVERVIEW ================= */}
      {(subTab === 'stock_overview') && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div>
              <h2 className="font-sans font-bold text-lg text-slate-800">
                {t("Live Paddy & Rice Stock Control")}
              </h2>
              <p className="text-xs text-slate-400">{t("View real-time balances across Silos, Godowns, and processed rice bins.")}</p>
            </div>
            <div className="flex gap-2">
              <input 
                type="text"
                placeholder={t("Search storage...")}
                value={stockSearch}
                onChange={(e) => setStockSearch(e.target.value)}
                className="p-2 border border-slate-200 rounded-xl text-xs focus:border-emerald-500 text-slate-800"
              />
              <select 
                value={stockVarietyFilter}
                onChange={(e) => setStockVarietyFilter(e.target.value)}
                className="p-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 focus:border-emerald-500 text-slate-800"
              >
                <option value="">{t("All Varieties")}</option>
                {varieties.map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Paddy and Rice storage tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50">
              <h3 className="font-sans font-bold text-sm text-slate-800 mb-3">{t("Paddy Stocks by Storage Bins")}</h3>
              <div className="overflow-x-auto max-h-[300px]">
                <table className="w-full text-xs text-slate-600 border-collapse bg-white rounded-xl">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-500 font-bold text-center">
                      <th className="p-2.5 text-left">{t("Storage Place")}</th>
                      <th className="p-2.5 text-left">{t("Variety")}</th>
                      <th className="p-2.5 text-right">{t("Live Stock (Bags)")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPaddy.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="p-4 text-center text-slate-400 font-medium">{t("No paddy stocks found.")}</td>
                      </tr>
                    ) : (
                      filteredPaddy.map((r, i) => (
                        <tr key={i} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50">
                          <td className="p-2.5 font-bold text-slate-800">{r.storage}</td>
                          <td className="p-2.5 font-semibold text-slate-600">{r.variety}</td>
                          <td className="p-2.5 text-right font-black text-emerald-600">{r.balanceBags.toFixed(1)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50">
              <h3 className="font-sans font-bold text-sm text-slate-800 mb-3">{t("Processed Rice Stock balances")}</h3>
              <div className="overflow-x-auto max-h-[300px]">
                <table className="w-full text-xs text-slate-600 border-collapse bg-white rounded-xl">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-500 font-bold text-center">
                      <th className="p-2.5 text-left">{t("Rice Bin / Storage")}</th>
                      <th className="p-2.5 text-left">{t("Variety")}</th>
                      <th className="p-2.5 text-left">{t("Product")}</th>
                      <th className="p-2.5 text-right">{t("Stock (Bags)")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRice.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-slate-400 font-medium">{t("No rice outputs available.")}</td>
                      </tr>
                    ) : (
                      filteredRice.map((r, i) => (
                        <tr key={i} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50">
                          <td className="p-2.5 font-bold text-slate-800">{r.storage}</td>
                          <td className="p-2.5 font-semibold text-slate-600">{r.variety}</td>
                          <td className="p-2.5 font-bold text-slate-500">{r.product}</td>
                          <td className="p-2.5 text-right font-black text-emerald-600">{r.balanceBags.toFixed(1)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= OPENING STOCK ENTRY ================= */}
      {(subTab === 'opening_stock') && (
        <>
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div>
              <h3 className="font-sans font-bold text-base text-slate-800">{t("Record Opening Paddy Balances (Silos / Godowns)")}</h3>
              <p className="text-xs text-slate-400">{t("Initialize stock that was already filled before tracking with this application.")}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">{t("Date")}</label>
                <input 
                  type="date"
                  value={osDate}
                  onChange={(e) => setOsDate(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">{t("Silo / Godown Storage")}</label>
                <input 
                  type="text"
                  list="silos-list"
                  value={osStorage}
                  onChange={(e) => setOsStorage(e.target.value)}
                  placeholder="e.g., SILO 1"
                  className="w-full p-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                />
                <datalist id="silos-list">
                  {paddyStorages.map((s, i) => <option key={i} value={s}></option>)}
                </datalist>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">{t("Paddy Variety")}</label>
                <select 
                  value={osVariety}
                  onChange={(e) => setOsVariety(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                >
                  {varieties.map((v, i) => <option key={i} value={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">{t("Bags Count")}</label>
                <input 
                  type="number"
                  value={osBags}
                  onChange={(e) => setOsBags(e.target.value)}
                  placeholder="1200"
                  className="w-full p-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">{t("Lot Supplier / Ref")}</label>
                <input 
                  type="text"
                  value={osSupplier}
                  onChange={(e) => setOsSupplier(e.target.value)}
                  placeholder="e.g., Opening Lot 1"
                  className="w-full p-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">{t("Remarks / Reason")}</label>
              <input 
                type="text"
                value={osRemarks}
                onChange={(e) => setOsRemarks(e.target.value)}
                placeholder="Paddy filled into SILO 1 last week"
                className="w-full p-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
              />
            </div>

            <div className="flex gap-2">
              <button 
                onClick={handleSaveOpeningStock}
                className="py-2.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow"
              >
                {t("Save Opening Stock")}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ================= PADDY STOCK TRANSFER ================= */}
      {(subTab === 'transfers') && (
        <>
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div>
              <h3 className="font-sans font-bold text-base text-slate-800">🔁 {t("Silo & Yard Stock Transfers")}</h3>
              <p className="text-xs text-slate-400">{t("Move paddy raw lots between yards or feed silos directly.")}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-center">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">{t("Transfer Date")}</label>
                <input 
                  type="date"
                  value={pmDate}
                  onChange={(e) => setPmDate(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">{t("From Storage")}</label>
                <select 
                  value={pmFrom}
                  onChange={(e) => setPmFrom(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-xl text-xs font-semibold font-bold text-slate-600 text-slate-800"
                >
                  <option value="">{t("Select source")}</option>
                  {paddyBalances.filter(r=>r.balanceBags>0).map((r, i) => (
                    <option key={i} value={r.storage}>{r.storage}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">{t("Paddy Variety")}</label>
                <select 
                  value={pmVariety}
                  onChange={(e) => setPmVariety(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-xl text-xs font-semibold font-bold text-slate-600 text-slate-800"
                >
                  <option value="">{t("Select variety")}</option>
                  {varieties.map((v, i) => (
                    <option key={i} value={v}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">{t("Available Bags")}</label>
                <input 
                  type="number"
                  value={getSelectedPaddyAvailable() || 0}
                  readOnly
                  className="w-full p-2 border border-slate-200 rounded-xl text-xs font-semibold bg-slate-50 text-slate-500 text-slate-800"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">{t("To Storage SILO")}</label>
                <input 
                  type="text"
                  list="silos-list"
                  value={pmTo}
                  onChange={(e) => setPmTo(e.target.value)}
                  placeholder="SILO 1"
                  className="w-full p-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">{t("Bags to Move")}</label>
                <input 
                  type="number"
                  value={pmBags}
                  onChange={(e) => setPmBags(e.target.value)}
                  placeholder="e.g., 600"
                  className="w-full p-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">{t("Transfer Remarks")}</label>
              <input 
                type="text"
                value={pmRemarks}
                onChange={(e) => setPmRemarks(e.target.value)}
                placeholder="Optional movement notes"
                className="w-full p-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
              />
            </div>

            <div className="flex gap-2">
              <button 
                onClick={handleSaveMovement}
                className="py-2.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow transition"
              >
                {t("Save Stock Movement")}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ================= PRODUCTION BATCH MILLING ================= */}
      {(subTab === 'milling_batches') && (
        <>
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div>
            <h2 className="font-sans font-bold text-lg text-slate-800 mb-1">{t("Production Batch Controller")}</h2>
          <p className="text-xs text-slate-500">
            {t("Combine multiple grain lots to fulfill the 600 paddy bags parboiled requirement, and transition them into head & broken rice products.")}
          </p>
        </div>

        {/* 1. Production Start Form */}
        <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50 space-y-6">
          <h3 className="font-sans font-bold text-sm text-slate-800">{t("Start New Batch (Deduct Paddy Stock)")}</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">{t("Milling Start Date")}</label>
              <input 
                type="date"
                value={prodDate}
                onChange={(e) => setProdDate(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">{t("Batch ID / Process No")}</label>
              <input 
                type="text"
                value={prodBatch}
                onChange={(e) => setProdBatch(e.target.value)}
                placeholder="BATCH-1001"
                className="w-full p-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">{t("Target Batch size (Bags)")}</label>
              <input 
                type="number"
                value={prodTargetBags}
                onChange={(e) => setProdTargetBags(Number(e.target.value))}
                className="w-full p-2 border border-slate-200 rounded-xl text-xs font-black text-slate-700 text-slate-800"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">{t("Presteam Timing (Min)")}</label>
              <input 
                type="number"
                value={prodPreSteam}
                onChange={(e) => setProdPreSteam(e.target.value)}
                placeholder="5"
                className="w-full p-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">{t("Holding Tank Tempering (Min)")}</label>
              <input 
                type="number"
                value={prodHoldingTemper}
                onChange={(e) => setProdHoldingTemper(e.target.value)}
                placeholder="25"
                className="w-full p-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">{t("LCU Tank Tempering (Hours)")}</label>
              <input 
                type="number"
                value={prodLCUTemper}
                onChange={(e) => setProdLCUTemper(e.target.value)}
                placeholder="4"
                className="w-full p-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">{t("Water Soaking (Hours)")}</label>
              <input 
                type="number"
                value={prodSoak}
                onChange={(e) => setProdSoak(e.target.value)}
                placeholder="6"
                className="w-full p-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
              />
            </div>
          </div>

          {/* Core source selectors */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-4">
            <h4 className="font-bold text-xs text-slate-500 uppercase">{t("Combine Paddy Stocks for Batch")}</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
              <div>
                <label className="text-xs font-bold text-slate-400">{t("Select Silo/Godown")}</label>
                <select 
                  value={prodSourceSelect}
                  onChange={(e) => setProdSourceSelect(e.target.value)}
                  className="w-full p-1.5 border border-slate-200 rounded-lg text-xs text-slate-800"
                >
                  <option value="">{t("Select storage")}</option>
                  {[...new Set(paddyBalances.filter(x=>x.balanceBags>0).map(x=>x.storage))].map(s=>(
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400">{t("Paddy Variety")}</label>
                <select 
                  value={prodVarietySelect}
                  onChange={(e) => setProdVarietySelect(e.target.value)}
                  className="w-full p-1.5 border border-slate-200 rounded-lg text-xs text-slate-800"
                >
                  <option value="">{t("Select variety")}</option>
                  {varieties.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400">{t("Available Stock (Bags)")}</label>
                <input 
                  type="number"
                  value={paddyBalances.find(r=>r.storage===prodSourceSelect && r.variety===prodVarietySelect)?.balanceBags.toFixed(1) || 0}
                  readOnly
                  className="w-full p-1.5 border border-slate-200 bg-slate-50 rounded-lg text-xs text-slate-500 text-slate-800"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400">{t("Add bags from source")}</label>
                <input 
                  type="number"
                  value={prodSourceBags}
                  onChange={(e) => setProdSourceBags(e.target.value)}
                  placeholder="e.g., 200"
                  className="w-full p-1.5 border border-slate-200 rounded-lg text-xs text-slate-800"
                />
              </div>
              <button 
                onClick={handleAddProdSourceLine}
                className="py-2 px-4 rounded-xl bg-slate-800 text-white font-bold text-xs hover:bg-slate-900 shadow"
              >
                {t("+ Add Source Line")}
              </button>
            </div>

            {/* List selected sources */}
            {prodSourceLines.length > 0 && (
              <div className="overflow-x-auto border border-slate-100 rounded-xl">
                <table className="w-full text-xs text-slate-600 border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 font-bold text-slate-500 text-center">
                      <th className="p-2 text-left">{t("Paddy Bin")}</th>
                      <th className="p-2 text-left">{t("Variety")}</th>
                      <th className="p-2 text-right">{t("Bags Added")}</th>
                      <th className="p-2">{t("Action")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prodSourceLines.map((line, idx) => (
                      <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50">
                        <td className="p-2 font-bold text-slate-800">{line.source}</td>
                        <td className="p-2 font-semibold">{line.variety}</td>
                        <td className="p-2 text-right font-black text-emerald-600">{line.bags}</td>
                        <td className="p-2 text-center">
                          <button onClick={() => handleRemoveSourceLine(idx)} className="text-red-500 font-bold hover:text-red-700">
                            {t("Remove")}
                          </button>
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-emerald-50/50 font-bold">
                      <td colSpan={2} className="p-2 text-right">{t("Total Selected Paddy:")}</td>
                      <td className="p-2 text-right text-emerald-700 font-black">{sourceBagsTotal} {t("Bags")}</td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">{t("Start Milling Remarks")}</label>
            <input 
              type="text"
              value={prodRemarks}
              onChange={(e) => setProdRemarks(e.target.value)}
              placeholder="Parboiling yard steam logs"
              className="w-full p-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
            />
          </div>

          <div className="flex gap-2">
            <button 
              onClick={handleStartBatch}
              className="py-2.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow transition"
            >
              {t("Start Production Batch")}
            </button>
          </div>
        </div>

        {/* 2. Production Completion Form */}
        <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50 space-y-6">
          <h3 className="font-sans font-bold text-sm text-slate-800">{t("2️⃣ Complete Milling Output (Yield & Rice Bags Creation)")}</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">{t("Select In-Process Batch")}</label>
              <select 
                value={prodCompleteSelect}
                onChange={(e) => handleLoadBatchForCompletion(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 text-slate-800"
              >
                <option value="">{t("Select batch")}</option>
                {activeInProcess.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.date} | {p.batchNo} | {p.variety} | {p.paddyBags} bags
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">{t("Completion Date")}</label>
              <input 
                type="date"
                value={prodCompleteDate}
                onChange={(e) => setProdCompleteDate(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">{t("Milled Batch No")}</label>
              <input 
                type="text"
                value={prodCompleteBatchNo}
                onChange={(e) => setProdCompleteBatchNo(e.target.value)}
                placeholder="Final batch label"
                className="w-full p-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">{t("Rice storage placement")}</label>
              <input 
                type="text"
                list="rice-storage-options"
                value={prodCompleteRiceStorage}
                onChange={(e) => setProdCompleteRiceStorage(e.target.value)}
                placeholder="Rice Storage 1"
                className="w-full p-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
              />
              <datalist id="rice-storage-options">
                <option value="Rice Storage 1"></option>
                <option value="Rice Storage 2"></option>
                <option value="Rice Storage 3"></option>
                <option value="Loading Area"></option>
              </datalist>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">{t("Head Rice Output (Bags 26kg)")}</label>
              <input 
                type="number"
                value={prodCompleteHeadBags}
                onChange={(e) => setProdCompleteHeadBags(e.target.value)}
                placeholder="400"
                className="w-full p-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">{t("Broken Rice Output (Bags 26kg)")}</label>
              <input 
                type="number"
                value={prodCompleteBrokenBags}
                onChange={(e) => setProdCompleteBrokenBags(e.target.value)}
                placeholder="80"
                className="w-full p-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">{t("Final Moisture %")}</label>
              <input 
                type="number"
                step="0.1"
                value={prodCompleteMoisture}
                onChange={(e) => setProdCompleteMoisture(e.target.value)}
                placeholder="12.5"
                className="w-full p-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">{t("Milled Grade Quality")}</label>
              <select 
                value={prodCompleteQuality}
                onChange={(e) => setProdCompleteQuality(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
              >
                <option value="Good">{t("Good")}</option>
                <option value="Excellent">{t("Excellent")}</option>
                <option value="Average">{t("Average")}</option>
                <option value="Needs Check">{t("Needs Check")}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">{t("Poststeaming Timing (Min)")}</label>
              <input 
                type="number"
                value={prodCompletePostSteam}
                onChange={(e) => setProdCompletePostSteam(e.target.value)}
                placeholder="3"
                className="w-full p-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">{t("Mechanical Drying Cycle (Hours)")}</label>
              <input 
                type="number"
                value={prodCompleteDrying}
                onChange={(e) => setProdCompleteDrying(e.target.value)}
                placeholder="8"
                className="w-full p-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">{t("Output Milling Remarks")}</label>
            <input 
              type="text"
              value={prodCompleteRemarks}
              onChange={(e) => setProdCompleteRemarks(e.target.value)}
              placeholder="Excellent yield recovery notes"
              className="w-full p-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
            />
          </div>

          <div className="flex gap-2">
            <button 
              onClick={handleCompleteBatch}
              className="py-2.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow"
            >
              {t("Complete Batch & Create Rice Stock")}
            </button>
          </div>
        </div>
      </div>

      {/* ================= REGISTER ================= */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <div>
            <h3 className="font-sans font-bold text-base text-slate-800">{t("Historical Milling Batches Log")}</h3>
            <p className="text-xs text-slate-400">{t("Ledger of processed batches showing yields, parboiled parameters, and and traceability logs.")}</p>
          </div>
          <div className="flex gap-2">
            <input 
              type="text"
              placeholder={t("Search batch/variety...")}
              value={prodSearch}
              onChange={(e) => setProdSearch(e.target.value)}
              className="p-2 border border-slate-200 rounded-xl text-xs text-slate-800"
            />
            <button 
              onClick={exportProductionExcel}
              className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs"
            >
              {t("Export Excel")}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-slate-600 border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold text-center">
                <th className="p-2.5">{t("S.No")}</th>
                <th className="p-2.5 text-left">{t("Start Date")}</th>
                <th className="p-2.5 text-left">{t("End Date")}</th>
                <th className="p-2.5 text-left">{t("Batch No")}</th>
                <th className="p-2.5">{t("Stage")}</th>
                <th className="p-2.5 text-left">{t("Source Stock")}</th>
                <th className="p-2.5 text-left">{t("Variety")}</th>
                <th className="p-2.5 text-right">{t("Paddy Bags")}</th>
                <th className="p-2.5 text-right">{t("Head Rice")}</th>
                <th className="p-2.5 text-right">{t("Broken")}</th>
                <th className="p-2.5 text-right">{t("Yield %")}</th>
                <th className="p-2.5">{t("Rice Storage")}</th>
                <th className="p-2.5">{t("Action")}</th>
              </tr>
            </thead>
            <tbody>
              {filteredProd.length === 0 ? (
                <tr>
                  <td colSpan={13} className="p-4 text-center text-slate-400 font-medium">{t("No production batches found.")}</td>
                </tr>
              ) : (
                filteredProd.map((x, idx) => (
                  <tr key={x.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="p-2.5 text-center font-bold text-slate-400">{idx + 1}</td>
                    <td className="p-2.5 font-semibold whitespace-nowrap">{fmtDate(x.date)}</td>
                    <td className="p-2.5 font-semibold whitespace-nowrap">{x.completionDate ? fmtDate(x.completionDate) : '-'}</td>
                    <td className="p-2.5 font-bold text-slate-800">{x.batchNo}</td>
                    <td className="p-2.5 text-center font-bold">
                      <span className={`py-0.5 px-2 rounded-full text-[10px] ${x.status === 'Completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                        {t(x.status)}
                      </span>
                    </td>
                    <td className="p-2.5 truncate max-w-[120px]" title={x.lotSummary}>{x.source}</td>
                    <td className="p-2.5 font-semibold">{x.variety}</td>
                    <td className="p-2.5 text-right font-bold text-slate-700">{x.paddyBags}</td>
                    <td className="p-2.5 text-right font-black text-slate-700">{x.headBags || 0}</td>
                    <td className="p-2.5 text-right font-black text-slate-700">{x.brokenBags || 0}</td>
                    <td className="p-2.5 text-right font-black text-emerald-600">{Number(x.yieldPercent || 0).toFixed(2)}%</td>
                    <td className="p-2.5 text-center font-semibold">{x.riceStorage || '-'}</td>
                    <td className="p-2.5 text-center space-x-1.5 whitespace-nowrap">
                      {x.status === 'In Process' && (
                        <button 
                          onClick={() => handleLoadBatchForCompletion(x.id)}
                          className="text-emerald-600 font-bold hover:text-emerald-800"
                        >
                          {t("Complete")}
                        </button>
                      )}
                      <button 
                        onClick={() => onViewProductionReport(x.id)}
                        className="text-emerald-600 font-bold hover:text-emerald-800"
                      >
                        {t("PDF")}
                      </button>
                      <button 
                        onClick={() => onDeleteDoc('productionBatches', x.id)}
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
    </>
    )}
      
    </div>
  );
};
