import Icon, { type IconName } from './Icon';

interface Tab {
  id: string;
  label: string;
  icon: IconName;
  /** タブごとのアイコンの色（省略時は文字色） */
  color?: string;
}

interface Props {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

/** 選択中のタブの背景に使う、タブの色の淡い色 */
function activeBackground(color: string): string {
  return `color-mix(in srgb, ${color} 14%, transparent)`;
}

/** 画面下部に固定表示するメインナビゲーション（アイコンはタブごとの色で常に表示する） */
export default function BottomNav({ tabs, activeTab, onTabChange }: Props) {
  return (
    <nav className="bottom-nav">
      {tabs.map((tab) => {
        const active = activeTab === tab.id;
        const color = tab.color ?? 'currentColor';
        return (
          <button
            key={tab.id}
            type="button"
            className={`bottom-nav-item${active ? ' active' : ''}`}
            onClick={() => onTabChange(tab.id)}
            // 選択中はタブの色で背景とラベルを塗る（未指定なら CSS の既定の配色）
            style={active && tab.color ? { color: tab.color, background: activeBackground(tab.color) } : undefined}
          >
            <span className="bottom-nav-icon">
              <Icon name={tab.icon} size="1.4rem" color={color} style={{ marginRight: 0 }} />
            </span>
            <span className="bottom-nav-label">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
