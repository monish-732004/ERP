import React, { useState } from 'react';
import { Employee, Attendance } from '../types';
import { useTranslation } from '../context/LanguageContext';

interface AttendanceTrackerProps {
  employees: Employee[];
  attendance: Attendance[];
  onAddEmployee: (emp: Omit<Employee, 'id'>) => Promise<void>;
  onUpdateEmployee: (id: string, emp: Partial<Employee>) => Promise<void>;
  onAddAttendance: (att: Omit<Attendance, 'id'>) => Promise<void>;
  onDeleteDoc: (col: string, id: string) => Promise<void>;
}

export const AttendanceTracker: React.FC<AttendanceTrackerProps> = ({
  employees,
  attendance,
  onAddEmployee,
  onUpdateEmployee,
  onAddAttendance,
  onDeleteDoc
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

  const cleanText = (s: string) => String(s || '').toLowerCase().trim();

  // Form Attendance Tile Mode
  const [atDate, setAtDate] = useState(today());
  const [atSearch, setAtSearch] = useState('');
  const [atEmpFilter, setAtEmpFilter] = useState('');
  const [atStatusFilter, setAtStatusFilter] = useState('');
  const [atMonthFilter, setAtMonthFilter] = useState(today().slice(0, 7));

  // Employee Master Form
  const [empName, setEmpName] = useState('');
  const [empPhone, setEmpPhone] = useState('');
  const [empSalaryType, setEmpSalaryType] = useState<'Daily Wage' | 'Monthly Salary'>('Daily Wage');
  const [empShift, setEmpShift] = useState<'General' | '12 Hr' | '24 Hr'>('General');
  const [empSalary, setEmpSalary] = useState('');
  const [editingEmployeeId, setEditingEmployeeId] = useState('');

  // Daily attendance details
  const attendanceFor = (empName: string, date: string) => {
    return attendance.find(a => a.employee === empName && a.date === date);
  };

  const wageForEmployeeStatus = (emp: Employee, status: string) => {
    let wage = 0;
    const dailyRate = emp.salaryType === 'Monthly Salary' ? (emp.salary / 30) : emp.salary;
    if (status === 'Present') wage = dailyRate;
    if (status === 'Half Day') wage = dailyRate / 2;
    return wage;
  };

  const setTileAttendance = async (empName: string, status: 'Present' | 'Absent' | 'Half Day') => {
    const emp = employees.find(e => e.name === empName);
    if (!emp) return;
    const date = atDate || today();
    const wage = wageForEmployeeStatus(emp, status);
    const existing = attendanceFor(empName, date);

    const data: Omit<Attendance, 'id'> = {
      date,
      employee: empName,
      status,
      wage,
      voiceConfirmed: false,
      photo: '',
      tileMode: true
    };

    if (existing) {
      // Overwrite / Update
      await onUpdateEmployee(existing.id, data as any); // We can route updates to the database
    } else {
      await onAddAttendance(data);
    }
  };

  const markAllPresentToday = async () => {
    if (!employees.length) {
      alert("Please add employees first.");
      return;
    }
    if (!confirm(`Mark all ${employees.length} employees as Present for ${fmtDate(atDate)}?`)) return;
    
    for (const emp of employees) {
      const date = atDate || today();
      const wage = wageForEmployeeStatus(emp, 'Present');
      const existing = attendanceFor(emp.name, date);
      const data: Omit<Attendance, 'id'> = {
        date,
        employee: emp.name,
        status: 'Present',
        wage,
        voiceConfirmed: false,
        photo: '',
        tileMode: true
      };
      if (existing) {
        await onUpdateEmployee(existing.id, data as any);
      } else {
        await onAddAttendance(data);
      }
    }
    alert("All marked present!");
  };

  const clearTodayAttendance = async () => {
    const date = atDate || today();
    const todayList = attendance.filter(x => x.date === date);
    if (todayList.length === 0) {
      alert("No attendance marked for this date.");
      return;
    }
    if (!confirm(`Clear all marked attendance for ${fmtDate(date)}?`)) return;

    for (const item of todayList) {
      await onDeleteDoc('attendance', item.id);
    }
    alert("Daily log cleared.");
  };

  // Salary and automatic leave multipliers
  const companyLeaveCalc = (emp: Employee, present: number, absent: number, half: number) => {
    const autoLeave = 2; // Automatic 2 paid days company leave per month
    const shift = String(emp.shiftType || 'General').toLowerCase();
    const is24 = shift.includes('24');
    
    // 24 Hr Shift multiplier rule
    const presentFactor = is24 ? 2 : 1;
    const halfFactor = is24 ? 1 : 0.5;

    const presentPaid = present * presentFactor;
    const halfPaid = half * halfFactor;
    const workingPaid = presentPaid + halfPaid;
    const rawPayable = workingPaid + autoLeave;

    // Mill cap: max payable days is 28 including auto leave
    const payable = Math.min(28, rawPayable);
    const unpaidAbsent = Math.max(0, absent - autoLeave);
    const dailyRate = emp.salaryType === 'Monthly Salary' ? (emp.salary / 30) : emp.salary;
    const finalWage = dailyRate * payable;

    return {
      autoLeave,
      unpaidAbsent,
      payable,
      wage: finalWage,
      is24,
      presentPaid,
      halfPaid,
      workingPaid
    };
  };

  // View Printable Monthly Statement for All
  const viewMonthlyAllSheet = () => {
    const month = atMonthFilter || today().slice(0, 7);
    const parts = month.split('-').map(Number);
    const yy = parts[0], mm = parts[1];
    const daysInMonth = new Date(yy, mm, 0).getDate();

    const dayHeads = [];
    for (let d = 1; d <= daysInMonth; d++) dayHeads.push(`<th>${d}</th>`);

    let grandWage = 0, grandPresent = 0, grandAbsent = 0;

    const bodyRows = employees.map((emp, idx) => {
      let present = 0, absent = 0, half = 0;
      const vals = [];

      for (let d = 1; d <= daysInMonth; d++) {
        const dStr = month + '-' + String(d).padStart(2, '0');
        const rec = attendanceFor(emp.name, dStr);
        const status = rec ? rec.status : '';
        let sym = '';
        if (status === 'Present') { sym = 'P'; present++; }
        else if (status === 'Absent') { sym = 'A'; absent++; }
        else if (status === 'Half Day') { sym = 'H'; half++; }

        const cls = status === 'Present' ? 'p' : status === 'Absent' ? 'a' : status === 'Half Day' ? 'h' : 'n';
        vals.push(`<td class="${cls}">${sym}</td>`);
      }

      const cl = companyLeaveCalc(emp, present, absent, half);
      grandWage += cl.wage; grandPresent += present; grandAbsent += absent;

      return `<tr>
        <td>${idx+1}</td>
        <td class="name">${emp.name}<br><small>${emp.shiftType}</small></td>
        ${vals.join('')}
        <td>${present}</td>
        <td>${absent}</td>
        <td>${half}</td>
        <td>${cl.autoLeave}</td>
        <td>${cl.unpaidAbsent}</td>
        <td class="tot">${cl.payable}</td>
        <td class="tot font-bold">${money(cl.wage)}</td>
      </tr>`;
    }).join('');

    const html = `<!DOCTYPE html><html><head><title>All Employees Monthly Sheet</title><style>
      @page{size:A4 landscape;margin:6mm} body{font-family:Arial,sans-serif;margin:0;color:#111}
      h2{margin:0;text-align:center;font-size:16px} .sub{text-align:center;font-size:11px;margin-bottom:6px}
      table{width:100%;border-collapse:collapse;font-size:9px} th,td{border:1px solid #111;text-align:center;padding:3.5px}
      th{background:#eaf4ff} .name{text-align:left;font-weight:900;min-width:110px}
      .p{background:#eafaf1;color:#0b8f62;font-weight:900} .a{background:#ffecec;color:#c0392b;font-weight:900}
      .h{background:#fff8df;color:#b9770e;font-weight:900} .n{color:#bbb} .tot{font-weight:900;background:#f9fafb}
      .summary{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;font-size:11px;margin-top:10px}
      .sum-box{border:1px solid #222;padding:6px;border-radius:6px} .btn{display:inline-block;padding:8px;background:#0874d8;color:#fff;border-radius:6px;border:0;font-weight:800;cursor:pointer}
      @media print{.toolbar{display:none} body{zoom:.94}}
    </style></head><body><div style="padding:10px">
      <div class="toolbar" style="text-align:center;margin-bottom:10px"><button class="btn" onclick="window.print()">Print / Save PDF</button></div>
      <h2>ஸ்ரீ கன்னிகா பரமேஸ்வரி மாடர்ன் ரைஸ் மில்</h2>
      <div class="sub">All Employees Monthly Ledger Sheet - ${month}</div>
      <table>
        <thead>
          <tr>
            <th>S.No</th><th class="name">Employee</th>${dayHeads.join('')}
            <th>P</th><th>A</th><th>H</th><th>Co. L</th><th>Unpaid A</th><th>Payable</th><th>Payout</th>
          </tr>
        </thead>
        <tbody>${bodyRows}</tbody>
      </table>
      <div class="summary">
        <div class="sum-box"><b>Total Employees</b><br>${employees.length}</div>
        <div class="sum-box"><b>Total Monthly Payout</b><br>${money(grandWage)}</div>
        <div class="sum-box"><b>Average Present Ratio</b><br>${(grandPresent / (grandPresent + grandAbsent || 1) * 100).toFixed(1)}%</div>
        <div class="sum-box"><b>Company Leave Included</b><br>2 Days Per Employee</div>
        <div class="sum-box"><b>Wage Cap Limit</b><br>Max 28 Paid Days</div>
      </div>
    </div></body></html>`;

    const w = window.open('', '_blank');
    w?.document.write(html);
    w?.document.close();
  };

  // Single Employee Statement View
  const viewSingleEmployeeSheet = (empName: string) => {
    const emp = employees.find(e => e.name === empName);
    if (!emp) return;
    const month = atMonthFilter || today().slice(0, 7);
    const parts = month.split('-').map(Number);
    const yy = parts[0], mm = parts[1];
    const daysInMonth = new Date(yy, mm, 0).getDate();

    let present = 0, absent = 0, half = 0, notMarked = 0;
    const dayRows = [];

    for (let d = 1; d <= daysInMonth; d++) {
      const dStr = month + '-' + String(d).padStart(2, '0');
      const rec = attendanceFor(empName, dStr);
      const status = rec ? rec.status : 'Not Marked';
      let sym = '-';
      if (status === 'Present') { sym = 'P'; present++; }
      else if (status === 'Absent') { sym = 'A'; absent++; }
      else if (status === 'Half Day') { sym = 'H'; half++; }
      else { notMarked++; }

      dayRows.push({ d, date: dStr, status, sym, wage: rec ? rec.wage : 0 });
    }

    const cl = companyLeaveCalc(emp, present, absent, half);
    const dayHeads = dayRows.map(r => `<th>${r.d}</th>`).join('');
    const dayVals = dayRows.map(r => {
      const cls = r.status === 'Present' ? 'p' : r.status === 'Absent' ? 'a' : r.status === 'Half Day' ? 'h' : 'n';
      return `<td class="${cls}">${r.sym}</td>`;
    }).join('');

    const html = `<!DOCTYPE html><html><head><title>${empName} Statement</title><style>
      body{font-family:Arial,sans-serif;margin:0;padding:12px;color:#111}
      h2{margin:0;text-align:center;font-size:16px} .sub{text-align:center;font-size:11px;margin-bottom:10px}
      .meta{display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:12px;margin-bottom:10px}
      table{width:100%;border-collapse:collapse;font-size:10px} th,td{border:1px solid #111;text-align:center;padding:5px}
      th{background:#eaf4ff} .name{text-align:left;font-weight:900}
      .p{background:#eafaf1;color:#0b8f62;font-weight:900} .a{background:#ffecec;color:#c0392b;font-weight:900}
      .h{background:#fff8df;color:#b9770e;font-weight:900} .n {color:#bbb}
      .summary{margin-top:12px;display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:12px}
      .box{border:1px solid #222;padding:8px;border-radius:6px} .btn{padding:8px;background:#0874d8;color:#fff;border-radius:6px;border:0;font-weight:800;cursor:pointer}
      @media print{.toolbar{display:none}}
    </style></head><body>
      <div class="toolbar" style="text-align:center;margin-bottom:10px"><button class="btn" onclick="window.print()">Print Statement</button></div>
      <h2>ஸ்ரீ கன்னிகா பரமேஸ்வரி மாடர்ன் ரைஸ் மில்</h2>
      <div class="sub">Milling Employee Attendance & Wage Sheet - ${month}</div>
      <div class="meta">
        <div class="box"><b>Employee Name:</b> ${empName}<br><b>Phone:</b> ${emp.phone || '-'}<br><b>Shift Length:</b> ${emp.shiftType}</div>
        <div class="box"><b>Salary Grade:</b> ${money(emp.salary)} (${emp.salaryType})<br><b>Daily Rate Equivalent:</b> ${money(emp.salaryType === 'Monthly Salary' ? emp.salary/30 : emp.salary)}</div>
      </div>
      <table>
        <thead><tr><th class="name">Employee</th>${dayHeads}<th>P</th><th>A</th><th>H</th><th>Co.L</th><th>Unpaid</th><th>Payable</th><th>Payout</th></tr></thead>
        <tbody>
          <tr>
            <td class="name">${empName}</td>${dayVals}<td>${present}</td><td>${absent}</td><td>${half}</td><td>${cl.autoLeave}</td><td>${cl.unpaidAbsent}</td><td><b>${cl.payable}</b></td><td><b>${money(cl.wage)}</b></td>
          </tr>
        </tbody>
      </table>
      <div class="summary">
        <div class="box">
          <b>Summary stats:</b><br />
          Present days: <b>${present}</b><br />
          Absent days: <b>${absent}</b><br />
          Half days worked: <b>${half}</b><br />
          Unmarked: <b>${notMarked}</b>
        </div>
        <div class="box">
          <b>Calculated Salary:</b><br />
          Present Days: ${cl.is24 ? `${present} × 2 (Shift Factor) = ${cl.presentPaid} days` : `${present} days`}<br />
          Half Days: ${cl.is24 ? `${half} × 1 = ${cl.halfPaid} days` : `${half} × 0.5 = ${cl.halfPaid} days`}<br />
          Company Leave: <b>+${cl.autoLeave} days</b><br />
          <b>Total Payout: ${money(cl.wage)} for ${cl.payable} payable days</b> (capped at 28)
        </div>
      </div>
    </body></html>`;

    const w = window.open('', '_blank');
    w?.document.write(html);
    w?.document.close();
  };

  const handleSaveEmployee = async () => {
    const name = empName.trim();
    const phone = empPhone.trim();
    const salary = Number(empSalary || 0);

    if (!name || !salary) {
      alert("Please fill name and wage details.");
      return;
    }

    if (editingEmployeeId) {
      await onUpdateEmployee(editingEmployeeId, {
        name,
        phone,
        salaryType: empSalaryType,
        shiftType: empShift,
        salary
      });
      setEditingEmployeeId('');
      alert("Employee profile updated!");
    } else {
      const maxOrder = employees.reduce((m, e) => Math.max(m, e.sortOrder || 0), 0);
      await onAddEmployee({
        name,
        phone,
        salaryType: empSalaryType,
        shiftType: empShift,
        salary,
        sortOrder: maxOrder + 1
      });
      alert("Employee added successfully!");
    }

    setEmpName('');
    setEmpPhone('');
    setEmpSalary('');
    setEmpSalaryType('Daily Wage');
    setEmpShift('General');
  };

  const handleEditEmployee = (emp: Employee) => {
    setEditingEmployeeId(emp.id);
    setEmpName(emp.name);
    setEmpPhone(emp.phone || '');
    setEmpSalaryType(emp.salaryType);
    setEmpShift(emp.shiftType);
    setEmpSalary(String(emp.salary));
  };

  const handleOrderChange = async (emp: Employee, dir: number) => {
    const idx = employees.findIndex(e => e.id === emp.id);
    const targetIdx = idx + dir;
    if (idx < 0 || targetIdx < 0 || targetIdx >= employees.length) return;

    const b = employees[targetIdx];
    const orderA = emp.sortOrder || idx + 1;
    const orderB = b.sortOrder || targetIdx + 1;

    await onUpdateEmployee(emp.id, { sortOrder: orderB });
    await onUpdateEmployee(b.id, { sortOrder: orderA });
  };

  const getFilteredTiles = () => {
    const q = cleanText(atSearch);
    const date = atDate || today();
    return employees.filter(emp => {
      const rec = attendanceFor(emp.name, date);
      const st = rec ? rec.status : 'Not Marked';
      return (!q || cleanText(emp.name + ' ' + st).includes(q)) && 
             (!atEmpFilter || emp.name === atEmpFilter) && 
             (!atStatusFilter || st === atStatusFilter);
    });
  };

  const tiles = getFilteredTiles();
  const todayList = attendance.filter(x => x.date === (atDate || today()));
  const todayPresent = todayList.filter(x => x.status === 'Present').length;
  const todayAbsent = todayList.filter(x => x.status === 'Absent').length;
  const todayHalf = todayList.filter(x => x.status === 'Half Day').length;

  return (
    <div className="space-y-8">
      
      {/* ================= DAILY BOARD ATTENDANCE ================= */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-wrap justify-between items-center gap-4 border-b border-slate-100 pb-4 mb-6">
          <div>
            <h2 className="font-sans font-bold text-lg text-slate-800">{t("Milling Attendance Yard Board")}</h2>
            <p className="text-xs text-slate-400">{t("Daily labor tracking. Use the \"Mark All Present\" button for bulk shifts, and adjust exceptions.")}</p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">{t("Daily Date")}</label>
            <input 
              type="date"
              value={atDate}
              onChange={(e) => setAtDate(e.target.value)}
              className="p-2 border border-slate-200 rounded-xl text-sm font-semibold focus:border-emerald-500 text-slate-800"
            />
          </div>
        </div>

        {/* Master Control buttons */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button 
            onClick={markAllPresentToday}
            className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow"
          >
            {t("Mark All Present")}
          </button>
          <button 
            onClick={clearTodayAttendance}
            className="py-2.5 px-4 rounded-xl bg-red-100 hover:bg-red-200 text-red-700 font-bold text-xs"
          >
            {t("Clear Today Attendance")}
          </button>
          <button 
            onClick={viewMonthlyAllSheet}
            className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow"
          >
            {t("Monthly Payout Sheet")}
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 mb-6">
          <input 
            type="text"
            placeholder={t("Search employee / status...")}
            value={atSearch}
            onChange={(e) => setAtSearch(e.target.value)}
            className="p-2.5 border border-slate-200 rounded-xl text-xs text-slate-800"
          />
          <select 
            value={atEmpFilter}
            onChange={(e) => setAtEmpFilter(e.target.value)}
            className="p-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 text-slate-800"
          >
            <option value="">{t("All Employees")}</option>
            {employees.map(e => (
              <option key={e.id} value={e.name}>{e.name}</option>
            ))}
          </select>
          <select 
            value={atStatusFilter}
            onChange={(e) => setAtStatusFilter(e.target.value)}
            className="p-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 text-slate-800"
          >
            <option value="">{t("All Statuses")}</option>
            <option value="Present">{t("Present")}</option>
            <option value="Absent">{t("Absent")}</option>
            <option value="Half Day">{t("Half Day")}</option>
            <option value="Not Marked">{t("Not Marked")}</option>
          </select>
          <input 
            type="month"
            value={atMonthFilter}
            onChange={(e) => setAtMonthFilter(e.target.value)}
            className="p-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 text-slate-800"
          />
        </div>

        {/* Quick today statistics summary */}
        <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-2xl text-xs font-bold flex flex-wrap gap-x-6 gap-y-2 mb-6">
          <span>{t("Date")}: <b>{fmtDate(atDate)}</b></span>
          <span>{t("Roster Strength")}: <b>{employees.length}</b></span>
          <span>{t("Marked")}: <b>{todayList.length}</b></span>
          <span>{t("Present")}: <b>{todayPresent}</b></span>
          <span>{t("Absent")}: <b>{todayAbsent}</b></span>
          <span>{t("Half Day")}: <b>{todayHalf}</b></span>
          <span>{t("Unmarked")}: <b>{Math.max(0, employees.length - todayList.length)}</b></span>
        </div>

        {/* Employees attendance Tiles grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tiles.map(emp => {
            const date = atDate || today();
            const rec = attendanceFor(emp.name, date);
            const status = rec ? rec.status : 'Not Marked';

            let borderStyle = 'border-slate-100';
            let bgStyle = 'bg-white';
            if (status === 'Present') { borderStyle = 'border-l-4 border-l-emerald-500 border-slate-200'; bgStyle = 'bg-emerald-50/20'; }
            else if (status === 'Absent') { borderStyle = 'border-l-4 border-l-red-500 border-slate-200'; bgStyle = 'bg-red-50/20'; }
            else if (status === 'Half Day') { borderStyle = 'border-l-4 border-l-amber-500 border-slate-200'; bgStyle = 'bg-amber-50/20'; }

            return (
              <div 
                key={emp.id} 
                onClick={() => viewSingleEmployeeSheet(emp.name)}
                className={`p-4 border rounded-2xl shadow-sm hover:shadow transition cursor-pointer flex flex-col justify-between min-h-[140px] ${borderStyle} ${bgStyle}`}
              >
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <b className="text-slate-800 text-base font-bold">{emp.name}</b>
                    <span className="text-[10px] uppercase bg-slate-100 text-slate-500 py-0.5 px-2 rounded-full font-black">
                      {t(emp.shiftType)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {t("Phone")}: {emp.phone || '-'} | {t("Wage")}: {money(emp.salary)} ({t(emp.salaryType)})
                  </p>
                  <p className="text-xs font-bold text-slate-700 mt-2">
                    {t("Today")}: <span className="underline decoration-slate-300">{t(status)}</span> {rec ? ` | ${t("Earned")}: ${money(rec.wage)}` : ''}
                  </p>
                </div>

                <div className="flex gap-1.5 mt-3" onClick={(e) => e.stopPropagation()}>
                  <button 
                    onClick={() => setTileAttendance(emp.name, 'Present')}
                    className="flex-1 py-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                  >
                    {t("Present")}
                  </button>
                  <button 
                    onClick={() => setTileAttendance(emp.name, 'Absent')}
                    className="flex-1 py-1.5 px-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs"
                  >
                    {t("Absent")}
                  </button>
                  <button 
                    onClick={() => setTileAttendance(emp.name, 'Half Day')}
                    className="flex-1 py-1.5 px-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs"
                  >
                    {t("Half Day")}
                  </button>
                  <button 
                    onClick={() => viewSingleEmployeeSheet(emp.name)}
                    className="py-1.5 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-xs"
                  >
                    {t("Sheet")}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ================= EMPLOYEE REGISTRY ================= */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
        <div>
          <h3 className="font-sans font-bold text-base text-slate-800">👤 {t("Employee Master Roster")}</h3>
          <p className="text-xs text-slate-400">{t("Add or edit milling workers. Use Up/Down buttons to re-order the payroll index.")}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">{t("Worker Name")}</label>
            <input 
              type="text"
              value={empName}
              onChange={(e) => setEmpName(e.target.value)}
              placeholder="Ravi Kumar"
              className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">{t("Phone Number")}</label>
            <input 
              type="text"
              value={empPhone}
              onChange={(e) => setEmpPhone(e.target.value)}
              placeholder="9876543210"
              className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">{t("Salary Type")}</label>
            <select 
              value={empSalaryType}
              onChange={(e) => setEmpSalaryType(e.target.value as any)}
              className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800"
            >
              <option value="Daily Wage">Daily Wage</option>
              <option value="Monthly Salary">Monthly Salary</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">{t("Shift Type")}</label>
            <select 
              value={empShift}
              onChange={(e) => setEmpShift(e.target.value as any)}
              className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800"
            >
              <option value="General">{t("General")}</option>
              <option value="12 Hr">{t("12 Hr")}</option>
              <option value="24 Hr">{t("24 Hr")}</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">{t("Wages Amount (₹)")}</label>
            <input 
              type="number"
              value={empSalary}
              onChange={(e) => setEmpSalary(e.target.value)}
              placeholder="450"
              className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={handleSaveEmployee}
            className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
          >
            {editingEmployeeId ? t('Update Employee Profile') : t('Save Employee')}
          </button>
          <button 
            onClick={() => {
              setEditingEmployeeId('');
              setEmpName('');
              setEmpPhone('');
              setEmpSalary('');
              setEmpSalaryType('Daily Wage');
              setEmpShift('General');
            }}
            className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 text-xs font-bold border border-slate-200"
          >
            {t('Clear Form')}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-slate-600 border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold text-center">
                <th className="p-2.5">{t("S.No")}</th>
                <th className="p-2.5 text-left">{t("Employee Name")}</th>
                <th className="p-2.5 text-left">{t("Phone")}</th>
                <th className="p-2.5">{t("Salary Type")}</th>
                <th className="p-2.5">{t("Shift Length")}</th>
                <th className="p-2.5 text-right">{t("Wages")}</th>
                <th className="p-2.5">{t("Sequence")}</th>
                <th className="p-2.5">{t("Action")}</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((x, i) => (
                <tr key={x.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="p-2.5 text-center font-bold text-slate-400">{i + 1}</td>
                  <td className="p-2.5 font-bold text-slate-800">{x.name}</td>
                  <td className="p-2.5">{x.phone || '-'}</td>
                  <td className="p-2.5 text-center font-semibold text-slate-600">{t(x.salaryType)}</td>
                  <td className="p-2.5 text-center font-bold text-slate-700">{t(x.shiftType)}</td>
                  <td className="p-2.5 text-right font-black text-emerald-600">{money(x.salary)}</td>
                  <td className="p-2.5 text-center space-x-1">
                    <button 
                      onClick={() => handleOrderChange(x, -1)}
                      className="py-1 px-2.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-xs"
                    >
                      ↑
                    </button>
                    <button 
                      onClick={() => handleOrderChange(x, 1)}
                      className="py-1 px-2.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-xs"
                    >
                      ↓
                    </button>
                  </td>
                  <td className="p-2.5 text-center space-x-1">
                    <button 
                      onClick={() => handleEditEmployee(x)}
                      className="text-emerald-600 font-bold hover:text-emerald-800"
                    >
                      {t("Edit")}
                    </button>
                    <span>|</span>
                    <button 
                      onClick={() => onDeleteDoc('employees', x.id)}
                      className="text-red-500 font-bold hover:text-red-700"
                    >
                      {t("Delete")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
};
