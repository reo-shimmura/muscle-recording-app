import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Tab {
  id: string;
  label: string;
}

interface Props {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

/** メインタブナビゲーション（コンテンツの出し分けは呼び出し側で行う） */
export default function TabNav({ tabs, activeTab, onTabChange }: Props) {
  return (
    <Tabs value={activeTab} onValueChange={(value) => onTabChange(value as string)}>
      <TabsList variant="line" className="w-full justify-start overflow-x-auto">
        {tabs.map((tab) => (
          <TabsTrigger key={tab.id} value={tab.id}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
