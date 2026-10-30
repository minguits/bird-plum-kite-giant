import { lazy, Suspense, useEffect, useId, useMemo, useRef, useState, type FormEvent, type ReactNode, type RefObject } from "react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Briefcase,
  Download,
  Home,
  LayoutGrid,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  EXPENSE_CATEGORIES,
  compute,
  downloadCsv,
  formatDate,
  formatMoney,
  isSampleBook,
  localToday,
  makeSample,
  readLedger,
  writeLedger,
  type Category,
  type Transaction,
  type TxType,
} from "@/lib/ledger";

const SpendChart = lazy(() =>
  import("@/components/spend-chart").then((mod) => ({ default: mod.SpendChart })),
);

const FIELD =
  "w-full rounded-xl border border-line bg-ink px-3 py-3 text-base text-paper placeholder:text-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass";

type CategoryFilter = "ALL" | Category;
type TypeFilter = "ALL" | TxType;
type Pending = { kind: "delete"; id: string } | { kind: "reset" } | null;

interface Draft {
  type: TxType;
  category: Category;
  amount: string;
  date: string;
  payer: string;
  recipient: string;
  description: string;
  refNo: string;
  error: string;
}

const SPEND_ROWS: Array<{
  category: Category;
  label: string;
  key: "house" | "business" | "misc";
  bar: string;
  fill: string;
  icon: typeof Home;
}> = [
  {
    category: "House Payment",
    label: "House",
    key: "house",
    bar: "bg-brass",
    fill: "var(--color-brass)",
    icon: Home,
  },
  {
    category: "Business",
    label: "Business",
    key: "business",
    bar: "bg-sand",
    fill: "var(--color-sand)",
    icon: Briefcase,
  },
  {
    category: "Miscellaneous",
    label: "Miscellaneous",
    key: "misc",
    bar: "bg-clay",
    fill: "var(--color-clay)",
    icon: LayoutGrid,
  },
];

function blankDraft(date: string): Draft {
  return {
    type: "transfer",
    category: "Transfer",
    amount: "",
    date,
    payer: "Boyfriend",
    recipient: "Me",
    description: "",
    refNo: "",
    error: "",
  };
}

function categoryClass(category: Category): string {
  if (category === "Transfer") return "bg-ink text-paper ring-1 ring-line";
  if (category === "House Payment") return "bg-brass/15 text-brass";
  if (category === "Business") return "bg-sand/15 text-sand";
  return "bg-clay/15 text-clay";
}

export function HomeLedger() {
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);
  const [draft, setDraft] = useState<Draft>(() => blankDraft(""));
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("ALL");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");
  const [formOpen, setFormOpen] = useState(false);
  const [pending, setPending] = useState<Pending>(null);
  const [chartReady, setChartReady] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const today = localToday();
    const stored = readLedger();
    setTransactions(stored ?? makeSample(today));
    setDraft((current) => ({ ...current, date: current.date || today }));
    setChartReady(true);
  }, []);

  useEffect(() => {
    if (transactions) writeLedger(transactions);
  }, [transactions]);

  const totals = useMemo(() => compute(transactions ?? []), [transactions]);
  const ready = transactions !== null;
  const sample = transactions ? isSampleBook(transactions) : false;

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return [...totals.rows].reverse().filter((tx) => {
      const matchesQuery =
        needle.length === 0 ||
        tx.description.toLowerCase().includes(needle) ||
        tx.refNo.toLowerCase().includes(needle) ||
        tx.payer.toLowerCase().includes(needle) ||
        tx.recipient.toLowerCase().includes(needle);
      const matchesCategory = categoryFilter === "ALL" || tx.category === categoryFilter;
      const matchesType = typeFilter === "ALL" || tx.type === typeFilter;
      return matchesQuery && matchesCategory && matchesType;
    });
  }, [totals.rows, query, categoryFilter, typeFilter]);

  const filtersOn = query.trim().length > 0 || categoryFilter !== "ALL" || typeFilter !== "ALL";

  function patchDraft(partial: Partial<Draft>) {
    setDraft((current) => ({ ...current, error: "", ...partial }));
  }

  function setType(type: TxType) {
    if (type === "transfer") {
      patchDraft({
        type,
        category: "Transfer",
        payer: "Boyfriend",
        recipient: "Me",
      });
      return;
    }
    patchDraft({
      type,
      category: "House Payment",
      payer: "Me",
      recipient: "Vendor / Service",
    });
  }

  function openForm() {
    setFormOpen(true);
    window.setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      amountRef.current?.focus();
    }, 30);
  }

  function addEntry(event: FormEvent) {
    event.preventDefault();
    const amount = Number(draft.amount);
    const description = draft.description.trim();
    if (!draft.date) {
      patchDraft({ error: "Choose a date." });
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      patchDraft({ error: "Enter an amount greater than zero." });
      return;
    }
    if (!description) {
      patchDraft({ error: "Add a short description." });
      return;
    }

    const entry: Transaction = {
      id: crypto.randomUUID(),
      date: draft.date,
      type: draft.type,
      category: draft.type === "transfer" ? "Transfer" : draft.category,
      amount,
      payer: draft.payer.trim() || "Unspecified",
      recipient: draft.recipient.trim() || "Unspecified",
      description,
      refNo: draft.refNo.trim(),
      createdAt: new Date().toISOString(),
    };

    setTransactions((current) => [entry, ...(current ?? [])]);
    setDraft((current) => ({
      ...current,
      amount: "",
      description: "",
      refNo: "",
      error: "",
    }));
    toast.success("Added to the book");
    if (window.innerWidth < 1024) {
      setFormOpen(false);
      listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function confirmPending() {
    if (!pending) return;
    if (pending.kind === "reset") {
      setTransactions([]);
      setCategoryFilter("ALL");
      setTypeFilter("ALL");
      setQuery("");
      toast("Book cleared");
    } else {
      setTransactions((current) => (current ?? []).filter((tx) => tx.id !== pending.id));
      toast("Entry removed");
    }
    setPending(null);
  }

  function exportBook() {
    if (!transactions?.length) {
      toast("Nothing to export yet");
      return;
    }
    downloadCsv(transactions);
  }

  const countLabel =
    visible.length === totals.rows.length
      ? `${visible.length} ${visible.length === 1 ? "entry" : "entries"}`
      : `${visible.length} of ${totals.rows.length}`;

  const slices = SPEND_ROWS.map((row) => ({
    name: row.label,
    value: totals[row.key],
    fill: row.fill,
  }));

  return (
    <div className="min-h-screen bg-ink text-paper">
      <header className="sticky top-0 z-40 border-b border-line bg-ink/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brass text-ink">
              <Home className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h1 className="truncate font-display text-lg font-semibold leading-tight">Home Ledger</h1>
              <p className="truncate text-xs text-muted">House, business, and the fund between you</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-xs text-muted sm:inline-flex">
              <span className="size-1.5 rounded-full bg-brass" aria-hidden="true" />
              On this device
            </span>
            <button
              type="button"
              onClick={exportBook}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-line px-3 text-sm text-paper hover:bg-panel"
            >
              <Download className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">Export</span>
            </button>
            <button
              type="button"
              onClick={() => setPending({ kind: "reset" })}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-line px-3 text-sm text-clay hover:bg-panel"
            >
              <Trash2 className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-5 pb-28 sm:px-6 lg:pb-10">
        <section className="grid gap-4 lg:grid-cols-5" aria-label="Fund summary">
          <div className="rounded-2xl border border-line bg-panel p-5 lg:col-span-2">
            <p className="text-sm text-muted">Available fund</p>
            <p
              className={`mt-1 font-display text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl ${
                totals.balance < 0 ? "text-clay" : "text-paper"
              }`}
              aria-live="polite"
            >
              {ready ? formatMoney(totals.balance) : "—"}
            </p>
            <p className="mt-2 text-sm text-muted">
              {totals.balance < 0 ? "The fund is short." : "Money sent in, minus what was spent."}
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-ink px-3 py-3">
                <p className="flex items-center gap-1.5 text-xs text-muted">
                  <ArrowDownLeft className="size-3.5 text-brass" aria-hidden="true" />
                  Sent in
                </p>
                <p className="mt-1 font-medium text-brass tabular-nums">
                  {ready ? formatMoney(totals.inflow) : "—"}
                </p>
              </div>
              <div className="rounded-xl bg-ink px-3 py-3">
                <p className="flex items-center gap-1.5 text-xs text-muted">
                  <ArrowUpRight className="size-3.5 text-clay" aria-hidden="true" />
                  Spent
                </p>
                <p className="mt-1 font-medium text-clay tabular-nums">
                  {ready ? formatMoney(totals.outflow) : "—"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-panel p-5 lg:col-span-3">
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <h2 className="font-display text-lg font-semibold">Where it went</h2>
              <p className="text-xs text-muted">Tap a row to filter the book</p>
            </div>
            <div className="grid items-center gap-4 sm:grid-cols-[1fr_9.5rem]">
              <div className="space-y-1">
                {SPEND_ROWS.map((row) => {
                  const amount = totals[row.key];
                  const pct = totals.outflow > 0 ? Math.round((amount / totals.outflow) * 100) : 0;
                  const selected = categoryFilter === row.category;
                  const Icon = row.icon;
                  return (
                    <button
                      key={row.category}
                      type="button"
                      aria-pressed={selected}
                      onClick={() =>
                        setCategoryFilter((current) => (current === row.category ? "ALL" : row.category))
                      }
                      className={`w-full rounded-xl px-2 py-2 text-left hover:bg-panel-2 ${
                        selected ? "bg-panel-2 ring-1 ring-brass" : ""
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Icon className="size-4 shrink-0 text-muted" aria-hidden="true" />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-baseline justify-between gap-3">
                            <span className="text-sm font-medium">{row.label}</span>
                            <span className="text-sm tabular-nums">{ready ? formatMoney(amount) : "—"}</span>
                          </span>
                          <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-ink">
                            <span className={`block h-full rounded-full ${row.bar}`} style={{ width: `${pct}%` }} />
                          </span>
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="mx-auto w-full max-w-40">
                {chartReady ? (
                  <Suspense fallback={<div className="h-36" />}>
                    <SpendChart slices={slices} />
                  </Suspense>
                ) : (
                  <div className="h-36" />
                )}
              </div>
            </div>
          </div>
        </section>

        <div className="mt-4 grid items-start gap-4 lg:grid-cols-12">
          <section ref={listRef} className="scroll-mt-20 lg:col-span-7" aria-label="Transaction history">
            <div className="rounded-2xl border border-line bg-panel">
              <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center">
                <div className="relative min-w-0 flex-1">
                  <Search
                    className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-faint"
                    aria-hidden="true"
                  />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search memo, person, or ref"
                    aria-label="Search the book"
                    className={`${FIELD} pl-9`}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={categoryFilter}
                    onChange={(event) => setCategoryFilter(event.target.value as CategoryFilter)}
                    aria-label="Filter by category"
                    className={FIELD}
                  >
                    <option value="ALL">All categories</option>
                    <option value="Transfer">Transfers</option>
                    <option value="House Payment">House</option>
                    <option value="Business">Business</option>
                    <option value="Miscellaneous">Miscellaneous</option>
                  </select>
                  <select
                    value={typeFilter}
                    onChange={(event) => setTypeFilter(event.target.value as TypeFilter)}
                    aria-label="Filter by type"
                    className={FIELD}
                  >
                    <option value="ALL">All types</option>
                    <option value="transfer">Sent in</option>
                    <option value="expense">Spent</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 px-4 py-3">
                <h2 className="font-display text-lg font-semibold">The book</h2>
                <div className="flex items-center gap-3 text-xs text-muted">
                  {filtersOn ? (
                    <button
                      type="button"
                      onClick={() => {
                        setQuery("");
                        setCategoryFilter("ALL");
                        setTypeFilter("ALL");
                      }}
                      className="text-brass hover:underline"
                    >
                      Clear filters
                    </button>
                  ) : null}
                  <span>{countLabel}</span>
                </div>
              </div>

              {sample ? (
                <p className="mx-4 mb-3 rounded-xl bg-ink px-3 py-2 text-sm text-muted">
                  These lines are examples, so you can see how a fund reads. Reset the book when you want a clean start.
                </p>
              ) : null}

              {!ready || visible.length === 0 ? (
                <div className="px-4 py-14 text-center">
                  <p className="font-medium">
                    {ready && totals.rows.length > 0 ? "Nothing matches those filters." : "The book is empty."}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    {ready && totals.rows.length > 0
                      ? "Clear the search or pick another category."
                      : "Record money sent into the fund, or the first thing it paid for."}
                  </p>
                </div>
              ) : (
                <>
                  <ul className="divide-y divide-line px-2 pb-2 md:hidden">
                    {visible.map((tx) => (
                      <li key={tx.id} className="px-2 py-3">
                        <EntryCard tx={tx} onDelete={() => setPending({ kind: "delete", id: tx.id })} />
                      </li>
                    ))}
                  </ul>
                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-y border-line text-xs tracking-wide text-muted uppercase">
                          <th className="px-4 py-2 font-medium">Date</th>
                          <th className="px-4 py-2 font-medium">Entry</th>
                          <th className="px-4 py-2 text-right font-medium">In</th>
                          <th className="px-4 py-2 text-right font-medium">Out</th>
                          <th className="px-4 py-2 text-right font-medium">Balance</th>
                          <th className="px-3 py-2">
                            <span className="sr-only">Actions</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {visible.map((tx) => {
                          const incoming = tx.type === "transfer";
                          return (
                            <tr key={tx.id} className="border-b border-line last:border-0">
                              <td className="px-4 py-3 align-top whitespace-nowrap text-muted">
                                {formatDate(tx.date)}
                              </td>
                              <td className="px-4 py-3 align-top">
                                <span
                                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${categoryClass(tx.category)}`}
                                >
                                  {tx.category}
                                </span>
                                <p className="mt-1 font-medium break-words">{tx.description}</p>
                                <p className="mt-0.5 flex flex-wrap items-center gap-1 text-xs text-muted">
                                  <span>{tx.payer}</span>
                                  <ArrowRight className="size-3" aria-hidden="true" />
                                  <span>{tx.recipient}</span>
                                  {tx.refNo ? <span className="text-faint">· {tx.refNo}</span> : null}
                                </p>
                              </td>
                              <td className="px-4 py-3 text-right align-top font-medium whitespace-nowrap text-brass tabular-nums">
                                {incoming ? `+${formatMoney(tx.amount)}` : "—"}
                              </td>
                              <td className="px-4 py-3 text-right align-top font-medium whitespace-nowrap text-clay tabular-nums">
                                {incoming ? "—" : `−${formatMoney(tx.amount)}`}
                              </td>
                              <td
                                className={`px-4 py-3 text-right align-top font-medium whitespace-nowrap tabular-nums ${
                                  tx.balanceAfter < 0 ? "text-clay" : "text-paper"
                                }`}
                              >
                                {formatMoney(tx.balanceAfter)}
                              </td>
                              <td className="px-2 py-3 text-right align-top">
                                <button
                                  type="button"
                                  onClick={() => setPending({ kind: "delete", id: tx.id })}
                                  aria-label={`Delete ${tx.description}`}
                                  className="inline-flex size-11 items-center justify-center rounded-xl text-muted hover:bg-ink hover:text-clay"
                                >
                                  <Trash2 className="size-4" aria-hidden="true" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
              <p className="px-4 py-3 text-xs text-faint">
                Balance is the fund after each line, from oldest to newest. It does not change when you filter.
              </p>
            </div>
          </section>

          <aside className={`${formOpen ? "order-first block" : "hidden"} scroll-mt-20 lg:order-none lg:col-span-5 lg:block`}>
            <form
              ref={formRef}
              onSubmit={addEntry}
              className="rounded-2xl border border-line bg-panel p-5"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
                    <Plus className="size-4 text-brass" aria-hidden="true" />
                    Record a line
                  </h2>
                  <p className="mt-1 text-sm text-muted">Sent in adds to the fund. Spent takes from it.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="min-h-11 rounded-xl px-3 text-sm text-muted hover:bg-ink lg:hidden"
                >
                  Close
                </button>
              </div>
              <EntryFields draft={draft} amountRef={amountRef} onType={setType} onChange={patchDraft} />
              {draft.error ? <p className="mt-3 text-sm text-clay">{draft.error}</p> : null}
              <button
                type="submit"
                className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-brass px-4 text-sm font-semibold text-ink hover:bg-brass/90"
              >
                <Plus className="size-4" aria-hidden="true" />
                Add to the book
              </button>
            </form>
          </aside>
        </div>
      </main>

      {formOpen ? null : (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-ink/95 p-3 backdrop-blur-md lg:hidden">
          <button
            type="button"
            onClick={openForm}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-brass text-sm font-semibold text-ink"
          >
            <Plus className="size-4" aria-hidden="true" />
            Record a transaction
          </button>
        </div>
      )}

      <ConfirmDialog
        pending={pending}
        onCancel={() => setPending(null)}
        onConfirm={confirmPending}
      />
    </div>
  );
}

function EntryCard({ tx, onDelete }: { tx: Transaction & { balanceAfter: number }; onDelete: () => void }) {
  const incoming = tx.type === "transfer";
  return (
    <article className={`border-l-2 pl-3 ${incoming ? "border-brass" : "border-clay"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-muted">{formatDate(tx.date)}</p>
          <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${categoryClass(tx.category)}`}>
            {tx.category}
          </span>
          <p className="mt-1 font-medium break-words">{tx.description}</p>
          <p className="mt-0.5 flex flex-wrap items-center gap-1 text-xs text-muted">
            <span>{tx.payer}</span>
            <ArrowRight className="size-3" aria-hidden="true" />
            <span>{tx.recipient}</span>
            {tx.refNo ? <span className="text-faint">· {tx.refNo}</span> : null}
          </p>
        </div>
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Delete ${tx.description}`}
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl text-muted hover:bg-ink hover:text-clay"
        >
          <Trash2 className="size-4" aria-hidden="true" />
        </button>
      </div>
      <div className="mt-2 flex items-baseline justify-between gap-3 text-sm">
        <span className={`font-medium tabular-nums ${incoming ? "text-brass" : "text-clay"}`}>
          {incoming ? `+${formatMoney(tx.amount)}` : `−${formatMoney(tx.amount)}`}
        </span>
        <span className={`tabular-nums ${tx.balanceAfter < 0 ? "text-clay" : "text-muted"}`}>
          Bal {formatMoney(tx.balanceAfter)}
        </span>
      </div>
    </article>
  );
}

function EntryFields({
  draft,
  amountRef,
  onType,
  onChange,
}: {
  draft: Draft;
  amountRef: RefObject<HTMLInputElement | null>;
  onType: (type: TxType) => void;
  onChange: (partial: Partial<Draft>) => void;
}) {
  const baseId = useId();
  return (
    <div className="space-y-4">
      <fieldset>
        <legend className="mb-2 text-sm text-muted">Type</legend>
        <div className="grid grid-cols-2 gap-2">
          <TypeOption
            name={`${baseId}-type`}
            checked={draft.type === "transfer"}
            onSelect={() => onType("transfer")}
            label="Money sent"
            tone="brass"
            icon={<ArrowDownLeft className="size-4" aria-hidden="true" />}
          />
          <TypeOption
            name={`${baseId}-type`}
            checked={draft.type === "expense"}
            onSelect={() => onType("expense")}
            label="Money spent"
            tone="clay"
            icon={<ArrowUpRight className="size-4" aria-hidden="true" />}
          />
        </div>
      </fieldset>

      <label className="block" htmlFor={`${baseId}-category`}>
        <span className="mb-1.5 block text-sm text-muted">Category</span>
        <select
          id={`${baseId}-category`}
          value={draft.type === "transfer" ? "Transfer" : draft.category}
          onChange={(event) => onChange({ category: event.target.value as Category })}
          disabled={draft.type === "transfer"}
          className={`${FIELD} disabled:opacity-70`}
        >
          {draft.type === "transfer" ? <option value="Transfer">Transfer (fund deposit)</option> : null}
          {draft.type === "expense"
            ? EXPENSE_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))
            : null}
        </select>
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block" htmlFor={`${baseId}-amount`}>
          <span className="mb-1.5 block text-sm text-muted">Amount (₱)</span>
          <input
            ref={amountRef}
            id={`${baseId}-amount`}
            inputMode="decimal"
            type="number"
            min="0.01"
            step="0.01"
            value={draft.amount}
            onChange={(event) => onChange({ amount: event.target.value })}
            placeholder="0.00"
            className={FIELD}
          />
        </label>
        <label className="block" htmlFor={`${baseId}-date`}>
          <span className="mb-1.5 block text-sm text-muted">Date</span>
          <input
            id={`${baseId}-date`}
            type="date"
            required
            value={draft.date}
            onChange={(event) => onChange({ date: event.target.value })}
            className={FIELD}
          />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block" htmlFor={`${baseId}-payer`}>
          <span className="mb-1.5 block text-sm text-muted">Paid / sent by</span>
          <input
            id={`${baseId}-payer`}
            value={draft.payer}
            onChange={(event) => onChange({ payer: event.target.value })}
            className={FIELD}
          />
        </label>
        <label className="block" htmlFor={`${baseId}-recipient`}>
          <span className="mb-1.5 block text-sm text-muted">Received / paid to</span>
          <input
            id={`${baseId}-recipient`}
            value={draft.recipient}
            onChange={(event) => onChange({ recipient: event.target.value })}
            className={FIELD}
          />
        </label>
      </div>

      <label className="block" htmlFor={`${baseId}-memo`}>
        <span className="mb-1.5 block text-sm text-muted">Description</span>
        <input
          id={`${baseId}-memo`}
          value={draft.description}
          onChange={(event) => onChange({ description: event.target.value })}
          placeholder="Downpayment for kitchen tiles"
          maxLength={180}
          className={FIELD}
        />
      </label>

      <label className="block" htmlFor={`${baseId}-ref`}>
        <span className="mb-1.5 block text-sm text-muted">Ref / receipt (optional)</span>
        <input
          id={`${baseId}-ref`}
          value={draft.refNo}
          onChange={(event) => onChange({ refNo: event.target.value })}
          placeholder="GCash, check, or invoice"
          maxLength={60}
          className={FIELD}
        />
      </label>
    </div>
  );
}

function TypeOption({
  name,
  checked,
  onSelect,
  label,
  tone,
  icon,
}: {
  name: string;
  checked: boolean;
  onSelect: () => void;
  label: string;
  tone: "brass" | "clay";
  icon: ReactNode;
}) {
  const selected =
    tone === "brass"
      ? "peer-checked:border-brass peer-checked:bg-brass/15 peer-checked:text-brass"
      : "peer-checked:border-clay peer-checked:bg-clay/15 peer-checked:text-clay";
  return (
    <label className="cursor-pointer">
      <input type="radio" name={name} checked={checked} onChange={onSelect} className="peer sr-only" />
      <span
        className={`flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-line px-2 text-center text-sm text-paper peer-focus-visible:ring-2 peer-focus-visible:ring-brass ${selected}`}
      >
        {icon}
        {label}
      </span>
    </label>
  );
}

function ConfirmDialog({
  pending,
  onCancel,
  onConfirm,
}: {
  pending: Pending;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const reset = pending?.kind === "reset";
  return (
    <AlertDialog.Root open={pending !== null} onOpenChange={(open) => { if (!open) onCancel(); }}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-50 bg-ink/70" />
        <AlertDialog.Content className="fixed top-1/2 left-1/2 z-50 w-[min(100%-2rem,24rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-line bg-panel p-6">
          <AlertDialog.Title className="font-display text-xl font-semibold">
            {reset ? "Reset the book?" : "Remove this line?"}
          </AlertDialog.Title>
          <AlertDialog.Description className="mt-2 text-sm text-muted">
            {reset
              ? "Every entry on this device will be deleted. This cannot be undone."
              : "The running balance updates as if this line was never written."}
          </AlertDialog.Description>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <AlertDialog.Cancel className="min-h-11 rounded-xl border border-line text-sm text-paper hover:bg-ink">
              Cancel
            </AlertDialog.Cancel>
            <AlertDialog.Action
              onClick={onConfirm}
              className="min-h-11 rounded-xl bg-clay text-sm font-semibold text-ink hover:bg-clay/90"
            >
              {reset ? "Clear all" : "Delete"}
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
