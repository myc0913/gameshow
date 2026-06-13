// src/components/DeltaBar.tsx
// 差异可视化原语 — 双色并排条形图，用于所有对比场景

interface DeltaBarProps {
  label: string;
  valueA: number;
  valueB: number;
  maxValue?: number;
  showDelta?: boolean;
}

/**
 * 并排双色差异条。
 * 金色 (gold) = A 值，翡翠 (jade) = B 值。
 * 可选显示差值标注（▲ +Δ / ▼ -Δ / ≈ 无变化）。
 */
export function DeltaBar({
  label,
  valueA,
  valueB,
  maxValue = 1,
  showDelta = true,
}: DeltaBarProps) {
  const delta = valueB - valueA;
  const pctA = Math.min((valueA / maxValue) * 100, 100);
  const pctB = Math.min((valueB / maxValue) * 100, 100);
  const deltaSignificant = Math.abs(delta) > 0.01;
  const deltaLabel = !deltaSignificant
    ? '≈'
    : delta > 0
      ? `▲ +${delta.toFixed(2)}`
      : `▼ ${delta.toFixed(2)}`;
  const deltaClass = !deltaSignificant
    ? 'delta-bar__delta--same'
    : delta > 0
      ? 'delta-bar__delta--up'
      : 'delta-bar__delta--down';

  return (
    <div className="delta-bar">
      <span className="delta-bar__label">{label}</span>
      <div className="delta-bar__tracks">
        <div className="delta-bar__track delta-bar__track--a">
          <div
            className="delta-bar__fill delta-bar__fill--a"
            style={{ width: `${pctA}%` }}
          />
          <span className="delta-bar__value">{valueA.toFixed(2)}</span>
        </div>
        <div className="delta-bar__track delta-bar__track--b">
          <div
            className="delta-bar__fill delta-bar__fill--b"
            style={{ width: `${pctB}%` }}
          />
          <span className="delta-bar__value">{valueB.toFixed(2)}</span>
        </div>
      </div>
      {showDelta && (
        <span className={`delta-bar__delta ${deltaClass}`}>{deltaLabel}</span>
      )}
    </div>
  );
}
