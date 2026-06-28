import React from 'react';
import { PaddyPurchase } from '../types';
import { useTranslation } from '../context/LanguageContext';

interface LorryPrintModalProps {
  purchase: PaddyPurchase;
  onClose: () => void;
}

export const LorryPrintModal: React.FC<LorryPrintModalProps> = ({ purchase, onClose }) => {
  const { t } = useTranslation();
  const money = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN');
  const fmtDate = (v: string) => {
    if (!v) return '';
    const parts = v.split('-');
    if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
    return v;
  };

  const getVehicleDisplay = (x: PaddyPurchase) => {
    const list = x.extraLoads && x.extraLoads.length ? x.extraLoads : [];
    const nos = list.map(a => String(a.lorry || '').trim()).filter(Boolean);
    if (nos.length) return [...new Set(nos)].join(', ');
    return x.lorryList || x.lorry || '-';
  };

  const spotPaid = Math.max(0, (purchase.paid || 0) - (purchase.balancePaid || 0));
  const payableBal = Math.max(0, (purchase.total || 0) - spotPaid);
  const statusKey = String(purchase.status || 'Pending').toLowerCase();
  
  const getStatusLabel = () => {
    if (statusKey === 'paid') return 'PAYMENT COMPLETED';
    if (statusKey === 'partial') return 'PARTIAL PAYMENT';
    return 'PAYMENT PENDING';
  };

  const getStatusBg = () => {
    if (statusKey === 'paid') return '#d9f7d9';
    if (statusKey === 'partial') return '#fff3cd';
    return '#ffd6d6';
  };

  const getStatusColor = () => {
    if (statusKey === 'paid') return '#008000';
    if (statusKey === 'partial') return '#d97706';
    return '#d01818';
  };

  const handlePrint = () => {
    const printContent = document.getElementById('printable-receipt-area');
    if (!printContent) return;
    const originalContent = document.body.innerHTML;
    document.body.innerHTML = printContent.innerHTML;
    window.print();
    // Restore original content
    document.body.innerHTML = originalContent;
    window.location.reload(); // Quick refresh to re-bind React events cleanly
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-sans font-bold text-lg text-slate-800">{t("Print Purchase Slip")}</h3>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-full hover:bg-slate-100"
          >
            ✕
          </button>
        </div>

        <div className="flex gap-2 justify-center mb-6">
          <button 
            onClick={handlePrint} 
            className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition"
          >
            {t("Print / Save PDF")}
          </button>
          <button 
            onClick={onClose} 
            className="py-3 px-4 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition"
          >
            {t("Close")}
          </button>
        </div>

        <div id="printable-receipt-area" className="flex justify-center p-2 bg-slate-50 border border-slate-200 rounded-xl overflow-x-auto">
          <div className="bg-white border-1.5 border-black p-4 text-black font-mono w-[78mm] max-w-[78mm] text-xs">
            <div className="text-center border-b-1.5 border-black pb-1.5 mb-2">
              <h2 className="text-sm font-bold m-0 leading-tight">ஸ்ரீ கன்னிகா பரமேஸ்வரி மாடர்ன் ரைஸ் மில்</h2>
              <h3 className="text-xs m-0.5 font-bold">கள்ளக்குறிச்சி</h3>
              <p className="m-0 text-[10px]">PHONE - 04151 294870</p>
            </div>

            <table className="w-full border-collapse text-[10px] table-fixed">
              <tbody>
                <tr>
                  <td colSpan={5} className="py-1">
                    <div className="flex justify-between items-center gap-1">
                      <span className="font-bold text-red-600 whitespace-nowrap">{fmtDate(purchase.date)}</span>
                      <span className="font-bold text-emerald-600 whitespace-nowrap">Gunny: {purchase.secondItem && purchase.gunny2 && purchase.gunny2 !== purchase.gunny ? `${purchase.gunny} / ${purchase.gunny2} KG` : `${purchase.gunny} KG`}</span>
                      <span className="font-bold text-right ml-auto whitespace-nowrap">{purchase.party}</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="font-bold bg-slate-100 border border-black p-1">விலை</td>
                  <td className="font-black text-red-600 border border-black p-1 text-[11px]">{money(purchase.rate)}</td>
                  <td className="font-bold bg-slate-100 border border-black p-1">பில் எண்:</td>
                  <td colSpan={2} className="font-black text-red-600 border border-black p-1 text-center">{purchase.billNo}</td>
                </tr>
                <tr>
                  <td colSpan={3} className="font-black border border-black p-1 text-xs truncate break-all">{getVehicleDisplay(purchase)}</td>
                  <td className="font-bold bg-slate-100 border border-black p-1">நிகர் எடை</td>
                  <td className="font-black text-red-600 border border-black p-1 text-right">{Number(purchase.net || 0).toFixed(1)}</td>
                </tr>
                <tr className="font-bold text-center bg-slate-100">
                  <td className="border border-black p-1">விலை</td>
                  <td className="border border-black p-1">விபரம்</td>
                  <td className="border border-black p-1">மூட்டை</td>
                  <td className="border border-black p-1">கிலோ</td>
                  <td className="border border-black p-1 text-right">ரூபாய்</td>
                </tr>
                
                {/* First Variety Row */}
                <tr>
                  <td className="border border-black p-1 font-bold text-red-600 text-center">{money(purchase.rate)}</td>
                  <td className="border border-black p-1 font-bold truncate">{purchase.variety}</td>
                  <td className="border border-black p-1 text-center font-bold">{purchase.full}</td>
                  <td className="border border-black p-1 text-center font-bold">{Number(purchase.left || 0).toFixed(1)}</td>
                  <td className="border border-black p-1 text-right font-bold">{money(purchase.paddyValue)}</td>
                </tr>

                {/* Second Variety Row */}
                {purchase.secondItem && (
                  <tr>
                    <td className="border border-black p-1 font-bold text-red-600 text-center">{money(purchase.rate2 || 0)}</td>
                    <td className="border border-black p-1 font-bold truncate">{purchase.variety2}</td>
                    <td className="border border-black p-1 text-center font-bold">{purchase.full2 || 0}</td>
                    <td className="border border-black p-1 text-center font-bold">{Number(purchase.left2 || 0).toFixed(1)}</td>
                    <td className="border border-black p-1 text-right font-bold">{money(purchase.paddyValue2 || 0)}</td>
                  </tr>
                )}

                {/* Freight */}
                {!!purchase.freight && (
                  <tr>
                    <td colSpan={4} className="font-bold bg-slate-100 border border-black p-1 text-right">வாடகை</td>
                    <td className="border border-black p-1 text-right font-bold">{money(purchase.freight)}</td>
                  </tr>
                )}

                {/* Unload & commission */}
                {!!purchase.unload && (
                  <tr>
                    <td colSpan={4} className="font-bold bg-slate-100 border border-black p-1 text-right">கூலி + கமிஷன்</td>
                    <td className="border border-black p-1 text-right font-bold">{money(purchase.unload)}</td>
                  </tr>
                )}

                {/* Food */}
                {!!purchase.food && (
                  <tr>
                    <td colSpan={4} className="font-bold bg-slate-100 border border-black p-1 text-right">சாப்பாடு</td>
                    <td className="border border-black p-1 text-right font-bold">{money(purchase.food)}</td>
                  </tr>
                )}

                {/* Cess */}
                {!!purchase.cess && (
                  <tr>
                    <td colSpan={4} className="font-bold bg-slate-100 border border-black p-1 text-right">CESS / OTHER</td>
                    <td className="border border-black p-1 text-right font-bold">{money(purchase.cess)}</td>
                  </tr>
                )}

                {/* Total */}
                <tr>
                  <td colSpan={4} className="font-bold bg-emerald-50 border border-black p-1 text-right text-emerald-700">மொத்தம்</td>
                  <td className="border border-black p-1 text-right font-black text-emerald-700 text-xs">{money(purchase.total)}</td>
                </tr>

                {/* Paid */}
                <tr>
                  <td colSpan={4} className="font-bold bg-slate-100 border border-black p-1 text-right">உடன்பற்று / PAID</td>
                  <td className="border border-black p-1 text-right font-black text-red-600 text-xs">{money(spotPaid)}</td>
                </tr>

                {/* To pay */}
                <tr>
                  <td colSpan={4} className="font-bold bg-slate-100 border border-black p-1 text-right">TO PAY / பாக்கி</td>
                  <td className="border border-black p-1 text-right font-black text-xs">{money(payableBal)}</td>
                </tr>

                {/* Balance payments history if any */}
                {purchase.balancePaid && purchase.balancePaid > 0 && (
                  <tr>
                    <td colSpan={4} className="font-bold bg-slate-100 border border-black p-1 text-right text-[9px] leading-tight">
                      பாக்கி செலுத்தியது: <b>{money(purchase.balancePaid)}</b><br />
                      <small className="font-normal text-slate-600">
                        {fmtDate(purchase.lastBalancePaidDate || '')} | {(purchase.lastPaymentMode || '').toUpperCase()}
                        {purchase.lastPaidThrough ? ` | ${purchase.lastPaidThrough}` : ''}
                      </small>
                    </td>
                    <td className="border border-black p-1 text-right font-black text-slate-700 text-[11px]">
                      {money(purchase.balancePaid)}
                    </td>
                  </tr>
                )}

                {/* Status banner block */}
                <tr>
                  <td colSpan={5} className="p-1 border border-black">
                    <div 
                      className="text-center font-black p-1 border-2 border-black rounded-lg text-xs"
                      style={{
                        backgroundColor: getStatusBg(),
                        color: getStatusColor()
                      }}
                    >
                      {getStatusLabel()}
                    </div>
                    <div className="text-[10px] text-center mt-1 font-bold">
                      Balance Amount : {money(purchase.balance)}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
