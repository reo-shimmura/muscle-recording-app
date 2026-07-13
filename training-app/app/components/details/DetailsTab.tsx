'use client'

import { useCallback, useMemo, useState } from 'react';
import RecordCard from './RecordCard';
import DetailsFilters from './DetailsFilters';
import StatsChart from './StatsChart';
import { buildExerciseCategoryMap, CARDIO_CATEGORY, UNCATEGORIZED_LABEL } from '../../constants/exercises';
import { aggregateDailyStats } from '../../lib/detailsStats';
import type { TrainingRecord, CustomExercise } from '../../types';

interface Props {
  records: TrainingRecord[];
  customExercisesWithCategory: CustomExercise[];
  onDeleteRequest: (id: number) => void;
}

const ALL_VALUE = '';

/** 記録詳細タブ：カテゴリ・種目でのフィルター、日別統計グラフ、記録一覧を表示 */
export default function DetailsTab({ records, customExercisesWithCategory, onDeleteRequest }: Props) {
  const [category, setCategory] = useState(ALL_VALUE);
  const [exercise, setExercise] = useState(ALL_VALUE);

  const categoryMap = useMemo(
    () => buildExerciseCategoryMap(customExercisesWithCategory),
    [customExercisesWithCategory]
  );
  const categoryOf = useCallback(
    (exerciseName: string) => categoryMap[exerciseName] ?? UNCATEGORIZED_LABEL,
    [categoryMap]
  );

  const categories = useMemo(
    () => Array.from(new Set(records.map((r) => categoryOf(r.exercise)))).sort(),
    [records, categoryOf]
  );

  // 選択中のカテゴリに属する種目のみを候補にする
  const exerciseOptions = useMemo(() => {
    const scoped = records.filter((r) => !category || categoryOf(r.exercise) === category);
    return Array.from(new Set(scoped.map((r) => r.exercise))).sort();
  }, [records, category, categoryOf]);

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (category && categoryOf(r.exercise) !== category) return false;
      if (exercise && r.exercise !== exercise) return false;
      return true;
    });
  }, [records, category, exercise, categoryOf]);

  const dailyStats = useMemo(() => aggregateDailyStats(filteredRecords), [filteredRecords]);

  // カテゴリで「有酸素」を選んでいるか、有酸素種目を個別に選んでいる場合は時間ベースのグラフに切り替える
  const isCardio = category === CARDIO_CATEGORY || (exercise !== '' && categoryOf(exercise) === CARDIO_CATEGORY);

  // カテゴリを変更したら、別カテゴリの種目が選択されたままにならないようリセットする
  const handleCategoryChange = (value: string) => {
    setCategory(value);
    setExercise(ALL_VALUE);
  };

  return (
    <div>
      <h3>📊 統計・記録詳細</h3>

      {records.length === 0 ? (
        <div className="alert alert-info">
          まだ記録がありません。「記録追加」タブで追加してください。
        </div>
      ) : (
        <>
          <DetailsFilters
            categories={categories}
            exercises={exerciseOptions}
            selectedCategory={category}
            selectedExercise={exercise}
            onCategoryChange={handleCategoryChange}
            onExerciseChange={setExercise}
          />

          {filteredRecords.length === 0 ? (
            <div className="alert alert-info">該当する記録がありません。</div>
          ) : (
            <>
              <StatsChart key={isCardio ? 'cardio' : 'strength'} data={dailyStats} isCardio={isCardio} />

              <p className="small-muted">{filteredRecords.length} 件の記録</p>
              {filteredRecords.map((r) => (
                <RecordCard key={r.id} record={r} onDeleteRequest={onDeleteRequest} />
              ))}
            </>
          )}
        </>
      )}
    </div>
  );
}
