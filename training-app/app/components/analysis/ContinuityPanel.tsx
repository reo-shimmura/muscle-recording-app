import PeriodTrendCard from './PeriodTrendCard';
import WeekdayHeatmapCard from './WeekdayHeatmapCard';
import IntervalCard from './IntervalCard';
import type { TrainingRecord } from '../../types';

interface Props {
  records: TrainingRecord[];
}

/** 統計タブ「継続」：週・月ごとの推移、曜日別ヒートマップ、記録の間隔 */
export default function ContinuityPanel({ records }: Props) {
  return (
    <>
      <PeriodTrendCard records={records} />
      <WeekdayHeatmapCard records={records} />
      <IntervalCard records={records} />
    </>
  );
}
