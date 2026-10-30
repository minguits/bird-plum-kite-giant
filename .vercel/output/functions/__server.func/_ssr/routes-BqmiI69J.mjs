import { i as __toESM } from "../_runtime.mjs";
import { a as AlertDialogDescription, c as AlertDialogTitle, d as require_react, i as AlertDialogContent, n as AlertDialogAction, o as AlertDialogOverlay, r as AlertDialogCancel, s as AlertDialogPortal, t as AlertDialog, u as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { a as LayoutGrid, c as Briefcase, d as ArrowDownLeft, i as Plus, l as ArrowUpRight, n as Trash2, o as House, r as Search, s as Download, u as ArrowRight } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-BqmiI69J.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
var CATEGORIES = [
	"Transfer",
	"House Payment",
	"Business",
	"Miscellaneous"
];
var EXPENSE_CATEGORIES = [
	"House Payment",
	"Business",
	"Miscellaneous"
];
var STORAGE_KEY = "home-ledger-v1";
function localToday() {
	const now = /* @__PURE__ */ new Date();
	const month = String(now.getMonth() + 1).padStart(2, "0");
	const day = String(now.getDate()).padStart(2, "0");
	return `${now.getFullYear()}-${month}-${day}`;
}
function formatMoney(value) {
	return new Intl.NumberFormat("en-PH", {
		style: "currency",
		currency: "PHP",
		minimumFractionDigits: 2
	}).format(value);
}
function formatDate(dateStr) {
	const [year, month, day] = dateStr.split("-").map(Number);
	if (!year || !month || !day) return dateStr;
	return new Date(year, month - 1, day).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric"
	});
}
function compute(transactions) {
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
		return {
			...tx,
			balanceAfter: balance
		};
	});
	return {
		balance,
		inflow,
		outflow,
		house,
		business,
		misc,
		rows
	};
}
function isSampleBook(transactions) {
	return transactions.length > 0 && transactions.every((tx) => tx.id.startsWith("sample-"));
}
function makeSample(today) {
	const base = Date.parse(`${today}T08:00:00`);
	const at = (minutes) => new Date(base + minutes * 6e4).toISOString();
	return [
		{
			id: "sample-transfer",
			date: today,
			type: "transfer",
			category: "Transfer",
			amount: 5e4,
			payer: "Boyfriend",
			recipient: "Me",
			description: "Remittance for home savings fund",
			refNo: "GCASH-982112",
			createdAt: at(0)
		},
		{
			id: "sample-house",
			date: today,
			type: "expense",
			category: "House Payment",
			amount: 15e3,
			payer: "Me",
			recipient: "Architect / Developer",
			description: "Initial deposit for architectural blueprint design",
			refNo: "INV-0012",
			createdAt: at(1)
		},
		{
			id: "sample-business",
			date: today,
			type: "expense",
			category: "Business",
			amount: 8500,
			payer: "Me",
			recipient: "Supplier",
			description: "Inventory payment for business startup",
			refNo: "SUP-4421",
			createdAt: at(2)
		},
		{
			id: "sample-misc",
			date: today,
			type: "expense",
			category: "Miscellaneous",
			amount: 1200,
			payer: "Me",
			recipient: "Notary Public",
			description: "Document notarization fees for land title",
			refNo: "RCPT-88",
			createdAt: at(3)
		}
	];
}
function isCategory(value) {
	return typeof value === "string" && CATEGORIES.includes(value);
}
function normalize(value) {
	if (!value || typeof value !== "object") return null;
	const row = value;
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
		recipient: typeof row.recipient === "string" && row.recipient.trim() ? row.recipient : "Unspecified",
		description: row.description,
		refNo: typeof row.refNo === "string" ? row.refNo : "",
		createdAt: typeof row.createdAt === "string" ? row.createdAt : row.date
	};
}
function readLedger() {
	if (typeof window === "undefined") return null;
	try {
		const raw = window.localStorage.getItem(STORAGE_KEY);
		if (raw == null) return null;
		const parsed = JSON.parse(raw);
		if (!Array.isArray(parsed)) return null;
		return parsed.map(normalize).filter((row) => row !== null);
	} catch {
		return null;
	}
}
function writeLedger(transactions) {
	if (typeof window === "undefined") return;
	try {
		window.localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
	} catch {}
}
function csvField(value) {
	return `"${value.replaceAll("\"", "\"\"")}"`;
}
function toCsv(transactions) {
	const lines = ["Date,Type,Category,Description,Paid By,Received By,Amount (PHP),Ref No"];
	const ordered = [...transactions].sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : 0);
	for (const tx of ordered) lines.push([
		tx.date,
		tx.type,
		csvField(tx.category),
		csvField(tx.description),
		csvField(tx.payer),
		csvField(tx.recipient),
		tx.amount.toFixed(2),
		csvField(tx.refNo)
	].join(","));
	return `\uFEFF${lines.join("\n")}`;
}
function downloadCsv(transactions) {
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
var SpendChart = (0, import_react.lazy)(() => import("./spend-chart-BIWE8s-Q.mjs").then((mod) => ({ default: mod.SpendChart })));
var FIELD = "w-full rounded-xl border border-line bg-ink px-3 py-3 text-base text-paper placeholder:text-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass";
var SPEND_ROWS = [
	{
		category: "House Payment",
		label: "House",
		key: "house",
		bar: "bg-brass",
		fill: "var(--color-brass)",
		icon: House
	},
	{
		category: "Business",
		label: "Business",
		key: "business",
		bar: "bg-sand",
		fill: "var(--color-sand)",
		icon: Briefcase
	},
	{
		category: "Miscellaneous",
		label: "Miscellaneous",
		key: "misc",
		bar: "bg-clay",
		fill: "var(--color-clay)",
		icon: LayoutGrid
	}
];
function blankDraft(date) {
	return {
		type: "transfer",
		category: "Transfer",
		amount: "",
		date,
		payer: "Boyfriend",
		recipient: "Me",
		description: "",
		refNo: "",
		error: ""
	};
}
function categoryClass(category) {
	if (category === "Transfer") return "bg-ink text-paper ring-1 ring-line";
	if (category === "House Payment") return "bg-brass/15 text-brass";
	if (category === "Business") return "bg-sand/15 text-sand";
	return "bg-clay/15 text-clay";
}
function HomeLedger() {
	const [transactions, setTransactions] = (0, import_react.useState)(null);
	const [draft, setDraft] = (0, import_react.useState)(() => blankDraft(""));
	const [query, setQuery] = (0, import_react.useState)("");
	const [categoryFilter, setCategoryFilter] = (0, import_react.useState)("ALL");
	const [typeFilter, setTypeFilter] = (0, import_react.useState)("ALL");
	const [formOpen, setFormOpen] = (0, import_react.useState)(false);
	const [pending, setPending] = (0, import_react.useState)(null);
	const [chartReady, setChartReady] = (0, import_react.useState)(false);
	const formRef = (0, import_react.useRef)(null);
	const amountRef = (0, import_react.useRef)(null);
	const listRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		const today = localToday();
		const stored = readLedger();
		setTransactions(stored ?? makeSample(today));
		setDraft((current) => ({
			...current,
			date: current.date || today
		}));
		setChartReady(true);
	}, []);
	(0, import_react.useEffect)(() => {
		if (transactions) writeLedger(transactions);
	}, [transactions]);
	const totals = (0, import_react.useMemo)(() => compute(transactions ?? []), [transactions]);
	const ready = transactions !== null;
	const sample = transactions ? isSampleBook(transactions) : false;
	const visible = (0, import_react.useMemo)(() => {
		const needle = query.trim().toLowerCase();
		return [...totals.rows].reverse().filter((tx) => {
			const matchesQuery = needle.length === 0 || tx.description.toLowerCase().includes(needle) || tx.refNo.toLowerCase().includes(needle) || tx.payer.toLowerCase().includes(needle) || tx.recipient.toLowerCase().includes(needle);
			const matchesCategory = categoryFilter === "ALL" || tx.category === categoryFilter;
			const matchesType = typeFilter === "ALL" || tx.type === typeFilter;
			return matchesQuery && matchesCategory && matchesType;
		});
	}, [
		totals.rows,
		query,
		categoryFilter,
		typeFilter
	]);
	const filtersOn = query.trim().length > 0 || categoryFilter !== "ALL" || typeFilter !== "ALL";
	function patchDraft(partial) {
		setDraft((current) => ({
			...current,
			error: "",
			...partial
		}));
	}
	function setType(type) {
		if (type === "transfer") {
			patchDraft({
				type,
				category: "Transfer",
				payer: "Boyfriend",
				recipient: "Me"
			});
			return;
		}
		patchDraft({
			type,
			category: "House Payment",
			payer: "Me",
			recipient: "Vendor / Service"
		});
	}
	function openForm() {
		setFormOpen(true);
		window.setTimeout(() => {
			formRef.current?.scrollIntoView({
				behavior: "smooth",
				block: "start"
			});
			amountRef.current?.focus();
		}, 30);
	}
	function addEntry(event) {
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
		const entry = {
			id: crypto.randomUUID(),
			date: draft.date,
			type: draft.type,
			category: draft.type === "transfer" ? "Transfer" : draft.category,
			amount,
			payer: draft.payer.trim() || "Unspecified",
			recipient: draft.recipient.trim() || "Unspecified",
			description,
			refNo: draft.refNo.trim(),
			createdAt: (/* @__PURE__ */ new Date()).toISOString()
		};
		setTransactions((current) => [entry, ...current ?? []]);
		setDraft((current) => ({
			...current,
			amount: "",
			description: "",
			refNo: "",
			error: ""
		}));
		toast.success("Added to the book");
		if (window.innerWidth < 1024) {
			setFormOpen(false);
			listRef.current?.scrollIntoView({
				behavior: "smooth",
				block: "start"
			});
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
	const countLabel = visible.length === totals.rows.length ? `${visible.length} ${visible.length === 1 ? "entry" : "entries"}` : `${visible.length} of ${totals.rows.length}`;
	const slices = SPEND_ROWS.map((row) => ({
		name: row.label,
		value: totals[row.key],
		fill: row.fill
	}));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-ink text-paper",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
				className: "sticky top-0 z-40 border-b border-line bg-ink/95 backdrop-blur-md",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex min-w-0 items-center gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "flex size-10 shrink-0 items-center justify-center rounded-xl bg-brass text-ink",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(House, {
								className: "size-5",
								"aria-hidden": "true"
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "truncate font-display text-lg font-semibold leading-tight",
								children: "Home Ledger"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "truncate text-xs text-muted",
								children: "House, business, and the fund between you"
							})]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex shrink-0 items-center gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "hidden items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-xs text-muted sm:inline-flex",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "size-1.5 rounded-full bg-brass",
									"aria-hidden": "true"
								}), "On this device"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: exportBook,
								className: "inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-line px-3 text-sm text-paper hover:bg-panel",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, {
									className: "size-4",
									"aria-hidden": "true"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "hidden sm:inline",
									children: "Export"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => setPending({ kind: "reset" }),
								className: "inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-line px-3 text-sm text-clay hover:bg-panel",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, {
									className: "size-4",
									"aria-hidden": "true"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "hidden sm:inline",
									children: "Reset"
								})]
							})
						]
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "mx-auto max-w-6xl px-4 py-5 pb-28 sm:px-6 lg:pb-10",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "grid gap-4 lg:grid-cols-5",
					"aria-label": "Fund summary",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-2xl border border-line bg-panel p-5 lg:col-span-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-muted",
								children: "Available fund"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: `mt-1 font-display text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl ${totals.balance < 0 ? "text-clay" : "text-paper"}`,
								"aria-live": "polite",
								children: ready ? formatMoney(totals.balance) : "—"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-sm text-muted",
								children: totals.balance < 0 ? "The fund is short." : "Money sent in, minus what was spent."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-5 grid grid-cols-2 gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "rounded-xl bg-ink px-3 py-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "flex items-center gap-1.5 text-xs text-muted",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowDownLeft, {
											className: "size-3.5 text-brass",
											"aria-hidden": "true"
										}), "Sent in"]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-1 font-medium text-brass tabular-nums",
										children: ready ? formatMoney(totals.inflow) : "—"
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "rounded-xl bg-ink px-3 py-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "flex items-center gap-1.5 text-xs text-muted",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUpRight, {
											className: "size-3.5 text-clay",
											"aria-hidden": "true"
										}), "Spent"]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-1 font-medium text-clay tabular-nums",
										children: ready ? formatMoney(totals.outflow) : "—"
									})]
								})]
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-2xl border border-line bg-panel p-5 lg:col-span-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mb-3 flex items-baseline justify-between gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "font-display text-lg font-semibold",
								children: "Where it went"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-muted",
								children: "Tap a row to filter the book"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid items-center gap-4 sm:grid-cols-[1fr_9.5rem]",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "space-y-1",
								children: SPEND_ROWS.map((row) => {
									const amount = totals[row.key];
									const pct = totals.outflow > 0 ? Math.round(amount / totals.outflow * 100) : 0;
									const selected = categoryFilter === row.category;
									const Icon = row.icon;
									return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										"aria-pressed": selected,
										onClick: () => setCategoryFilter((current) => current === row.category ? "ALL" : row.category),
										className: `w-full rounded-xl px-2 py-2 text-left hover:bg-panel-2 ${selected ? "bg-panel-2 ring-1 ring-brass" : ""}`,
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "flex items-center gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
												className: "size-4 shrink-0 text-muted",
												"aria-hidden": "true"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "min-w-0 flex-1",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "flex items-baseline justify-between gap-3",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "text-sm font-medium",
														children: row.label
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "text-sm tabular-nums",
														children: ready ? formatMoney(amount) : "—"
													})]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "mt-1.5 block h-1 overflow-hidden rounded-full bg-ink",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: `block h-full rounded-full ${row.bar}`,
														style: { width: `${pct}%` }
													})
												})]
											})]
										})
									}, row.category);
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mx-auto w-full max-w-40",
								children: chartReady ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react.Suspense, {
									fallback: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-36" }),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SpendChart, { slices })
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-36" })
							})]
						})]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 grid items-start gap-4 lg:grid-cols-12",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
						ref: listRef,
						className: "scroll-mt-20 lg:col-span-7",
						"aria-label": "Transaction history",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-2xl border border-line bg-panel",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "relative min-w-0 flex-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, {
											className: "pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-faint",
											"aria-hidden": "true"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											value: query,
											onChange: (event) => setQuery(event.target.value),
											placeholder: "Search memo, person, or ref",
											"aria-label": "Search the book",
											className: `${FIELD} pl-9`
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-2 gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
											value: categoryFilter,
											onChange: (event) => setCategoryFilter(event.target.value),
											"aria-label": "Filter by category",
											className: FIELD,
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
													value: "ALL",
													children: "All categories"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
													value: "Transfer",
													children: "Transfers"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
													value: "House Payment",
													children: "House"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
													value: "Business",
													children: "Business"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
													value: "Miscellaneous",
													children: "Miscellaneous"
												})
											]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
											value: typeFilter,
											onChange: (event) => setTypeFilter(event.target.value),
											"aria-label": "Filter by type",
											className: FIELD,
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
													value: "ALL",
													children: "All types"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
													value: "transfer",
													children: "Sent in"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
													value: "expense",
													children: "Spent"
												})
											]
										})]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between gap-3 px-4 py-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
										className: "font-display text-lg font-semibold",
										children: "The book"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-3 text-xs text-muted",
										children: [filtersOn ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											onClick: () => {
												setQuery("");
												setCategoryFilter("ALL");
												setTypeFilter("ALL");
											},
											className: "text-brass hover:underline",
											children: "Clear filters"
										}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: countLabel })]
									})]
								}),
								sample ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mx-4 mb-3 rounded-xl bg-ink px-3 py-2 text-sm text-muted",
									children: "These lines are examples, so you can see how a fund reads. Reset the book when you want a clean start."
								}) : null,
								!ready || visible.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "px-4 py-14 text-center",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "font-medium",
										children: ready && totals.rows.length > 0 ? "Nothing matches those filters." : "The book is empty."
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-1 text-sm text-muted",
										children: ready && totals.rows.length > 0 ? "Clear the search or pick another category." : "Record money sent into the fund, or the first thing it paid for."
									})]
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
									className: "divide-y divide-line px-2 pb-2 md:hidden",
									children: visible.map((tx) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
										className: "px-2 py-3",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EntryCard, {
											tx,
											onDelete: () => setPending({
												kind: "delete",
												id: tx.id
											})
										})
									}, tx.id))
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "hidden overflow-x-auto md:block",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
										className: "w-full text-left text-sm",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
											className: "border-y border-line text-xs tracking-wide text-muted uppercase",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
													className: "px-4 py-2 font-medium",
													children: "Date"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
													className: "px-4 py-2 font-medium",
													children: "Entry"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
													className: "px-4 py-2 text-right font-medium",
													children: "In"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
													className: "px-4 py-2 text-right font-medium",
													children: "Out"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
													className: "px-4 py-2 text-right font-medium",
													children: "Balance"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
													className: "px-3 py-2",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "sr-only",
														children: "Actions"
													})
												})
											]
										}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: visible.map((tx) => {
											const incoming = tx.type === "transfer";
											return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
												className: "border-b border-line last:border-0",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
														className: "px-4 py-3 align-top whitespace-nowrap text-muted",
														children: formatDate(tx.date)
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
														className: "px-4 py-3 align-top",
														children: [
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: `inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${categoryClass(tx.category)}`,
																children: tx.category
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
																className: "mt-1 font-medium break-words",
																children: tx.description
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
																className: "mt-0.5 flex flex-wrap items-center gap-1 text-xs text-muted",
																children: [
																	/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: tx.payer }),
																	/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, {
																		className: "size-3",
																		"aria-hidden": "true"
																	}),
																	/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: tx.recipient }),
																	tx.refNo ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
																		className: "text-faint",
																		children: ["· ", tx.refNo]
																	}) : null
																]
															})
														]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
														className: "px-4 py-3 text-right align-top font-medium whitespace-nowrap text-brass tabular-nums",
														children: incoming ? `+${formatMoney(tx.amount)}` : "—"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
														className: "px-4 py-3 text-right align-top font-medium whitespace-nowrap text-clay tabular-nums",
														children: incoming ? "—" : `−${formatMoney(tx.amount)}`
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
														className: `px-4 py-3 text-right align-top font-medium whitespace-nowrap tabular-nums ${tx.balanceAfter < 0 ? "text-clay" : "text-paper"}`,
														children: formatMoney(tx.balanceAfter)
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
														className: "px-2 py-3 text-right align-top",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
															type: "button",
															onClick: () => setPending({
																kind: "delete",
																id: tx.id
															}),
															"aria-label": `Delete ${tx.description}`,
															className: "inline-flex size-11 items-center justify-center rounded-xl text-muted hover:bg-ink hover:text-clay",
															children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, {
																className: "size-4",
																"aria-hidden": "true"
															})
														})
													})
												]
											}, tx.id);
										}) })]
									})
								})] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "px-4 py-3 text-xs text-faint",
									children: "Balance is the fund after each line, from oldest to newest. It does not change when you filter."
								})
							]
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("aside", {
						className: `${formOpen ? "order-first block" : "hidden"} scroll-mt-20 lg:order-none lg:col-span-5 lg:block`,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
							ref: formRef,
							onSubmit: addEntry,
							className: "rounded-2xl border border-line bg-panel p-5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mb-4 flex items-start justify-between gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
										className: "flex items-center gap-2 font-display text-lg font-semibold",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {
											className: "size-4 text-brass",
											"aria-hidden": "true"
										}), "Record a line"]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-1 text-sm text-muted",
										children: "Sent in adds to the fund. Spent takes from it."
									})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => setFormOpen(false),
										className: "min-h-11 rounded-xl px-3 text-sm text-muted hover:bg-ink lg:hidden",
										children: "Close"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(EntryFields, {
									draft,
									amountRef,
									onType: setType,
									onChange: patchDraft
								}),
								draft.error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-3 text-sm text-clay",
									children: draft.error
								}) : null,
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "submit",
									className: "mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-brass px-4 text-sm font-semibold text-ink hover:bg-brass/90",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {
										className: "size-4",
										"aria-hidden": "true"
									}), "Add to the book"]
								})
							]
						})
					})]
				})]
			}),
			formOpen ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed inset-x-0 bottom-0 z-30 border-t border-line bg-ink/95 p-3 backdrop-blur-md lg:hidden",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: openForm,
					className: "inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-brass text-sm font-semibold text-ink",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {
						className: "size-4",
						"aria-hidden": "true"
					}), "Record a transaction"]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ConfirmDialog, {
				pending,
				onCancel: () => setPending(null),
				onConfirm: confirmPending
			})
		]
	});
}
function EntryCard({ tx, onDelete }) {
	const incoming = tx.type === "transfer";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: `border-l-2 pl-3 ${incoming ? "border-brass" : "border-clay"}`,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-start justify-between gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-w-0",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted",
						children: formatDate(tx.date)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: `mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${categoryClass(tx.category)}`,
						children: tx.category
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 font-medium break-words",
						children: tx.description
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-0.5 flex flex-wrap items-center gap-1 text-xs text-muted",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: tx.payer }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, {
								className: "size-3",
								"aria-hidden": "true"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: tx.recipient }),
							tx.refNo ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-faint",
								children: ["· ", tx.refNo]
							}) : null
						]
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: onDelete,
				"aria-label": `Delete ${tx.description}`,
				className: "inline-flex size-11 shrink-0 items-center justify-center rounded-xl text-muted hover:bg-ink hover:text-clay",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, {
					className: "size-4",
					"aria-hidden": "true"
				})
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-2 flex items-baseline justify-between gap-3 text-sm",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: `font-medium tabular-nums ${incoming ? "text-brass" : "text-clay"}`,
				children: incoming ? `+${formatMoney(tx.amount)}` : `−${formatMoney(tx.amount)}`
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: `tabular-nums ${tx.balanceAfter < 0 ? "text-clay" : "text-muted"}`,
				children: ["Bal ", formatMoney(tx.balanceAfter)]
			})]
		})]
	});
}
function EntryFields({ draft, amountRef, onType, onChange }) {
	const baseId = (0, import_react.useId)();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", {
				className: "mb-2 text-sm text-muted",
				children: "Type"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-2 gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TypeOption, {
					name: `${baseId}-type`,
					checked: draft.type === "transfer",
					onSelect: () => onType("transfer"),
					label: "Money sent",
					tone: "brass",
					icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowDownLeft, {
						className: "size-4",
						"aria-hidden": "true"
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TypeOption, {
					name: `${baseId}-type`,
					checked: draft.type === "expense",
					onSelect: () => onType("expense"),
					label: "Money spent",
					tone: "clay",
					icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUpRight, {
						className: "size-4",
						"aria-hidden": "true"
					})
				})]
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "block",
				htmlFor: `${baseId}-category`,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "mb-1.5 block text-sm text-muted",
					children: "Category"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
					id: `${baseId}-category`,
					value: draft.type === "transfer" ? "Transfer" : draft.category,
					onChange: (event) => onChange({ category: event.target.value }),
					disabled: draft.type === "transfer",
					className: `${FIELD} disabled:opacity-70`,
					children: [draft.type === "transfer" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: "Transfer",
						children: "Transfer (fund deposit)"
					}) : null, draft.type === "expense" ? EXPENSE_CATEGORIES.map((category) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: category,
						children: category
					}, category)) : null]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-3 sm:grid-cols-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "block",
					htmlFor: `${baseId}-amount`,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "mb-1.5 block text-sm text-muted",
						children: "Amount (₱)"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						ref: amountRef,
						id: `${baseId}-amount`,
						inputMode: "decimal",
						type: "number",
						min: "0.01",
						step: "0.01",
						value: draft.amount,
						onChange: (event) => onChange({ amount: event.target.value }),
						placeholder: "0.00",
						className: FIELD
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "block",
					htmlFor: `${baseId}-date`,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "mb-1.5 block text-sm text-muted",
						children: "Date"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						id: `${baseId}-date`,
						type: "date",
						required: true,
						value: draft.date,
						onChange: (event) => onChange({ date: event.target.value }),
						className: FIELD
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-3 sm:grid-cols-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "block",
					htmlFor: `${baseId}-payer`,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "mb-1.5 block text-sm text-muted",
						children: "Paid / sent by"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						id: `${baseId}-payer`,
						value: draft.payer,
						onChange: (event) => onChange({ payer: event.target.value }),
						className: FIELD
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "block",
					htmlFor: `${baseId}-recipient`,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "mb-1.5 block text-sm text-muted",
						children: "Received / paid to"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						id: `${baseId}-recipient`,
						value: draft.recipient,
						onChange: (event) => onChange({ recipient: event.target.value }),
						className: FIELD
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "block",
				htmlFor: `${baseId}-memo`,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "mb-1.5 block text-sm text-muted",
					children: "Description"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					id: `${baseId}-memo`,
					value: draft.description,
					onChange: (event) => onChange({ description: event.target.value }),
					placeholder: "Downpayment for kitchen tiles",
					maxLength: 180,
					className: FIELD
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "block",
				htmlFor: `${baseId}-ref`,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "mb-1.5 block text-sm text-muted",
					children: "Ref / receipt (optional)"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					id: `${baseId}-ref`,
					value: draft.refNo,
					onChange: (event) => onChange({ refNo: event.target.value }),
					placeholder: "GCash, check, or invoice",
					maxLength: 60,
					className: FIELD
				})]
			})
		]
	});
}
function TypeOption({ name, checked, onSelect, label, tone, icon }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "cursor-pointer",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
			type: "radio",
			name,
			checked,
			onChange: onSelect,
			className: "peer sr-only"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: `flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-line px-2 text-center text-sm text-paper peer-focus-visible:ring-2 peer-focus-visible:ring-brass ${tone === "brass" ? "peer-checked:border-brass peer-checked:bg-brass/15 peer-checked:text-brass" : "peer-checked:border-clay peer-checked:bg-clay/15 peer-checked:text-clay"}`,
			children: [icon, label]
		})]
	});
}
function ConfirmDialog({ pending, onCancel, onConfirm }) {
	const reset = pending?.kind === "reset";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialog, {
		open: pending !== null,
		onOpenChange: (open) => {
			if (!open) onCancel();
		},
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogPortal, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogOverlay, { className: "fixed inset-0 z-50 bg-ink/70" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogContent, {
			className: "fixed top-1/2 left-1/2 z-50 w-[min(100%-2rem,24rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-line bg-panel p-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogTitle, {
					className: "font-display text-xl font-semibold",
					children: reset ? "Reset the book?" : "Remove this line?"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogDescription, {
					className: "mt-2 text-sm text-muted",
					children: reset ? "Every entry on this device will be deleted. This cannot be undone." : "The running balance updates as if this line was never written."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-5 grid grid-cols-2 gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogCancel, {
						className: "min-h-11 rounded-xl border border-line text-sm text-paper hover:bg-ink",
						children: "Cancel"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogAction, {
						onClick: onConfirm,
						className: "min-h-11 rounded-xl bg-clay text-sm font-semibold text-ink hover:bg-clay/90",
						children: reset ? "Clear all" : "Delete"
					})]
				})
			]
		})] })
	});
}
var routes_exports = /* @__PURE__ */ __exportAll({ component: () => SplitComponent });
var SplitComponent = HomeLedger;
//#endregion
export { formatMoney as n, routes_exports as t };
