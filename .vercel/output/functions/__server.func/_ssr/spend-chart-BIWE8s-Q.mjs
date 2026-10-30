import { u as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { n as formatMoney } from "./routes-BqmiI69J.mjs";
import { a as Tooltip, i as ResponsiveContainer, n as Pie, r as Cell, t as PieChart } from "../_libs/recharts+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/spend-chart-BIWE8s-Q.js
var import_jsx_runtime = require_jsx_runtime();
function Tip({ active, payload }) {
	if (!active || !payload?.length) return null;
	const item = payload[0];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-xl border border-line bg-ink px-3 py-2 text-sm",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-muted",
			children: item.name
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "font-medium text-paper tabular-nums",
			children: formatMoney(Number(item.value ?? 0))
		})]
	});
}
function SpendChart({ slices }) {
	const drawn = slices.filter((slice) => slice.value > 0);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "h-36 w-full",
		children: drawn.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex h-full items-center justify-center text-center text-sm text-muted",
			children: "Spending shows up here"
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
			width: "100%",
			height: "100%",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(PieChart, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pie, {
				data: drawn,
				dataKey: "value",
				nameKey: "name",
				innerRadius: "62%",
				outerRadius: "92%",
				paddingAngle: 2,
				stroke: "var(--color-panel)",
				strokeWidth: 2,
				isAnimationActive: false,
				children: drawn.map((slice) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cell, { fill: slice.fill }, slice.name))
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, { content: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tip, {}) })] })
		})
	});
}
//#endregion
export { SpendChart };
