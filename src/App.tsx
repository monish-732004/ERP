import React, { useState, useEffect } from 'react';
import { 
  PaddyEntry, 
  PaddyPurchase, 
  PaddyMovement, 
  OpeningStock, 
  ProductionBatch, 
  QualityRecord, 
  Employee, 
  Attendance, 
  Loading 
} from './types';
import { 
  INITIAL_VARIETIES, 
  INITIAL_SUPPLIERS, 
  INITIAL_EMPLOYEES, 
  INITIAL_ENTRIES, 
  INITIAL_PURCHASES, 
  INITIAL_OPENING_STOCKS, 
  INITIAL_MOVEMENTS, 
  INITIAL_PRODUCTIONS, 
  INITIAL_QUALITY_RECORDS, 
  INITIAL_LOADINGS, 
  INITIAL_ATTENDANCE 
} from './mockData';

// Subcomponents
import { Dashboard } from './components/Dashboard';
import { PaddyEntryForm } from './components/PaddyEntryForm';
import { PaddyPurchaseForm } from './components/PaddyPurchaseForm';
import { StockAndProduction } from './components/StockAndProduction';
import { QualityAndFinance } from './components/QualityAndFinance';
import { AttendanceTracker } from './components/AttendanceTracker';
import { VoiceAndInsights } from './components/VoiceAndInsights';
import { LorryPrintModal } from './components/LorryPrintModal';
import { 
  LayoutDashboard, 
  FileSpreadsheet, 
  Receipt, 
  Warehouse, 
  ShieldCheck, 
  Users, 
  Sparkles,
  Menu,
  X,
  Globe
} from 'lucide-react';
import { useTranslation } from './context/LanguageContext';

export default function App() {
  const { language, setLanguage, t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Navigation Tabs state
  type TabType = 'dashboard' | 'paddy_entry' | 'paddy_purchase' | 'stock_milling' | 'quality_finance' | 'labor_wages' | 'ai_insights';
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  // Real-time Clock digital display
  const [currentTime, setCurrentTime] = useState('');
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour12: true }) + ' (UTC)');
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  // Syncing States from LocalStorage / Seed Defaults
  const [entries, setEntries] = useState<PaddyEntry[]>(() => {
    const raw = localStorage.getItem('skp_entries');
    return raw ? JSON.parse(raw) : INITIAL_ENTRIES;
  });

  const [purchases, setPurchases] = useState<PaddyPurchase[]>(() => {
    const raw = localStorage.getItem('skp_purchases');
    return raw ? JSON.parse(raw) : INITIAL_PURCHASES;
  });

  const [paddyMovements, setPaddyMovements] = useState<PaddyMovement[]>(() => {
    const raw = localStorage.getItem('skp_movements');
    return raw ? JSON.parse(raw) : INITIAL_MOVEMENTS;
  });

  const [openingStocks, setOpeningStocks] = useState<OpeningStock[]>(() => {
    const raw = localStorage.getItem('skp_opening_stocks');
    return raw ? JSON.parse(raw) : INITIAL_OPENING_STOCKS;
  });

  const [productions, setProductions] = useState<ProductionBatch[]>(() => {
    const raw = localStorage.getItem('skp_productions');
    return raw ? JSON.parse(raw) : INITIAL_PRODUCTIONS;
  });

  const [qualityRecords, setQualityRecords] = useState<QualityRecord[]>(() => {
    const raw = localStorage.getItem('skp_quality_records');
    return raw ? JSON.parse(raw) : INITIAL_QUALITY_RECORDS;
  });

  const [loadings, setLoadings] = useState<Loading[]>(() => {
    const raw = localStorage.getItem('skp_loadings');
    return raw ? JSON.parse(raw) : INITIAL_LOADINGS;
  });

  const [employees, setEmployees] = useState<Employee[]>(() => {
    const raw = localStorage.getItem('skp_employees');
    return raw ? JSON.parse(raw) : INITIAL_EMPLOYEES;
  });

  const [attendance, setAttendance] = useState<Attendance[]>(() => {
    const raw = localStorage.getItem('skp_attendance');
    return raw ? JSON.parse(raw) : INITIAL_ATTENDANCE;
  });

  // Base list configs
  const [suppliers, setSuppliers] = useState<string[]>(() => {
    const raw = localStorage.getItem('skp_suppliers');
    return raw ? JSON.parse(raw) : INITIAL_SUPPLIERS;
  });

  const [varieties, setVarieties] = useState<string[]>(() => {
    const raw = localStorage.getItem('skp_varieties');
    return raw ? JSON.parse(raw) : INITIAL_VARIETIES;
  });

  const paddyStorages = ['SILO 1', 'SILO 2', 'SILO 3', 'Paddy Storage 1', 'Paddy Storage 2', 'GODOWN A1'];
  const frequentLorries = ['TN15AB1234', 'TN15CD5678', 'TN15XY9012', 'TN15Z9999', 'AP21T3044', 'KA04M1102'];

  // Write-back loops to local storage
  useEffect(() => { localStorage.setItem('skp_entries', JSON.stringify(entries)); }, [entries]);
  useEffect(() => { localStorage.setItem('skp_purchases', JSON.stringify(purchases)); }, [purchases]);
  useEffect(() => { localStorage.setItem('skp_movements', JSON.stringify(paddyMovements)); }, [paddyMovements]);
  useEffect(() => { localStorage.setItem('skp_opening_stocks', JSON.stringify(openingStocks)); }, [openingStocks]);
  useEffect(() => { localStorage.setItem('skp_productions', JSON.stringify(productions)); }, [productions]);
  useEffect(() => { localStorage.setItem('skp_quality_records', JSON.stringify(qualityRecords)); }, [qualityRecords]);
  useEffect(() => { localStorage.setItem('skp_loadings', JSON.stringify(loadings)); }, [loadings]);
  useEffect(() => { localStorage.setItem('skp_employees', JSON.stringify(employees)); }, [employees]);
  useEffect(() => { localStorage.setItem('skp_attendance', JSON.stringify(attendance)); }, [attendance]);
  useEffect(() => { localStorage.setItem('skp_suppliers', JSON.stringify(suppliers)); }, [suppliers]);
  useEffect(() => { localStorage.setItem('skp_varieties', JSON.stringify(varieties)); }, [varieties]);

  // Printable Receipt Modal State
  const [selectedReceiptId, setSelectedReceiptId] = useState('');
  const [printModalOpen, setPrintModalOpen] = useState(false);

  // General Database Document Handlers
  const onAddEntry = async (item: Omit<PaddyEntry, 'id'>) => {
    const newDoc: PaddyEntry = {
      ...item,
      id: `entry_${Date.now()}`
    };
    setEntries(prev => [...prev, newDoc]);
  };

  const onUpdateEntry = async (id: string, update: Partial<PaddyEntry>) => {
    setEntries(prev => prev.map(x => x.id === id ? { ...x, ...update } : x));
  };

  const onUpdateEntryId = async (entryId: string, purchaseId: string) => {
    setEntries(prev => prev.map(x => x.id === entryId ? { ...x, purchaseId } : x));
  };

  const onAddPurchase = async (item: Omit<PaddyPurchase, 'id'>) => {
    const id = `pu_${Date.now()}`;
    const newDoc: PaddyPurchase = {
      ...item,
      id
    };
    setPurchases(prev => [...prev, newDoc]);
    return id;
  };

  const onUpdatePurchase = async (id: string, update: Partial<PaddyPurchase>) => {
    setPurchases(prev => prev.map(x => x.id === id ? { ...x, ...update } : x));
  };

  const onAddMovement = async (item: Omit<PaddyMovement, 'id'>) => {
    const newDoc: PaddyMovement = {
      ...item,
      id: `move_${Date.now()}`
    };
    setPaddyMovements(prev => [...prev, newDoc]);
  };

  const onAddOpeningStock = async (item: Omit<OpeningStock, 'id'>) => {
    const newDoc: OpeningStock = {
      ...item,
      id: `os_${Date.now()}`
    };
    setOpeningStocks(prev => [...prev, newDoc]);
  };

  const onAddProductionBatch = async (item: Omit<ProductionBatch, 'id'>) => {
    const newDoc: ProductionBatch = {
      ...item,
      id: `prod_${Date.now()}`
    };
    setProductions(prev => [...prev, newDoc]);
  };

  const onUpdateProductionBatch = async (id: string, update: Partial<ProductionBatch>) => {
    setProductions(prev => prev.map(x => x.id === id ? { ...x, ...update } : x));
  };

  const onAddQualityRecord = async (item: Omit<QualityRecord, 'id'>) => {
    const newDoc: QualityRecord = {
      ...item,
      id: `qr_${Date.now()}`
    };
    setQualityRecords(prev => [...prev, newDoc]);
  };

  const onAddLoading = async (item: Omit<Loading, 'id'>) => {
    const newDoc: Loading = {
      ...item,
      id: `load_${Date.now()}`
    };
    setLoadings(prev => [...prev, newDoc]);
  };

  const onAddEmployee = async (item: Omit<Employee, 'id'>) => {
    const newDoc: Employee = {
      ...item,
      id: `emp_${Date.now()}`
    };
    setEmployees(prev => [...prev, newDoc]);
  };

  const onUpdateEmployee = async (id: string, update: Partial<Employee>) => {
    setEmployees(prev => prev.map(x => x.id === id ? { ...x, ...update } : x));
  };

  const onSaveAttendance = async (date: string, records: Attendance[]) => {
    // Overwrite existing attendance for this date
    setAttendance(prev => {
      const filtered = prev.filter(x => x.date !== date);
      return [...filtered, ...records];
    });
  };

  const onAddSupplier = async (name: string) => {
    if (!suppliers.includes(name)) {
      setSuppliers(prev => [...prev, name]);
    }
  };

  const onAddVariety = async (name: string) => {
    if (!varieties.includes(name)) {
      setVarieties(prev => [...prev, name]);
    }
  };

  const onDeleteDoc = async (col: string, id: string) => {
    const confirmed = confirm(`Are you sure you want to delete this document from ${col}?`);
    if (!confirmed) return;

    if (col === 'paddyEntries') {
      setEntries(prev => prev.filter(x => x.id !== id));
    } else if (col === 'purchases') {
      const pu = purchases.find(x => x.id === id);
      if (pu) {
        // Unlink connected entries
        const links = [pu.paddyEntryId, pu.paddyEntryId2, pu.paddyEntryId3].filter(Boolean) as string[];
        setEntries(prev => prev.map(x => links.includes(x.id) ? { ...x, purchaseId: '' } : x));
      }
      setPurchases(prev => prev.filter(x => x.id !== id));
    } else if (col === 'paddyMovements') {
      setPaddyMovements(prev => prev.filter(x => x.id !== id));
    } else if (col === 'openingStocks') {
      setOpeningStocks(prev => prev.filter(x => x.id !== id));
    } else if (col === 'productionBatches') {
      setProductions(prev => prev.filter(x => x.id !== id));
    } else if (col === 'qualityRecords') {
      setQualityRecords(prev => prev.filter(x => x.id !== id));
    } else if (col === 'loadings') {
      setLoadings(prev => prev.filter(x => x.id !== id));
    } else if (col === 'employees') {
      setEmployees(prev => prev.filter(x => x.id !== id));
    } else if (col === 'attendance') {
      setAttendance(prev => prev.filter(x => x.id !== id));
    }
  };

  const handleOpenReceipt = (id: string) => {
    setSelectedReceiptId(id);
    setPrintModalOpen(true);
  };

  const handleViewProductionReport = (id: string) => {
    const p = productions.find(x => x.id === id);
    if (!p) return;
    
    // Show quick printable production report
    const w = window.open('', '_blank');
    w?.document.write(`
      <html><head><title>Production Batch Report</title><style>
        body{font-family:Arial;padding:16px;font-size:12px;color:#334155}
        .header{border-bottom:2px solid #0f172a;padding-bottom:12px;margin-bottom:16px}
        table{width:100%;border-collapse:collapse;margin:12px 0}
        th,td{border:1px solid #cbd5e1;padding:8px} th{background:#f1f5f9;font-weight:bold}
        .title{font-size:18px;font-weight:bold;color:#0f172a}
      </style></head><body>
        <div class="header">
          <div class="title">SKP RICE MILLS</div>
          <div>Milling Production Traceability Report | Batch ${p.batchNo}</div>
        </div>
        <p><b>Start Date:</b> ${p.date} &nbsp;&nbsp;|&nbsp;&nbsp; <b>Completion Date:</b> ${p.completionDate || 'In Progress'}</p>
        <p><b>Rice Variety:</b> ${p.variety} &nbsp;&nbsp;|&nbsp;&nbsp; <b>Target Size:</b> ${p.targetBags} Bags</p>
        
        <h3>Paddy Stock Consumption</h3>
        <table>
          <thead>
            <tr><th>Source Bins / Silos</th><th>Bags Allocated</th></tr>
          </thead>
          <tbody>
            ${(p.sourceLines || []).map(l => `<tr><td>${l.source}</td><td style="text-align:right">${l.bags} Bags</td></tr>`).join('')}
            <tr style="font-weight:bold"><td>Total Paddy Input:</td><td style="text-align:right">${p.paddyBags} Bags</td></tr>
          </tbody>
        </table>

        <h3>Parboiled Processing Logs</h3>
        <ul>
          <li><b>Pre-Steam Timing:</b> ${p.preSteam} Minutes</li>
          <li><b>Holding Tank Tempering:</b> ${p.holdingTemper} Minutes</li>
          <li><b>LCU Tank Tempering:</b> ${p.lcuTemper} Hours</li>
          <li><b>Soak Cycle Duration:</b> ${p.soak} Hours</li>
          <li><b>Post-Steam Timing:</b> ${p.postSteam || 0} Minutes</li>
          <li><b>Mechanical Dryer Cycles:</b> ${p.drying || 0} Hours</li>
        </ul>

        <h3>Milled Rice Yield Output</h3>
        <table>
          <thead>
            <tr><th>Product</th><th>Output (Bags 26kg)</th><th>Recovery %</th></tr>
          </thead>
          <tbody>
            <tr><td>Head Rice</td><td style="text-align:right">${p.headBags || 0} Bags</td><td style="text-align:right">${p.paddyBags ? ((p.headBags||0)/p.paddyBags*100).toFixed(1) : 0}%</td></tr>
            <tr><td>Broken Rice</td><td style="text-align:right">${p.brokenBags || 0} Bags</td><td style="text-align:right">${p.paddyBags ? ((p.brokenBags||0)/p.paddyBags*100).toFixed(1) : 0}%</td></tr>
            <tr style="font-weight:bold"><td>Total Output:</td><td style="text-align:right">${p.totalRice || 0} Bags</td><td style="text-align:right">${p.yieldPercent?.toFixed(1) || 0}%</td></tr>
          </tbody>
        </table>
        <p><b>Moisture:</b> ${p.finalMoisture || 0}% &nbsp;&nbsp;|&nbsp;&nbsp; <b>Milled Quality Grade:</b> ${p.quality || '-'}</p>
        <p><b>Milling Remarks:</b> ${p.completionRemarks || p.remarks || ''}</p>
        <script>window.print()</script>
      </body></html>
    `);
    w?.document.close();
  };

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
    }));
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
    }));
  };

  const paddyBalances = getPaddyStockBalances();
  const riceBalances = getRiceStockBalances();
  const paddyStockBags = paddyBalances.reduce((sum, x) => sum + x.balanceBags, 0);
  const riceStockBags = riceBalances.reduce((sum, x) => sum + x.balanceBags, 0);

  const getTabTitle = () => {
    switch (activeTab) {
      case 'dashboard': return t('Overview Dashboard Title');
      case 'paddy_entry': return t('Paddy Entry Register');
      case 'paddy_purchase': return t('Paddy Purchase Bills');
      case 'stock_milling': return t('Milling Batches & Stock Logs');
      case 'quality_finance': return t('Quality Logs & Finance Ledger');
      case 'labor_wages': return t('Labor Wages & Attendance Tracker');
      case 'ai_insights': return t('Executive Insights Desk');
      default: return t('SKP Rice Mill');
    }
  };

  return (
    <div className="h-screen w-full bg-slate-50 flex overflow-hidden font-sans text-slate-800">
      
      {/* Mobile Sidebar Overlay & Slide-out Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Backdrop overlay */}
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setMobileMenuOpen(false)}
          />
          
          {/* Slide-out Panel */}
          <aside className="relative w-72 max-w-[85vw] bg-slate-900 flex flex-col h-full z-10 shadow-2xl animate-in slide-in-from-left duration-200">
            {/* Close Button */}
            <div className="absolute top-4 right-4">
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Mobile Brand Header */}
            <div className="p-6 flex items-center gap-3 border-b border-slate-800/60">
              <div className="w-8 h-8 bg-emerald-600 rounded flex items-center justify-center text-xs font-bold text-white shadow">
                SKP
              </div>
              <div>
                <span className="text-white font-bold text-base tracking-tight block leading-tight">SKP RICE MILL</span>
                <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest block">Enterprise ERP</span>
              </div>
            </div>

            {/* Mobile Navigation Links */}
            <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
              <div className="text-slate-500 text-[10px] font-extrabold uppercase tracking-widest px-2 mb-2">Management</div>
              
              <button 
                onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-md font-bold text-xs uppercase tracking-wider transition-all duration-150 text-left group ${activeTab === 'dashboard' ? 'bg-emerald-500/10 text-emerald-400 border-l-4 border-emerald-500' : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-100'}`}
              >
                <LayoutDashboard className={`w-4 h-4 shrink-0 transition-colors ${activeTab === 'dashboard' ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                <span>{t('Overview Dashboard')}</span>
              </button>
              
              <button 
                onClick={() => { setActiveTab('paddy_entry'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-md font-bold text-xs uppercase tracking-wider transition-all duration-150 text-left group ${activeTab === 'paddy_entry' ? 'bg-emerald-500/10 text-emerald-400 border-l-4 border-emerald-500' : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-100'}`}
              >
                <FileSpreadsheet className={`w-4 h-4 shrink-0 transition-colors ${activeTab === 'paddy_entry' ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                <span>{t('Paddy Entry')}</span>
              </button>
              
              <button 
                onClick={() => { setActiveTab('paddy_purchase'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-md font-bold text-xs uppercase tracking-wider transition-all duration-150 text-left group ${activeTab === 'paddy_purchase' ? 'bg-emerald-500/10 text-emerald-400 border-l-4 border-emerald-500' : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-100'}`}
              >
                <Receipt className={`w-4 h-4 shrink-0 transition-colors ${activeTab === 'paddy_purchase' ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                <span>{t('Paddy Purchase')}</span>
              </button>
              
              <button 
                onClick={() => { setActiveTab('stock_milling'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-md font-bold text-xs uppercase tracking-wider transition-all duration-150 text-left group ${activeTab === 'stock_milling' ? 'bg-emerald-500/10 text-emerald-400 border-l-4 border-emerald-500' : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-100'}`}
              >
                <Warehouse className={`w-4 h-4 shrink-0 transition-colors ${activeTab === 'stock_milling' ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                <span>{t('Milling & Stock')}</span>
              </button>
      
              <div className="text-slate-500 text-[10px] font-extrabold uppercase tracking-widest px-2 mt-6 mb-2">Systems & Analytics</div>
      
              <button 
                onClick={() => { setActiveTab('quality_finance'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-md font-bold text-xs uppercase tracking-wider transition-all duration-150 text-left group ${activeTab === 'quality_finance' ? 'bg-emerald-500/10 text-emerald-400 border-l-4 border-emerald-500' : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-100'}`}
              >
                <ShieldCheck className={`w-4 h-4 shrink-0 transition-colors ${activeTab === 'quality_finance' ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                <span>{t('Quality & Finance')}</span>
              </button>
              
              <button 
                onClick={() => { setActiveTab('labor_wages'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-md font-bold text-xs uppercase tracking-wider transition-all duration-150 text-left group ${activeTab === 'labor_wages' ? 'bg-emerald-500/10 text-emerald-400 border-l-4 border-emerald-500' : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-100'}`}
              >
                <Users className={`w-4 h-4 shrink-0 transition-colors ${activeTab === 'labor_wages' ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                <span>{t('Labor & Wages')}</span>
              </button>
              
              <button 
                onClick={() => { setActiveTab('ai_insights'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-md font-bold text-xs uppercase tracking-wider transition-all duration-150 text-left group ${activeTab === 'ai_insights' ? 'bg-emerald-500/10 text-emerald-400 border-l-4 border-emerald-500' : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-100'}`}
              >
                <Sparkles className={`w-4 h-4 shrink-0 transition-colors ${activeTab === 'ai_insights' ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                <span>{t('Voice & Insights')}</span>
              </button>
            </nav>
     
            {/* Mobile User Status Card */}
            <div className="p-4 mt-auto border-t border-slate-800">
              <div className="flex items-center gap-3 p-2.5 bg-slate-800/40 rounded-lg border border-slate-800/80">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-xs font-bold text-emerald-400">SK</div>
                <div className="overflow-hidden">
                  <p className="text-xs text-white font-medium truncate">{t('SKP Admin')}</p>
                  <p className="text-[10px] text-slate-500">{t('Mill Manager Account')}</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Navigation Sidebar (Professional Polish Theme, Emerald) - Hidden on mobile/tablets */}
      <aside className="w-64 bg-slate-900 flex flex-col shrink-0 hidden lg:flex">
        {/* Brand Header */}
        <div className="p-6 flex items-center gap-3 border-b border-slate-800/50 mb-4">
          <div className="w-8 h-8 bg-emerald-600 rounded flex items-center justify-center text-xs font-bold text-white shadow">
            SKP
          </div>
          <div>
            <span className="text-white font-bold text-base tracking-tight block leading-tight">SKP RICE MILL</span>
            <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest block">Enterprise ERP</span>
          </div>
        </div>
        
        {/* Navigation Sidebar Items */}
        <nav className="flex-1 px-4 space-y-1">
          <div className="text-slate-500 text-[10px] font-extrabold uppercase tracking-widest px-2 mb-2">Management</div>
          
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-md font-bold text-xs uppercase tracking-wider transition-all duration-150 text-left group ${activeTab === 'dashboard' ? 'bg-emerald-500/10 text-emerald-400 border-l-4 border-emerald-500' : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-100'}`}
          >
            <LayoutDashboard className={`w-4 h-4 shrink-0 transition-colors ${activeTab === 'dashboard' ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
            <span>{t('Overview Dashboard')}</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('paddy_entry')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-md font-bold text-xs uppercase tracking-wider transition-all duration-150 text-left group ${activeTab === 'paddy_entry' ? 'bg-emerald-500/10 text-emerald-400 border-l-4 border-emerald-500' : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-100'}`}
          >
            <FileSpreadsheet className={`w-4 h-4 shrink-0 transition-colors ${activeTab === 'paddy_entry' ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
            <span>{t('Paddy Entry')}</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('paddy_purchase')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-md font-bold text-xs uppercase tracking-wider transition-all duration-150 text-left group ${activeTab === 'paddy_purchase' ? 'bg-emerald-500/10 text-emerald-400 border-l-4 border-emerald-500' : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-100'}`}
          >
            <Receipt className={`w-4 h-4 shrink-0 transition-colors ${activeTab === 'paddy_purchase' ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
            <span>{t('Paddy Purchase')}</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('stock_milling')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-md font-bold text-xs uppercase tracking-wider transition-all duration-150 text-left group ${activeTab === 'stock_milling' ? 'bg-emerald-500/10 text-emerald-400 border-l-4 border-emerald-500' : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-100'}`}
          >
            <Warehouse className={`w-4 h-4 shrink-0 transition-colors ${activeTab === 'stock_milling' ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
            <span>{t('Milling & Stock')}</span>
          </button>
  
          <div className="text-slate-500 text-[10px] font-extrabold uppercase tracking-widest px-2 mt-6 mb-2">Systems & Analytics</div>
  
          <button 
            onClick={() => setActiveTab('quality_finance')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-md font-bold text-xs uppercase tracking-wider transition-all duration-150 text-left group ${activeTab === 'quality_finance' ? 'bg-emerald-500/10 text-emerald-400 border-l-4 border-emerald-500' : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-100'}`}
          >
            <ShieldCheck className={`w-4 h-4 shrink-0 transition-colors ${activeTab === 'quality_finance' ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
            <span>{t('Quality & Finance')}</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('labor_wages')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-md font-bold text-xs uppercase tracking-wider transition-all duration-150 text-left group ${activeTab === 'labor_wages' ? 'bg-emerald-500/10 text-emerald-400 border-l-4 border-emerald-500' : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-100'}`}
          >
            <Users className={`w-4 h-4 shrink-0 transition-colors ${activeTab === 'labor_wages' ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
            <span>{t('Labor & Wages')}</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('ai_insights')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-md font-bold text-xs uppercase tracking-wider transition-all duration-150 text-left group ${activeTab === 'ai_insights' ? 'bg-emerald-500/10 text-emerald-400 border-l-4 border-emerald-500' : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-100'}`}
          >
            <Sparkles className={`w-4 h-4 shrink-0 transition-colors ${activeTab === 'ai_insights' ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
            <span>{t('Voice & Insights')}</span>
          </button>
        </nav>
 
        {/* User Status Card */}
        <div className="p-4 mt-auto border-t border-slate-800">
          <div className="flex items-center gap-3 p-2.5 bg-slate-800/40 rounded-lg border border-slate-800/80">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-xs font-bold text-emerald-400">SK</div>
            <div className="overflow-hidden">
              <p className="text-xs text-white font-medium truncate">{t('SKP Admin')}</p>
              <p className="text-[10px] text-slate-500">{t('Mill Manager Account')}</p>
            </div>
          </div>
        </div>
      </aside>
 
      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        
        {/* Header Bar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 shrink-0">
          <div className="flex items-center gap-3">
            {/* Hamburger menu for mobile/tablet */}
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors focus:outline-none"
              aria-label="Toggle menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-sm md:text-lg font-bold text-slate-900 font-sans tracking-tight">{getTabTitle()}</h1>
          </div>
          
          <div className="flex items-center gap-2 md:gap-3">
            {/* Elegant high-contrast Language Toggle */}
            <div className="flex bg-slate-100 rounded-xl p-0.5 border border-slate-200 shadow-2xs">
              <button
                onClick={() => setLanguage('en')}
                className={`px-3 py-1 text-[10px] md:text-xs font-bold rounded-lg transition-all ${language === 'en' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('ta')}
                className={`px-3 py-1 text-[10px] md:text-xs font-bold rounded-lg transition-all ${language === 'ta' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                தமிழ்
              </button>
            </div>

            <div className="bg-slate-100 rounded-xl py-1.5 px-3 border border-slate-200 hidden sm:flex items-center gap-2">
              <span className="font-mono text-[10px] md:text-xs font-black text-slate-600">{currentTime}</span>
            </div>
            
            <div className="text-[9px] md:text-[10px] bg-emerald-900/10 text-emerald-700 font-extrabold tracking-widest px-2.5 md:px-3 py-1.5 rounded-full uppercase border border-emerald-200 hidden sm:inline-block">
              {t('Active Workspace')}
            </div>
          </div>
        </header>

        {/* Main Viewport Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50/50">
          
          {activeTab === 'dashboard' && (
            <Dashboard 
              entries={entries} 
              purchases={purchases} 
              productions={productions} 
              loadings={loadings}
              paddyStockBags={paddyStockBags}
              riceStockBags={riceStockBags}
              paddyBalances={paddyBalances}
              riceBalances={riceBalances}
            />
          )}

          {activeTab === 'paddy_entry' && (
            <PaddyEntryForm 
              entries={entries} 
              varieties={varieties} 
              suppliers={suppliers} 
              paddyStorages={paddyStorages} 
              frequentLorries={frequentLorries} 
              onAddEntry={onAddEntry} 
              onUpdateEntry={onUpdateEntry} 
              onDeleteDoc={onDeleteDoc} 
              onAddSupplier={onAddSupplier} 
            />
          )}

          {activeTab === 'paddy_purchase' && (
            <PaddyPurchaseForm 
              purchases={purchases} 
              entries={entries} 
              varieties={varieties} 
              suppliers={suppliers} 
              onAddPurchase={onAddPurchase} 
              onUpdatePurchase={onUpdatePurchase} 
              onDeleteDoc={onDeleteDoc} 
              onAddVariety={onAddVariety} 
              onAddSupplier={onAddSupplier} 
              onOpenReceipt={handleOpenReceipt} 
              onUpdateEntryId={onUpdateEntryId} 
            />
          )}

          {activeTab === 'stock_milling' && (
            <StockAndProduction 
              entries={entries} 
              purchases={purchases} 
              paddyMovements={paddyMovements} 
              openingStocks={openingStocks} 
              productions={productions} 
              loadings={loadings} 
              varieties={varieties} 
              paddyStorages={paddyStorages} 
              onAddMovement={onAddMovement} 
              onAddOpeningStock={onAddOpeningStock} 
              onAddProductionBatch={onAddProductionBatch} 
              onUpdateProductionBatch={onUpdateProductionBatch} 
              onDeleteDoc={onDeleteDoc} 
              onViewProductionReport={handleViewProductionReport} 
            />
          )}

          {activeTab === 'quality_finance' && (
            <QualityAndFinance 
              purchases={purchases} 
              productions={productions} 
              qualityRecords={qualityRecords} 
              loadings={loadings} 
              varieties={varieties} 
              onAddQualityRecord={onAddQualityRecord} 
              onAddLoading={onAddLoading} 
              onDeleteDoc={onDeleteDoc} 
            />
          )}

          {activeTab === 'labor_wages' && (
            <AttendanceTracker 
              employees={employees} 
              attendance={attendance} 
              onAddEmployee={onAddEmployee} 
              onUpdateEmployee={onUpdateEmployee} 
              onDeleteDoc={onDeleteDoc} 
              onSaveAttendance={onSaveAttendance} 
            />
          )}

          {activeTab === 'ai_insights' && (
            <VoiceAndInsights 
              entries={entries} 
              purchases={purchases} 
              productions={productions} 
              employees={employees} 
              attendance={attendance} 
            />
          )}

        </div>



      </main>

      {/* Lorry Spot Payment Slip Printable Invoice Modal */}
      {printModalOpen && selectedReceiptId && (
        <LorryPrintModal 
          isOpen={printModalOpen} 
          onClose={() => setPrintModalOpen(false)} 
          purchase={purchases.find(p => p.id === selectedReceiptId) as PaddyPurchase} 
        />
      )}

    </div>
  );
}
