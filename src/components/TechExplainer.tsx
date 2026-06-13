// src/components/TechExplainer.tsx
// V6 重写：展示 V6 技能互馈引擎的工作原理
// 依据: docs/v6/presentation-and-migration.md §7

import { useMemo, type CSSProperties } from 'react';
import type { GeneratedBuild } from '../types/v6.ts';
import { STAT_KEYS } from '../types/v6.ts';
import { ELEMENT_LABELS_V6, STAT_LABELS, FORM_LABELS } from '../engine/v6/finalizeGeneratedSkill.ts';
import { ELEMENT_COLORS } from '../data/vectorDims.ts';
import { diffBuilds } from '../engine/v6/diffBuilds.ts';
import { getBaseSkill } from '../data/v6/baseSkills.ts';
import { V6CausalityGraph } from './V6CausalityGraph.tsx';
import { V6PerSkillSnapshot } from './V6PerSkillSnapshot.tsx';
import { V6RejectedContributions } from './V6RejectedContributions.tsx';
import { V6FormulaDetail } from './V6FormulaDetail.tsx';
import { DeltaBar } from './DeltaBar.tsx';

interface TechExplainerProps {
  buildA: GeneratedBuild;
  buildB: GeneratedBuild;
}

export function TechExplainer({ buildA, buildB }: TechExplainerProps) {
  // Compute some stats for display
  const totalContribsA = buildA.trace.contributions.length;
  const totalContribsB = buildB.trace.contributions.length;
  return (
    <div className="tech-explainer">
      {/* 核心原理 */}
      <PrincipleBanner
        totalContribsA={totalContribsA}
        totalContribsB={totalContribsB}
      />

      {/* 管道流程 */}
      <PipelineFlow />

      {/* Step 1: Skill Seed Snapshot */}
      <StepSection step="1" title="技能种子快照">
        <p className="step-intro">
          每个技能种子是一个<strong>固定形态的基础技能</strong>，拥有确定的元素、形态、
          主效果、10 个连续参数（威力/射程/范围/持续/速度/控制/冲击/传播/穿透/防护）
          和 17 个离散机制（燃烧/寒意/冻结/感电/震晕/击退/拉拽/穿透/防护/标记/延迟爆发/连锁/破裂/束缚/遮蔽/回响/加速）。
        </p>
        <div className="step-runes-grid">
          {buildA.skills.map((skill, i) => {
            const color = ELEMENT_COLORS[skill.primaryElement];
            return (
              <div key={i} className="step-rune-card" style={{ borderLeftColor: color }}>
                <div className="step-rune-card__header">
                  <span className="step-rune-card__symbol" style={{ color }}>
                    {ELEMENT_LABELS_V6[skill.primaryElement]}
                  </span>
                  <span className="step-rune-card__name">{skill.baseName}</span>
                </div>
                <div style={{ fontSize: '0.65em', color: 'var(--mist-400)', marginTop: '4px' }}>
                  {FORM_LABELS[skill.form] ?? skill.form} · {skill.coreEffect}
                </div>
                <div style={{ marginTop: '6px' }}>
                  <p className="subsection-label" style={{ fontSize: '0.7em', margin: '4px 0' }}>
                    基础 Top 参数:
                  </p>
                  {STAT_KEYS.filter((k) => skill.baseStats[k] > 0.3).slice(0, 4).map((k) => (
                    <span key={k} className="bonus-tag" style={{ marginRight: '4px' }}>
                      {STAT_LABELS[k]}: {skill.baseStats[k].toFixed(2)}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </StepSection>

      {/* Step 2: Causality Graph */}
      <StepSection step="2" title="技能位互馈因果图">
        <p className="step-intro">
          实线（金色）= 前向塑形：前位技能较强地改变后位技能的表现和机制。
          虚线（翡翠）= 后向改写：后位技能较轻地联合修饰前位技能。
          线宽 = 贡献显著度，颜色 = 来源元素。点击连线查看详细贡献。
        </p>
        <V6CausalityGraph
          contributions={buildA.trace.contributions}
          skills={buildA.skills}
          seedCount={buildA.skills.length}
        />
      </StepSection>

      {/* Step 3: Three-stage snapshots — Build A */}
      <StepSection step="3" title="构筑 A：三阶段技能快照">
        <p className="step-intro">
          每个技能展示 <strong>基础值 → 前向固化 → 后向联合修饰</strong> 三个阶段。
          下方贡献条显示每个来源槽位（前向/后向）的贡献占比。
        </p>
        {buildA.skills.map((skill, i) => {
          const stageTrace = buildA.trace.skills[i];
          // Filter contributions targeting this slot
          const slotContribs = buildA.trace.contributions.filter(
            (c) => c.targetSlot === skill.slot,
          );
          return (
            <V6PerSkillSnapshot
              key={i}
              skill={skill}
              stageTrace={stageTrace}
              contributions={slotContribs}
            />
          );
        })}
      </StepSection>

      {/* Step 4: Rejected contributions */}
      <StepSection step="4" title="被拒绝的贡献">
        <p className="step-intro">
          规则引擎计算了每个可能的变化，但目标技能的元素能力边界会拒绝不合理的机制变化。
          这证明了系统<strong>不是简单查表</strong>——它真实计算了每个可能的变化，再根据语义合法性过滤。
        </p>
        <V6RejectedContributions contributions={buildA.trace.contributions} />
      </StepSection>

      {/* Step 5: A/B 对比 */}
      <StepSection step="5" title="同一组种子，不同顺序 → 不同构筑">
        <p className="step-intro">
          下面两组使用了<strong>完全相同的技能种子</strong>，仅交换了排列顺序。
          由于互馈拓扑不同（前向方向、后向来源、距离系数全变了），
          每个技能位的参数、机制和生成名称都产生了明显差异。
        </p>
        <V6AbComparison buildA={buildA} buildB={buildB} />
      </StepSection>

      {/* Step 6: Formula detail */}
      <StepSection step="6" title="推演公式详情">
        <V6FormulaDetail
          contributions={buildA.trace.contributions}
          aggregates={buildA.trace.aggregates}
          skills={buildA.skills}
        />
      </StepSection>
    </div>
  );
}

// ---- 子组件 ----

function PrincipleBanner({ totalContribsA, totalContribsB }: { totalContribsA: number; totalContribsB: number }) {
  return (
    <div className="principle-banner">
      <p className="principle-banner__main">
        每个技能种子是一个<strong>形态固定、主效果明确的基础技能</strong>。
      </p>
      <p>
        4 个槽位是 4 个<strong>独立技能</strong>，前面技能通过<strong>前向塑形</strong>较强地改变后面技能，
        后面技能通过<strong>后向联合修饰</strong>较轻地回写前面技能。
      </p>
      <p>
        同样一组种子，<strong>不同排列顺序</strong>会形成不同的前向/后向拓扑，
        经由<strong>定向元素反应规则 + 连续聚合 + 有符号饱和</strong>，
        生成{totalContribsA}-{totalContribsB} 条独立的参数/机制贡献。
      </p>
    </div>
  );
}

function PipelineFlow() {
  const steps = [
    { label: '基础快照', sub: '读取24个基础技能' },
    { label: '前向固化', sub: '左→右定向改变' },
    { label: '后向修饰', sub: '右→左联合回写' },
    { label: '有符号饱和', sub: 'tanh聚合·反对消' },
    { label: '结果解码', sub: '命名·标签·动画' },
  ];

  return (
    <div className="pipeline-flow">
      {steps.map((s, i) => (
        <div key={s.label} className="pipeline-step">
          <div className="pipeline-step__bubble">{i + 1}</div>
          <div className="pipeline-step__label">{s.label}</div>
          <div className="pipeline-step__sub">{s.sub}</div>
        </div>
      ))}
    </div>
  );
}

function StepSection({ step, title, children }: { step: string; title: string; children: React.ReactNode }) {
  return (
    <section className="how-step">
      <h3 className="how-step__title">
        <span className="how-step__num">{step}</span>
        {title}
      </h3>
      {children}
    </section>
  );
}

// ---- A/B Comparison (V6) ----

function V6AbComparison({
  buildA,
  buildB,
}: {
  buildA: GeneratedBuild;
  buildB: GeneratedBuild;
}) {
  const diffs = useMemo(() => diffBuilds(buildA, buildB), [buildA, buildB]);

  // Build seed occurrence key -> info maps
  const buildOccurrenceKeys = (build: GeneratedBuild) => {
    const seen = new Map<string, number>();
    return build.skills.map((skill, i) => {
      const count = seen.get(skill.seedId) ?? 0;
      seen.set(skill.seedId, count + 1);
      return {
        occurrenceKey: `${skill.seedId}#${count}`,
        slot: i,
        skill,
        seedId: skill.seedId,
      };
    });
  };

  const keysA = buildOccurrenceKeys(buildA);
  const keysB = buildOccurrenceKeys(buildB);

  const mapA = new Map(keysA.map((k) => [k.occurrenceKey, k]));
  const mapB = new Map(keysB.map((k) => [k.occurrenceKey, k]));

  const commonKeys = [...new Set([...mapA.keys()].filter((k) => mapB.has(k)))];

  return (
    <div className="ab-compare">
      <div className="ab-compare__cols">
        <AbCol label="构筑 A" build={buildA} />
        <div className="ab-compare__vs">VS</div>
        <AbCol label="构筑 B" build={buildB} />
      </div>

      {/* Per-seed diffs */}
      <div className="ab-compare__diff">
        <p className="subsection-label">
          同一种子在不同位置上的差异（{commonKeys.length} 个公共种子）
        </p>
        {diffs.map((diff) => {
          const infoA = mapA.get(diff.occurrenceKey);
          const infoB = mapB.get(diff.occurrenceKey);
          if (!infoA || !infoB) return null;
          const posChanged = diff.slotA !== diff.slotB;
          const base = getBaseSkill(diff.seedId);

          // Top stat diffs
          const topStatDiffs = diff.statDiffs
            .filter((d) => Math.abs(d.delta) > 0.005)
            .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
            .slice(0, 4);

          return (
            <div key={diff.occurrenceKey} className="diff-row" style={{ fontSize: '0.78em', marginBottom: '8px' }}>
              <div className="diff-row__label" style={{ marginBottom: '4px' }}>
                <span style={{ color: ELEMENT_COLORS[infoA.skill.primaryElement] }}>
                  {base?.name ?? diff.seedId}
                </span>
              </div>
              <div style={{ fontSize: '0.82em', marginBottom: '2px' }}>
                <span>
                  A: 位{diff.slotA + 1} — <strong>{infoA.skill.generatedName}</strong>
                </span>
                <span style={{ margin: '0 8px', color: 'var(--mist-500)' }}>vs</span>
                <span>
                  B: 位{diff.slotB + 1} — <strong>{infoB.skill.generatedName}</strong>
                </span>
                {posChanged && (
                  <span style={{ color: 'var(--gold-400)', marginLeft: '6px', fontSize: '0.85em' }}>
                    ← 顺序改变
                  </span>
                )}
                {diff.forwardCueChanged && (
                  <span style={{ color: 'var(--gold-400)', marginLeft: '4px', fontSize: '0.75em' }}>
                    前向Cue变
                  </span>
                )}
                {diff.backwardCueChanged && (
                  <span style={{ color: 'var(--jade-300)', marginLeft: '4px', fontSize: '0.75em' }}>
                    后向Cue变
                  </span>
                )}
              </div>
              {topStatDiffs.length > 0 && (
                <div style={{ paddingLeft: '8px' }}>
                  {topStatDiffs.map((sd) => (
                    <DeltaBar
                      key={sd.key}
                      label={STAT_LABELS[sd.key]}
                      valueA={sd.valueA}
                      valueB={sd.valueB}
                      maxValue={1}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="ab-compare__conclusion">
        <p>
          <strong>结论：</strong>
          构筑 A 与构筑 B 使用了<strong>完全相同的技能种子</strong>，
          但因排列顺序不同，前向/后向拓扑改变，导致每个种子的最终参数、机制和生成名称都产生了明显差异。
          这不是预设技能树，而是<strong>定向元素反应规则 + 连续聚合</strong>在同一输入上的不同计算路径。
        </p>
      </div>
    </div>
  );
}

function AbCol({
  label,
  build,
}: {
  label: string;
  build: GeneratedBuild;
}) {
  const variant = label.includes('A') ? 'a' : 'b';

  return (
    <div className={`ab-col ab-col--${variant}`}>
      <div className="ab-col__header">
        <div>
          <span className="ab-col__eyebrow">BUILD {variant.toUpperCase()}</span>
          <h4 className="ab-col__title">{label}</h4>
        </div>
        <span className="ab-col__direction">前向固化顺序</span>
      </div>

      <div className="ab-col__sequence">
        {build.skills.map((skill, i) => {
          const base = getBaseSkill(skill.seedId);
          return (
            <div
              key={i}
              className="ab-col__skill"
              style={{ '--ab-skill-color': ELEMENT_COLORS[skill.primaryElement] } as CSSProperties}
            >
              <div className="ab-col__icon" aria-hidden="true">
                <span>{ELEMENT_LABELS_V6[skill.primaryElement]}</span>
                <i />
              </div>
              <div className="ab-col__skill-copy">
                <div className="ab-col__skill-source">
                  <span>槽位 {i + 1}</span>
                  <strong>{base?.name ?? skill.seedId}</strong>
                </div>
                <div className="ab-col__skill-result">{skill.generatedName}</div>
                <div className="ab-col__skill-meta">
                  {FORM_LABELS[skill.form] ?? skill.form}
                  <i />
                  {ELEMENT_LABELS_V6[skill.primaryElement]}系
                </div>
              </div>
              {i < build.skills.length - 1 && (
                <span className="ab-col__connector" aria-hidden="true">↓</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="ab-col__summary">
        <span>顺序签名</span>
        <strong>{build.skills.map((skill) => ELEMENT_LABELS_V6[skill.primaryElement]).join(' → ')}</strong>
      </div>
    </div>
  );
}
