'use client'

import { useMemo } from 'react';
import PersonalRecordCard from './PersonalRecordCard';
import GrowthCard from './GrowthCard';
import { calcPersonalRecords } from '../../lib/analysis/personalRecords';
import { toDateStr } from '../../lib/goalsProgress';
import type { TrainingRecord } from '../../types';

interface Props {
  records: TrainingRecord[];
  categoryMap: Record<string, string>;
}

/** 統計タブ「成長」：自己ベスト一覧と伸び率 */
export default function GrowthPanel({ records, categoryMap }: Props) {
  const today = toDateStr(new Date());
  const personalRecords = useMemo(
    () => calcPersonalRecords(records, categoryMap, today),
    [records, categoryMap, today]
  );

  return (
    <>
      <GrowthCard records={records} categoryMap={categoryMap} />
      <PersonalRecordCard personalRecords={personalRecords} />
    </>
  );
}
