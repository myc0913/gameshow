// src/components/VectorBar.tsx
// V4 更新：支持新的行为维度标签

interface VectorBarProps {
  label: string;
  value: number;
  color?: string;
  maxValue?: number;
  showValue?: boolean;
  highlight?: boolean;
}

const BEHAVIOR_COLORS: Record<string, string> = {
  '冲击': '#ff6b6b', '爆裂': '#ff4444', '持续': '#ffa94d', '扩散': '#ff922b',
  '区域': '#748ffc', '控制': '#4dabf7', '禁锢': '#e599f7', '连锁': '#ffd43b',
  '延迟': '#da77f2', '标记': '#f06595', '穿透': '#ffe066', '防护': '#69db7c',
  '牵引': '#20c997', '位移': '#40c057', '疾速': '#38d9a9', '召出': '#adb5bd',
};

function getDimColor(label: string): string {
  // Look up by Chinese label
  if (BEHAVIOR_COLORS[label]) return BEHAVIOR_COLORS[label];

  // Fallback: hash the label
  let hash = 0;
  for (let i = 0; i < label.length; i++) hash = (hash * 31 + label.charCodeAt(i)) % 360;
  return `hsl(${hash}, 60%, 55%)`;
}

/** 单个向量维度的水平条 */
export function VectorBar({
  label,
  value,
  color,
  maxValue = 1,
  showValue = true,
  highlight = false,
}: VectorBarProps) {
  const barColor = color ?? getDimColor(label);
  const pct = Math.min(100, Math.max(0, (value / maxValue) * 100));

  return (
    <div className={`vec-bar ${highlight ? 'vec-bar--highlight' : ''}`}>
      <span className="vec-bar__label">{label}</span>
      <div className="vec-bar__track">
        <div
          className="vec-bar__fill"
          style={{
            width: `${pct}%`,
            background: highlight
              ? barColor
              : `linear-gradient(90deg, ${barColor}cc, ${barColor}44)`,
            boxShadow: highlight ? `0 0 6px ${barColor}88` : undefined,
          }}
        />
      </div>
      {showValue && <span className="vec-bar__value">{value.toFixed(2)}</span>}
    </div>
  );
}
