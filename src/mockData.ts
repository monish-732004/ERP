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

export const INITIAL_VARIETIES = [
  'RNR',
  'BPT',
  'Mahendra',
  'CO 55',
  'White Ponni'
];

export const INITIAL_SUPPLIERS = [
  'Murugan Farms',
  'Bala & Co',
  'Raja Traders',
  'Ganesh Agencies',
  'Kalyan Farms'
];

export const INITIAL_EMPLOYEES: Employee[] = [
  { id: 'emp_1', name: 'Ravi Kumar', phone: '9876543210', salaryType: 'Daily Wage', shiftType: 'General', salary: 450, sortOrder: 1 },
  { id: 'emp_2', name: 'Senthil Kumar', phone: '9876543211', salaryType: 'Daily Wage', shiftType: '12 Hr', salary: 600, sortOrder: 2 },
  { id: 'emp_3', name: 'Mani Maran', phone: '9876543212', salaryType: 'Daily Wage', shiftType: '24 Hr', salary: 900, sortOrder: 3 },
  { id: 'emp_4', name: 'Anbu Selvan', phone: '9876543213', salaryType: 'Monthly Salary', shiftType: 'General', salary: 15000, sortOrder: 4 },
  { id: 'emp_5', name: 'Palani Swamy', phone: '9876543214', salaryType: 'Daily Wage', shiftType: 'General', salary: 450, sortOrder: 5 }
];

export const INITIAL_ENTRIES: PaddyEntry[] = [
  {
    id: 'entry_1',
    date: '2026-06-25',
    party: 'Murugan Farms',
    lorry: 'TN15AB1234',
    load: 21500,
    empty: 11000,
    net: 10500,
    bags: 135,
    calcBags: 134,
    left: 48,
    variety: 'RNR',
    destination: 'Paddy Storage 1',
    gunny: 78,
    rate: 1450,
    amount: 195192,
    status: 'Pending',
    purchaseId: 'pu_1'
  },
  {
    id: 'entry_2',
    date: '2026-06-26',
    party: 'Bala & Co',
    lorry: 'TN15CD5678',
    load: 25400,
    empty: 10900,
    net: 14500,
    bags: 186,
    calcBags: 185,
    left: 70,
    variety: 'BPT',
    destination: 'SILO 1',
    gunny: 78,
    rate: 1520,
    amount: 282564,
    status: 'Paid',
    purchaseId: 'pu_2'
  },
  {
    id: 'entry_3',
    date: '2026-06-27',
    party: 'Raja Traders',
    lorry: 'TN15XY9012',
    load: 18900,
    empty: 11200,
    net: 7700,
    bags: 98,
    calcBags: 98,
    left: 56,
    variety: 'Mahendra',
    destination: 'Paddy Storage 2',
    gunny: 78,
    rate: 1380,
    amount: 136230,
    status: 'Pending'
  }
];

export const INITIAL_PURCHASES: PaddyPurchase[] = [
  {
    id: 'pu_1',
    date: '2026-06-25',
    billNo: '1',
    paddyEntryId: 'entry_1',
    party: 'Murugan Farms',
    lorry: 'TN15AB1234',
    lorryList: 'TN15AB1234',
    variety: 'RNR',
    load: 21500,
    empty: 11000,
    discount: 0,
    net: 10500,
    net1: 10500,
    gunny: 78,
    full: 134,
    left: 48,
    rate: 1450,
    paddyValue: 195192,
    freight: 1200,
    unload: 450,
    food: 200,
    cess: 0,
    total: 197042,
    paid: 100000,
    balance: 97042,
    status: 'Partial',
    paidDate: '2026-06-25',
    multiLoad: false,
    secondItem: false,
    balancePaid: 0,
    balancePayments: []
  },
  {
    id: 'pu_2',
    date: '2026-06-26',
    billNo: '2',
    paddyEntryId: 'entry_2',
    party: 'Bala & Co',
    lorry: 'TN15CD5678',
    lorryList: 'TN15CD5678',
    variety: 'BPT',
    load: 25400,
    empty: 10900,
    discount: 0,
    net: 14500,
    net1: 14500,
    gunny: 78,
    full: 185,
    left: 70,
    rate: 1520,
    paddyValue: 282564,
    freight: 1500,
    unload: 600,
    food: 300,
    cess: 0,
    total: 284964,
    paid: 284964,
    balance: 0,
    status: 'Paid',
    paidDate: '2026-06-26',
    multiLoad: false,
    secondItem: false,
    balancePaid: 0,
    balancePayments: []
  }
];

export const INITIAL_OPENING_STOCKS: OpeningStock[] = [
  {
    id: 'os_1',
    date: '2026-06-20',
    storage: 'SILO 1',
    variety: 'RNR',
    bags: 1200,
    supplier: 'Old Stock Lot 1',
    remarks: 'Pre-app inventory in SILO 1'
  },
  {
    id: 'os_2',
    date: '2026-06-21',
    storage: 'GODOWN A1',
    variety: 'BPT',
    bags: 850,
    supplier: 'Old Stock Lot 2',
    remarks: 'GODOWN A1 initial storage'
  }
];

export const INITIAL_MOVEMENTS: PaddyMovement[] = [
  {
    id: 'move_1',
    date: '2026-06-26',
    fromStorage: 'Paddy Storage 1',
    toStorage: 'SILO 2',
    variety: 'RNR',
    bags: 100,
    remarks: 'Transferred 100 bags to SILO 2 for tempering'
  }
];

export const INITIAL_PRODUCTIONS: ProductionBatch[] = [
  {
    id: 'prod_1',
    date: '2026-06-23',
    completionDate: '2026-06-25',
    batchNo: 'BATCH-2601',
    status: 'Completed',
    source: 'SILO 1',
    variety: 'RNR',
    sourceLines: [
      { source: 'SILO 1', variety: 'RNR', bags: 600, available: 1200 }
    ],
    paddyBags: 600,
    targetBags: 600,
    headBags: 410,
    brokenBags: 70,
    totalRice: 480,
    ricePerPaddy: 0.8,
    yieldPercent: 80,
    riceStorage: 'Rice Storage 1',
    finalMoisture: 12.5,
    quality: 'Excellent',
    preSteam: 5,
    holdingTemper: 25,
    lcuTemper: 4,
    soak: 6,
    postSteam: 3,
    drying: 8,
    lotIds: ['sourceLine:1'],
    lotSummary: 'SILO 1 | RNR | 600 bags',
    remarks: 'Processed successfully.',
    completionRemarks: 'Excellent head rice yield with minimal broken percentage.'
  },
  {
    id: 'prod_2',
    date: '2026-06-27',
    batchNo: 'BATCH-2602',
    status: 'In Process',
    source: 'Paddy Storage 1',
    variety: 'RNR',
    sourceLines: [
      { source: 'Paddy Storage 1', variety: 'RNR', bags: 34, available: 34 }
    ],
    paddyBags: 34,
    targetBags: 600,
    headBags: 0,
    brokenBags: 0,
    totalRice: 0,
    ricePerPaddy: 0,
    yieldPercent: 0,
    riceStorage: 'Rice Storage 1',
    finalMoisture: 0,
    quality: '',
    preSteam: 6,
    holdingTemper: 20,
    lcuTemper: 3,
    soak: 5,
    postSteam: 0,
    drying: 0,
    lotIds: ['sourceLine:1'],
    lotSummary: 'Paddy Storage 1 | RNR | 34 bags',
    remarks: 'Currently soaking in parboiling tank.',
  }
];

export const INITIAL_QUALITY_RECORDS: QualityRecord[] = [
  {
    id: 'qr_1',
    date: '2026-06-25',
    productionId: 'prod_1',
    batchNo: 'BATCH-2601',
    supplier: 'SILO 1 | RNR | 600 bags',
    variety: 'RNR',
    purchaseMonth: '2026-06',
    paddyBags: 600,
    headBags: 410,
    brokenBags: 70,
    totalRiceBags: 480,
    headPct: 68.33,
    brokenPct: 11.67,
    totalPct: 80.00,
    moisture: 12.5,
    cooking: 'Excellent',
    stickiness: 'Low',
    elongation: 'Excellent',
    feedback: 'Highly volume expansion upon cooking. Buyers loved the non-sticky texture.',
    remarks: 'Premium quality parboiled result.'
  }
];

export const INITIAL_LOADINGS: Loading[] = [
  {
    id: 'load_1',
    date: '2026-06-26',
    movementType: 'Customer Delivery',
    party: 'Venkateswara Rice Traders',
    toGodown: '',
    lorry: 'TN15Z9999',
    storage: 'Rice Storage 1',
    lot: 'BATCH-2601',
    variety: 'RNR',
    product: 'Head Rice 26kg',
    bags: 150
  },
  {
    id: 'load_2',
    date: '2026-06-27',
    movementType: 'Godown Transfer',
    party: '',
    toGodown: 'Shop Godown',
    lorry: 'Internal Trolley 1',
    storage: 'Rice Storage 1',
    lot: 'BATCH-2601',
    variety: 'RNR',
    product: 'Broken 26kg',
    bags: 40
  }
];

export const INITIAL_ATTENDANCE: Attendance[] = [
  { id: 'att_1', date: '2026-06-27', employee: 'Ravi Kumar', status: 'Present', wage: 450, tileMode: true },
  { id: 'att_2', date: '2026-06-27', employee: 'Senthil Kumar', status: 'Present', wage: 600, tileMode: true },
  { id: 'att_3', date: '2026-06-27', employee: 'Mani Maran', status: 'Present', wage: 1800, tileMode: true }, // 24hr multiplier
  { id: 'att_4', date: '2026-06-27', employee: 'Anbu Selvan', status: 'Present', wage: 500, tileMode: true } // monthly/30
];
