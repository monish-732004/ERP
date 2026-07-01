import React, { useState } from 'react';
import { 
  PaddyEntry, 
  PaddyPurchase, 
  PaddyMovement, 
  OpeningStock, 
  ProductionBatch, 
  Loading,
  ProductionSourceLine,
  QualityRecord
} from '../types';
import { downloadExcel } from '../utils';
import { useTranslation } from '../context/LanguageContext';
import { 
  Warehouse as WarehouseIcon, 
  AlertTriangle, 
  Info, 
  Calendar, 
  User, 
  DollarSign, 
  Clock, 
  Activity, 
  TrendingUp, 
  CheckCircle,
  X as CloseIcon,
  Filter,
  BarChart3,
  Layers,
  Thermometer,
  Percent
} from 'lucide-react';

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
  qualityRecords: QualityRecord[];
}

// Helper: Stock Health calculations
const getStockHealth = (percent: number) => {
  if (percent <= 0) return { label: 'Out of Stock', color: 'bg-rose-50 text-rose-700 border-rose-200', text: 'text-rose-600', fill: 'bg-rose-500', indicator: '🔴' };
  if (percent < 15) return { label: 'Critical Stock', color: 'bg-red-50 text-red-700 border-red-200', text: 'text-red-600', fill: 'bg-red-500', indicator: '🚨' };
  if (percent < 40) return { label: 'Low Stock', color: 'bg-amber-50 text-amber-700 border-amber-200', text: 'text-amber-600', fill: 'bg-amber-500', indicator: '⚠️' };
  if (percent < 80) return { label: 'Moderate Stock', color: 'bg-yellow-50 text-yellow-700 border-yellow-200', text: 'text-yellow-600', fill: 'bg-yellow-500', indicator: '⚡' };
  return { label: 'Healthy Stock', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', text: 'text-emerald-600', fill: 'bg-emerald-500', indicator: '🟢' };
};

// Dynamic Rice Bag SVG Illustrator
const RiceBag: React.FC<{ percent: number }> = ({ percent }) => {
  const fillHeight = percent; // 0 to 100
  const isZero = percent <= 0;
  
  return (
    <svg viewBox="0 0 100 120" className="w-16 h-20 mx-auto filter drop-shadow-sm hover:scale-105 transition-all duration-300">
      <defs>
        {/* Clip path defining the sack contour based on stock fullness */}
        <clipPath id={`bagClip-${percent}`}>
          {isZero ? (
            // Shriveled bag path
            <path d="M 50,22 C 38,22 36,32 38,70 C 40,92 43,106 50,106 C 57,106 60,92 62,70 C 64,32 62,22 50,22 Z" />
          ) : percent < 40 ? (
            // Thin/Emptying bag path
            <path d="M 50,20 C 36,22 34,42 33,78 C 32,102 38,108 50,108 C 62,108 68,102 67,78 C 66,42 64,22 50,20 Z" />
          ) : percent < 80 ? (
            // Medium plump bag path
            <path d="M 50,18 C 34,20 30,48 29,82 C 28,110 36,112 50,112 C 64,112 72,110 71,82 C 70,48 66,20 50,18 Z" />
          ) : (
            // Bulging plump bag path
            <path d="M 50,16 C 30,18 24,42 23,82 C 22,114 32,115 50,115 C 68,115 78,114 77,82 C 76,42 70,18 50,16 Z" />
          )}
        </clipPath>
        
        {/* Burlap textured appearance */}
        <pattern id="burlapPattern" width="6" height="6" patternUnits="userSpaceOnUse">
          <line x1="0" y1="3" x2="6" y2="3" stroke="#78350F" strokeWidth="0.3" opacity="0.12" />
          <line x1="3" y1="0" x2="3" y2="6" stroke="#78350F" strokeWidth="0.3" opacity="0.12" />
        </pattern>
      </defs>

      {/* Shadows at the base */}
      <ellipse cx="50" cy="112" rx={isZero ? "18" : percent < 40 ? "22" : "28"} ry="3" fill="#000" opacity="0.18" />

      {/* Main Bag Body inside clipping path */}
      <g clipPath={`url(#bagClip-${percent})`}>
        {/* Base burlap color */}
        <rect x="0" y="0" width="100" height="120" fill={isZero ? '#E5E7EB' : '#F5D0A9'} />
        <rect x="0" y="0" width="100" height="120" fill="url(#burlapPattern)" />
        
        {/* Colored overlay representing quantity fill level */}
        {percent > 0 && (
          <rect 
            x="0" 
            y={115 - (fillHeight * 0.95)} 
            width="100" 
            height="120" 
            fill={percent < 40 ? '#D97706' : percent < 80 ? '#F59E0B' : '#10B981'} 
            opacity="0.25" 
            className="transition-all duration-700"
          />
        )}
        
        {/* Dark shading details */}
        <path d="M 10,85 C 30,110 70,110 90,85" stroke="#78350F" strokeWidth="1" fill="none" opacity="0.15" />
        
        {/* Grain Wheat emblem */}
        {percent > 0 && (
          <g transform="translate(50, 64) scale(0.65)" className="opacity-60">
            <path d="M0,-15 C2,-10 5,-5 0,10 C-5,-5 -2,-10 0,-15 Z" fill="#92400E" />
            <path d="M-8,-8 C-4,-6 -2,-2 -5,8 C-8,2 -8,-4 -8,-8 Z" fill="#92400E" />
            <path d="M8,-8 C4,-6 2,-2 5,8 C8,2 8,-4 8,-8 Z" fill="#92400E" />
            <line x1="0" y1="-15" x2="0" y2="20" stroke="#92400E" strokeWidth="2" />
          </g>
        )}
      </g>

      {/* Tied neck folds */}
      <path d="M 50,18 C 45,18 42,11 38,13 C 42,15 46,17 50,19 C 54,17 58,15 62,13 C 58,11 55,18 50,18 Z" fill={isZero ? '#D1D5DB' : '#D2B48C'} stroke="#78350F" strokeWidth="0.8" />
      <circle cx="50" cy="18.5" r="2" fill="#78350F" />

      {/* Warning Overlay for empty bags */}
      {isZero && (
        <g transform="translate(50, 65)">
          <circle cx="0" cy="0" r="10" fill="#EF4444" />
          <path d="M0,-5 L0,2 M0,5 L0,5.5" stroke="#FFF" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      )}
    </svg>
  );
};

// Warehouse Visual/Illustration SVG
const WarehouseIllustration: React.FC<{ occupancy: number; name: string }> = ({ occupancy, name }) => {
  const isFull = occupancy >= 95;
  const isNearFull = occupancy >= 80 && occupancy < 95;
  const isEmpty = occupancy <= 0;
  
  // Color scale
  let color = '#3B82F6'; // blue
  if (isEmpty) color = '#9CA3AF'; // gray
  else if (isFull) color = '#EF4444'; // red
  else if (isNearFull) color = '#F59E0B'; // orange
  else color = '#10B981'; // emerald green

  // Calculate pixel height of stock block inside the window
  const stockHeight = Math.round(32 * (occupancy / 100));

  return (
    <svg viewBox="0 0 120 90" className="w-16 h-14 mx-auto transition-transform hover:scale-105 duration-200">
      {/* Ground platform shadow */}
      <ellipse cx="60" cy="85" rx="52" ry="3.5" fill="#E2E8F0" />
      <line x1="10" y1="84" x2="110" y2="84" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />

      {/* Building walls */}
      <rect x="25" y="32" width="70" height="50" fill="#F8FAFC" stroke="#64748B" strokeWidth="2" rx="1.5" />
      
      {/* Dynamic storage indicator band */}
      <rect x="25" y="32" width="70" height="6" fill={color} opacity="0.8" rx="0.5" />

      {/* Roof */}
      <polygon points="20,32 60,12 100,32" fill="#334155" stroke="#1E293B" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="25,32 60,15 95,32" fill="#475569" />

      {/* Loading bay door (transparent glass frame) */}
      <rect x="42" y="48" width="36" height="34" fill="#F1F5F9" stroke="#94A3B8" strokeWidth="1.2" rx="1" />
      
      {/* Inside inventory visual filled block */}
      {occupancy > 0 && (
        <rect 
          x="44" 
          y={80 - stockHeight} 
          width="32" 
          height={stockHeight} 
          fill={color} 
          opacity="0.75" 
          rx="0.5"
          className="transition-all duration-700"
        />
      )}

      {/* Door shutters grid lines */}
      <line x1="51" y1="48" x2="51" y2="82" stroke="#CBD5E1" strokeWidth="0.8" strokeDasharray="1,1" />
      <line x1="60" y1="48" x2="60" y2="82" stroke="#CBD5E1" strokeWidth="0.8" strokeDasharray="1,1" />
      <line x1="69" y1="48" x2="69" y2="82" stroke="#CBD5E1" strokeWidth="0.8" strokeDasharray="1,1" />

      {/* Round circular vent/ventilation */}
      <circle cx="60" cy="24" r="4.5" fill="#1E293B" />
      <circle cx="60" cy="24" r="3" fill="#E2E8F0" opacity="0.3" />
    </svg>
  );
};

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
  activeTab = 'stock_milling',
  qualityRecords
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
  
  // Custom states for visual stock overview & details modal
  const [selectedStorageFilter, setSelectedStorageFilter] = useState<string | null>(null);
  const [selectedStockCard, setSelectedStockCard] = useState<any | null>(null);

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
      r.inBags += Number(e.bags || e.calcBags || 0);
    });

    openingStocks.forEach(o => {
      const r = ensure(o.storage, o.variety);
      r.openingBags += Number(o.bags || 0);
    });

    paddyMovements.forEach(m => {
      ensure(m.fromStorage, m.variety).transferOutBags += Number(m.bags || 0);
      ensure(m.toStorage, m.variety).transferInBags += Number(m.bags || 0);
    });

    productions.forEach(p => {
      if (p.sourceLines && p.sourceLines.length) {
        p.sourceLines.forEach(sl => {
          ensure(sl.source, sl.variety).usedBags += Number(sl.bags || 0);
        });
      } else {
        ensure(p.source, p.variety).usedBags += Number(p.paddyBags || 0);
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
      {(subTab === 'stock_overview') && (() => {
        // 1. Warehouse Details calculation
        const storagesList = [
          { name: 'SILO 1', capacity: 1500, type: 'Paddy', whNo: 1 },
          { name: 'SILO 2', capacity: 1500, type: 'Paddy', whNo: 2 },
          { name: 'SILO 3', capacity: 1500, type: 'Paddy', whNo: 3 },
          { name: 'Paddy Storage 1', capacity: 2000, type: 'Paddy', whNo: 4 },
          { name: 'Paddy Storage 2', capacity: 2000, type: 'Paddy', whNo: 5 },
          { name: 'GODOWN A1', capacity: 3000, type: 'Paddy', whNo: 6 },
          { name: 'Rice Storage 1', capacity: 1000, type: 'Rice', whNo: 7 },
          { name: 'Rice Storage 2', capacity: 1000, type: 'Rice', whNo: 8 },
          { name: 'Rice Storage 3', capacity: 1000, type: 'Rice', whNo: 9 },
          { name: 'Loading Area', capacity: 500, type: 'Rice', whNo: 10 }
        ];

        const warehouseDetails = storagesList.map(s => {
          let bags = 0;
          if (s.type === 'Paddy') {
            const matches = paddyBalances.filter(pb => pb.storage === s.name);
            bags = matches.reduce((sum, pb) => sum + Math.max(0, pb.balanceBags), 0);
          } else {
            const matches = riceBalances.filter(rb => rb.storage === s.name);
            bags = matches.reduce((sum, rb) => sum + Math.max(0, rb.balanceBags), 0);
          }
          
          const occupancy = Math.min(100, Math.round((bags / s.capacity) * 100));
          const remaining = Math.max(0, s.capacity - Math.round(bags));
          
          let status = 'Available';
          if (occupancy >= 95) status = 'Full';
          else if (occupancy >= 80) status = 'Near Full';
          else if (occupancy === 0) status = 'Empty';
          
          return { ...s, bags: Math.round(bags), occupancy, remaining, status };
        });

        // 2. Unified Stock List for cards
        const allStockCards = [
          ...paddyBalances.map(pb => ({
            id: `paddy-${pb.storage}-${pb.variety}`,
            variety: pb.variety,
            name: `${pb.variety} Paddy`,
            storage: pb.storage,
            bags: Math.max(0, pb.balanceBags),
            capacity: 1500, // base reference for percentages
            isPaddy: true,
            kgPerBag: 78,
            quantityKg: Math.round(Math.max(0, pb.balanceBags) * 78),
            type: 'Raw Paddy'
          })),
          ...riceBalances.map(rb => ({
            id: `rice-${rb.storage}-${rb.variety}-${rb.product}`,
            variety: rb.variety,
            name: rb.product.includes('Head') ? `${rb.variety} Head Rice` : `${rb.variety} Broken Rice`,
            storage: rb.storage,
            bags: Math.max(0, rb.balanceBags),
            capacity: 1000,
            isPaddy: false,
            kgPerBag: 26,
            quantityKg: Math.round(Math.max(0, rb.balanceBags) * 26),
            type: 'Milled Rice'
          }))
        ];

        // Apply filters
        const filteredStockCards = allStockCards.filter(card => {
          const searchVal = stockSearch.toLowerCase().trim();
          const matchesSearch = !searchVal || 
                                card.name.toLowerCase().includes(searchVal) ||
                                card.storage.toLowerCase().includes(searchVal) ||
                                card.variety.toLowerCase().includes(searchVal);
          const matchesVariety = !stockVarietyFilter || card.variety === stockVarietyFilter;
          const matchesStorage = !selectedStorageFilter || card.storage === selectedStorageFilter;
          return matchesSearch && matchesVariety && matchesStorage;
        });

        // Detailed spec lookup for modal
        const detailedCard = selectedStockCard ? (() => {
          const card = selectedStockCard;
          
          // Defaults
          let supplier = 'Local Procurement Pool';
          let purchaseDate = '2026-06-25';
          let rate = card.isPaddy ? 1480 : 1800;
          let marketPrice = card.isPaddy ? 1650 : 2150;
          let moisture = card.isPaddy ? 13.4 : 12.2;
          let quality = card.isPaddy ? 'A Grade Paddy' : 'Premium Standard';
          let processing = card.isPaddy ? 'Pre-sorted Raw' : 'Steam Parboiled Milled';
          let shelfLife = card.isPaddy ? '12 Months' : '24 Months';
          let lastUpdated = '2026-06-28';

          if (card.isPaddy) {
            const matchEntry = [...entries].reverse().find(e => e.variety === card.variety && e.destination === card.storage);
            if (matchEntry) {
              supplier = matchEntry.party;
              purchaseDate = matchEntry.date;
              lastUpdated = matchEntry.date;
              if (matchEntry.rate) rate = matchEntry.rate;
              marketPrice = Math.round(rate * 1.15);
            }
            const matchQr = [...qualityRecords].reverse().find(q => q.variety === card.variety);
            if (matchQr) {
              moisture = matchQr.moisture || 13.2;
              quality = matchQr.remarks.includes('Premium') ? 'Premium Grade' : 'Grade A Quality';
            }
          } else {
            const matchBatch = [...productions].reverse().find(p => p.status === 'Completed' && p.variety === card.variety && p.riceStorage === card.storage);
            if (matchBatch) {
              purchaseDate = matchBatch.completionDate || matchBatch.date;
              lastUpdated = matchBatch.completionDate || matchBatch.date;
              moisture = matchBatch.finalMoisture || 12.0;
              quality = matchBatch.quality || 'Excellent Grade';
              processing = 'Mechanical Parboiled';
              supplier = `SKP Mill In-house (Batch #${matchBatch.batchNo})`;
              rate = 1580; 
              marketPrice = card.name.includes('Broken') ? 1200 : 2250;
            }
          }

          // Dynamic depletion calc
          const daysRemaining = Math.max(3, Math.round(card.bags / 35));
          const depletion = new Date();
          depletion.setDate(depletion.getDate() + daysRemaining);
          const expectedDepletionDate = depletion.toISOString().slice(0, 10);

          const percent = Math.min(100, Math.max(0, Math.round((card.bags / card.capacity) * 100)));
          const health = getStockHealth(percent);
          const whNo = storagesList.find(s => s.name === card.storage)?.whNo || 1;

          return {
            ...card,
            supplier,
            purchaseDate,
            purchasePrice: rate,
            marketPrice,
            moisture,
            quality,
            processing,
            shelfLife,
            lastUpdated,
            expectedDepletionDate,
            percent,
            health,
            whNo
          };
        })() : null;

        return (
          <div className="space-y-6">
            
            {/* 1. Storage Warehouses Representation */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-sans font-bold text-base text-slate-800 flex items-center gap-2">
                    <WarehouseIcon className="w-5 h-5 text-emerald-600" />
                    {t("Warehouse Storage Representation")}
                  </h3>
                  <p className="text-xs text-slate-400">{t("Interactive layouts of Silos & Godowns. Click a warehouse to filter its inventory below.")}</p>
                </div>
                {selectedStorageFilter && (
                  <button 
                    onClick={() => setSelectedStorageFilter(null)}
                    className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[10px] font-bold hover:bg-amber-100 transition"
                  >
                    <Filter className="w-3 h-3" />
                    <span>{t("Filtering by")}: {selectedStorageFilter} ({t("Reset")})</span>
                  </button>
                )}
              </div>

              {/* Warehouse grid layout */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {warehouseDetails.map((w, idx) => {
                  const isSelected = selectedStorageFilter === w.name;
                  
                  // Color codes
                  let statusColor = 'text-blue-600 bg-blue-50 border-blue-200';
                  if (w.status === 'Empty') statusColor = 'text-slate-500 bg-slate-50 border-slate-200';
                  else if (w.status === 'Full') statusColor = 'text-rose-600 bg-rose-50 border-rose-200';
                  else if (w.status === 'Near Full') statusColor = 'text-amber-600 bg-amber-50 border-amber-200';
                  else statusColor = 'text-emerald-600 bg-emerald-50 border-emerald-200';

                  return (
                    <div 
                      key={idx}
                      onClick={() => setSelectedStorageFilter(isSelected ? null : w.name)}
                      className={`cursor-pointer rounded-2xl border p-4 text-center transition-all duration-200 hover:shadow-md relative ${
                        isSelected 
                          ? 'border-emerald-500 bg-emerald-50/20 ring-2 ring-emerald-500/20' 
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      {/* Status indicator tag */}
                      <span className={`absolute top-2.5 right-2.5 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full border ${statusColor}`}>
                        {t(w.status)}
                      </span>

                      {/* SVG Illustration */}
                      <div className="my-2">
                        <WarehouseIllustration occupancy={w.occupancy} name={w.name} />
                      </div>

                      {/* Storage Info */}
                      <h4 className="font-extrabold text-xs text-slate-800 truncate mt-1.5">{w.name}</h4>
                      <p className="text-[10px] text-slate-400 capitalize mb-2">{t(w.type)} Storage</p>

                      <div className="border-t border-slate-100 pt-2 space-y-1 text-[10px]">
                        <div>
                          <span className="text-slate-500">{t("Bags")}: </span>
                          <strong className="text-slate-800 font-extrabold text-xs">{w.bags.toLocaleString('en-IN')}</strong>
                        </div>
                        <div className="flex justify-between items-center text-[9px] text-slate-500 px-1 mt-1">
                          <span>{w.occupancy}% {t("Filled")}</span>
                          <span>Cap: {w.capacity}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. Warehouse Graphical Occupancy Bars */}
            <div className="bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 p-6 shadow-md">
              <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-3">
                <div>
                  <h4 className="font-sans font-bold text-xs uppercase tracking-wider text-slate-400">{t("Warehouse Occupancy Visualization")}</h4>
                  <p className="text-[10px] text-slate-500">{t("Real-time comparative graphical bars representing percentage utilization.")}</p>
                </div>
                <div className="flex gap-4 text-[9px] font-black uppercase text-slate-400">
                  <div className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-500"></span> &lt;80%</div>
                  <div className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-amber-500"></span> 80%-95%</div>
                  <div className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-rose-500"></span> &gt;95%</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                {warehouseDetails.map((w, idx) => {
                  let barColor = 'bg-emerald-500';
                  if (w.occupancy >= 95) barColor = 'bg-rose-500 animate-pulse';
                  else if (w.occupancy >= 80) barColor = 'bg-amber-500';
                  
                  const blockSegments = Math.round(w.occupancy / 10);
                  const emptySegments = 10 - blockSegments;
                  const visualTextBlocks = '█'.repeat(blockSegments) + '░'.repeat(emptySegments);

                  return (
                    <div key={idx} className="flex items-center justify-between text-xs py-1 hover:bg-slate-800/40 px-2 rounded-lg transition">
                      <div className="w-28 font-bold text-slate-300 truncate">{w.name}</div>
                      
                      {/* Graphical Text Segment */}
                      <div className="font-mono text-emerald-500/80 tracking-widest text-[10px] hidden sm:block">
                        {visualTextBlocks}
                      </div>

                      {/* Visual progress bar */}
                      <div className="flex-1 mx-4 flex items-center gap-2">
                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden flex-1 border border-slate-700/50 flex">
                          <div 
                            className={`h-full rounded-full transition-all duration-700 ${barColor}`} 
                            style={{ width: `${w.occupancy}%` }}
                          />
                        </div>
                        <span className="w-8 text-right font-mono font-bold text-[10px] text-slate-400">{w.occupancy}%</span>
                      </div>
                      
                      <div className="w-14 text-right text-[10px] font-semibold text-slate-400 font-mono">
                        {w.bags} / {w.capacity}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. Live Stock Cards Grid */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
              <div className="flex flex-wrap justify-between items-center gap-4 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-sans font-bold text-base text-slate-800 flex items-center gap-1.5">
                    <BarChart3 className="w-5 h-5 text-emerald-600" />
                    {t("Live Visual Stock Cards")}
                  </h3>
                  <p className="text-xs text-slate-400">{t("A graphical inventory of raw paddy and milled rice. Click on any card to view detailed specifications.")}</p>
                </div>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    placeholder={t("Search stock name/silo...")}
                    value={stockSearch}
                    onChange={(e) => setStockSearch(e.target.value)}
                    className="p-2 border border-slate-200 rounded-xl text-xs focus:border-emerald-500 text-slate-800 bg-white"
                  />
                  <select 
                    value={stockVarietyFilter}
                    onChange={(e) => setStockVarietyFilter(e.target.value)}
                    className="p-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 focus:border-emerald-500 text-slate-800 bg-white"
                  >
                    <option value="">{t("All Varieties")}</option>
                    {varieties.map(v => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>

              {filteredStockCards.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 font-semibold text-xs">
                  {t("No stock matching the filters found in this view.")}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {filteredStockCards.map((card) => {
                    const percent = Math.min(100, Math.max(0, Math.round((card.bags / card.capacity) * 100)));
                    const health = getStockHealth(percent);
                    
                    return (
                      <div
                        key={card.id}
                        onClick={() => setSelectedStockCard(card)}
                        className="cursor-pointer bg-white border border-slate-200 rounded-2xl p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-emerald-300/80 flex flex-col justify-between"
                      >
                        {/* Status Label */}
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                            {t(card.type)}
                          </span>
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase border flex items-center gap-1 ${health.color}`}>
                            <span>{health.indicator}</span>
                            <span>{t(health.label)}</span>
                          </span>
                        </div>

                        {/* Visual Image/Illustrator */}
                        <div className="py-4 bg-slate-50/60 rounded-xl border border-slate-100 mb-4 flex items-center justify-center">
                          <RiceBag percent={percent} />
                        </div>

                        {/* Information Section */}
                        <div className="space-y-1">
                          <h4 className="font-extrabold text-sm text-slate-800 hover:text-emerald-700 transition leading-tight">
                            {t(card.name)}
                          </h4>
                          <div className="text-[10px] text-slate-500 font-medium flex items-center gap-1.5">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                            <span>{t("Storage")}: <strong className="text-slate-700">{card.storage}</strong></span>
                          </div>
                        </div>

                        {/* Bold Metric Section */}
                        <div className="border-t border-slate-100 mt-4 pt-3 flex items-end justify-between">
                          <div>
                            <span className="text-[9px] text-slate-400 uppercase font-black tracking-wider block">{t("Quantity")}</span>
                            <span className="text-sm font-black text-slate-800">
                              {card.quantityKg.toLocaleString('en-IN')} <small className="text-[10px] font-semibold text-slate-500">kg</small>
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-[9px] text-slate-400 uppercase font-black tracking-wider block">{t("Bags filled")}</span>
                            <span className="text-lg font-black text-emerald-600 block leading-tight">
                              {Math.round(card.bags).toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 4. Stock Details Specification Modal */}
            {detailedCard && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                <div 
                  className="bg-white rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200"
                  onClick={(e) => e.stopPropagation()}
                >
                  
                  {/* Modal Header */}
                  <div className="bg-slate-900 text-white px-6 py-5 flex justify-between items-center relative">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                        <Info className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-base tracking-tight">{t(detailedCard.name)} {t("Stock Details")}</h3>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">
                          {t("Warehouse Location")} #{detailedCard.whNo} | {detailedCard.storage}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setSelectedStockCard(null)}
                      className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition"
                    >
                      <CloseIcon className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Modal Content Grid */}
                  <div className="p-6 grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6 max-h-[75vh] overflow-y-auto">
                    
                    {/* Left Pane: Image & Highlights */}
                    <div className="text-center space-y-4 border-r border-slate-100 pr-0 md:pr-6">
                      <div className="py-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center">
                        <div className="scale-125 my-2">
                          <RiceBag percent={detailedCard.percent} />
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-black tracking-wider">{t("Stock Health Status")}</div>
                        <span className={`inline-flex mt-1 text-[11px] px-3 py-1 rounded-full font-black uppercase border items-center gap-1.5 ${detailedCard.health.color}`}>
                          <span>{detailedCard.health.indicator}</span>
                          <span>{t(detailedCard.health.label)}</span>
                        </span>
                      </div>
                      
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-1.5 text-left text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-semibold">{t("Filled Ratio")}:</span>
                          <strong className="text-slate-800 font-mono font-bold">{detailedCard.percent}%</strong>
                        </div>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden flex">
                          <div className={`h-full rounded-full ${detailedCard.health.fill}`} style={{ width: `${detailedCard.percent}%` }} />
                        </div>
                      </div>
                    </div>

                    {/* Right Pane: Logical Info Sections */}
                    <div className="space-y-6">
                      
                      {/* Section 1: Core Quantities */}
                      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-[9px] text-slate-400 uppercase font-black tracking-wider block">{t("Total Counted Bags")}</span>
                          <strong className="text-2xl font-black text-emerald-600 block mt-0.5">
                            {detailedCard.bags.toLocaleString('en-IN')} <small className="text-xs text-slate-500 font-medium">{t("bags")}</small>
                          </strong>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 uppercase font-black tracking-wider block">{t("Current Mass Weight")}</span>
                          <strong className="text-2xl font-black text-slate-800 block mt-0.5">
                            {detailedCard.quantityKg.toLocaleString('en-IN')} <small className="text-xs text-slate-500 font-medium">kg</small>
                          </strong>
                        </div>
                      </div>

                      {/* Section 2: Commercial details */}
                      <div className="space-y-2">
                        <h4 className="font-black text-xs text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                          {t("Financial & Supply Profile")}
                        </h4>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div className="p-3 bg-white border border-slate-150 rounded-xl">
                            <span className="text-[10px] text-slate-400 block mb-0.5">{t("Latest Procurement Date")}</span>
                            <span className="font-bold text-slate-700 flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              {fmtDate(detailedCard.purchaseDate)}
                            </span>
                          </div>
                          <div className="p-3 bg-white border border-slate-150 rounded-xl">
                            <span className="text-[10px] text-slate-400 block mb-0.5">{t("Latest Supplier Source")}</span>
                            <span className="font-bold text-slate-700 flex items-center gap-1.5 truncate" title={detailedCard.supplier}>
                              <User className="w-3.5 h-3.5 text-slate-400" />
                              {detailedCard.supplier}
                            </span>
                          </div>
                          <div className="p-3 bg-white border border-slate-150 rounded-xl">
                            <span className="text-[10px] text-slate-400 block mb-0.5">{t("Purchase Rate (per Bag)")}</span>
                            <span className="font-black text-slate-800 text-sm">
                              ₹{Math.round(detailedCard.purchasePrice).toLocaleString('en-IN')}
                            </span>
                          </div>
                          <div className="p-3 bg-white border border-slate-150 rounded-xl">
                            <span className="text-[10px] text-slate-400 block mb-0.5">{t("Est. Market Value (per Bag)")}</span>
                            <span className="font-black text-emerald-600 text-sm flex items-center gap-1">
                              ₹{Math.round(detailedCard.marketPrice).toLocaleString('en-IN')}
                              <TrendingUp className="w-3.5 h-3.5" />
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Section 3: Technical Specs */}
                      <div className="space-y-2">
                        <h4 className="font-black text-xs text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <Activity className="w-3.5 h-3.5 text-emerald-600" />
                          {t("Quality & Material Specifications")}
                        </h4>
                        <div className="grid grid-cols-3 gap-3 text-xs">
                          <div className="p-2.5 bg-white border border-slate-150 rounded-xl text-center">
                            <span className="text-[9px] text-slate-400 block mb-0.5">{t("Moisture Level")}</span>
                            <span className="font-bold text-slate-700 text-sm flex items-center justify-center gap-1">
                              <Thermometer className="w-3.5 h-3.5 text-amber-500" />
                              {detailedCard.moisture}%
                            </span>
                          </div>
                          <div className="p-2.5 bg-white border border-slate-150 rounded-xl text-center">
                            <span className="text-[9px] text-slate-400 block mb-0.5">{t("Quality Grade")}</span>
                            <span className="font-bold text-slate-700 text-xs">
                              {t(detailedCard.quality)}
                            </span>
                          </div>
                          <div className="p-2.5 bg-white border border-slate-150 rounded-xl text-center">
                            <span className="text-[9px] text-slate-400 block mb-0.5">{t("Processing Status")}</span>
                            <span className="font-bold text-slate-700 text-[10px] truncate block" title={detailedCard.processing}>
                              {t(detailedCard.processing)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Section 4: Depletion timeline */}
                      <div className="space-y-2">
                        <h4 className="font-black text-xs text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-emerald-600" />
                          {t("Inventory Lifecycle Timeline")}
                        </h4>
                        <div className="grid grid-cols-3 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <div>
                            <span className="text-[9px] text-slate-400 block mb-0.5">{t("Shelf Life")}</span>
                            <span className="font-semibold text-slate-700 block">{detailedCard.shelfLife}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 block mb-0.5">{t("Last Updated")}</span>
                            <span className="font-semibold text-slate-700 block">{fmtDate(detailedCard.lastUpdated)}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 block mb-0.5">{t("Expected Depletion")}</span>
                            <span className="font-bold text-amber-600 block">{fmtDate(detailedCard.expectedDepletionDate)}</span>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end">
                    <button 
                      onClick={() => setSelectedStockCard(null)}
                      className="py-2 px-5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs transition"
                    >
                      {t("Close Panel")}
                    </button>
                  </div>

                </div>
              </div>
            )}

          </div>
        );
      })()}

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
