import type { ReactNode } from 'react';
import GoalProgressBar from './GoalProgressBar';
import Icon, { type IconName } from '../Icon';
import type { GoalProgressItem } from '../../lib/goalItems';

interface Props {
  icon: IconName;
  title: string;
  items: GoalProgressItem[];
  /** 項目がないときに出す文言（省略時は何も表示しない） */
  emptyMessage?: string;
  /** 行ごとの右端の操作（長期目標の削除ボタンなど） */
  renderAction?: (item: GoalProgressItem) => ReactNode;
}

/** 小見出しと、目標の横棒の一覧（ホームの「目標の進捗」と目標管理画面の達成状況で共通） */
export default function GoalProgressList({ icon, title, items, emptyMessage, renderAction }: Props) {
  if (items.length === 0 && !emptyMessage) return null;

  return (
    <div style={{ marginTop: '0.75rem' }}>
      <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.35rem' }}>
        <Icon name={icon} />{title}
      </div>
      {items.length === 0 ? (
        <div className="small-muted" style={{ fontSize: '0.85rem' }}>{emptyMessage}</div>
      ) : (
        items.map((item) => <GoalProgressBar key={item.key} item={item} action={renderAction?.(item)} />)
      )}
    </div>
  );
}
