// src/App.tsx
// V5 更新：Play/How 共享 buildResult 状态

import { useState, useCallback } from 'react';
import { TabNav, type TabId } from './components/TabNav';
import { PlayPage, type PlayPageBuildState } from './pages/PlayPage';
import { HowPage } from './pages/HowPage';
import { WhyPage } from './pages/WhyPage';
import { PageErrorBoundary } from './components/PageErrorBoundary';
import './styles.css';
import './visual-refresh.css';

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('play');
  // 共享状态：Play 页写入，How 页读取
  const [sharedBuildState, setSharedBuildState] = useState<PlayPageBuildState>({
    currentBuild: null,
    previousBuild: null,
    currentSeeds: [],
    v6Build: null,
    v6PreviousBuild: null,
  });

  const handleBuildChange = useCallback((state: PlayPageBuildState) => {
    setSharedBuildState(state);
  }, []);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand-lockup">
          <div className="brand-seal" aria-hidden="true">
            构
          </div>
          <div>
            <p className="brand-kicker">SEMANTIC SKILL FORGE</p>
            <h1 className="brand-title">技能符文构筑实验室</h1>
          </div>
        </div>
        <div className="header-principle">
          <span>四个种子</span>
          <i />
          <span>四个技能</span>
          <i />
          <strong>顺序改变互馈</strong>
        </div>
        <TabNav activeTab={activeTab} onTabChange={setActiveTab} />
      </header>
      <main className="app-main">
        <section hidden={activeTab !== 'play'}>
          <PageErrorBoundary
            pageName="Play"
            resetKey={`play:${activeTab}`}
          >
            <PlayPage
              onBuildChange={handleBuildChange}
              isActive={activeTab === 'play'}
            />
          </PageErrorBoundary>
        </section>
        <section hidden={activeTab !== 'how'}>
          <PageErrorBoundary
            pageName="How"
            resetKey={`how:${activeTab}:${sharedBuildState.currentSeeds.map((seed) => seed.id).join('|')}`}
          >
            <HowPage
              currentBuild={sharedBuildState.currentBuild}
              currentSeeds={sharedBuildState.currentSeeds}
            />
          </PageErrorBoundary>
        </section>
        <section hidden={activeTab !== 'why'}>
          <PageErrorBoundary
            pageName="Why"
            resetKey={`why:${activeTab}`}
          >
            <WhyPage />
          </PageErrorBoundary>
        </section>
      </main>
    </div>
  );
}

export default App;
