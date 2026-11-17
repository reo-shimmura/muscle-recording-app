'use client'

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import DetailsFilters from './DetailsFilters';
import StatsChart from './StatsChart';
import OptionButtons from '../analysis/OptionButtons';
import ContinuityPanel from '../analysis/ContinuityPanel';
import BalancePanel from '../analysis/BalancePanel';
import GrowthPanel from '../analysis/GrowthPanel';
import BodyPanel from '../analysis/BodyPanel';
import { buildExerciseCategoryMap, CARDIO_CATEGORY } from '../../constants/exercises';
import { aggregateDailyStats } from '../../lib/detailsStats';
import { useExerciseFilter } from '../../hooks/useExerciseFilter';
import type { TrainingRecord, CustomExercise, BodyWeight } from '../../types';
import Icon from '../Icon';

interface Props {
  records: TrainingRecord[];
  bodyWeights: BodyWeight[];
  customExercisesWithCategory: CustomExercise[];
}

type Section = 'chart' | 'continuity' | 'balance' | 'growth' | 'body';

// 画面上部の切り替え（分析が多く縦に長くなりすぎないよう、観点ごとに切り替える）
const SECTION_OPTIONS: { key: Section; label: string }[] = [
  { key: 'chart', label: '種目グラフ' },
  { key: 'continuity', label: '継続' },
  { key: 'balance', label: 'バランス' },
  { key: 'growth', label: '成長' },
  { key: 'body', label: '体' },
];

/** 統計・分析タブ：種目ごとの推移グラフと、継続・バランス・成長・体の分析を切り替えて表示する */
export default function StatsTab({ records, bodyWeights, customExercisesWithCategory }: Props) {
  const [section, setSection] = useState<Section>('chart');

  const categoryMap = useMemo(
    () => buildExerciseCategoryMap(customExercisesWithCategory),
    [customExercisesWithCategory]
  );
  const filter = useExerciseFilter(records, categoryMap);
  const dailyStats = useMemo(() => aggregateDailyStats(filter.filteredRecords), [filter.filteredRecords]);

  // カテゴリで「有酸素」を選んでいるか、有酸素種目を個別に選んでいる場合は時間ベースのグラフに切り替える
  const isCardio =
    filter.category === CARDIO_CATEGORY || (filter.exercise !== '' && filter.categoryOf(filter.exercise) === CARDIO_CATEGORY);

  if (records.length === 0) {
    return (
      <div>
        <h3><Icon name="chart-up" />統計・分析</h3>
        <div className="alert alert-info">まだ記録がありません。「記録追加」タブで追加してください。</div>
      </div>
    );
  }

  return (
    <div>
      <h3><Icon name="chart-up" />統計・分析</h3>

      <OptionButtons options={SECTION_OPTIONS} selected={section} onSelect={setSection} />

      {section === 'chart' && (
        <Card className="mb-4 ring-2 ring-primary/20">
          <CardHeader>
            <CardTitle><Icon name="chart-up" />種目ごとの推移</CardTitle>
          </CardHeader>
          <CardContent>
            <DetailsFilters
              categories={filter.categories}
              exercises={filter.exerciseOptions}
              selectedCategory={filter.category}
              selectedExercise={filter.exercise}
              onCategoryChange={filter.setCategory}
              onExerciseChange={filter.setExercise}
            />
            {filter.filteredRecords.length === 0 ? (
              <div className="alert alert-info">該当する記録がありません。</div>
            ) : (
              <StatsChart key={isCardio ? 'cardio' : 'strength'} data={dailyStats} isCardio={isCardio} />
            )}
          </CardContent>
        </Card>
      )}
      {section === 'continuity' && <ContinuityPanel records={records} />}
      {section === 'balance' && <BalancePanel records={records} categoryMap={categoryMap} />}
      {section === 'growth' && <GrowthPanel records={records} categoryMap={categoryMap} />}
      {section === 'body' && <BodyPanel records={records} bodyWeights={bodyWeights} categoryMap={categoryMap} />}
    </div>
  );
}
