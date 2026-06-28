import React, { useState } from 'react';
import { useTranslation } from '../context/LanguageContext';
import { 
  PaddyPurchase, 
  PaddyEntry, 
  ProductionBatch, 
  Attendance, 
  Loading, 
  Employee,
  SalesDraft
} from '../types';

interface VoiceAndInsightsProps {
  purchases: PaddyPurchase[];
  entries: PaddyEntry[];
  productions: ProductionBatch[];
  attendance: Attendance[];
  loadings: Loading[];
  employees: Employee[];
}

export const VoiceAndInsights: React.FC<VoiceAndInsightsProps> = ({
  purchases,
  entries,
  productions,
  attendance,
  loadings,
  employees
}) => {
  const { t, language } = useTranslation();
  const [voiceText, setVoiceText] = useState('');
  const [status, setStatus] = useState('Ready for voice entry');
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  // Form states
  const [party, setParty] = useState('');
  const [variety, setVariety] = useState('RNR Rice');
  const [bags, setBags] = useState('');
  const [rate, setRate] = useState('');
  const [lorry, setLorry] = useState('');
  const [dueDays, setDueDays] = useState('');
  const [phone, setPhone] = useState('');
  const [salesDate, setSalesDate] = useState(new Date().toISOString().slice(0, 10));

  const [savedDrafts, setSavedDrafts] = useState<SalesDraft[]>(() => {
    const d = localStorage.getItem('skp_voice_drafts');
    return d ? JSON.parse(d) : [];
  });

  // AI Q&A States
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswerTitle, setAiAnswerTitle] = useState('Ready');
  const [aiAnswerBody, setAiAnswerBody] = useState('Try: "Who is the best supplier?" or click one of the quick buttons below.');
  const [aiTableHeads, setAiTableHeads] = useState<string[]>([]);
  const [aiTableRows, setAiTableRows] = useState<any[][]>([]);
  const [aiSuggestion, setAiSuggestion] = useState('');

  const money = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN');

  const fmtDate = (v: string) => {
    if (!v) return '';
    const parts = v.split('-');
    if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
    return v;
  };

  // Title case helper
  const toTitleCase = (str: string) => {
    return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  };

  const startVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setStatus("Voice recognition is not supported in this browser. Please use Google Chrome.");
      return;
    }

    const rec = new SpeechRecognition();
    rec.lang = "en-IN";
    rec.continuous = false;
    rec.interimResults = false;

    rec.onstart = () => {
      setIsListening(true);
      setStatus("Listening... Speak sales details now.");
    };

    rec.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setVoiceText(text);
      setStatus("Voice captured. Auto-filling form...");
      parseText(text);
    };

    rec.onerror = (event: any) => {
      setStatus("Voice error: " + event.error);
      setIsListening(false);
    };

    rec.onend = () => {
      setIsListening(false);
      setStatus("Voice stopped. Verify details before saving.");
    };

    setRecognition(rec);
    rec.start();
  };

  const stopVoice = () => {
    if (recognition) {
      recognition.stop();
      setIsListening(false);
      setStatus("Stopped.");
    }
  };

  const parseText = (text: string) => {
    const lower = text.toLowerCase();

    // Bags
    const bagMatch = lower.match(/(\d+)\s*(bags|bag|pcs|pieces|மூட்டை|மூட்டைகள்)/);
    if (bagMatch) setBags(bagMatch[1]);

    // Rate
    const rateMatch = lower.match(/rate\s*(?:rs|₹)?\s*(\d+)/) || lower.match(/rs\s*(\d+)/) || lower.match(/விலை\s*(\d+)/);
    if (rateMatch) setRate(rateMatch[1]);

    // Due days
    const dueMatch = lower.match(/due\s*(\d+)\s*(days|day|நாள்|நாட்கள்)/);
    if (dueMatch) setDueDays(dueMatch[1]);

    // Lorry number
    const lorryMatch = text.match(/\b[A-Z]{2}\s*\d{1,2}\s*[A-Z]{1,2}\s*\d{3,4}\b/i);
    if (lorryMatch) setLorry(lorryMatch[0].replace(/\s+/g, "").toUpperCase());

    // Variety mapping
    if (lower.includes("rnr")) setVariety("RNR Rice");
    else if (lower.includes("bpt")) setVariety("BPT Rice");
    else if (lower.includes("co 55") || lower.includes("co55")) setVariety("CO 55 Rice");
    else if (lower.includes("white ponni") || lower.includes("ponni")) setVariety("White Ponni Rice");
    else if (lower.includes("broken")) setVariety("Broken Rice");

    // Extract Party Name: filter out keywords
    let extractedParty = text;
    extractedParty = extractedParty.replace(/\b\d+\s*(bags|bag|pcs|pieces|மூட்டை|மூட்டைகள்)\b/ig, "");
    extractedParty = extractedParty.replace(/\brate\s*(?:rs|₹)?\s*\d+\b/ig, "");
    extractedParty = extractedParty.replace(/\bdue\s*\d+\s*(days|day|நாள்|நாட்கள்)\b/ig, "");
    extractedParty = extractedParty.replace(/\blorry\s*[A-Z0-9\s]+\b/ig, "");
    extractedParty = extractedParty.replace(/\b(RNR|BPT|CO\s*55|White Ponni|Ponni|Broken|Rice)\b/ig, "");
    extractedParty = extractedParty.replace(/\s+/g, " ").trim();

    if (extractedParty.length > 1) {
      setParty(toTitleCase(extractedParty));
    }
  };

  const calculateTotal = () => {
    const numBags = Number(bags || 0);
    const numRate = Number(rate || 0);
    return numBags * numRate;
  };

  const handleSaveDraft = () => {
    if (!party || !variety || !bags || !rate) {
      alert("Please fill Party, Variety, Bags and Rate before saving.");
      return;
    }

    const newDraft: SalesDraft = {
      id: 'draft_' + Date.now(),
      date: salesDate,
      party,
      variety,
      bags: Number(bags),
      rate: Number(rate),
      lorry: lorry || '-',
      dueDays: Number(dueDays || 0),
      phone,
      total: calculateTotal()
    };

    const updated = [newDraft, ...savedDrafts];
    setSavedDrafts(updated);
    localStorage.setItem('skp_voice_drafts', JSON.stringify(updated));

    // Clear form
    setParty('');
    setBags('');
    setRate('');
    setLorry('');
    setDueDays('');
    setPhone('');
    alert("Sales draft saved locally!");
  };

  const handleClearForm = () => {
    setVoiceText('');
    setParty('');
    setBags('');
    setRate('');
    setLorry('');
    setDueDays('');
    setPhone('');
    setStatus('Cleared. Ready.');
  };

  const handleCopyWhatsApp = () => {
    const client = party || "Customer";
    const totalAmt = calculateTotal();
    const msg = `Vanakkam ${client},

Sales draft created from Sri Kannika Parameswari Modern Rice Mill.

Item: ${variety}
Bags: ${bags || 0} Bags
Rate: ₹${rate || 0}
Total Amount: ₹${totalAmt.toLocaleString("en-IN")}
Lorry No: ${lorry || '-'}
Due Credit: ${dueDays ? dueDays + ' Days' : 'No credit'}

Please verify. Thank you!`;

    navigator.clipboard.writeText(msg).then(() => {
      alert("WhatsApp message copied to clipboard!");
    }).catch(() => {
      alert("Error copying. Draft text:\n\n" + msg);
    });
  };

  // AI Insights Rule Engine
  const askAIInsight = (queryStr?: string) => {
    const q = (queryStr || aiQuestion || '').toLowerCase().trim();
    if (!q) {
      setAiAnswerTitle('Ready');
      setAiAnswerBody('Please select a question or type a query.');
      setAiTableHeads([]);
      setAiTableRows([]);
      setAiSuggestion('');
      return;
    }

    const t = new Date().toISOString().slice(0, 10);
    const m = t.slice(0, 7);

    // Question routers
    if (q.includes('today') && (q.includes('purchase') || q.includes('paddy'))) {
      const todayList = purchases.filter(x => x.date === t);
      const total = todayList.reduce((sum, x) => sum + (x.total || 0), 0);
      const net = todayList.reduce((sum, x) => sum + (x.net || 0), 0);
      const bagsCount = todayList.reduce((sum, x) => sum + (x.full || 0), 0);

      setAiAnswerTitle("Today's Paddy Purchases Summary");
      setAiAnswerBody(`Today (${t}), you recorded <b>${todayList.length}</b> purchase loads, totaling <b>${bagsCount}</b> bags (<b>${net.toFixed(1)} kg</b>) with a combined value of <b>${money(total)}</b>.`);
      setAiTableHeads(['Bill No', 'Supplier / Party', 'Variety', 'Vehicle', 'Bags', 'Amount']);
      setAiTableRows(todayList.map(x => [x.billNo, x.party, x.variety, x.lorryList || x.lorry || '-', x.full, money(x.total)]));
      setAiSuggestion(todayList.length ? "Ensure payments are scheduled for partial/pending bills before day close." : "No purchases recorded yet today.");
    } 
    else if (q.includes('month') && (q.includes('purchase') || q.includes('paddy'))) {
      const monthList = purchases.filter(x => String(x.date || '').startsWith(m));
      const total = monthList.reduce((sum, x) => sum + (x.total || 0), 0);
      const net = monthList.reduce((sum, x) => sum + (x.net || 0), 0);
      const bagsCount = monthList.reduce((sum, x) => sum + (x.full || 0), 0);

      setAiAnswerTitle(`Paddy Purchases for ${m}`);
      setAiAnswerBody(`This month, you secured <b>${monthList.length}</b> purchase loads, representing <b>${bagsCount}</b> bags (<b>${net.toFixed(0)} kg</b>) valued at <b>${money(total)}</b>.`);
      
      const supplierSummary: Record<string, { count: number; value: number }> = {};
      monthList.forEach(x => {
        supplierSummary[x.party] = supplierSummary[x.party] || { count: 0, value: 0 };
        supplierSummary[x.party].count++;
        supplierSummary[x.party].value += x.total || 0;
      });

      setAiTableHeads(['Supplier Name', 'Total Loads', 'Total Value']);
      setAiTableRows(Object.entries(supplierSummary).sort((a,b)=>b[1].value - a[1].value).map(x => [x[0], x[1].count, money(x[1].value)]));
      setAiSuggestion("Murugan Farms and Bala & Co remain your top suppliers this season.");
    }
    else if (q.includes('best') && q.includes('supplier')) {
      const supplierSums: Record<string, { value: number; bags: number; count: number }> = {};
      purchases.forEach(x => {
        supplierSums[x.party] = supplierSums[x.party] || { value: 0, bags: 0, count: 0 };
        supplierSums[x.party].value += x.total || 0;
        supplierSums[x.party].bags += x.full || 0;
        supplierSums[x.party].count++;
      });

      const sorted = Object.entries(supplierSums).sort((a,b) => b[1].value - a[1].value);
      if (sorted.length === 0) {
        setAiAnswerTitle("Best Supplier Analysis");
        setAiAnswerBody("No purchases found to determine the best supplier.");
        return;
      }

      setAiAnswerTitle("Best Supplier Analysis (By Total Purchase Value)");
      setAiAnswerBody(`Your primary supplier is <b>${sorted[0][0]}</b>, contributing <b>${sorted[0][1].count}</b> lots with a total purchase value of <b>${money(sorted[0][1].value)}</b>.`);
      setAiTableHeads(['Supplier Name', 'Lots Supplied', 'Total Bags', 'Purchase Value']);
      setAiTableRows(sorted.map(x => [x[0], x[1].count, x[1].bags, money(x[1].value)]));
      setAiSuggestion(`You can negotiate bulk parboiling discounts with ${sorted[0][0]} due to their dominant supply share.`);
    }
    else if (q.includes('pending') || q.includes('balance') || q.includes('payable')) {
      const pendingList = purchases.filter(x => x.balance > 0);
      const totalPending = pendingList.reduce((sum, x) => sum + x.balance, 0);

      setAiAnswerTitle("Outstanding Supplier Payables");
      setAiAnswerBody(`There are currently <b>${pendingList.length}</b> outstanding bills to pay, totaling <b>${money(totalPending)}</b>.`);
      
      const supMap: Record<string, number> = {};
      pendingList.forEach(x => {
        supMap[x.party] = (supMap[x.party] || 0) + x.balance;
      });

      setAiTableHeads(['Supplier Name', 'Oustanding Balance']);
      setAiTableRows(Object.entries(supMap).sort((a,b)=>b[1]-a[1]).map(x=>[x[0], money(x[1])]));
      setAiSuggestion("Consider clearing balances for smaller suppliers to minimize total outstanding accounts.");
    }
    else if (q.includes('variety') && (q.includes('purchase') || q.includes('paddy'))) {
      const varMap: Record<string, { count: number; bags: number; value: number }> = {};
      purchases.forEach(x => {
        varMap[x.variety] = varMap[x.variety] || { count: 0, bags: 0, value: 0 };
        varMap[x.variety].count++;
        varMap[x.variety].bags += x.full || 0;
        varMap[x.variety].value += x.total || 0;
      });

      setAiAnswerTitle("Variety-wise Paddy Purchases");
      setAiAnswerBody("Breakdown of paddy purchased by variety:");
      setAiTableHeads(['Variety', 'Loads', 'Total Bags', 'Purchase Value']);
      setAiTableRows(Object.entries(varMap).sort((a,b)=>b[1].bags - a[1].bags).map(x=>[x[0], x[1].count, x[1].bags, money(x[1].value)]));
      setAiSuggestion("RNR remains your highest volume variety, aligning with bulk market consumer demand.");
    }
    else if (q.includes('absent')) {
      const absents = attendance.filter(x => x.date === t && x.status === 'Absent');

      setAiAnswerTitle("Absent Employees Today");
      setAiAnswerBody(`Today (${t}), you have <b>${absents.length}</b> employee(s) absent.`);
      setAiTableHeads(['Absent Employee Name', 'Phone Number', 'Salary Type']);
      setAiTableRows(absents.map(x => {
        const emp = employees.find(e => e.name === x.employee);
        return [x.employee, emp?.phone || '-', emp?.salaryType || '-'];
      }));
      setAiSuggestion(absents.length ? "You may need to reorganize shift allocations to maintain parboiling yard throughput." : "Excellent! All workers are present today.");
    }
    else if (q.includes('yield') || q.includes('production')) {
      const completed = productions.filter(p => p.status === 'Completed');
      
      setAiAnswerTitle("Production Batch Yield Performance");
      setAiAnswerBody("Performance list of completed parboiling milling batches:");
      setAiTableHeads(['Date Finished', 'Batch No', 'Variety', 'Paddy Input (Bags)', 'Rice Output (Bags)', 'Yield %']);
      setAiTableRows(completed.map(x => [
        x.completionDate || x.date,
        x.batchNo,
        x.variety,
        x.paddyBags,
        x.totalRice,
        x.yieldPercent.toFixed(2) + '%'
      ]));
      setAiSuggestion("Any yield above 78% is excellent. Try to identify which supplier lots yield higher results.");
    }
    else {
      // Default / fallback search on paddy entries
      const matches = entries.filter(e => e.party.toLowerCase().includes(q) || e.variety.toLowerCase().includes(q));
      setAiAnswerTitle(`Search Results for "${q}"`);
      setAiAnswerBody(`Found <b>${matches.length}</b> matches in paddy entry logs:`);
      setAiTableHeads(['Date', 'Party', 'Lorry', 'Bags', 'Variety', 'Destination']);
      setAiTableRows(matches.map(x => [x.date, x.party, x.lorry, x.bags, x.variety, x.destination]));
      setAiSuggestion("Filter search term by supplier name or paddy variety for highly accurate reports.");
    }
  };

  const handleQuickQuestion = (question: string) => {
    setAiQuestion(question);
    askAIInsight(question);
  };

  const handleClearDrafts = () => {
    if (confirm("Clear all sales drafts from local storage?")) {
      setSavedDrafts([]);
      localStorage.removeItem('skp_voice_drafts');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* 🎤 AI Voice Sales Assistant */}
      <div className="flex flex-col gap-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h2 className="font-sans font-bold text-lg text-slate-800 flex items-center gap-2 mb-2">
            <span>{t("Voice-Enabled Sales Assistant")}</span>
          </h2>
          
          <div className="bg-orange-50/50 border-l-4 border-orange-500 rounded-xl p-4 mb-4 text-xs leading-relaxed text-orange-800">
            <span className="font-bold block mb-1">{t("Suggested Voice Format:")}</span>
            "Kumar Traders 100 bags RNR rate 1500 lorry TN15AB1234 due 15 days"<br />
            <span className="font-bold">Tamil/Thanglish:</span> "Bala & Co RNR variety 150 bags rate 1450"
          </div>

          <div className="mb-4">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t("Voice Text Capture")}</label>
            <textarea 
              value={voiceText}
              onChange={(e) => setVoiceText(e.target.value)}
              className="font-sans text-sm w-full p-3 border border-slate-200 rounded-xl focus:border-emerald-500 min-h-[80px]"
              placeholder={t("Captured spoken text will print here...")}
            />
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            <button 
              onClick={startVoice}
              disabled={isListening}
              className={`py-3 px-4 rounded-xl text-white font-bold text-sm shadow flex items-center gap-2 ${isListening ? 'bg-slate-400' : 'bg-emerald-600 hover:bg-emerald-700'}`}
            >
              {isListening ? t('Listening...') : t('Start Voice')}
            </button>
            <button 
              onClick={stopVoice}
              disabled={!isListening}
              className="py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow"
            >
              {t("Stop")}
            </button>
            <button 
              onClick={() => parseText(voiceText)}
              className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm border border-slate-200"
            >
              {t("Auto Fill Form")}
            </button>
            <button 
              onClick={handleClearForm}
              className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 font-semibold text-sm"
            >
              {t("Clear")}
            </button>
          </div>

          <div className="p-3 bg-emerald-50 rounded-xl text-xs font-bold text-emerald-800 mb-6">
            {t("Status")}: {t(status)}
          </div>

          <h3 className="font-sans font-bold text-base text-slate-700 mb-4 border-b border-slate-100 pb-2">{t("Sales draft compiler")}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">{t("Party Name")}</label>
              <input 
                type="text"
                value={party}
                onChange={(e) => setParty(e.target.value)}
                placeholder="Kumar Traders"
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring focus:ring-emerald-100 text-sm font-semibold"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">{t("Variety / Item")}</label>
              <select 
                value={variety}
                onChange={(e) => setVariety(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring focus:ring-emerald-100 text-sm font-semibold"
              >
                <option value="RNR Rice">{t("RNR Rice")}</option>
                <option value="BPT Rice">{t("BPT Rice")}</option>
                <option value="CO 55 Rice">{t("CO 55 Rice")}</option>
                <option value="White Ponni Rice">{t("White Ponni Rice")}</option>
                <option value="Broken Rice">{t("Broken Rice")}</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">{t("No. of Bags")}</label>
              <input 
                type="number"
                value={bags}
                onChange={(e) => setBags(e.target.value)}
                placeholder="100"
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring focus:ring-emerald-100 text-sm font-semibold"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">{t("Rate per Bag (₹)")}</label>
              <input 
                type="number"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                placeholder="1500"
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring focus:ring-emerald-100 text-sm font-semibold"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">{t("Lorry No")}</label>
              <input 
                type="text"
                value={lorry}
                onChange={(e) => setLorry(e.target.value)}
                placeholder="TN15AB1234"
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring focus:ring-emerald-100 text-sm font-semibold"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">{t("Due Days")}</label>
              <input 
                type="number"
                value={dueDays}
                onChange={(e) => setDueDays(e.target.value)}
                placeholder="15"
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring focus:ring-emerald-100 text-sm font-semibold"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">{t("Phone / WhatsApp")}</label>
              <input 
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="9876543210"
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring focus:ring-emerald-100 text-sm font-semibold"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">{t("Sales Date")}</label>
              <input 
                type="date"
                value={salesDate}
                onChange={(e) => setSalesDate(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring focus:ring-emerald-100 text-sm font-semibold"
              />
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center justify-between mb-6">
            <span className="text-emerald-800 font-bold text-sm">{t("Estimated Total Amount:")}</span>
            <b className="text-emerald-700 text-lg font-black">{money(calculateTotal())}</b>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={handleSaveDraft}
              className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow transition"
            >
              {t("Save Sales Draft")}
            </button>
            <button 
              onClick={handleCopyWhatsApp}
              className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow transition"
            >
              {t("Copy WhatsApp Note")}
            </button>
          </div>
        </div>

        {/* Saved Local Drafts List */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-sans font-bold text-base text-slate-800">{t("Saved Local Sales Drafts")}</h3>
            {savedDrafts.length > 0 && (
              <button onClick={handleClearDrafts} className="text-xs font-bold text-red-600 hover:text-red-800">
                {t("Clear All")}
              </button>
            )}
          </div>
          <p className="text-xs text-slate-500 mb-4 leading-relaxed">
            {t("These drafts are saved to your browser session storage. You can verify and load them into customer invoicing modules later.")}
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-slate-600 border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold">
                  <th className="p-2.5 text-left">{t("Date")}</th>
                  <th className="p-2.5 text-left">{t("Party")}</th>
                  <th className="p-2.5 text-left">{t("Variety")}</th>
                  <th className="p-2.5 text-right">{t("Bags")}</th>
                  <th className="p-2.5 text-right">{t("Rate")}</th>
                  <th className="p-2.5 text-right">{t("Total")}</th>
                </tr>
              </thead>
              <tbody>
                {savedDrafts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-slate-400">{t("No sales drafts created yet. Try the voice input!")}</td>
                  </tr>
                ) : (
                  savedDrafts.map((d, i) => (
                    <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="p-2.5 font-semibold">{fmtDate(d.date)}</td>
                      <td className="p-2.5 font-bold text-slate-800">{d.party}</td>
                      <td className="p-2.5 font-semibold">{d.variety}</td>
                      <td className="p-2.5 text-right font-black">{d.bags}</td>
                      <td className="p-2.5 text-right font-bold text-red-600">{money(d.rate)}</td>
                      <td className="p-2.5 text-right font-black text-emerald-700">{money(d.total)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Operational Business Insights Trial */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col gap-6">
        <div>
          <h2 className="font-sans font-bold text-lg text-slate-800 flex items-center gap-2 mb-1">
            <span>{t("Operational Insights Business Dashboard")}</span>
          </h2>
          <p className="text-xs text-slate-500">
            {t("Ask simple questions about your mill database. The rule engine generates instant financial reports, supplier analyses, and stock recommendation logs.")}
          </p>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">{t("Ask a Question")}</label>
          <div className="flex gap-2">
            <input 
              type="text"
              value={aiQuestion}
              onChange={(e) => setAiQuestion(e.target.value)}
              placeholder={t("e.g., who is our best supplier?")}
              onKeyDown={(e) => e.key === 'Enter' && askAIInsight()}
              className="flex-1 p-3 border border-slate-200 rounded-xl focus:border-emerald-500 text-sm font-semibold"
            />
            <button 
              onClick={() => askAIInsight()}
              className="py-3 px-5 rounded-xl bg-emerald-600 text-white font-bold text-sm shadow hover:bg-emerald-700 transition"
            >
              {t("Analyze")}
            </button>
            <button 
              onClick={() => { setAiQuestion(''); askAIInsight(''); }}
              className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 font-semibold text-sm border border-slate-200"
            >
              {t("Reset")}
            </button>
          </div>
        </div>

        {/* Quick Questions Buttons */}
        <div>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">{t("Quick Reports")}</span>
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'Today Purchases', q: 'today purchase summary' },
              { label: 'This Month Purchases', q: 'this month purchase summary' },
              { label: 'Best Supplier', q: 'who is the best supplier' },
              { label: 'Variety Purchase', q: 'variety wise purchase' },
              { label: 'Pending Balances', q: 'pending payments' },
              { label: 'Paddy Stock Levels', q: 'stock levels' },
              { label: 'Paddy Reorder recommendation', q: 'purchase recommendation' },
              { label: 'Milling Yield Batch', q: 'best yield batch' },
              { label: 'Milling Batches Month', q: 'production summary' },
              { label: 'Absent Workers Today', q: 'absent employees today' }
            ].map((item, idx) => (
              <button 
                key={idx}
                onClick={() => handleQuickQuestion(item.q)}
                className="py-2 px-3 rounded-lg bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 text-slate-700 font-bold text-xs"
              >
                {t(item.label)}
              </button>
            ))}
          </div>
        </div>

        {/* AI Answer Card Output */}
        <div className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-5">
          <h3 className="font-sans font-bold text-base text-slate-800 mb-2">{t(aiAnswerTitle)}</h3>
          <p className="text-sm text-slate-700 leading-relaxed mb-4" dangerouslySetInnerHTML={{ __html: t(aiAnswerBody) }} />

          {/* AI Result Table */}
          {aiTableRows.length > 0 && (
            <div className="overflow-x-auto max-h-[280px] border border-emerald-100 rounded-xl mb-4">
              <table className="w-full text-xs text-slate-600 border-collapse bg-white">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 font-bold text-slate-600 text-center">
                    {aiTableHeads.map((h, i) => (
                      <th key={i} className="p-2 border-r border-slate-200 last:border-r-0">{t(h)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {aiTableRows.map((row, rowIdx) => (
                    <tr key={rowIdx} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50">
                      {row.map((cell, cellIdx) => (
                        <td key={cellIdx} className="p-2 border-r border-slate-100 last:border-r-0 font-semibold">{t(cell)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {aiSuggestion && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-bold leading-relaxed">
              {t("Suggestion Note:")} {t(aiSuggestion)}
            </div>
          )}
        </div>
      </div>
      
    </div>
  );
};
