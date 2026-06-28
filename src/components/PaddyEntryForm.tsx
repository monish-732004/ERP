import React, { useState } from 'react';
import { PaddyEntry } from '../types';
import { downloadExcel } from '../utils';
import { useTranslation } from '../context/LanguageContext';

interface PaddyEntryFormProps {
  entries: PaddyEntry[];
  varieties: string[];
  suppliers: string[];
  paddyStorages: string[];
  frequentLorries: string[];
  onAddEntry: (entry: Omit<PaddyEntry, 'id'>) => Promise<void>;
  onUpdateEntry: (id: string, entry: Partial<PaddyEntry>) => Promise<void>;
  onDeleteDoc: (col: string, id: string) => Promise<void>;
  onAddSupplier: (name: string) => Promise<void>;
}

export const PaddyEntryForm: React.FC<PaddyEntryFormProps> = ({
  entries,
  varieties,
  suppliers,
  paddyStorages,
  frequentLorries,
  onAddEntry,
  onUpdateEntry,
  onDeleteDoc,
  onAddSupplier
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

  // Form states
  const [peDate, setPeDate] = useState(today());
  const [peParty, setPeParty] = useState('');
  const [peNewSupplier, setPeNewSupplier] = useState('');
  const [peLorry, setPeLorry] = useState('');
  const [peLoad, setPeLoad] = useState('');
  const [peEmpty, setPeEmpty] = useState('');
  const [peBags, setPeBags] = useState('');
  const [peVariety, setPeVariety] = useState('RNR');
  const [peDestination, setPeDestination] = useState('Paddy Storage 1');
  const [peGunny, setPeGunny] = useState(78);
  const [peRate, setPeRate] = useState('');
  const [peStatus, setPeStatus] = useState('Pending');

  // Edit states
  const [editingId, setEditingId] = useState('');

  // Search & Register mode filters
  const [peSearch, setPeSearch] = useState('');
  const [peFrom, setPeFrom] = useState('');
  const [peTo, setPeTo] = useState('');
  const [pePurchaseStatusFilter, setPePurchaseStatusFilter] = useState('');
  const [registerMode, setRegisterMode] = useState<'today' | 'all'>('today');

  // Column specific filters
  const [colFilters, setColFilters] = useState<Record<string, string>>({});

  const cleanText = (s: string) => String(s || '').toLowerCase().trim();

  const handleColFilterChange = (field: string, val: string) => {
    setColFilters(prev => ({ ...prev, [field]: val }));
  };

  // Live Math
  const getCalculatedValues = () => {
    const load = Number(peLoad || 0);
    const empty = Number(peEmpty || 0);
    const actualBags = Number(peBags || 0);
    const gunny = Number(peGunny || 78);
    const rate = Number(peRate || 0);

    const net = Math.max(0, load - empty);
    const calcBags = gunny ? Math.floor(net / gunny) : 0;
    const left = gunny ? net - calcBags * gunny : 0;
    const amount = gunny ? (net / gunny) * rate : 0;

    return { net, calcBags, left, amount, load, empty, actualBags, gunny, rate };
  };

  const handleSaveSupplier = async () => {
    const name = peNewSupplier.trim();
    if (!name) {
      alert("Enter supplier name first.");
      return;
    }
    const exists = suppliers.some(s => cleanText(s) === cleanText(name));
    if (!exists) {
      await onAddSupplier(name);
    }
    setPeParty(name);
    setPeNewSupplier('');
    alert("New supplier saved!");
  };

  const handleSaveEntry = async () => {
    const c = getCalculatedValues();
    if (!peParty) {
      alert("Please select a Supplier / Party.");
      return;
    }
    if (!c.net) {
      alert("Net weight is zero. Check load and empty weights.");
      return;
    }

    const data: Omit<PaddyEntry, 'id'> = {
      date: peDate,
      party: peParty,
      lorry: peLorry,
      load: c.load,
      empty: c.empty,
      net: c.net,
      bags: c.actualBags,
      calcBags: c.calcBags,
      left: c.left,
      variety: peVariety,
      destination: peDestination,
      gunny: c.gunny,
      rate: c.rate,
      amount: c.amount,
      status: peStatus,
      purchaseId: ''
    };

    try {
      if (editingId) {
        await onUpdateEntry(editingId, data);
        setEditingId('');
        alert("Paddy entry updated successfully!");
      } else {
        await onAddEntry(data);
        alert("Paddy entry saved successfully!");
      }
      clearForm();
    } catch(err) {
      console.error(err);
      alert("Error saving paddy entry.");
    }
  };

  const handleEditEntry = (x: PaddyEntry) => {
    setEditingId(x.id);
    setPeDate(x.date || today());
    setPeParty(x.party || '');
    setPeLorry(x.lorry || '');
    setPeLoad(String(x.load || ''));
    setPeEmpty(String(x.empty || ''));
    setPeBags(String(x.bags || ''));
    setPeVariety(x.variety || 'RNR');
    setPeDestination(x.destination || 'Paddy Storage 1');
    setPeGunny(x.gunny || 78);
    setPeRate(String(x.rate || ''));
    setPeStatus(x.status || 'Pending');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearForm = () => {
    setPeLoad('');
    setPeEmpty('');
    setPeBags('');
    setPeRate('');
    setPeLorry('');
    setPeParty('');
    setPeNewSupplier('');
    setPeDate(today());
    setEditingId('');
  };

  // Filter criteria logic
  const getFilteredEntries = () => {
    const q = cleanText(peSearch);
    const todayOnly = registerMode === 'today';

    return entries.filter(x => {
      const purchaseStatus = x.purchaseId ? 'Saved to Purchase' : 'Entry Only';
      const hay = cleanText([x.date, x.party, x.lorry, x.variety, x.destination, purchaseStatus].join(' '));
      
      const inDateRange = todayOnly 
        ? x.date === today() 
        : (!peFrom || x.date >= peFrom) && (!peTo || x.date <= peTo);

      const inPurchaseFilter = !pePurchaseStatusFilter || purchaseStatus === pePurchaseStatusFilter;

      // Column filters
      const matchesCol = Object.entries(colFilters).every(([field, query]) => {
        if (!query) return true;
        let cellVal = '';
        if (field === 'purchaseStatus') cellVal = purchaseStatus;
        else cellVal = String((x as any)[field] || '');
        return cleanText(cellVal).includes(cleanText(query as string));
      });

      return (!q || hay.includes(q)) && inDateRange && inPurchaseFilter && matchesCol;
    });
  };

  const c = getCalculatedValues();
  const list = getFilteredEntries();

  const exportPaddyEntriesExcel = () => {
    downloadExcel('SKP_Paddy_Entry_Register.xls',
      ['Date', 'Party / Supplier', 'Lorry No', 'Gross Weight', 'Tare Weight', 'Net Weight (Kg)', 'Actual Bags', 'Variety', 'Destination Storage', 'Gunny Base', 'Rate', 'Amount', 'Reconciliation Status'],
      list.map(x => [x.date, x.party, x.lorry, x.load, x.empty, x.net, x.bags, x.variety, x.destination, x.gunny, x.rate, Math.round(x.amount), x.purchaseId ? 'Saved to Purchase' : 'Entry Only'])
    );
  };

  return (
    <div className="space-y-8">
      
      {/* Interactive Entry Steps form panel */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 md:p-6 shadow-sm">
        <h2 className="font-sans font-bold text-base md:text-lg text-slate-800 mb-2">{t("Arriving Paddy Lorry Entry")}</h2>
        <p className="text-xs text-slate-400 mb-6">{t("Enter lorry gross/tare weights, and allocate grain varieties into silos or storage yards.")}</p>

        <div className="space-y-6">
          {/* Step 1: Supplier */}
          <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
            <h3 className="font-sans font-bold text-sm text-slate-700 mb-4 flex items-center gap-2">
              <span className="w-5 h-5 bg-emerald-600 text-white rounded-full inline-flex items-center justify-center text-xs">1</span>
              <span>{t("Date & Supplier")}</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t("Arrival Date")}</label>
                <input 
                  type="date"
                  value={peDate}
                  onChange={(e) => setPeDate(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-semibold focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t("Party / Supplier")}</label>
                <select 
                  value={peParty}
                  onChange={(e) => setPeParty(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800"
                >
                  <option value="">{t("Select Supplier")}</option>
                  {suppliers.map((s, idx) => (
                    <option key={idx} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t("Quick Add Supplier")}</label>
                <input 
                  type="text"
                  value={peNewSupplier}
                  onChange={(e) => setPeNewSupplier(e.target.value)}
                  placeholder={t("Supplier Name")}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">&nbsp;</label>
                <button 
                  onClick={handleSaveSupplier}
                  className="w-full py-2.5 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-900 transition"
                >
                  {t("Save Supplier")}
                </button>
              </div>
            </div>
          </div>

          {/* Step 2: Weight parameters */}
          <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
            <h3 className="font-sans font-bold text-sm text-slate-700 mb-4 flex items-center gap-2">
              <span className="w-5 h-5 bg-emerald-600 text-white rounded-full inline-flex items-center justify-center text-xs">2</span>
              <span>{t("Lorry & Weighment Details")}</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t("Lorry / Vehicle No")}</label>
                <input 
                  type="text"
                  list="lorries-data-list"
                  value={peLorry}
                  onChange={(e) => setPeLorry(e.target.value)}
                  placeholder="TN15AB1234"
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-semibold"
                />
                <datalist id="lorries-data-list">
                  {frequentLorries.map((v, i) => (
                    <option key={i} value={v}></option>
                  ))}
                </datalist>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t("Gross Weight (Load Kg)")}</label>
                <input 
                  type="number"
                  value={peLoad}
                  onChange={(e) => setPeLoad(e.target.value)}
                  placeholder="24000"
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t("Tare Weight (Empty Kg)")}</label>
                <input 
                  type="number"
                  value={peEmpty}
                  onChange={(e) => setPeEmpty(e.target.value)}
                  placeholder="11000"
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t("No. of Bags / உருப்படி")}</label>
                <input 
                  type="number"
                  value={peBags}
                  onChange={(e) => setPeBags(e.target.value)}
                  placeholder="150"
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Step 3: Varieties & Silo */}
          <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
            <h3 className="font-sans font-bold text-sm text-slate-700 mb-4 flex items-center gap-2">
              <span className="w-5 h-5 bg-emerald-600 text-white rounded-full inline-flex items-center justify-center text-xs">3</span>
              <span>{t("Variety, Allocation & Settlement Status")}</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t("Paddy Variety")}</label>
                <select 
                  value={peVariety}
                  onChange={(e) => setPeVariety(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-semibold"
                >
                  {varieties.map((v, i) => (
                    <option key={i} value={v}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t("Storage Area / SILO")}</label>
                <input 
                  type="text"
                  list="silos-data-list"
                  value={peDestination}
                  onChange={(e) => setPeDestination(e.target.value)}
                  placeholder={t("Paddy Storage 1")}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800"
                />
                <datalist id="silos-data-list">
                  {paddyStorages.map((s, i) => (
                    <option key={i} value={s}></option>
                  ))}
                </datalist>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t("Gunny Weight Base (Kg)")}</label>
                <select 
                  value={peGunny}
                  onChange={(e) => setPeGunny(Number(e.target.value))}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-semibold"
                >
                  <option value={62}>62 kg</option>
                  <option value={77}>77 kg</option>
                  <option value={78}>78 kg</option>
                  <option value={79}>79 kg</option>
                  <option value={80}>80 kg</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t("Wages Rate per Gunny (₹)")}</label>
                <input 
                  type="number"
                  value={peRate}
                  onChange={(e) => setPeRate(e.target.value)}
                  placeholder="1450"
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t("Initial Payment Status")}</label>
                <select 
                  value={peStatus}
                  onChange={(e) => setPeStatus(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800"
                >
                  <option value="Pending">{t("Pending")}</option>
                  <option value="Paid">{t("Paid")}</option>
                  <option value="Partial">{t("Partial")}</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Live Calculation preview grid */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 my-6 text-sm grid grid-cols-2 sm:grid-cols-4 gap-4 text-emerald-800">
          <div>{t("Net Weight")}: <b className="block text-emerald-700 text-lg font-black">{c.net.toFixed(1)} kg</b></div>
          <div>{t("Calculated Bags")}: <b className="block text-emerald-700 text-lg font-black">{c.calcBags} {t("bags")}</b></div>
          <div>{t("Leftover Weight")}: <b className="block text-emerald-700 text-lg font-black">{c.left.toFixed(1)} kg</b></div>
          <div>{t("Estimated Cost")}: <b className="block text-emerald-700 text-lg font-black">{money(c.amount)}</b></div>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={handleSaveEntry}
            className="py-3 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow transition"
          >
            {editingId ? t('Update Paddy Entry') : t('Save Paddy Entry')}
          </button>
          {editingId && (
            <button 
              onClick={clearForm}
              className="py-3 px-6 rounded-xl bg-red-100 hover:bg-red-200 text-red-700 font-bold text-sm"
            >
              {t("Cancel Edit")}
            </button>
          )}
          <button 
            onClick={clearForm}
            className="py-3 px-6 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 font-semibold text-sm border border-slate-200"
          >
            {t("Clear Form")}
          </button>
        </div>
      </div>

      {/* ================= REGISTER ================= */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 md:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
          <div>
            <h3 className="font-sans font-bold text-base text-slate-800">📒 {t("Saved Paddy Entry Register")}</h3>
            <p className="text-xs text-slate-400">{t("Ledger of arriving paddy trucks before double-entry reconciliation.")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => setRegisterMode('today')}
              className={`py-2 px-4 rounded-xl text-xs font-bold ${registerMode === 'today' ? 'bg-emerald-600 text-white shadow' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'}`}
            >
              {t("Today Entries")}
            </button>
            <button 
              onClick={() => setRegisterMode('all')}
              className={`py-2 px-4 rounded-xl text-xs font-bold ${registerMode === 'all' ? 'bg-emerald-600 text-white shadow' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'}`}
            >
              {t("All Entries")}
            </button>
            <button 
              onClick={exportPaddyEntriesExcel}
              className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs"
            >
              {t("Export Excel")}
            </button>
          </div>
        </div>

        {/* Global Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 mb-6">
          <input 
            type="text"
            placeholder={t("Global search (supplier / lorry)...")}
            value={peSearch}
            onChange={(e) => setPeSearch(e.target.value)}
            className="p-2.5 border border-slate-200 rounded-xl text-xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-100 font-semibold text-slate-800"
          />
          <input 
            type="date"
            value={peFrom}
            onChange={(e) => { setPeFrom(e.target.value); setRegisterMode('all'); }}
            className="p-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600"
          />
          <input 
            type="date"
            value={peTo}
            onChange={(e) => { setPeTo(e.target.value); setRegisterMode('all'); }}
            className="p-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600"
          />
          <select 
            value={pePurchaseStatusFilter}
            onChange={(e) => setPePurchaseStatusFilter(e.target.value)}
            className="p-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 text-slate-800"
          >
            <option value="">{t("All Purchase Status")}</option>
            <option value="Entry Only">{t("Entry Only")}</option>
            <option value="Saved to Purchase">{t("Saved to Purchase")}</option>
          </select>
        </div>

        {/* Saved Paddy Register table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-slate-600 border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold text-center">
                <th className="p-3">{t("S.No")}</th>
                <th className="p-3 text-left">{t("Date")}</th>
                <th className="p-3 text-left">{t("Party")}</th>
                <th className="p-3 text-left">{t("Lorry No")}</th>
                <th className="p-3 text-right">{t("Gross (kg)")}</th>
                <th className="p-3 text-right">{t("Tare (kg)")}</th>
                <th className="p-3 text-right">{t("Net Weight")}</th>
                <th className="p-3 text-right">{t("Bags")}</th>
                <th className="p-3 text-left">{t("Variety")}</th>
                <th className="p-3 text-left">{t("Storage")}</th>
                <th className="p-3 text-right">{t("Rate")}</th>
                <th className="p-3 text-right">{t("Cost")}</th>
                <th className="p-3">{t("Recon Status")}</th>
                <th className="p-3">{t("Action")}</th>
              </tr>
              {/* Column Filters Row */}
              <tr className="bg-slate-50 border-b border-slate-100">
                <th></th>
                <th>
                  <input 
                    type="text" 
                    placeholder={t("Filter date")} 
                    value={colFilters.date || ''}
                    onChange={(e) => handleColFilterChange('date', e.target.value)}
                    className="w-full p-1 border border-slate-200 rounded text-[10px]"
                  />
                </th>
                <th>
                  <input 
                    type="text" 
                    placeholder={t("Filter party")} 
                    value={colFilters.party || ''}
                    onChange={(e) => handleColFilterChange('party', e.target.value)}
                    className="w-full p-1 border border-slate-200 rounded text-[10px]"
                  />
                </th>
                <th>
                  <input 
                    type="text" 
                    placeholder={t("Filter lorry")} 
                    value={colFilters.lorry || ''}
                    onChange={(e) => handleColFilterChange('lorry', e.target.value)}
                    className="w-full p-1 border border-slate-200 rounded text-[10px]"
                  />
                </th>
                <th colSpan={2}></th>
                <th>
                  <input 
                    type="text" 
                    placeholder={t("Filter weight")} 
                    value={colFilters.net || ''}
                    onChange={(e) => handleColFilterChange('net', e.target.value)}
                    className="w-full p-1 border border-slate-200 rounded text-[10px]"
                  />
                </th>
                <th>
                  <input 
                    type="text" 
                    placeholder={t("Filter bags")} 
                    value={colFilters.bags || ''}
                    onChange={(e) => handleColFilterChange('bags', e.target.value)}
                    className="w-full p-1 border border-slate-200 rounded text-[10px]"
                  />
                </th>
                <th>
                  <input 
                    type="text" 
                    placeholder={t("Filter variety")} 
                    value={colFilters.variety || ''}
                    onChange={(e) => handleColFilterChange('variety', e.target.value)}
                    className="w-full p-1 border border-slate-200 rounded text-[10px]"
                  />
                </th>
                <th>
                  <input 
                    type="text" 
                    placeholder={t("Filter storage")} 
                    value={colFilters.destination || ''}
                    onChange={(e) => handleColFilterChange('destination', e.target.value)}
                    className="w-full p-1 border border-slate-200 rounded text-[10px]"
                  />
                </th>
                <th colSpan={2}></th>
                <th>
                  <input 
                    type="text" 
                    placeholder={t("Filter recon")} 
                    value={colFilters.purchaseStatus || ''}
                    onChange={(e) => handleColFilterChange('purchaseStatus', e.target.value)}
                    className="w-full p-1 border border-slate-200 rounded text-[10px]"
                  />
                </th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr>
                  <td colSpan={14} className="p-4 text-center text-slate-400 font-medium">{t("No matching paddy entries found.")}</td>
                </tr>
              ) : (
                list.map((x, idx) => {
                  const purchaseStatus = x.purchaseId ? 'Saved to Purchase' : 'Entry Only';
                  return (
                    <tr key={x.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="p-3 text-center font-bold text-slate-400">{idx + 1}</td>
                      <td className="p-3 font-semibold whitespace-nowrap">{fmtDate(x.date)}</td>
                      <td className="p-3 font-bold text-slate-800">{x.party}</td>
                      <td className="p-3 font-semibold uppercase">{x.lorry}</td>
                      <td className="p-3 text-right">{x.load.toLocaleString('en-IN')}</td>
                      <td className="p-3 text-right">{x.empty.toLocaleString('en-IN')}</td>
                      <td className="p-3 text-right font-black text-slate-700">{Number(x.net || 0).toFixed(1)}</td>
                      <td className="p-3 text-right font-black text-slate-700">{x.bags}</td>
                      <td className="p-3 font-semibold">{x.variety}</td>
                      <td className="p-3 font-semibold">{x.destination}</td>
                      <td className="p-3 text-right font-semibold text-red-600">{money(x.rate)}</td>
                      <td className="p-3 text-right font-black text-emerald-700">{money(x.amount)}</td>
                      <td className="p-3 text-center font-bold">
                        <span className={`py-0.5 px-2.5 rounded-full text-[10px] uppercase ${x.purchaseId ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                          {t(purchaseStatus)}
                        </span>
                      </td>
                      <td className="p-3 text-center space-x-1 whitespace-nowrap">
                        <button 
                          onClick={() => handleEditEntry(x)}
                          className="text-emerald-600 font-bold hover:text-emerald-800"
                        >
                          {t("Edit")}
                        </button>
                        <span>|</span>
                        <button 
                          onClick={() => onDeleteDoc('paddyEntries', x.id)}
                          className="text-red-500 font-bold hover:text-red-700"
                        >
                          {t("Delete")}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
};
