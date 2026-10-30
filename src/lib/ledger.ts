export const CATEGORIES = [
  "Transfer",
  "House Payment",
  "Business",
  "Miscellaneous",
] as const;

export type Category = (typeof CATEGORIES)[number];
export type TxType = "transfer" | "expense";

export const EXPENSE_CATEGORIES: Category[] = [
  "House Payment",
  "Business",
  "Miscellaneous",
];

export interface Transaction {
  id: string;
  date: string;
  type: TxType;
  category: Category;
  amount: number;
  payer: string;
  recipient: string;
  description: string;
  refNo: string;
  createdAt: string;
}

export interface ComputedTx extends Transaction {
  balanceAfter: number;
}

export interface LedgerTotals {
  balance: number;
  inflow: number;
  outflow: number;
  house: number;
  business: number;
  misc: number;
  rows: ComputedTx[];
}

const STORAGE_KEY = "home-ledger-v1";

export function localToday(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function formatMoney(value: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(value);
}

export function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  if (!year || !month || !day) return dateStr;
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function compute(transactions: Transaction[]): LedgerTotals {
  const chronological = [...transactions].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    return a.createdAt < b.createdAt ? -1 : 1;
  });

  let balance = 0;
  let inflow = 0;
  let outflow = 0;
  let house = 0;
  let business = 0;
  let misc = 0;

  const rows = chronological.map((tx) => {
    if (tx.type === "transfer") {
      balance += tx.amount;
      inflow += tx.amount;
    } else {
      balance -= tx.amount;
      outflow += tx.amount;
      if (tx.category === "House Payment") house += tx.amount;
      else if (tx.category === "Business") business += tx.amount;
      else misc += tx.amount;
    }
    return { ...tx, balanceAfter: balance };
  });

  return { balance, inflow, outflow, house, business, misc, rows };
}

export function isSampleBook(transactions: Transaction[]): boolean {
  return transactions.length > 0 && transactions.every((tx) => tx.id.startsWith("sample-"));
}

export function makeSample(today: string): Transaction[] {
  const base = Date.parse(`${today}T08:00:00`);
  const at = (minutes: number) => new Date(base + minutes * 60_000).toISOString();

  return [
    {
      id: "sample-transfer",
      date: today,
      type: "transfer",
      category: "Transfer",
      amount: 50_000,
      payer: "Boyfriend",
      recipient: "Me",
      description: "Remittance for home savings fund",
      refNo: "GCASH-982112",
      createdAt: at(0),
    },
    {
      id: "sample-house",
      date: today,
      type: "expense",
      category: "House Payment",
      amount: 15_000,
      payer: "Me",
      recipient: "Architect / Developer",
      description: "Initial deposit for architectural blueprint design",
      refNo: "INV-0012",
      createdAt: at(1),
    },
    {
      id: "sample-business",
      date: today,
      type: "expense",
      category: "Business",
      amount: 8_500,
      payer: "Me",
      recipient: "Supplier",
      description: "Inventory payment for business startup",
      refNo: "SUP-4421",
      createdAt: at(2),
    },
    {
      id: "sample-misc",
      date: today,
      type: "expense",
      category: "Miscellaneous",
      amount: 1_200,
      payer: "Me",
      recipient: "Notary Public",
      description: "Document notarization fees for land title",
      refNo: "RCPT-88",
      createdAt: at(3),
    },
  ];
}

function isCategory(value: unknown): value is Category {
  return typeof value === "string" && (CATEGORIES as readonly string[]).includes(value);
}

function normalize(value: unknown): Transaction | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Partial<Transaction>;
  if (typeof row.id !== "string" || typeof row.date !== "string") return null;
  if (row.type !== "transfer" && row.type !== "expense") return null;
  if (!isCategory(row.category)) return null;
  if (typeof row.amount !== "number" || !Number.isFinite(row.amount) || row.amount <= 0) return null;
  if (typeof row.description !== "string") return null;
  return {
    id: row.id,
    date: row.date,
    type: row.type,
    category: row.category,
    amount: row.amount,
    payer: typeof row.payer === "string" && row.payer.trim() ? row.payer : "Unspecified",
    recipient:
      typeof row.recipient === "string" && row.recipient.trim() ? row.recipient : "Unspecified",
    description: row.description,
    refNo: typeof row.refNo === "string" ? row.refNo : "",
    createdAt: typeof row.createdAt === "string" ? row.createdAt : row.date,
  };
}

export function readLedger(): Transaction[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw == null) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed.map(normalize).filter((row): row is Transaction => row !== null);
  } catch {
    return null;
  }
}

export function writeLedger(transactions: Transaction[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  } catch {
    // Private mode or a full disk should not block the session.
  }
}

function csvField(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}

export function toCsv(transactions: Transaction[]): string {
  const lines = [
    "Date,Type,Category,Description,Paid By,Received By,Amount (PHP),Ref No",
  ];
  const ordered = [...transactions].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  for (const tx of ordered) {
    lines.push(
      [
        tx.date,
        tx.type,
        csvField(tx.category),
        csvField(tx.description),
        csvField(tx.payer),
        csvField(tx.recipient),
        tx.amount.toFixed(2),
        csvField(tx.refNo),
      ].join(","),
    );
  }
  return `\uFEFF${lines.join("\n")}`;
}

export function downloadCsv(transactions: Transaction[]): void {
  const blob = new Blob([toCsv(transactions)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `Home_Ledger_${localToday()}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
