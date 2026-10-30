import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatMoney } from "@/lib/ledger";

export interface SpendSlice {
  name: string;
  value: number;
  fill: string;
}

interface TipProps {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number }>;
}

function Tip({ active, payload }: TipProps) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="rounded-xl border border-line bg-ink px-3 py-2 text-sm">
      <p className="text-muted">{item.name}</p>
      <p className="font-medium text-paper tabular-nums">{formatMoney(Number(item.value ?? 0))}</p>
    </div>
  );
}

export function SpendChart({ slices }: { slices: SpendSlice[] }) {
  const drawn = slices.filter((slice) => slice.value > 0);

  return (
    <div className="h-36 w-full">
      {drawn.length === 0 ? (
        <div className="flex h-full items-center justify-center text-center text-sm text-muted">
          Spending shows up here
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={drawn}
              dataKey="value"
              nameKey="name"
              innerRadius="62%"
              outerRadius="92%"
              paddingAngle={2}
              stroke="var(--color-panel)"
              strokeWidth={2}
              isAnimationActive={false}
            >
              {drawn.map((slice) => (
                <Cell key={slice.name} fill={slice.fill} />
              ))}
            </Pie>
            <Tooltip content={<Tip />} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
