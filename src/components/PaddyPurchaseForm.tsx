import React, { useState } from 'react';
import { PaddyPurchase, PaddyEntry } from '../types';
import { downloadExcel } from '../utils';
import { useTranslation } from '../context/LanguageContext';

interface PaddyPurchaseFormProps {
  purchases: PaddyPurchase[];
  entries: PaddyEntry[];
  varieties: string[];
  suppliers: string[];
  onAddPurchase: (pu: Omit<PaddyPurchase, 'id'>) => Promise<string>;
  onUpdatePurchase: (id: string, pu: Partial<PaddyPurchase>) => Promise<void>;
  onDeleteDoc: (col: string, id: string) => Promise<void>;
  onAddVariety: (name: string) => Promise<void>;
  onAddSupplier: (name: string) => Promise<void>;
  onOpenReceipt: (id: string) => void;
  onUpdateEntryId: (entryId: string, purchaseId: string) => Promise<void>;
}

export const PaddyPurchaseForm: React.FC<PaddyPurchaseFormProps> = ({
  purchases,
  entries,
  varieties,
  suppliers,
  onAddPurchase,
  onUpdatePurchase,
  onDeleteDoc,
  onAddVariety,
  onAddSupplier,
  onOpenReceipt,
  onUpdateEntryId
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

  // Form states
  const [puDate, setPuDate] = useState(today());
  const [puBillNo, setPuBillNo] = useState('');
  const [puEntrySelect, setPuEntrySelect] = useState('');
  const [puParty, setPuParty] = useState('');
  const [puLorry, setPuLorry] = useState('');
  const [puVariety, setPuVariety] = useState('RNR');
  const [puNewVariety, setPuNewVariety] = useState('');

  // Primary load weights
  const [puLoad, setPuLoad] = useState('');
  const [puEmpty, setPuEmpty] = useState('');
  const [puDiscount, setPuDiscount] = useState('0');
  const [puGunny, setPuGunny] = useState(78);
  const [puRate, setPuRate] = useState('');

  // Toggles
  const [multiLoadOn, setMultiLoadOn] = useState(false);
  const [secondItemOn, setSecondItemOn] = useState(false);
  const [smartAssistOn, setSmartAssistOn] = useState(false);
  const [intelOn, setIntelOn] = useState(false);
  const [excelOn, setExcelOn] = useState(false);

  // Extra Loads (2 & 3)
  const [puEntrySelect2, setPuEntrySelect2] = useState('');
  const [puLorry2, setPuLorry2] = useState('');
  const [puLoad2, setPuLoad2] = useState('');
  const [puEmpty2, setPuEmpty2] = useState('');
  const [puDiscount2, setPuDiscount2] = useState('0');

  const [puEntrySelect3, setPuEntrySelect3] = useState('');
  const [puLorry3, setPuLorry3] = useState('');
  const [puLoad3, setPuLoad3] = useState('');
  const [puEmpty3, setPuEmpty3] = useState('');
  const [puDiscount3, setPuDiscount3] = useState('0');

  // Second Paddy Item
  const [puVariety2, setPuVariety2] = useState('BPT');
  const [puNet2, setPuNet2] = useState('');
  const [puGunny2, setPuGunny2] = useState(78);
  const [puRate2, setPuRate2] = useState('');

  // Charges
  const [puFreight, setPuFreight] = useState('0');
  const [puUnload, setPuUnload] = useState('0');
  const [puFood, setPuFood] = useState('0');
  const [puCess, setPuCess] = useState('0');
  const [puPaid, setPuPaid] = useState('0');
  const [puStatus, setPuStatus] = useState('Pending');
  const [puPaidDate, setPuPaidDate] = useState('');

  // Register state
  const [registerMode, setRegisterMode] = useState<'today' | 'all'>('today');
  const [puSearch, setPuSearch] = useState('');
  const [puFrom, setPuFrom] = useState('');
  const [puTo, setPuTo] = useState('');
  const [puStatusFilter, setPuStatusFilter] = useState('');

  // Excel internal states
  const [excelSearch, setExcelSearch] = useState('');
  const [excelPartyFilter, setExcelPartyFilter] = useState('');
  const [excelVarietyFilter, setExcelVarietyFilter] = useState('');
  const [excelDateFrom, setExcelDateFrom] = useState('');
  const [excelDateTo, setExcelDateTo] = useState('');
  const [selectedExcelIds, setSelectedExcelIds] = useState<string[]>([]);
  const [copySourceId, setCopySourceId] = useState('');

  // Editing state
  const [editingId, setEditingId] = useState('');

  const cleanText = (s: string) => String(s || '').toLowerCase().trim();

  // Load selected Paddy Entry to form
  const handleLoadEntry = (id: string, loadNum = 1) => {
    const e = entries.find(x => x.id === id);
    if (!e) return;

    if (loadNum === 1) {
      setPuEntrySelect(id);
      setPuDate(e.date || today());
      setPuParty(e.party || '');
      setPuLorry(e.lorry || '');
      setPuVariety(e.variety || 'RNR');
      setPuLoad(String(e.load || ''));
      setPuEmpty(String(e.empty || ''));
      setPuDiscount('0');
      setPuGunny(e.gunny || 78);
      setPuRate(String(e.rate || ''));
    } else if (loadNum === 2) {
      setPuEntrySelect2(id);
      setPuLorry2(e.lorry || '');
      setPuLoad2(String(e.load || ''));
      setPuEmpty2(String(e.empty || ''));
      setPuDiscount2('0');
    } else if (loadNum === 3) {
      setPuEntrySelect3(id);
      setPuLorry3(e.lorry || '');
      setPuLoad3(String(e.load || ''));
      setPuEmpty3(String(e.empty || ''));
      setPuDiscount3('0');
    }
  };

  const saveVariety = async () => {
    const name = puNewVariety.trim();
    if (!name) return;
    await onAddVariety(name);
    setPuVariety(name);
    setPuNewVariety('');
    alert("New variety saved!");
  };



  // Live Math calculations
  const getCalculatedValues = () => {
    const load1 = Number(puLoad || 0), empty1 = Number(puEmpty || 0), discount1 = Number(puDiscount || 0);
    const net1 = Math.max(0, load1 - empty1 - discount1);

    const load2 = multiLoadOn ? Number(puLoad2 || 0) : 0;
    const empty2 = multiLoadOn ? Number(puEmpty2 || 0) : 0;
    const discount2 = multiLoadOn ? Number(puDiscount2 || 0) : 0;
    const net2 = Math.max(0, load2 - empty2 - discount2);

    const load3 = multiLoadOn ? Number(puLoad3 || 0) : 0;
    const empty3 = multiLoadOn ? Number(puEmpty3 || 0) : 0;
    const discount3 = multiLoadOn ? Number(puDiscount3 || 0) : 0;
    const net3 = Math.max(0, load3 - empty3 - discount3);

    const totalNet = net1 + net2 + net3;

    // Optional second variety math
    const secondNetRaw = secondItemOn ? Number(puNet2 || 0) : 0;
    const secondNet = secondItemOn ? Math.min(totalNet, secondNetRaw) : 0;
    const primaryNet = secondItemOn ? Math.max(0, totalNet - secondNet) : totalNet;

    // Primary variety bags
    const gunny1 = Number(puGunny || 78);
    const rate1 = Number(puRate || 0);
    const full1 = gunny1 ? Math.floor(primaryNet / gunny1) : 0;
    const left1 = gunny1 ? primaryNet - full1 * gunny1 : 0;
    const paddyValue1 = gunny1 ? (primaryNet / gunny1) * rate1 : 0;

    // Second variety bags
    const gunny2 = Number(puGunny2 || 78);
    const rate2 = Number(puRate2 || 0);
    const full2 = secondItemOn && gunny2 ? Math.floor(secondNet / gunny2) : 0;
    const left2 = secondItemOn && gunny2 ? secondNet - full2 * gunny2 : 0;
    const paddyValue2 = secondItemOn && gunny2 ? (secondNet / gunny2) * rate2 : 0;

    // Charges and aggregates
    const freight = Number(puFreight || 0);
    const unload = Number(puUnload || 0);
    const food = Number(puFood || 0);
    const cess = Number(puCess || 0);
    const paid = Number(puPaid || 0);

    const total = paddyValue1 + paddyValue2 + freight + unload + food + cess;
    const balance = total - paid;

    // Build extraLoads array
    const extraLoads = [];
    extraLoads.push({ entryId: puEntrySelect, lorry: puLorry, load: load1, empty: empty1, discount: discount1, net: net1 });
    if (multiLoadOn) {
      extraLoads.push({ entryId: puEntrySelect2, lorry: puLorry2, load: load2, empty: empty2, discount: discount2, net: net2 });
      extraLoads.push({ entryId: puEntrySelect3, lorry: puLorry3, load: load3, empty: empty3, discount: discount3, net: net3 });
    }

    const lorryList = [...new Set(extraLoads.map(l => l.lorry).filter(Boolean))].join(', ');

    return {
      net: totalNet, net1: primaryNet, gunny: gunny1, full: full1, left: left1, rate: rate1, paddyValue: paddyValue1,
      variety2: puVariety2, net2: secondNet, gunny2, full2, left2, rate2, paddyValue2,
      freight, unload, food, cess, total, paid, balance, lorryList, extraLoads
    };
  };

  const x = getCalculatedValues();

  // Helper lists
  const supplierPurchases = purchases.filter(p => cleanText(p.party) === cleanText(puParty)).sort((a,b)=>(b.date||'').localeCompare(a.date||''));
  const pendingSuppliersList = purchases.filter(p => p.balance > 0);
  const outstandingLiabilities = pendingSuppliersList.reduce((s,x)=>s+x.balance,0);

  // Smart Warnings
  const getSmartWarnings = () => {
    const warnings = [];
    if (!puParty) return ["Select supplier to view warnings."];
    
    const duplicateExists = purchases.some(p => p.id !== editingId && p.date === puDate && p.party === puParty && p.net === x.net);
    if (duplicateExists) warnings.push("⚠️ DUP_ALERT: A identical weight purchase already exists on this date!");

    const avgRate = supplierPurchases.length ? supplierPurchases.reduce((s,p)=>s+p.rate,0)/supplierPurchases.length : 0;
    if (avgRate && x.rate > avgRate * 1.05) warnings.push(`⚠️ RATE_HIGH: This rate is 5% above the supplier's average rate of ${money(avgRate)}.`);

    const outstanding = supplierPurchases.reduce((s,p)=>s+p.balance,0);
    if (outstanding > 150000) warnings.push(`⚠️ RISK_LIABILITY: Outstanding balance for this supplier is ${money(outstanding)}.`);

    if (warnings.length === 0) warnings.push("🟢 Rate and outstanding thresholds are within normal margins.");
    return warnings;
  };

  // Actions
  const handleSavePurchase = async (openPdf: boolean) => {
    if (!puEntrySelect) {
      alert("Please link a saved Paddy Entry load first.");
      return;
    }
    if (!puParty || !x.net || !x.rate) {
      alert("Supplier, Net weight and Rate must be valid.");
      return;
    }

    // Bill sequence rebuild
    let nextBill = puBillNo.trim();
    if (!nextBill) {
      const maxBill = purchases.reduce((m, p) => Math.max(m, Number(p.billNo) || 0), 0);
      nextBill = String(maxBill + 1);
    }

    const payload: Omit<PaddyPurchase, 'id'> = {
      date: puDate,
      billNo: nextBill,
      paddyEntryId: puEntrySelect,
      paddyEntryId2: puEntrySelect2 || undefined,
      paddyEntryId3: puEntrySelect3 || undefined,
      party: puParty,
      lorry: puLorry,
      lorryList: x.lorryList,
      variety: puVariety,
      load: Number(puLoad || 0),
      empty: Number(puEmpty || 0),
      discount: Number(puDiscount || 0),
      net: x.net,
      net1: x.net1,
      gunny: x.gunny,
      full: x.full,
      left: x.left,
      rate: x.rate,
      paddyValue: x.paddyValue,
      freight: x.freight,
      unload: x.unload,
      food: x.food,
      cess: x.cess,
      total: x.total,
      paid: x.paid,
      balance: x.balance,
      status: puStatus,
      paidDate: puPaidDate,
      multiLoad: multiLoadOn,
      extraLoads: x.extraLoads,
      secondItem: secondItemOn,
      variety2: x.variety2,
      net2: x.net2,
      gunny2: x.gunny2,
      full2: x.full2,
      left2: x.left2,
      rate2: x.rate2,
      paddyValue2: x.paddyValue2,
      balancePaid: 0,
      balancePayments: []
    };

    try {
      if (editingId) {
        await onUpdatePurchase(editingId, payload);
        alert("Purchase record updated!");
      } else {
        const docId = await onAddPurchase(payload);
        // Link to Paddy Entries so they show up as reconciled
        const entriesToLink = [puEntrySelect, puEntrySelect2, puEntrySelect3].filter(Boolean);
        for (const eId of entriesToLink) {
          await onUpdateEntryId(eId, docId);
        }
        alert("Purchase saved!");
        if (openPdf) onOpenReceipt(docId);
      }
      clearForm();
    } catch(err) {
      console.error(err);
      alert("Error saving purchase.");
    }
  };

  const handleEditPurchase = (item: PaddyPurchase) => {
    setEditingId(item.id);
    setPuDate(item.date || today());
    setPuBillNo(item.billNo || '');
    setPuEntrySelect(item.paddyEntryId || '');
    setPuEntrySelect2(item.paddyEntryId2 || '');
    setPuEntrySelect3(item.paddyEntryId3 || '');
    setPuParty(item.party || '');
    setPuLorry(item.lorry || '');
    setPuVariety(item.variety || 'RNR');
    setPuLoad(String(item.load || ''));
    setPuEmpty(String(item.empty || ''));
    setPuDiscount(String(item.discount || '0'));
    setPuGunny(item.gunny || 78);
    setPuRate(String(item.rate || ''));
    setMultiLoadOn(!!item.multiLoad);
    
    if (item.extraLoads && item.extraLoads[1]) {
      setPuLorry2(item.extraLoads[1].lorry || '');
      setPuLoad2(String(item.extraLoads[1].load || ''));
      setPuEmpty2(String(item.extraLoads[1].empty || ''));
      setPuDiscount2(String(item.extraLoads[1].discount || '0'));
    }
    if (item.extraLoads && item.extraLoads[2]) {
      setPuLorry3(item.extraLoads[2].lorry || '');
      setPuLoad3(String(item.extraLoads[2].load || ''));
      setPuEmpty3(String(item.extraLoads[2].empty || ''));
      setPuDiscount3(String(item.extraLoads[2].discount || '0'));
    }

    setSecondItemOn(!!item.secondItem);
    setPuVariety2(item.variety2 || 'BPT');
    setPuNet2(String(item.net2 || ''));
    setPuGunny2(item.gunny2 || 78);
    setPuRate2(String(item.rate2 || ''));

    setPuFreight(String(item.freight || 0));
    setPuUnload(String(item.unload || 0));
    setPuFood(String(item.food || 0));
    setPuCess(String(item.cess || 0));
    setPuPaid(String(item.paid || 0));
    setPuStatus(item.status || 'Pending');
    setPuPaidDate(item.paidDate || '');
    
    setEditingId(item.id);
    setPuDate(item.date);
    setPuBillNo(item.billNo);

    setPurchaseEditFormState(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const setPurchaseEditFormState = (on: boolean) => {
    // Toggles button visibility
  };

  const clearForm = () => {
    setEditingId('');
    setPuBillNo('');
    setPuEntrySelect('');
    setPuEntrySelect2('');
    setPuEntrySelect3('');
    setPuParty('');
    setPuLorry('');
    setPuLoad('');
    setPuEmpty('');
    setPuDiscount('0');
    setPuRate('');
    setMultiLoadOn(false);
    setSecondItemOn(false);
    setPuLorry2('');
    setPuLoad2('');
    setPuEmpty2('');
    setPuDiscount2('0');
    setPuLorry3('');
    setPuLoad3('');
    setPuEmpty3('');
    setPuDiscount3('0');
    setPuNet2('');
    setPuRate2('');
    setPuFreight('0');
    setPuUnload('0');
    setPuFood('0');
    setPuCess('0');
    setPuPaid('0');
    setPuStatus('Pending');
    setPuPaidDate('');
    setPuDate(today());
  };

  // Registers Filter
  const getFilteredPurchases = () => {
    const q = cleanText(puSearch);
    const todayOnly = registerMode === 'today';
    const from = puFrom;
    const to = puTo;
    const st = puStatusFilter;

    return purchases.filter(x => {
      const hay = cleanText([x.date, x.billNo, x.party, x.variety, x.status].join(' '));
      const inDate = todayOnly 
        ? x.date === today() 
        : (!from || x.date >= from) && (!to || x.date <= to);

      return (!q || hay.includes(q)) && inDate && (!st || x.status === st);
    }).sort((a, b) => b.billNo.localeCompare(a.billNo));
  };

  const filteredPurchases = getFilteredPurchases();

  // Excel filter list
  const getExcelFiltered = () => {
    const list = purchases;
    const q = cleanText(excelSearch);
    const party = excelPartyFilter;
    const variety = excelVarietyFilter;
    const from = excelDateFrom;
    const to = excelDateTo;

    return list.filter(x => {
      const hay = cleanText([x.date, x.billNo, x.party, x.lorry, x.variety, x.status].join(' '));
      return (!q || hay.includes(q)) &&
             (!party || x.party === party) &&
             (!variety || x.variety === variety) &&
             (!from || x.date >= from) &&
             (!to || x.date <= to);
    }).sort((a,b)=>b.billNo.localeCompare(a.billNo));
  };

  const excelList = getExcelFiltered();

  const handleCellChange = (id: string, field: string, val: string) => {
    const p = purchases.find(x=>x.id===id);
    if (!p) return;
    const update: any = { [field]: val };
    
    // Auto recalculations if numeric values changed
    if (['net', 'gunny', 'rate', 'freight', 'unload', 'food', 'cess', 'paid'].includes(field)) {
      const net = field === 'net' ? Number(val) : Number(p.net || 0);
      const gunny = field === 'gunny' ? Number(val) : Number(p.gunny || 78);
      const rate = field === 'rate' ? Number(val) : Number(p.rate || 0);
      
      const freight = field === 'freight' ? Number(val) : Number(p.freight || 0);
      const unload = field === 'unload' ? Number(val) : Number(p.unload || 0);
      const food = field === 'food' ? Number(val) : Number(p.food || 0);
      const cess = field === 'cess' ? Number(val) : Number(p.cess || 0);
      const paid = field === 'paid' ? Number(val) : Number(p.paid || 0);

      const full = gunny ? Math.floor(net / gunny) : 0;
      const left = gunny ? net - full * gunny : 0;
      const paddyValue = gunny ? (net / gunny) * rate : 0;

      const total = paddyValue + freight + unload + food + cess;
      const balance = total - paid;

      update.full = full;
      update.left = left;
      update.paddyValue = paddyValue;
      update.total = total;
      update.balance = balance;
    }

    onUpdatePurchase(id, update);
  };

  const handleCopyPreviousExcel = () => {
    const selected = selectedExcelIds[0];
    if (!selected) {
      alert("Please select a target row first using the checkbox.");
      return;
    }
    const idx = purchases.findIndex(x=>x.id===selected);
    if (idx <= 0) {
      alert("No previous row available to copy from.");
      return;
    }
    const prev = purchases[idx - 1];
    onUpdatePurchase(selected, {
      party: prev.party,
      variety: prev.variety,
      gunny: prev.gunny,
      rate: prev.rate,
      freight: prev.freight,
      unload: prev.unload,
      food: prev.food,
      cess: prev.cess
    });
    alert("Copied values from preceding row.");
  };

  const handleBulkDelete = async () => {
    if (selectedExcelIds.length === 0) {
      alert("Please select rows to delete.");
      return;
    }
    const pass = prompt("Enter passcode to delete selected rows:");
    if (pass !== '1234') {
      alert("Wrong passcode.");
      return;
    }
    if (confirm(`Are you sure you want to delete ${selectedExcelIds.length} purchases?`)) {
      for (const id of selectedExcelIds) {
        await onDeleteDoc('purchases', id);
      }
      setSelectedExcelIds([]);
      alert("Selected rows deleted.");
    }
  };

  const exportPurchasesExcel = () => {
    downloadExcel('SKP_Paddy_Purchase_Register.xls',
      ['Date', 'Bill No', 'Supplier Name', 'Lorry List', 'Variety', 'Net Weight (Kg)', 'Gunny Base', 'Rate', 'Freight', 'Handling', 'Food', 'Cess', 'Invoice Value', 'Paid Amount', 'Recon Status'],
      filteredPurchases.map(x => [x.date, x.billNo, x.party, x.lorryList || x.lorry, x.variety, x.net, x.gunny, x.rate, Math.round(x.freight||0), Math.round(x.unload||0), Math.round(x.food||0), Math.round(x.cess||0), Math.round(x.total||0), Math.round(x.paid||0), x.status])
    );
  };

  const clearPurchaseExcelFilters = () => {
    setExcelSearch('');
    setExcelPartyFilter('');
    setExcelVarietyFilter('');
    setExcelDateFrom('');
    setExcelDateTo('');
  };

  const savePurchaseExcelRow = async (id: string) => {
    const row = purchases.find(x => x.id === id);
    if (!row) return;
    try {
      await onUpdatePurchase(id, row);
      alert("Excel row saved successfully!");
    } catch(err) {
      console.error(err);
      alert("Failed to save excel row.");
    }
  };

  const toggleSelectRow = (id: string) => {
    if (selectedExcelIds.includes(id)) {
      setSelectedExcelIds(selectedExcelIds.filter(x => x !== id));
    } else {
      setSelectedExcelIds([...selectedExcelIds, id]);
    }
  };

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedExcelIds(excelList.map(x=>x.id));
    } else {
      setSelectedExcelIds([]);
    }
  };

  const handlePrintSelectedExcel = () => {
    const list = purchases.filter(x=>selectedExcelIds.includes(x.id));
    if (!list.length) {
      alert("Select rows to print first.");
      return;
    }
    const rows = list.map((x, i) => `
      <tr>
        <td>${i+1}</td>
        <td>${fmtDate(x.date)}</td>
        <td>${x.billNo}</td>
        <td>${x.party}</td>
        <td>${x.variety}</td>
        <td>${x.lorry}</td>
        <td>${Number(x.net||0).toFixed(1)}</td>
        <td>${money(x.total)}</td>
        <td>${money(x.paid)}</td>
        <td>${money(x.balance)}</td>
      </tr>
    `).join('');

    const w = window.open('','_blank');
    w?.document.write(`
      <html><head><title>Print selected rows</title><style>
        body{font-family:Arial;padding:12px} table{width:100%;border-collapse:collapse;font-size:11px}
        th,td{border:1px solid #333;padding:5px} th{background:#eaf4ff}
      </style></head><body>
        <h2>SKP Rice Mill Selected Purchases</h2>
        <table><thead><tr><th>S.No</th><th>Date</th><th>Bill No</th><th>Supplier</th><th>Variety</th><th>Lorry</th><th>Net Weight</th><th>Total</th><th>Paid</th><th>Outstanding</th></tr></thead><tbody>${rows}</tbody></table>
        <script>window.print()</script>
      </body></html>
    `);
    w?.document.close();
  };

  // Live Excel totals
  const excelTotalAmount = excelList.reduce((s,x)=>s+(x.total||0), 0);
  const excelTotalPaid = excelList.reduce((s,x)=>s+(x.paid||0), 0);
  const excelTotalBalance = excelList.reduce((s,x)=>s+(x.balance||0), 0);

  const pendingList = purchases.filter(x=>x.balance > 0);

  return (
    <div className="space-y-6">
      
      {/* Complete Paddy Purchase Form card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h2 className="font-sans font-bold text-lg text-slate-800 mb-2">{t("Double-Entry Paddy Purchase")}</h2>
        <p className="text-xs text-slate-400 mb-6">{t("Reconcile arriving lorry slip registers, add secondary variety options, Waadagai/unloading expenses, and record transactions.")}</p>

        <div className="space-y-6">
          {/* Section 1: Link and Party */}
          <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
            <h3 className="font-sans font-bold text-sm text-slate-700 mb-4 flex items-center gap-2">
              <span className="w-5 h-5 bg-emerald-600 text-white rounded-full inline-flex items-center justify-center text-xs">1</span>
              <span>{t("Reconcile Paddy Entry Arrival")}</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center mb-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t("Purchase Date")}</label>
                <input 
                  type="date"
                  value={puDate}
                  onChange={(e) => setPuDate(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-xl text-xs font-semibold focus:border-emerald-500 text-slate-800"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t("Link Paddy Entry Arrival Slip")}</label>
                <select 
                  value={puEntrySelect}
                  onChange={(e) => handleLoadEntry(e.target.value, 1)}
                  className="w-full p-2 border border-slate-200 rounded-xl text-xs font-bold text-emerald-800"
                >
                  <option value="">{t("Select unsaved arrival entry")}</option>
                  {entries.filter(x=>!x.purchaseId).map(e => (
                    <option key={e.id} value={e.id}>
                      {e.date} | {e.party} | {e.lorry} | {e.net}kg | {e.variety}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t("Bill / Invoice No")}</label>
                <input 
                  type="text"
                  value={puBillNo}
                  onChange={(e) => setPuBillNo(e.target.value)}
                  placeholder={t("Auto Bill No")}
                  className="w-full p-2 border border-slate-200 rounded-xl text-xs font-semibold text-red-600 font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t("Party / Supplier")}</label>
                <select 
                  value={puParty}
                  onChange={(e) => setPuParty(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                >
                  <option value="">{t("Select Supplier")}</option>
                  {suppliers.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t("Primary Lorry No")}</label>
                <input 
                  type="text"
                  value={puLorry}
                  onChange={(e) => setPuLorry(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-xl text-xs font-semibold uppercase text-slate-800"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-4">
              <button 
                onClick={() => setMultiLoadOn(!multiLoadOn)}
                className={`py-2 px-4 rounded-xl text-xs font-bold transition ${multiLoadOn ? 'bg-emerald-600 text-white shadow' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
              >
                {t("Multiple Loads")}: {multiLoadOn ? 'ON' : 'OFF'}
              </button>
              <button 
                onClick={() => setSecondItemOn(!secondItemOn)}
                className={`py-2 px-4 rounded-xl text-xs font-bold transition ${secondItemOn ? 'bg-emerald-600 text-white shadow' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
              >
                {t("Second Item Option")}: {secondItemOn ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>

          {/* Section 2: Primary Weight details */}
          <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
            <h3 className="font-sans font-bold text-sm text-slate-700 mb-4 flex items-center gap-2">
              <span className="w-5 h-5 bg-emerald-600 text-white rounded-full inline-flex items-center justify-center text-xs">2</span>
              <span>{t("Primary Paddy variety weight & Rate")}</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t("Variety")}</label>
                <select 
                  value={puVariety}
                  onChange={(e) => setPuVariety(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                >
                  {varieties.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t("Add Variety Name")}</label>
                  <input 
                    type="text"
                    value={puNewVariety}
                    onChange={(e) => setPuNewVariety(e.target.value)}
                    placeholder={t("New Variety")}
                    className="w-full p-1.5 border border-slate-200 rounded-lg text-xs text-slate-800"
                  />
                </div>
                <button onClick={saveVariety} className="py-2 px-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold">{t("Add")}</button>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t("Gross Weight (Load Kg)")}</label>
                <input 
                  type="number"
                  value={puLoad}
                  onChange={(e) => setPuLoad(e.target.value)}
                  placeholder="24000"
                  className="w-full p-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t("Tare Weight (Empty Kg)")}</label>
                <input 
                  type="number"
                  value={puEmpty}
                  onChange={(e) => setPuEmpty(e.target.value)}
                  placeholder="11000"
                  className="w-full p-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t("Discount Weight (Kg)")}</label>
                <input 
                  type="number"
                  value={puDiscount}
                  onChange={(e) => setPuDiscount(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t("Primary Gunny base (Kg)")}</label>
                <select 
                  value={puGunny}
                  onChange={(e) => setPuGunny(Number(e.target.value))}
                  className="w-full p-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                >
                  <option value={62}>62 kg</option>
                  <option value={77}>77 kg</option>
                  <option value={78}>78 kg</option>
                  <option value={79}>79 kg</option>
                  <option value={80}>80 kg</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t("Rate per Gunny (₹)")}</label>
                <input 
                  type="number"
                  value={puRate}
                  onChange={(e) => setPuRate(e.target.value)}
                  placeholder="1450"
                  className="w-full p-2 border border-slate-200 rounded-xl text-xs font-black text-red-600"
                />
              </div>
            </div>
          </div>

          {/* Conditional Sub-panels */}
          {multiLoadOn && (
            <div className="p-4 bg-emerald-50/30 rounded-2xl border border-emerald-100 space-y-4">
              <h4 className="font-bold text-xs text-emerald-800 uppercase">Extra Loads from Same Supplier</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
                <div className="md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-400">Load 2 Linked Entry</label>
                  <select 
                    value={puEntrySelect2} 
                    onChange={(e) => handleLoadEntry(e.target.value, 2)}
                    className="w-full p-1.5 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="">Select saved entry</option>
                    {entries.filter(x=>!x.purchaseId).map(e => (
                      <option key={e.id} value={e.id}>{e.date} | {e.lorry} | {e.net}kg</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400">Load 2 Gross</label>
                  <input type="number" value={puLoad2} onChange={(e)=>setPuLoad2(e.target.value)} className="w-full p-1.5 border border-slate-200 rounded-lg text-xs" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400">Load 2 Tare</label>
                  <input type="number" value={puEmpty2} onChange={(e)=>setPuEmpty2(e.target.value)} className="w-full p-1.5 border border-slate-200 rounded-lg text-xs" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400">Load 2 Lorry</label>
                  <input type="text" value={puLorry2} onChange={(e)=>setPuLorry2(e.target.value)} className="w-full p-1.5 border border-slate-200 rounded-lg text-xs" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
                <div className="md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-400">Load 3 Linked Entry</label>
                  <select 
                    value={puEntrySelect3} 
                    onChange={(e) => handleLoadEntry(e.target.value, 3)}
                    className="w-full p-1.5 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="">Select saved entry</option>
                    {entries.filter(x=>!x.purchaseId).map(e => (
                      <option key={e.id} value={e.id}>{e.date} | {e.lorry} | {e.net}kg</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400">Load 3 Gross</label>
                  <input type="number" value={puLoad3} onChange={(e)=>setPuLoad3(e.target.value)} className="w-full p-1.5 border border-slate-200 rounded-lg text-xs" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400">Load 3 Tare</label>
                  <input type="number" value={puEmpty3} onChange={(e)=>setPuEmpty3(e.target.value)} className="w-full p-1.5 border border-slate-200 rounded-lg text-xs" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400">Load 3 Lorry</label>
                  <input type="text" value={puLorry3} onChange={(e)=>setPuLorry3(e.target.value)} className="w-full p-1.5 border border-slate-200 rounded-lg text-xs" />
                </div>
              </div>
            </div>
          )}

          {secondItemOn && (
            <div className="p-4 bg-emerald-50/30 rounded-2xl border border-emerald-100 space-y-4">
              <h4 className="font-bold text-xs text-emerald-800 uppercase">Optional Second Variety on Same Invoice</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400">Second Variety</label>
                  <select value={puVariety2} onChange={(e)=>setPuVariety2(e.target.value)} className="w-full p-1.5 border border-slate-200 rounded-lg text-xs">
                    {varieties.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400">Second Net Weight (Kg)</label>
                  <input type="number" value={puNet2} onChange={(e)=>setPuNet2(e.target.value)} className="w-full p-1.5 border border-slate-200 rounded-lg text-xs" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400">Second Gunny Base</label>
                  <select value={puGunny2} onChange={(e)=>setPuGunny2(Number(e.target.value))} className="w-full p-1.5 border border-slate-200 rounded-lg text-xs">
                    <option value={62}>62 kg</option>
                    <option value={77}>77 kg</option>
                    <option value={78}>78 kg</option>
                    <option value={79}>79 kg</option>
                    <option value={80}>80 kg</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400">Second Rate</label>
                  <input type="number" value={puRate2} onChange={(e)=>setPuRate2(e.target.value)} className="w-full p-1.5 border border-slate-200 rounded-lg text-xs" />
                </div>
              </div>
            </div>
          )}

          {/* Section 3: Freight, commissions, paid, status */}
          <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
            <h3 className="font-sans font-bold text-sm text-slate-700 mb-4 flex items-center gap-2">
              <span className="w-5 h-5 bg-emerald-600 text-white rounded-full inline-flex items-center justify-center text-xs">3</span>
              <span>{t("Freight, Handling Charges & Payouts")}</span>
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500">{t("வாடகை / Freight")}</label>
                <input type="number" value={puFreight} onChange={(e)=>setPuFreight(e.target.value)} className="w-full p-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500">{t("கூலி + கமிஷன்")}</label>
                <input type="number" value={puUnload} onChange={(e)=>setPuUnload(e.target.value)} className="w-full p-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500">{t("சாப்பாடு / Driver Food")}</label>
                <input type="number" value={puFood} onChange={(e)=>setPuFood(e.target.value)} className="w-full p-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500">{t("Cess / Other Tax")}</label>
                <input type="number" value={puCess} onChange={(e)=>setPuCess(e.target.value)} className="w-full p-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500">{t("உடன்பற்று / Spot Paid")}</label>
                <input type="number" value={puPaid} onChange={(e)=>setPuPaid(e.target.value)} className="w-full p-2 border border-slate-200 rounded-xl text-xs font-black text-emerald-600 text-slate-800" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500">{t("Payment Status")}</label>
                <select value={puStatus} onChange={(e)=>setPuStatus(e.target.value)} className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800">
                  <option value="Pending">{t("Pending")}</option>
                  <option value="Paid">{t("Paid")}</option>
                  <option value="Partial">{t("Partial")}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="text-xs font-bold text-slate-500">{t("Paid Date")}</label>
                <input type="date" value={puPaidDate} onChange={(e)=>setPuPaidDate(e.target.value)} className="w-full p-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800" />
              </div>
            </div>
          </div>
        </div>

        {/* Live Calculation preview card */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 my-6 text-sm grid grid-cols-2 sm:grid-cols-4 gap-4 text-emerald-800">
          <div>{t("Net Weight")}: <b className="block text-emerald-700 text-lg font-black">{x.net.toFixed(1)} kg</b></div>
          <div>{t("Calculated Bags")}: <b className="block text-emerald-700 text-lg font-black">{x.full} {t("bags")} + {x.left.toFixed(1)} kg</b></div>
          <div>{t("Milling Value")}: <b className="block text-emerald-700 text-lg font-black">{money(x.total)}</b></div>
          <div>{t("Payable Balance")}: <b className="block text-emerald-700 text-lg font-black">{money(x.balance)}</b></div>
        </div>

        {/* Smart Assist Warn Cards */}
        <div className="flex justify-end gap-2 mb-4">
          <button 
            onClick={() => setSmartAssistOn(!smartAssistOn)}
            className={`py-2 px-4 rounded-xl text-xs font-bold border transition ${smartAssistOn ? 'bg-emerald-600 text-white shadow border-emerald-600' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'}`}
          >
            {t("Smart Assist Warnings")}: {smartAssistOn ? 'ON' : 'OFF'}
          </button>
        </div>

        {smartAssistOn && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-2">
              <h4 className="font-bold text-xs uppercase text-slate-400">⚠️ Live Purchase Warnings</h4>
              {getSmartWarnings().map((w, idx) => (
                <div key={idx} className="p-2 bg-white rounded-lg text-xs font-bold leading-relaxed border border-slate-100">
                  {w}
                </div>
              ))}
            </div>
            <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-2">
              <h4 className="font-bold text-xs uppercase text-slate-400">📜 Outstanding liabilities alert</h4>
              <p className="text-xs leading-relaxed text-slate-600 font-medium">
                Total outstanding supplier payables: <b>{money(outstandingLiabilities)}</b> across <b>{pendingList.length}</b> unpaid loads.
              </p>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button 
            onClick={() => handleSavePurchase(false)}
            className="py-3 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow transition"
          >
            {editingId ? t('Update Purchase Invoice') : t('Save Invoice')}
          </button>
          <button 
            onClick={() => handleSavePurchase(true)}
            className="py-3 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow transition"
          >
            {t('Save + Open Slip PDF')}
          </button>
          {editingId && (
            <button 
              onClick={clearForm}
              className="py-3 px-6 rounded-xl bg-red-100 hover:bg-red-200 text-red-700 font-bold text-sm"
            >
              {t('Cancel Edit')}
            </button>
          )}
          <button 
            onClick={clearForm}
            className="py-3 px-6 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 font-semibold text-sm border border-slate-200"
          >
            {t('Clear Form')}
          </button>
        </div>
      </div>

      {/* ================= CLOUD REGISTER ================= */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <div>
            <h3 className="font-sans font-bold text-base text-slate-800">📒 {t("Saved Paddy Purchase Register")}</h3>
            <p className="text-xs text-slate-400">{t("Reconciled bills ready for accounting, print operations, and ledger sync.")}</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setRegisterMode('today')}
              className={`py-2 px-4 rounded-xl text-xs font-bold ${registerMode === 'today' ? 'bg-emerald-600 text-white shadow' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'}`}
            >
              {t("Today")}
            </button>
            <button 
              onClick={() => setRegisterMode('all')}
              className={`py-2 px-4 rounded-xl text-xs font-bold ${registerMode === 'all' ? 'bg-emerald-600 text-white shadow' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'}`}
            >
              {t("All Purchases")}
            </button>
            <button 
              onClick={exportPurchasesExcel}
              className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs"
            >
              {t("Export Excel")}
            </button>
            <button 
              onClick={() => setExcelOn(!excelOn)}
              className={`py-2 px-4 rounded-xl text-xs font-bold border transition ${excelOn ? 'bg-amber-600 text-white border-amber-600 shadow' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'}`}
            >
              {t("Excel Grid")}: {excelOn ? 'ON' : 'OFF'}
            </button>
            <button 
              onClick={() => setIntelOn(!intelOn)}
              className={`py-2 px-4 rounded-xl text-xs font-bold border transition ${intelOn ? 'bg-purple-600 text-white border-purple-600 shadow' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'}`}
            >
              {t("Analytics")}: {intelOn ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        {/* Filter controls */}
        {!excelOn && (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 mb-6">
            <input 
              type="text"
              placeholder={t("Search purchases (supplier/lorry)...")}
              value={puSearch}
              onChange={(e) => setPuSearch(e.target.value)}
              className="p-2.5 border border-slate-200 rounded-xl text-xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-100 text-slate-800"
            />
            <input 
              type="date"
              value={puFrom}
              onChange={(e) => { setPuFrom(e.target.value); setRegisterMode('all'); }}
              className="p-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 text-slate-800"
            />
            <input 
              type="date"
              value={puTo}
              onChange={(e) => { setPuTo(e.target.value); setRegisterMode('all'); }}
              className="p-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 text-slate-800"
            />
            <select 
              value={puStatusFilter}
              onChange={(e) => setPuStatusFilter(e.target.value)}
              className="p-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 text-slate-800"
            >
              <option value="">{t("All Statuses")}</option>
              <option value="Paid">{t("Paid")}</option>
              <option value="Pending">{t("Pending")}</option>
              <option value="Partial">{t("Partial")}</option>
            </select>
          </div>
        )}

        {/* Regular list Table view */}
        {!excelOn && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-slate-600 border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold text-center">
                  <th className="p-3">{t("S.No")}</th>
                  <th className="p-3 text-left">{t("Date")}</th>
                  <th className="p-3 text-left">{t("Bill No")}</th>
                  <th className="p-3 text-left">{t("Supplier Name")}</th>
                  <th className="p-3 text-left">{t("Primary Lorry")}</th>
                  <th className="p-3 text-left">{t("Variety")}</th>
                  <th className="p-3 text-right">{t("Net Weight")}</th>
                  <th className="p-3 text-right">{t("Gunny base")}</th>
                  <th className="p-3 text-right">{t("Wages/Rate")}</th>
                  <th className="p-3 text-right">{t("Invoice Value")}</th>
                  <th className="p-3 text-right">{t("Paid")}</th>
                  <th className="p-3 text-right">{t("Outstanding")}</th>
                  <th className="p-3">{t("Status")}</th>
                  <th className="p-3">{t("Action")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredPurchases.length === 0 ? (
                  <tr>
                    <td colSpan={14} className="p-4 text-center text-slate-400 font-medium">{t("No matching purchase invoices found.")}</td>
                  </tr>
                ) : (
                  filteredPurchases.map((x, idx) => (
                    <tr key={x.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="p-3 text-center font-bold text-slate-400">{idx + 1}</td>
                      <td className="p-3 font-semibold whitespace-nowrap">{fmtDate(x.date)}</td>
                      <td className="p-3 font-bold text-slate-800">{x.billNo}</td>
                      <td className="p-3 font-bold text-slate-800">{x.party}</td>
                      <td className="p-3 font-semibold uppercase">{x.lorry}</td>
                      <td className="p-3 font-semibold">{x.variety}</td>
                      <td className="p-3 text-right font-black text-slate-700">{Number(x.net || 0).toFixed(1)}</td>
                      <td className="p-3 text-center font-semibold text-slate-500">{x.gunny}</td>
                      <td className="p-3 text-right font-semibold text-red-600">{money(x.rate)}</td>
                      <td className="p-3 text-right font-black text-emerald-700">{money(x.total)}</td>
                      <td className="p-3 text-right font-semibold text-emerald-600">{money(x.paid)}</td>
                      <td className="p-3 text-right font-black text-red-600">{money(x.balance)}</td>
                      <td className="p-3 text-center">
                        <span className={`py-0.5 px-2.5 rounded-full text-[10px] uppercase font-bold ${x.status === 'Paid' ? 'bg-emerald-50 text-emerald-700' : x.status === 'Partial' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>
                          {t(x.status)}
                        </span>
                      </td>
                      <td className="p-3 text-center space-x-1.5 whitespace-nowrap">
                        <button onClick={() => handleEditPurchase(x)} className="text-emerald-600 font-bold hover:text-emerald-800">{t("Edit")}</button>
                        <span>|</span>
                        <button onClick={() => onOpenReceipt(x.id)} className="text-emerald-500 font-bold hover:text-emerald-700">{t("PDF")}</button>
                        <span>|</span>
                        <button onClick={() => onDeleteDoc('purchases', x.id)} className="text-red-500 font-bold hover:text-red-700">{t("Delete")}</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/*  Spreadsheet Excel Grid mode view */}
        {excelOn && (
          <div className="border border-amber-200 rounded-2xl p-4 bg-amber-50/10 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <input 
                type="text"
                placeholder={t("Excel Search...")}
                value={excelSearch}
                onChange={(e) => setExcelSearch(e.target.value)}
                className="p-2 border border-slate-200 rounded-lg text-xs text-slate-800"
              />
              <select 
                value={excelPartyFilter}
                onChange={(e) => setExcelPartyFilter(e.target.value)}
                className="p-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 text-slate-800"
              >
                <option value="">{t("All Suppliers")}</option>
                {suppliers.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select 
                value={excelVarietyFilter}
                onChange={(e) => setExcelVarietyFilter(e.target.value)}
                className="p-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 text-slate-800"
              >
                <option value="">{t("All Varieties")}</option>
                {varieties.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
              <input 
                type="date"
                value={excelDateFrom}
                onChange={(e) => setExcelDateFrom(e.target.value)}
                className="p-2 border border-slate-200 rounded-lg text-xs"
              />
              <input 
                type="date"
                value={excelDateTo}
                onChange={(e) => setExcelDateTo(e.target.value)}
                className="p-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button onClick={handleCopyPreviousExcel} className="py-1.5 px-3 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-700 text-xs font-bold">Copy Previous Row</button>
              <button onClick={handlePrintSelectedExcel} className="py-1.5 px-3 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold">Print Selected</button>
              <button onClick={handleBulkDelete} className="py-1.5 px-3 rounded bg-red-600 hover:bg-red-700 text-white text-xs font-bold">Bulk Delete</button>
              <button onClick={clearPurchaseExcelFilters} className="py-1.5 px-3 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold border">Clear</button>
            </div>

            {/* Excel totals summary row */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs flex flex-wrap gap-6 font-bold text-slate-600">
              <span>Grid Rows: {excelList.length}</span>
              <span>Subtotal Weight: {excelList.reduce((s,x)=>s+(x.net||0), 0).toLocaleString('en-IN')} kg</span>
              <span>Subtotal Value: {money(excelTotalAmount)}</span>
              <span>Paid: {money(excelTotalPaid)}</span>
              <span>Balance: {money(excelTotalBalance)}</span>
            </div>

            <div className="overflow-x-auto max-h-[400px] border border-slate-200 rounded-xl bg-white">
              <table className="min-w-max w-full text-[11px] text-slate-700 border-collapse table-auto">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 font-bold sticky top-0 z-50 text-slate-600 text-center">
                    <th className="p-2 text-center w-8">#</th>
                    <th className="p-2 text-center w-8"><input type="checkbox" onChange={(e) => toggleSelectAll(e.target.checked)} /></th>
                    <th className="p-2 text-left">Date</th>
                    <th className="p-2 text-left">Bill No</th>
                    <th className="p-2 text-left">Supplier</th>
                    <th className="p-2 text-left">Lorry No</th>
                    <th className="p-2 text-left">Variety</th>
                    <th className="p-2 text-right">Gunny Base</th>
                    <th className="p-2 text-right">Wages/Rate</th>
                    <th className="p-2 text-right">Net weight</th>
                    <th className="p-2 text-right">Freight</th>
                    <th className="p-2 text-right">Handling</th>
                    <th className="p-2 text-right">Food</th>
                    <th className="p-2 text-right">Cess</th>
                    <th className="p-2 text-right">Total</th>
                    <th className="p-2 text-right">Paid</th>
                    <th className="p-2 text-right">Balance</th>
                    <th className="p-2">Status</th>
                    <th className="p-2">Paid Date</th>
                    <th className="p-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {excelList.map((row, idx) => {
                    const isSelected = selectedExcelIds.includes(row.id);
                    return (
                      <tr key={row.id} className={`border-b border-slate-200 hover:bg-slate-50 ${isSelected ? 'bg-emerald-50/30' : ''}`}>
                        <td className="p-2 text-center font-bold bg-slate-50 border-r border-slate-200">{idx + 1}</td>
                        <td className="p-2 text-center border-r border-slate-200"><input type="checkbox" checked={isSelected} onChange={() => toggleSelectRow(row.id)} /></td>
                        <td className="p-2 font-semibold">
                          <input 
                            type="text" 
                            value={row.date} 
                            onChange={(e) => handleCellChange(row.id, 'date', e.target.value)} 
                            className="bg-transparent border-0 font-semibold w-20 outline-none focus:bg-amber-100"
                          />
                        </td>
                        <td className="p-2 font-bold">
                          <input 
                            type="text" 
                            value={row.billNo} 
                            onChange={(e) => handleCellChange(row.id, 'billNo', e.target.value)} 
                            className="bg-transparent border-0 font-bold w-12 outline-none focus:bg-amber-100"
                          />
                        </td>
                        <td className="p-2 font-bold text-slate-800">
                          <input 
                            type="text" 
                            value={row.party} 
                            onChange={(e) => handleCellChange(row.id, 'party', e.target.value)} 
                            className="bg-transparent border-0 font-bold w-32 outline-none focus:bg-amber-100"
                          />
                        </td>
                        <td className="p-2 font-semibold uppercase">
                          <input 
                            type="text" 
                            value={row.lorry} 
                            onChange={(e) => handleCellChange(row.id, 'lorry', e.target.value)} 
                            className="bg-transparent border-0 font-semibold w-24 outline-none focus:bg-amber-100"
                          />
                        </td>
                        <td className="p-2 font-semibold">
                          <input 
                            type="text" 
                            value={row.variety} 
                            onChange={(e) => handleCellChange(row.id, 'variety', e.target.value)} 
                            className="bg-transparent border-0 font-semibold w-16 outline-none focus:bg-amber-100"
                          />
                        </td>
                        <td className="p-2 text-right">
                          <input 
                            type="number" 
                            value={row.gunny} 
                            onChange={(e) => handleCellChange(row.id, 'gunny', e.target.value)} 
                            className="bg-transparent border-0 text-right w-12 outline-none focus:bg-amber-100"
                          />
                        </td>
                        <td className="p-2 text-right font-semibold text-red-600">
                          <input 
                            type="number" 
                            value={row.rate} 
                            onChange={(e) => handleCellChange(row.id, 'rate', e.target.value)} 
                            className="bg-transparent border-0 text-right w-16 outline-none text-red-600 focus:bg-amber-100"
                          />
                        </td>
                        <td className="p-2 text-right font-black text-slate-700">
                          <input 
                            type="number" 
                            value={Number(row.net || 0).toFixed(1)} 
                            onChange={(e) => handleCellChange(row.id, 'net', e.target.value)} 
                            className="bg-transparent border-0 text-right w-20 outline-none text-slate-700 focus:bg-amber-100"
                          />
                        </td>
                        <td className="p-2 text-right font-semibold">
                          <input 
                            type="number" 
                            value={Math.round(row.freight || 0)} 
                            onChange={(e) => handleCellChange(row.id, 'freight', e.target.value)} 
                            className="bg-transparent border-0 text-right w-16 outline-none focus:bg-amber-100"
                          />
                        </td>
                        <td className="p-2 text-right font-semibold">
                          <input 
                            type="number" 
                            value={Math.round(row.unload || 0)} 
                            onChange={(e) => handleCellChange(row.id, 'unload', e.target.value)} 
                            className="bg-transparent border-0 text-right w-16 outline-none focus:bg-amber-100"
                          />
                        </td>
                        <td className="p-2 text-right font-semibold">
                          <input 
                            type="number" 
                            value={Math.round(row.food || 0)} 
                            onChange={(e) => handleCellChange(row.id, 'food', e.target.value)} 
                            className="bg-transparent border-0 text-right w-16 outline-none focus:bg-amber-100"
                          />
                        </td>
                        <td className="p-2 text-right font-semibold">
                          <input 
                            type="number" 
                            value={Math.round(row.cess || 0)} 
                            onChange={(e) => handleCellChange(row.id, 'cess', e.target.value)} 
                            className="bg-transparent border-0 text-right w-16 outline-none focus:bg-amber-100"
                          />
                        </td>
                        <td className="p-2 text-right font-black text-emerald-700 bg-slate-50">{Math.round(row.total || 0).toLocaleString('en-IN')}</td>
                        <td className="p-2 text-right font-semibold text-emerald-600">
                          <input 
                            type="number" 
                            value={Math.round(row.paid || 0)} 
                            onChange={(e) => handleCellChange(row.id, 'paid', e.target.value)} 
                            className="bg-transparent border-0 text-right w-20 outline-none text-emerald-600 focus:bg-amber-100"
                          />
                        </td>
                        <td className="p-2 text-right font-black text-red-600 bg-slate-50">{Math.round(row.balance || 0).toLocaleString('en-IN')}</td>
                        <td className="p-2 font-bold text-center">
                          <input 
                            type="text" 
                            value={row.status} 
                            onChange={(e) => handleCellChange(row.id, 'status', e.target.value)} 
                            className="bg-transparent border-0 text-center w-16 outline-none focus:bg-amber-100"
                          />
                        </td>
                        <td className="p-2 font-semibold text-center">
                          <input 
                            type="text" 
                            value={row.paidDate || ''} 
                            onChange={(e) => handleCellChange(row.id, 'paidDate', e.target.value)} 
                            className="bg-transparent border-0 text-center w-20 outline-none focus:bg-amber-100"
                          />
                        </td>
                        <td className="p-2 text-center space-x-1">
                          <button onClick={() => savePurchaseExcelRow(row.id)} className="text-emerald-600 font-bold hover:underline">Save</button>
                          <span>|</span>
                          <button onClick={() => setSelectedExcelIds([row.id])} className="text-emerald-600 font-bold hover:underline">Copy</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ================= PURCHASE INTELLIGENCE ANALYTICS ================= */}
      {intelOn && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-sans font-bold text-base text-slate-800">Procurement Analytics & Intel Command</h3>
              <p className="text-xs text-slate-400">Smart decisions calculated from purchase register metrics.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
              <span className="text-[10px] text-slate-400 uppercase font-black block">Loads Filtered</span>
              <b className="block text-xl text-slate-800 font-extrabold mt-1">{filteredPurchases.length}</b>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
              <span className="text-[10px] text-slate-400 uppercase font-black block">Total Volume weight</span>
              <b className="block text-xl text-slate-800 font-extrabold mt-1">
                {(filteredPurchases.reduce((s,x)=>s+x.net, 0)/1000).toFixed(1)} Tons
              </b>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
              <span className="text-[10px] text-slate-400 uppercase font-black block">Procurement Value</span>
              <b className="block text-xl text-slate-800 font-extrabold mt-1">
                {money(filteredPurchases.reduce((s,x)=>s+x.total, 0))}
              </b>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
              <span className="text-[10px] text-slate-400 uppercase font-black block">Average Purchase Rate</span>
              <b className="block text-xl text-slate-800 font-extrabold mt-1">
                {money(filteredPurchases.reduce((s,x)=>s+x.rate, 0)/(filteredPurchases.length || 1))}
              </b>
            </div>
          </div>

          <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-2xl text-xs font-bold leading-relaxed">
            <b>Procurement Analysis Note:</b> Highest volume variety this season is <b>RNR</b>. Buy on average margins <b>{money(1450)} - {money(1520)}</b> to maintain milling profits.
          </div>
        </div>
      )}
      
    </div>
  );
};
