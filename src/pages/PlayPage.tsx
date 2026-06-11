// src/pages/PlayPage.tsx

export function PlayPage() {
  return (
    <div className="play-layout">
      {/* 左栏：操作区 */}
      <div className="play-left">
        {/* 符文池 */}
        <div className="panel">
          <div className="panel-title">符文池</div>
          <div className="placeholder-area placeholder-runes">
            选择符文（A2 实现）
          </div>
        </div>

        {/* 槽位栏 */}
        <div className="panel">
          <div className="panel-title">技能槽位</div>
          <div className="slot-bar">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="slot">{n}</div>
            ))}
          </div>
        </div>

        {/* 铭刻按钮 */}
        <button className="btn-engrave" disabled>
          铭刻生成
        </button>
      </div>

      {/* 右栏：展示区 */}
      <div className="play-right">
        {/* 技能结果面板 */}
        <div className="panel">
          <div className="panel-title">技能结果</div>
          <div className="placeholder-area">
            铭刻符文后在此展示技能
          </div>
        </div>

        {/* 动画区 */}
        <div className="panel" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div className="panel-title">技能动画</div>
          <div className="placeholder-area placeholder-canvas">
            Three.js Canvas 占位（A3 实现）
          </div>
        </div>
      </div>
    </div>
  );
}
