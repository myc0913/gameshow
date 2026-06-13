// src/pages/HowPage.tsx
// V6-4: How 页使用 V6 引擎，展示完整 trace 驱动的技术解释
// 依据: docs/v6/presentation-and-migration.md §7, docs/phases/A4-how-page.md

import { useMemo } from 'react';
import type { GeneratedBuild } from '../types/v6.ts';
import { generateBuildV6 } from '../engine/v6/generateBuildV6.ts';
import { getSkillSeed } from '../data/skillSeeds.ts';
import { ELEMENT_LABELS_V6, FORM_LABELS } from '../engine/v6/finalizeGeneratedSkill.ts';
import { ELEMENT_COLORS } from '../data/vectorDims.ts';
import { TechExplainer } from '../components/TechExplainer.tsx';
import { BuildStepTrace } from '../components/BuildStepTrace.tsx';
import { V6CausalityGraph } from '../components/V6CausalityGraph.tsx';
import { V6PerSkillSnapshot } from '../components/V6PerSkillSnapshot.tsx';
import { V6RejectedContributions } from '../components/V6RejectedContributions.tsx';
import { V6FormulaDetail } from '../components/V6FormulaDetail.tsx';

const DEFAULT_A = ['fire_flow', 'frost_zone', 'lightning_mark', 'wind_impact'];
const DEFAULT_B = ['wind_impact', 'lightning_mark', 'frost_zone', 'fire_flow'];

interface HowPageProps {
  v6Build: GeneratedBuild | null;
  v6PreviousBuild: GeneratedBuild | null;
  seedIds: string[];
}

export function HowPage({ v6Build, seedIds }: HowPageProps) {
  const hasLiveBuild = v6Build !== null && seedIds.length > 0;

  // ---- Default A/B builds ----
  const { defaultBuildA, defaultBuildB } = useMemo(() => {
    const buildA = generateBuildV6({ seedIds: DEFAULT_A });
    const buildB = generateBuildV6({ seedIds: DEFAULT_B });
    return { defaultBuildA: buildA, defaultBuildB: buildB };
  }, []);

  // ---- Incremental builds for default mode ----
  const defaultIncremental = useMemo(() => {
    const steps: GeneratedBuild[] = [];
    for (let n = 1; n <= DEFAULT_A.length; n++) {
      steps.push(generateBuildV6({ seedIds: DEFAULT_A.slice(0, n) }));
    }
    return steps;
  }, []);

  // ---- Incremental builds for live mode ----
  const liveIncremental = useMemo(() => {
    if (!hasLiveBuild || seedIds.length < 2) return null;
    const steps: GeneratedBuild[] = [];
    for (let n = 1; n <= seedIds.length; n++) {
      steps.push(generateBuildV6({ seedIds: seedIds.slice(0, n) }));
    }
    return steps;
  }, [hasLiveBuild, seedIds]);

  // ---- Determine what to render ----
  const effectiveBuild = hasLiveBuild ? v6Build! : defaultBuildA;
  const effectiveSeedIds = hasLiveBuild
    ? seedIds
    : DEFAULT_A;

  const incrementalBuilds = hasLiveBuild
    ? (liveIncremental ?? [])
    : defaultIncremental;

  return (
    <div className="page-content how-page">
      {/* Live / Default status banner */}
      <div className={`how-live-banner ${hasLiveBuild ? 'how-live-banner--active' : ''}`}>
        {hasLiveBuild ? (
          <>
            <span className="how-live-banner__dot" />
            当前展示：来自 Play 页的实时构筑
            <span className="how-live-banner__seeds">
              {seedIds.map((id, i) => (
                <span key={i} className="how-live-banner__seed">
                  {getSkillSeed(id)?.name ?? id}{i < seedIds.length - 1 ? ' → ' : ''}
                </span>
              ))}
            </span>
          </>
        ) : (
          <>
            <span className="how-live-banner__dot how-live-banner__dot--default" />
            当前展示：默认示例构筑（在 Play 页拖入种子后将自动切换为实时构筑）
          </>
        )}
      </div>

      {hasLiveBuild ? (
        /* === LIVE MODE === */
        <>
          {/* Principle banner */}
          <div className="principle-banner">
            <p className="principle-banner__main">
              当前构筑使用 <strong>{seedIds.length} 个技能种子</strong>，
              每个种子是一个形态固定的基础技能，种子之间通过<strong>定向元素反应</strong>互相影响。
            </p>
            <p>
              下面是当前构筑的完整计算过程，所有数据来自{' '}
              <strong>generateBuildV6() 的实时 trace</strong>。
              共 {effectiveBuild.trace.contributions.length} 条贡献记录，
              {effectiveBuild.trace.aggregates.length} 条聚合记录。
            </p>
          </div>

          {/* Section 1: Current sequence */}
          <section className="how-step">
            <h3 className="how-step__title">
              <span className="how-step__num">1</span>
              当前技能序列
            </h3>
            <div className="step-runes-grid" style={{ gridTemplateColumns: `repeat(${Math.min(effectiveBuild.skills.length, 4)}, 1fr)` }}>
              {effectiveBuild.skills.map((skill, i) => {
                const color = ELEMENT_COLORS[skill.primaryElement];
                return (
                  <div key={i} className="step-rune-card" style={{ borderLeftColor: color }}>
                    <div className="step-rune-card__header">
                      <span className="step-rune-card__symbol" style={{ color }}>
                        {ELEMENT_LABELS_V6[skill.primaryElement]}
                      </span>
                      <span className="step-rune-card__name">{skill.baseName}</span>
                    </div>
                    <div style={{ fontSize: '0.75em', marginTop: '4px' }}>
                      → <strong>{skill.generatedName}</strong>
                    </div>
                    <div style={{ fontSize: '0.68em', opacity: 0.7 }}>
                      {FORM_LABELS[skill.form] ?? skill.form} · {skill.coreEffect}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Section 2: Causality graph */}
          <section className="how-step">
            <h3 className="how-step__title">
              <span className="how-step__num">2</span>
              技能位互馈因果图
            </h3>
            <p className="step-intro">
              实线（金色）= 前向塑形，虚线（翡翠）= 后向改写。
              线宽 = 贡献显著度。点击连线查看详细贡献分解。
            </p>
            <V6CausalityGraph
              contributions={effectiveBuild.trace.contributions}
              skills={effectiveBuild.skills}
              seedCount={effectiveBuild.skills.length}
            />
          </section>

          {/* Section 3: Three-stage snapshots per skill */}
          <section className="how-step">
            <h3 className="how-step__title">
              <span className="how-step__num">3</span>
              各技能三阶段快照
            </h3>
            <p className="step-intro">
              每个技能展示 <strong>基础值 → 前向固化 → 后向联合修饰</strong> 三个阶段。
              贡献条显示每个来源槽位（金色=前向、翡翠=后向）的影响方向和大小。
            </p>
            {effectiveBuild.skills.map((skill, i) => {
              const stageTrace = effectiveBuild.trace.skills[i];
              const slotContribs = effectiveBuild.trace.contributions.filter(
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
          </section>

          {/* Section 4: Rejected contributions */}
          <section className="how-step">
            <h3 className="how-step__title">
              <span className="how-step__num">4</span>
              被拒绝的贡献
            </h3>
            <V6RejectedContributions contributions={effectiveBuild.trace.contributions} />
          </section>

          {/* Section 5: Formula detail */}
          <section className="how-step">
            <h3 className="how-step__title">
              <span className="how-step__num">5</span>
              推演公式详情
            </h3>
            <V6FormulaDetail
              contributions={effectiveBuild.trace.contributions}
              aggregates={effectiveBuild.trace.aggregates}
              skills={effectiveBuild.skills}
            />
          </section>

          {/* Section 6: Incremental build trace */}
          {incrementalBuilds && incrementalBuilds.length >= 2 && (
            <section className="how-step">
              <h3 className="how-step__title">
                <span className="how-step__num">6</span>
                分步构筑溯源
              </h3>
              <BuildStepTrace
                incrementalBuilds={incrementalBuilds}
                seedIds={effectiveSeedIds}
              />
            </section>
          )}
        </>
      ) : (
        /* === DEFAULT MODE === */
        <TechExplainer
          buildA={defaultBuildA}
          buildB={defaultBuildB}
        />
      )}

      {/* Section 7: Incremental trace (only in default mode, shown after TechExplainer) */}
      {!hasLiveBuild && incrementalBuilds.length >= 2 && (
        <section className="how-step">
          <h3 className="how-step__title">
            <span className="how-step__num">7</span>
            分步构筑溯源
          </h3>
          <BuildStepTrace
            incrementalBuilds={incrementalBuilds}
            seedIds={DEFAULT_A}
          />
        </section>
      )}
    </div>
  );
}
