'use client'

import { useMemo } from 'react';
import BodyVolumeCard from './BodyVolumeCard';
import RelativeStrengthCard from './RelativeStrengthCard';
import { calcRelativeStrength, summarizeWeeklyBody } from '../../lib/analysis/bodyComposition';
import { calcPersonalRecords } from '../../lib/analysis/personalRecords';
import { toDateStr } from '../../lib/goalsProgress';
import type { BodyWeight, TrainingRecord } from '../../types';

interface Props {
  records: TrainingRecord[];
  bodyWeights: BodyWeight[];
  categoryMap: Record<string, string>;
}

// 体重と負荷量のグラフに表示する週数
const WEEKS = 12;

/** 統計タブ「体」：体重と負荷量の重ね合わせ、体重あたりの挙上重量 */
export default function BodyPanel({ records, bodyWeights, categoryMap }: Props) {
  const today = toDateStr(new Date());

  const weeklyStats = useMemo(
    () => summarizeWeeklyBody(records, bodyWeights, today, WEEKS),
    [records, bodyWeights, today]
  );
  const relativeStrength = useMemo(
    () => calcRelativeStrength(calcPersonalRecords(records, categoryMap, today), bodyWeights),
    [records, bodyWeights, categoryMap, today]
  );

  return (
    <>
      <BodyVolumeCard weeklyStats={weeklyStats} />
      <RelativeStrengthCard result={relativeStrength} />
    </>
  );
}
