import { WhyVisionLab } from '../components/WhyVisionLab';

export function WhyPage() {
  return (
    <div className="page-content why-page">
      <header className="why-hero">
        <span className="why-hero__eyebrow">DESIGN THESIS · PLAYABLE PROTOTYPE</span>
        <h1 className="why-hero__title">
          从技能树到语义构筑：
          <br />
          让玩家的排列成为规则的一部分
        </h1>
        <p className="why-hero__sub">
          这不是预设 Build 树，而是玩家排列留下的<strong>可计算语义签名</strong>。
        </p>
      </header>

      <section className="why-section">
        <h2>传统技能系统的局限</h2>
        <div className="why-compare">
          <div className="why-compare__col why-compare__col--old">
            <h3>传统技能树 / 预设 Build</h3>
            <ul>
              <li>玩家在固定节点中选择，路径由设计师预设。</li>
              <li>技能效果是硬编码的 if/else 查表。</li>
              <li>Build 多样性受限于设计师预先写好的组合数量。</li>
              <li>玩家更像是「选择者」而非「构筑者」。</li>
            </ul>
          </div>
          <div className="why-compare__arrow">→</div>
          <div className="why-compare__col why-compare__col--new">
            <h3>当前 Demo：可解释的语义构筑原型</h3>
            <ul>
              <li>每个技能种子先拥有<strong>固定身份</strong>（主元素 + 主形态 + 主效果），确保结果仍可辨认。</li>
              <li>玩家不是选择现成技能，而是在<strong>排列 4 枚技能种子</strong>，顺序决定互馈拓扑。</li>
              <li>相同 4 枚种子，不同顺序 → 前向/后向互馈路径不同 → <strong>关键参数、机制倾向与动画表现随之偏移</strong>。</li>
              <li>每次排列都留下一个<strong>构筑指纹</strong>—— 完整 Trace 可追溯每一项变化的来源与聚合过程。</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="why-section">
        <h2>这个 Demo 验证了什么</h2>
        <div className="why-points">
          <div className="why-point">
            <span className="why-point__num">1</span>
            <div>
              <h3>排列顺序 = 构筑指纹</h3>
              <p>
                4 枚相同的技能种子交换顺序后，互馈来源与聚合路径随之改变；
                在默认 A/B 案例中，名称、关键参数、机制标签与动画都能形成明显对比。
                这不是随机噪声，而是<strong>定向元素反应 + 前向/后向连续聚合</strong>的确定性计算结果。
                前位技能较强地改变后位技能，后位技能较轻地联合修饰前位技能。
              </p>
            </div>
          </div>
          <div className="why-point">
            <span className="why-point__num">2</span>
            <div>
              <h3>规则引擎透明可解释</h3>
              <p>
                每个技能位都附带完整 <code>trace</code>：基础快照 → 前向贡献提案 →
                按维度有符号聚合与饱和 → 冻结前向结果 → 后向来源投影 → 后向联合聚合 →
                最终技能解码。How 页实时读取 trace 展示每项变化的来源、原因和聚合公式。
              </p>
            </div>
          </div>
          <div className="why-point">
            <span className="why-point__num">3</span>
            <div>
              <h3>没有完整排列结果查表，没有 AI API</h3>
              <p>
                技能 100% 来自纯函数 <code>generateBuildV6()</code> 的确定性计算。
                相同的输入永远产生相同的输出。引擎包含 24 个基础技能定义与 36 个定向元素反应规则，
                全部在前端本地运行，不依赖任何后端服务。
              </p>
            </div>
          </div>
          <div className="why-point">
            <span className="why-point__num">4</span>
            <div>
              <h3>动画与数据同源</h3>
              <p>
                技能动画的主要可变参数（颜色、粒子数、速度、爆裂强度、连锁路径、禁锢环……）
                全部来自同一份 <code>GeneratedSkill</code> 的计算结果。
                固定形态选择基础动画模板，具体材质、范围、时序与反应 Cue 再由规则结果驱动。
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="why-section why-boundary">
        <div className="why-boundary__heading">
          <span>PROTOTYPE BOUNDARY</span>
          <h2>当前的边界，未来的起点</h2>
        </div>
        <div className="why-boundary__grid">
          <div>
            <span className="why-boundary__tag">当前原型</span>
            <h3>为了让理念能在几分钟内被理解</h3>
            <p>
              24 个固定身份技能、36 个有向元素关系、有限的连续参数与离散机制，
              构成了一套刻意压缩的可运行模型。它优先证明顺序、互馈、解码与 Trace 的完整闭环，
              并不声称已经覆盖真实游戏所需的技能空间。
            </p>
          </div>
          <div>
            <span className="why-boundary__tag why-boundary__tag--future">策划前瞻</span>
            <h3>把技能从条目扩展为可探索的语义空间</h3>
            <p>
              未来可以用更丰富、经过精细调试的维度组描述技能。元素、剑法、伤害结构、目标数量、
              控制类型、时序与视听风格，都由多个维度共同定义；玩家排列道痕，就是让技能表征沿因果路径发生偏移。
            </p>
          </div>
        </div>
        <blockquote>
          当前 Demo 不是终点的缩小版，而是一种便于沟通的“弱化表达”：
          先让设计理念可玩、可看、可解释，再讨论它能够如何生长。
        </blockquote>
      </section>

      <section className="why-section why-vision">
        <div className="why-section__intro">
          <div>
            <span>INTERACTIVE CONCEPT</span>
            <h2>解构固定身份：走向显式语义空间</h2>
          </div>
          <p>
            这里展示的不是当前引擎输出，而是策划案中的交互概念模型。
            点击样例与顺序，可以观察“维度共同定义技能”和“顺序改变关系计算”这两层构想。
          </p>
        </div>
        <WhyVisionLab />
      </section>

      <section className="why-section">
        <h2>候选技术方案：可解释，但不预设唯一算法</h2>
        <div className="why-architecture">
          <div className="why-architecture__flow">
            <div className="architecture-node">
              <span>01</span>
              <strong>语义编码</strong>
              <p>策划定义维度职责，内容数据或训练过程确定具体坐标。</p>
            </div>
            <i>→</i>
            <div className="architecture-node architecture-node--focus">
              <span>02</span>
              <strong>顺序交互算子</strong>
              <p>有向规则、图网络、关系核或注意力均可作为候选。</p>
            </div>
            <i>→</i>
            <div className="architecture-node">
              <span>03</span>
              <strong>多路解码</strong>
              <p>同一表征生成数值、机制、动画、音效与叙事建议。</p>
            </div>
            <i>→</i>
            <div className="architecture-node">
              <span>04</span>
              <strong>模拟评估</strong>
              <p>战斗模拟检验强度、反制窗口、创意度与流派健康度。</p>
            </div>
          </div>
          <div className="why-architecture__notes">
            <div>
              <span>确定的设计目标</span>
              <strong>顺序敏感、语义可控、结果可检验、来源可追溯</strong>
            </div>
            <div>
              <span>开放的技术路径</span>
              <strong>注意力并非前提，训练方法也可以随验证结果替换</strong>
            </div>
            <div>
              <span>可能的训练信号</span>
              <strong>DPS、控制覆盖、资源权衡、反制空间、玩法新颖度</strong>
            </div>
          </div>
          <p className="why-architecture__caveat">
            这是个人策划观点中的候选架构，不是当前 Demo 已实现的机器学习系统，也不是对未来研发路线的承诺。
          </p>
        </div>
      </section>

      <section className="why-section">
        <h2>从生成技能，到培育技能生态</h2>
        <div className="why-evolution">
          <div className="why-evolution__step">
            <span>语义插值</span>
            <strong>在已知技能之间寻找合法的中间态</strong>
            <p>混合不再依赖设计师提前枚举“火雷”“冰影”等每一种组合。</p>
          </div>
          <div className="why-evolution__step">
            <span>变异与模拟</span>
            <strong>扰动候选表征，并在战斗环境中验证</strong>
            <p>淘汰数值失控或缺乏反制的结果，保留新鲜且可玩的候选。</p>
          </div>
          <div className="why-evolution__step">
            <span>策划选择</span>
            <strong>定义“什么是好构筑”，并为发现赋予意义</strong>
            <p>设计师从逐条制造技能，转向设定边界、筛选原型、命名流派与编织叙事。</p>
          </div>
          <div className="why-evolution__step">
            <span>玩家沉淀</span>
            <strong>群体轨迹最终形成世界自己的流派</strong>
            <p>高频聚集的语义区域可以被识别、包装，并反向成为新内容的起点。</p>
          </div>
        </div>
      </section>

      <section className="why-section">
        <h2>与《漂流诸天》道痕系统的关系</h2>
        <div className="why-drift">
          <p>
            在构想中的游戏《漂流诸天》里，这套符文原型将被替换为
            <strong>「道痕」</strong>—— 玩家在诸天世界中留下的因果印记。
          </p>
          <p>
            每个道痕携带一段经历的语义残留（而非元素属性），
            玩家通过在「道盘」上排列道痕来<strong>固化技能</strong>。
            顺序代表了因果的先后关系，直接影响技能的形态与效果。
          </p>
          <p>
            本 Demo 使用「符文」语言而非「道痕」语言，是为了
            <strong>降低理解门槛</strong>—— MMO 玩家熟悉符文和铭刻的概念，
            可以快速理解排列顺序会影响结果的核心理念。
          </p>
          <div className="why-mapping">
            <h4>概念映射</h4>
            <table className="why-table">
              <thead>
                <tr><th>Demo 概念</th><th>《漂流诸天》概念</th><th>设计意图</th></tr>
              </thead>
              <tbody>
                <tr><td>技能种子</td><td>道痕</td><td>当前以固定身份表达，未来可扩展为经历留下的高维语义表征</td></tr>
                <tr><td>技能槽位</td><td>道盘位</td><td>4 个独立技能位，互馈形成完整 Build</td></tr>
                <tr><td>铭刻生成</td><td>固化</td><td>规则引擎根据排列计算前向/后向互馈结果</td></tr>
                <tr><td>Build 结果</td><td>道术组</td><td>排列顺序留下的可追溯语义签名</td></tr>
                <tr><td>构筑对比</td><td>因果对比</td><td>同一组道痕不同因果顺序的效果差异</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="why-section">
        <h2>当前 Demo 的技术落点</h2>
        <div className="why-tech-stack">
          <div className="why-tech-item">
            <span className="why-tech-item__label">前端框架</span>
            <span>React 19 + TypeScript + Vite</span>
          </div>
          <div className="why-tech-item">
            <span className="why-tech-item__label">3D 动画</span>
            <span>Three.js（粒子系统 + 几何体 + 线段）</span>
          </div>
          <div className="why-tech-item">
            <span className="why-tech-item__label">规则引擎</span>
            <span>纯函数管道（前向互馈 → 有符号聚合 → 后向修饰 → 技能解码）</span>
          </div>
          <div className="why-tech-item">
            <span className="why-tech-item__label">部署</span>
            <span>纯静态站点，可部署到任意静态托管服务</span>
          </div>
        </div>
      </section>

      <section className="why-section why-closing">
        <span>FROM PROOF TO EVOLUTION</span>
        <h2>从验证，到演化</h2>
        <p>
          这个 Demo 证明的是：排列顺序可以成为规则的一部分，而且结果能够保持确定、透明与可解释。
          更远的构想则是让技能成为语义空间中的可生长对象，让模型负责探索，让模拟负责检验，
          让策划负责定义价值、边界与世界意义。
        </p>
        <strong>
          玩家在道盘上排下的每一组道痕，都是在语义空间中留下的一段因果轨迹。
        </strong>
      </section>

      <footer className="why-footer">
        <p>
          AI 规则引擎 Demo · 技能符文构筑实验室
        </p>
        <p className="why-footer__tagline">
          排列即构筑，顺序即指纹。
        </p>
      </footer>
    </div>
  );
}
