// src/components/V6RejectedContributions.tsx
// V6 被拒绝贡献展示 — 显示能力边界过滤掉的互馈变化
// 依据: docs/v6/presentation-and-migration.md §7.5

import type { ContributionTrace, StatKey, MechanicKey } from '../types/v6.ts';
import { ELEMENT_LABELS_V6, STAT_LABELS, MECHANIC_LABELS } from '../engine/v6/finalizeGeneratedSkill.ts';
import { ELEMENT_COLORS } from '../data/vectorDims.ts';

interface V6RejectedContributionsProps {
  contributions: ContributionTrace[];
}

const REJECTION_LABELS: Record<string, string> = {
  element_capability_forbidden: '元素能力边界不允许该机制变化',
};

function getKeyLabel(key: string): string {
  return STAT_LABELS[key as StatKey] ?? MECHANIC_LABELS[key as MechanicKey] ?? key;
}

export function V6RejectedContributions({ contributions }: V6RejectedContributionsProps) {
  const rejected = contributions.filter((c) => c.status === 'rejected');

  if (rejected.length === 0) {
    return (
      <div className="v6-rejected">
        <details>
          <summary className="v6-rejected__summary">
            被拒绝的贡献 (0) — 所有互馈变化均在能力边界内
          </summary>
        </details>
      </div>
    );
  }

  // Group by target slot
  const grouped = new Map<number, ContributionTrace[]>();
  for (const ct of rejected) {
    const group = grouped.get(ct.targetSlot) ?? [];
    group.push(ct);
    grouped.set(ct.targetSlot, group);
  }

  return (
    <div className="v6-rejected">
      <details>
        <summary className="v6-rejected__summary">
          被拒绝的贡献 ({rejected.length}) — 以下互馈变化被能力边界过滤
        </summary>
        <div className="v6-rejected__body">
          <p className="v6-rejected__intro">
            规则引擎计算了这些贡献的原始变化量，但因目标技能的元素能力边界不允许该机制，最终被拒绝应用。
            这证明了规则引擎<strong>不是简单查表</strong>——它真实计算了每个可能的变化，再根据语义合法性过滤。
          </p>
          {Array.from(grouped.entries()).map(([slot, items]) => (
            <div key={slot} className="v6-rejected__group">
              <h4 className="v6-rejected__slot-title">目标：技能 {'ⅠⅡⅢⅣ'[slot]}（位{slot + 1}）</h4>
              {items.map((ct, i) => (
                <div key={i} className="v6-rejected__item" style={{ borderLeftColor: ELEMENT_COLORS[ct.sourceElement] ?? '#888' }}>
                  <div className="v6-rejected__item-header">
                    <span className="v6-rejected__source" style={{ color: ELEMENT_COLORS[ct.sourceElement] }}>
                      位{ct.sourceSlot + 1} {ELEMENT_LABELS_V6[ct.sourceElement]}
                    </span>
                    <span className="v6-rejected__arrow">→</span>
                    <span className="v6-rejected__target" style={{ color: ELEMENT_COLORS[ct.targetElement] }}>
                      位{ct.targetSlot + 1} {ELEMENT_LABELS_V6[ct.targetElement]}
                    </span>
                    <span className="v6-rejected__reaction">「{ct.reactionName}」</span>
                    <span className="v6-rejected__id">[{ct.id}]</span>
                  </div>
                  <div className="v6-rejected__detail">
                    <span className="v6-rejected__key">{getKeyLabel(ct.key)}</span>
                    <span className="v6-rejected__raw">原始变化：{ct.rawDelta > 0 ? '+' : ''}{ct.rawDelta.toFixed(3)}</span>
                    <span className="v6-rejected__reason">
                      拒绝原因：{REJECTION_LABELS[ct.rejectionReason ?? ''] ?? ct.rejectionReason ?? '未知'}
                    </span>
                  </div>
                  <div className="v6-rejected__explain">{ct.explanation}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
