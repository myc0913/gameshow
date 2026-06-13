// src/components/TabNav.tsx

export type TabId = 'play' | 'how' | 'why';

interface TabNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const tabs: { id: TabId; label: string; cn: string }[] = [
  { id: 'play', label: 'PLAY', cn: '构筑' },
  { id: 'how', label: 'HOW', cn: '推演' },
  { id: 'why', label: 'WHY', cn: '理念' },
];

export function TabNav({ activeTab, onTabChange }: TabNavProps) {
  return (
    <nav className="tab-nav">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`tab-btn${activeTab === tab.id ? ' active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          <span>{tab.label}</span>
          <small>{tab.cn}</small>
        </button>
      ))}
    </nav>
  );
}
