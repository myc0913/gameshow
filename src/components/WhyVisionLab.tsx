import { useMemo, useState, type CSSProperties } from 'react';

type SemanticPreset = {
  id: string;
  name: string;
  subtitle: string;
  color: string;
  accent: string;
  dimensions: Array<{
    group: string;
    values: Array<{ label: string; value: number }>;
  }>;
  decoded: Array<{ label: string; value: string }>;
};

const SEMANTIC_PRESETS: SemanticPreset[] = [
  {
    id: 'ember-blade',
    name: '烬流剑式',
    subtitle: '火焰倾向与剑式拓扑共同占优',
    color: '#e47a60',
    accent: '#cdb47b',
    dimensions: [
      {
        group: '身份簇',
        values: [
          { label: '热能倾向', value: 82 },
          { label: '剑式倾向', value: 71 },
          { label: '虚空倾向', value: 12 },
        ],
      },
      {
        group: '伤害结构',
        values: [
          { label: '瞬时爆发', value: 76 },
          { label: '持续灼烧', value: 58 },
          { label: '结构破坏', value: 34 },
        ],
      },
      {
        group: '目标拓扑',
        values: [
          { label: '单点锁定', value: 48 },
          { label: '扇面扩散', value: 67 },
          { label: '多段追击', value: 55 },
        ],
      },
    ],
    decoded: [
      { label: '技能类别', value: '火系剑式 · 扇面追击' },
      { label: '战斗语法', value: '斩击命中后留下短时灼烧轨迹' },
      { label: '表现建议', value: '赤金弧光、短促爆鸣、余烬拖尾' },
    ],
  },
  {
    id: 'frost-domain',
    name: '霜雷缚场',
    subtitle: '低温控制与雷电传播形成混合区域',
    color: '#91c9e8',
    accent: '#b29be8',
    dimensions: [
      {
        group: '身份簇',
        values: [
          { label: '低温倾向', value: 78 },
          { label: '雷电倾向', value: 46 },
          { label: '领域倾向', value: 81 },
        ],
      },
      {
        group: '控制结构',
        values: [
          { label: '减速覆盖', value: 84 },
          { label: '束缚强度', value: 63 },
          { label: '打断能力', value: 42 },
        ],
      },
      {
        group: '目标拓扑',
        values: [
          { label: '单点锁定', value: 18 },
          { label: '区域覆盖', value: 88 },
          { label: '链式传播', value: 52 },
        ],
      },
    ],
    decoded: [
      { label: '技能类别', value: '冰雷领域 · 群体控制' },
      { label: '战斗语法', value: '先铺设低温场，再以脉冲束缚高频移动目标' },
      { label: '表现建议', value: '冰蓝雾层、紫白电弧、周期收束环' },
    ],
  },
  {
    id: 'void-thrust',
    name: '虚风穿界',
    subtitle: '空间穿透、风压与线性位移共同成形',
    color: '#a77ad9',
    accent: '#62c8b5',
    dimensions: [
      {
        group: '身份簇',
        values: [
          { label: '虚空倾向', value: 73 },
          { label: '风压倾向', value: 64 },
          { label: '枪术倾向', value: 69 },
        ],
      },
      {
        group: '运动结构',
        values: [
          { label: '释放速度', value: 87 },
          { label: '路径穿透', value: 79 },
          { label: '残留时长', value: 26 },
        ],
      },
      {
        group: '目标拓扑',
        values: [
          { label: '直线贯穿', value: 91 },
          { label: '目标牵引', value: 44 },
          { label: '末端扩散', value: 35 },
        ],
      },
    ],
    decoded: [
      { label: '技能类别', value: '虚风枪术 · 直线突进' },
      { label: '战斗语法', value: '沿穿刺路径快速位移，并牵动路径两侧单位' },
      { label: '表现建议', value: '暗紫裂隙、青色风压、低残留锐响' },
    ],
  },
];

const ORDER_DEMOS = {
  forward: {
    label: '火印 → 霜场 → 雷痕 → 风式',
    nodes: ['火印', '霜场', '雷痕', '风式'],
    target: '雷痕',
    change: '先被霜场压低传播速度，再由火印提高爆发；末位风式提供轻量扩散修饰。',
    deltas: [
      { label: '爆发', value: 78 },
      { label: '传播', value: 56 },
      { label: '控制', value: 49 },
      { label: '速度', value: 64 },
    ],
  },
  reverse: {
    label: '风式 → 雷痕 → 霜场 → 火印',
    nodes: ['风式', '雷痕', '霜场', '火印'],
    target: '雷痕',
    change: '雷痕首先承接风式导流，传播与速度成为主特征；后位火印只参与较轻的联合定调。',
    deltas: [
      { label: '爆发', value: 61 },
      { label: '传播', value: 86 },
      { label: '控制', value: 33 },
      { label: '速度', value: 82 },
    ],
  },
} as const;

export function WhyVisionLab() {
  const [presetId, setPresetId] = useState(SEMANTIC_PRESETS[0].id);
  const [orderKey, setOrderKey] = useState<keyof typeof ORDER_DEMOS>('forward');

  const preset = useMemo(
    () => SEMANTIC_PRESETS.find((item) => item.id === presetId) ?? SEMANTIC_PRESETS[0],
    [presetId],
  );
  const orderDemo = ORDER_DEMOS[orderKey];
  const style = {
    '--vision-color': preset.color,
    '--vision-accent': preset.accent,
  } as CSSProperties;

  return (
    <div className="why-vision-lab" style={style}>
      <article className="vision-demo vision-demo--semantic">
        <div className="vision-demo__header">
          <div>
            <span className="vision-demo__index">DEMO 01</span>
            <h3>已知语义维度，不是不可读的黑箱坐标</h3>
          </div>
          <span className="vision-demo__status">概念模型</span>
        </div>
        <p className="vision-demo__intro">
          单个维度不必直接等于“火”或“剑法”。一组含义明确、可审计的维度共同形成身份、战斗语法与表现风格。
        </p>

        <div className="semantic-preset-tabs" aria-label="切换技能语义样例">
          {SEMANTIC_PRESETS.map((item) => (
            <button
              key={item.id}
              className={item.id === preset.id ? 'is-active' : undefined}
              onClick={() => setPresetId(item.id)}
              aria-pressed={item.id === preset.id}
              type="button"
            >
              {item.name}
            </button>
          ))}
        </div>

        <div className="semantic-demo-grid">
          <div className="semantic-vector">
            <div className="semantic-vector__title">
              <div>
                <strong>{preset.name}</strong>
                <span>{preset.subtitle}</span>
              </div>
              <code>V[01..n]</code>
            </div>
            {preset.dimensions.map((dimension) => (
              <div className="semantic-group" key={dimension.group}>
                <span className="semantic-group__label">{dimension.group}</span>
                <div className="semantic-group__values">
                  {dimension.values.map((value) => (
                    <div className="semantic-axis" key={value.label}>
                      <div className="semantic-axis__meta">
                        <span>{value.label}</span>
                        <strong>{value.value}</strong>
                      </div>
                      <div className="semantic-axis__track">
                        <i style={{ width: `${value.value}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="semantic-decoder">
            <div className="semantic-decoder__glyph" aria-hidden="true">
              <span />
              <i />
              <b />
            </div>
            <span className="semantic-decoder__eyebrow">DECODER OUTPUT</span>
            {preset.decoded.map((item) => (
              <div className="semantic-output" key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </div>
      </article>

      <article className="vision-demo vision-demo--operator">
        <div className="vision-demo__header">
          <div>
            <span className="vision-demo__index">DEMO 02</span>
            <h3>注意力是候选算子，顺序敏感才是设计目标</h3>
          </div>
          <span className="vision-demo__status">技术推演</span>
        </div>
        <p className="vision-demo__intro">
          有向规则、图网络、可学习关系核或多头注意力都可能承担交互计算。技术可以替换，但必须保留位置差异、能力边界与可追溯来源。
        </p>

        <div className="order-switch" aria-label="切换技能排列顺序">
          {(Object.keys(ORDER_DEMOS) as Array<keyof typeof ORDER_DEMOS>).map((key) => (
            <button
              key={key}
              className={orderKey === key ? 'is-active' : undefined}
              onClick={() => setOrderKey(key)}
              aria-pressed={orderKey === key}
              type="button"
            >
              构筑 {key === 'forward' ? 'A' : 'B'}
            </button>
          ))}
          <span>{orderDemo.label}</span>
        </div>

        <div className="order-demo-grid">
          <div className="order-graph">
            <div className="order-graph__lane order-graph__lane--forward">
              <span>强前向影响</span>
              <i />
            </div>
            <div className="order-nodes">
              {orderDemo.nodes.map((node, index) => (
                <div
                  className={`order-node ${node === orderDemo.target ? 'is-target' : ''}`}
                  key={`${orderKey}-${node}`}
                >
                  <small>0{index + 1}</small>
                  <strong>{node}</strong>
                </div>
              ))}
            </div>
            <div className="order-graph__lane order-graph__lane--backward">
              <i />
              <span>轻后向定调</span>
            </div>
            <p>{orderDemo.change}</p>
          </div>

          <div className="order-result">
            <span className="order-result__label">目标技能 · {orderDemo.target}</span>
            <div className="order-result__bars">
              {orderDemo.deltas.map((delta) => (
                <div className="order-result__bar" key={delta.label}>
                  <span>{delta.label}</span>
                  <div><i style={{ width: `${delta.value}%` }} /></div>
                  <strong>{delta.value}</strong>
                </div>
              ))}
            </div>
            <p>同一组输入，仅改变因果顺序，关系权重与解码结果随之偏移。</p>
          </div>
        </div>
      </article>
    </div>
  );
}
