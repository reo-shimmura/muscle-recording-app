'use client'

import { useMemo, useState } from 'react';
import OptionButtons from './OptionButtons';
import CategoryBalanceCard from './CategoryBalanceCard';
import PushPullCard from './PushPullCard';
import { calcPushPullBalance, summarizeByCategory } from '../../lib/analysis/categoryBalance';
import { addDaysStr } from '../../lib/analysis/common';
import { toDateStr } from '../../lib/goalsProgress';
import type { TrainingRecord } from '../../types';

interface Props {
  records: TrainingRecord[];
  categoryMap: Record<string, string>;
}

type Range = '1m' | '3m' | 'all';

const RANGE_OPTIONS: { key: Range; label: string }[] = [
  { key: '1m', label: '直近1か月' },
  { key: '3m', label: '直近3か月' },
  { key: 'all', label: '全期間' },
];

const RANGE_DAYS: Record<Exclude<Range, 'all'>, number> = { '1m': 30, '3m': 90 };

/** 集計の開始日（今日を含む直近N日の初日。全期間なら null） */
function startDateOf(range: Range, today: string): string | null {
  return range === 'all' ? null : addDaysStr(today, -(RANGE_DAYS[range] - 1));
}

/** 統計タブ「バランス」：部位別バランスと押す・引くのバランス（期間は共通で切り替える） */
export default function BalancePanel({ records, categoryMap }: Props) {
  const [range, setRange] = useState<Range>('1m');
  const today = toDateStr(new Date());

  const balances = useMemo(
    () => summarizeByCategory(records, categoryMap, startDateOf(range, today)),
    [records, categoryMap, range, today]
  );
  const pushPull = useMemo(() => calcPushPullBalance(balances), [balances]);

  return (
    <>
      <OptionButtons options={RANGE_OPTIONS} selected={range} onSelect={setRange} />
      <CategoryBalanceCard balances={balances} />
      <PushPullCard balance={pushPull} />
    </>
  );
}
