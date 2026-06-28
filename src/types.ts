export interface PaddyEntry {
  id: string;
  date: string;
  party: string;
  lorry: string;
  load: number;
  empty: number;
  net: number;
  bags: number;
  calcBags: number;
  left: number;
  variety: string;
  destination: string;
  gunny: number;
  rate: number;
  amount: number;
  status: string;
  purchaseId?: string;
  createdAt?: any;
  createdBy?: string;
}

export interface ExtraLoad {
  entryId: string;
  lorry: string;
  load: number;
  empty: number;
  discount: number;
  net: number;
}

export interface BalancePayment {
  amount: number;
  paidDate: string;
  mode: string;
  through: string;
  remarks: string;
  recordedAt: string;
  recordedBy: string;
}

export interface PaddyPurchase {
  id: string;
  date: string;
  billNo: string;
  paddyEntryId?: string;
  paddyEntryId2?: string;
  paddyEntryId3?: string;
  party: string;
  lorry: string;
  lorryList?: string;
  variety: string;
  load: number;
  empty: number;
  discount: number;
  net: number;
  net1?: number;
  gunny: number;
  full: number;
  left: number;
  rate: number;
  paddyValue: number;
  freight: number;
  unload: number;
  food: number;
  cess: number;
  total: number;
  paid: number;
  balance: number;
  status: string;
  paidDate: string;
  multiLoad?: boolean;
  extraLoads?: ExtraLoad[];
  secondItem?: boolean;
  variety2?: string;
  net2?: number;
  gunny2?: number;
  full2?: number;
  left2?: number;
  rate2?: number;
  paddyValue2?: number;
  balancePaid?: number;
  lastBalancePaidDate?: string;
  lastPaymentMode?: string;
  lastPaidThrough?: string;
  lastPaymentRemarks?: string;
  balancePayments?: BalancePayment[];
  createdAt?: any;
  createdBy?: string;
  updatedAt?: any;
  updatedBy?: string;
}

export interface PaddyMovement {
  id: string;
  date: string;
  fromStorage: string;
  toStorage: string;
  variety: string;
  bags: number;
  remarks: string;
  createdAt?: any;
  createdBy?: string;
}

export interface OpeningStock {
  id: string;
  date: string;
  storage: string;
  variety: string;
  bags: number;
  supplier: string;
  remarks: string;
  createdAt?: any;
  createdBy?: string;
}

export interface ProductionSourceLine {
  source: string;
  variety: string;
  bags: number;
  available: number;
}

export interface ProductionBatch {
  id: string;
  date: string;
  completionDate?: string;
  batchNo: string;
  status: 'In Process' | 'Completed';
  source: string;
  variety: string;
  sourceLines?: ProductionSourceLine[];
  paddyBags: number;
  targetBags: number;
  headBags: number;
  brokenBags: number;
  totalRice: number;
  ricePerPaddy: number;
  yieldPercent: number;
  riceStorage: string;
  finalMoisture: number;
  quality: string;
  preSteam: number;
  holdingTemper: number;
  lcuTemper: number;
  soak: number;
  postSteam: number;
  drying: number;
  lotIds?: string[];
  lotSummary: string;
  remarks: string;
  completionRemarks?: string;
  createdAt?: any;
  createdBy?: string;
  updatedAt?: any;
  updatedBy?: string;
}

export interface QualityRecord {
  id: string;
  date: string;
  productionId: string;
  batchNo: string;
  supplier: string;
  variety: string;
  purchaseMonth: string;
  paddyBags: number;
  headBags: number;
  brokenBags: number;
  totalRiceBags: number;
  headPct: number;
  brokenPct: number;
  totalPct: number;
  moisture: number;
  cooking: string;
  stickiness: string;
  elongation: string;
  feedback: string;
  remarks: string;
  createdAt?: any;
  createdBy?: string;
}

export interface Employee {
  id: string;
  name: string;
  phone?: string;
  salaryType: 'Daily Wage' | 'Monthly Salary';
  shiftType: 'General' | '12 Hr' | '24 Hr';
  salary: number;
  sortOrder: number;
  createdAt?: any;
  createdBy?: string;
}

export interface Attendance {
  id: string;
  date: string;
  employee: string;
  status: 'Present' | 'Absent' | 'Half Day';
  wage: number;
  voiceConfirmed?: boolean;
  photo?: string;
  tileMode?: boolean;
  createdAt?: any;
  createdBy?: string;
  updatedAt?: any;
  updatedBy?: string;
}

export interface Loading {
  id: string;
  date: string;
  movementType: 'Customer Delivery' | 'Godown Transfer';
  party: string;
  toGodown: string;
  lorry: string;
  storage: string;
  lot: string;
  variety: string;
  product: string;
  bags: number;
  createdAt?: any;
  createdBy?: string;
}

export interface SalesDraft {
  id: string;
  date: string;
  party: string;
  variety: string;
  bags: number;
  rate: number;
  lorry: string;
  dueDays: number;
  phone: string;
  total: number;
}
