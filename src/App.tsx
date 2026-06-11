// src/App.tsx

import { useState } from 'react';
import { TabNav, type TabId } from './components/TabNav';
import { PlayPage } from './pages/PlayPage';
import { HowPage } from './pages/HowPage';
import { WhyPage } from './pages/WhyPage';
import './styles.css';

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('play');

  const renderPage = () => {
    switch (activeTab) {
      case 'play':
        return <PlayPage />;
      case 'how':
        return <HowPage />;
      case 'why':
        return <WhyPage />;
    }
  };

  return (
    <div className="app-shell">
      <TabNav activeTab={activeTab} onTabChange={setActiveTab} />
      {renderPage()}
    </div>
  );
}

export default App;
