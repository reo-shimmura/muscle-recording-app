'use client'

import { useCallback, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import RecordCard from './RecordCard';
import DetailsFilters from './DetailsFilters';
import RecordDateFilter from './RecordDateFilter';
import StatsChart from './StatsChart';
import { buildExerciseCategoryMap, CARDIO_CATEGORY, UNCATEGORIZED_LABEL } from '../../constants/exercises';
import { aggregateDailyStats } from '../../lib/detailsStats';
import type { TrainingRecord, CustomExercise } from '../../types';

interface Props {
  records: TrainingRecord[];
  customExercisesWithCategory: CustomExercise[];
  onEditRequest: (record: TrainingRecord) => void;
  onDeleteRequest: (id: number) => void;
}

const ALL_VALUE = '';

/** 記録詳細タブ：統計詳細（グラフ）と記録詳細（一覧）をブロックごとに分け、それぞれ独立したカテゴリ・種目フィルターを持つ */
export default function DetailsTab({ records, customExercisesWithCategory, onEditRequest, onDeleteRequest }: Props) {
  const [statsCategory, setStatsCategory] = useState(ALL_VALUE);
  const [statsExercise, setStatsExercise] = useState(ALL_VALUE);
  const [recordCategory, setRecordCategory] = useState(ALL_VALUE);
  const [recordExercise, setRecordExercise] = useState(ALL_VALUE);
  const [recordDate, setRecordDate] = useState(ALL_VALUE);

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

  // 選択中のカテゴリに属する種目のみを候補にする（統計・記録それぞれ独立して絞り込む）
  const exerciseOptionsFor = useCallback(
    (category: string) => {
      const scoped = records.filter((r) => !category || categoryOf(r.exercise) === category);
      return Array.from(new Set(scoped.map((r) => r.exercise))).sort();
    },
    [records, categoryOf]
  );
  const statsExerciseOptions = useMemo(() => exerciseOptionsFor(statsCategory), [exerciseOptionsFor, statsCategory]);
  const recordExerciseOptions = useMemo(() => exerciseOptionsFor(recordCategory), [exerciseOptionsFor, recordCategory]);

  const statsFilteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (statsCategory && categoryOf(r.exercise) !== statsCategory) return false;
      if (statsExercise && r.exercise !== statsExercise) return false;
      return true;
    });
  }, [records, statsCategory, statsExercise, categoryOf]);

  const dailyStats = useMemo(() => aggregateDailyStats(statsFilteredRecords), [statsFilteredRecords]);

  // カテゴリで「有酸素」を選んでいるか、有酸素種目を個別に選んでいる場合は時間ベースのグラフに切り替える
  const isCardio = statsCategory === CARDIO_CATEGORY || (statsExercise !== '' && categoryOf(statsExercise) === CARDIO_CATEGORY);

  // カテゴリを変更したら、別カテゴリの種目が選択されたままにならないようリセットする
  const handleStatsCategoryChange = (value: string) => {
    setStatsCategory(value);
    setStatsExercise(ALL_VALUE);
  };
  const handleRecordCategoryChange = (value: string) => {
    setRecordCategory(value);
    setRecordExercise(ALL_VALUE);
  };

  // 記録一覧はカテゴリ・種目・日付で絞り込める（統計ブロックとは独立したフィルター）
  const recordCategoryFilteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (recordCategory && categoryOf(r.exercise) !== recordCategory) return false;
      if (recordExercise && r.exercise !== recordExercise) return false;
      return true;
    });
  }, [records, recordCategory, recordExercise, categoryOf]);

  const availableDates = useMemo(
    () => Array.from(new Set(recordCategoryFilteredRecords.map((r) => r.date))).sort((a, b) => b.localeCompare(a)),
    [recordCategoryFilteredRecords]
  );

  const recordListRecords = useMemo(
    () => recordCategoryFilteredRecords.filter((r) => !recordDate || r.date === recordDate),
    [recordCategoryFilteredRecords, recordDate]
  );

  // 日付ごとにグループ化し、新しい日付が上に来るように並べる
  const recordsByDate = useMemo(() => {
    const grouped = new Map<string, TrainingRecord[]>();
    for (const r of recordListRecords) {
      const list = grouped.get(r.date) ?? [];
      list.push(r);
      grouped.set(r.date, list);
    }
    return Array.from(grouped.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [recordListRecords]);

  if (records.length === 0) {
    return (
      <div>
        <h3>📊 統計・記録詳細</h3>
        <div className="alert alert-info">
          まだ記録がありません。「記録追加」タブで追加してください。
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3>📊 統計・記録詳細</h3>

      <Card className="mb-4 ring-2 ring-primary/20">
        <CardHeader>
          <CardTitle>📈 統計詳細</CardTitle>
        </CardHeader>
        <CardContent>
          <DetailsFilters
            categories={categories}
            exercises={statsExerciseOptions}
            selectedCategory={statsCategory}
            selectedExercise={statsExercise}
            onCategoryChange={handleStatsCategoryChange}
            onExerciseChange={setStatsExercise}
          />

          {statsFilteredRecords.length === 0 ? (
            <div className="alert alert-info">該当する記録がありません。</div>
          ) : (
            <StatsChart key={isCardio ? 'cardio' : 'strength'} data={dailyStats} isCardio={isCardio} />
          )}
        </CardContent>
      </Card>

      <Card className="ring-2 ring-primary/20">
        <CardHeader>
          <CardTitle>📋 記録詳細</CardTitle>
        </CardHeader>
        <CardContent>
          <DetailsFilters
            categories={categories}
            exercises={recordExerciseOptions}
            selectedCategory={recordCategory}
            selectedExercise={recordExercise}
            onCategoryChange={handleRecordCategoryChange}
            onExerciseChange={setRecordExercise}
          />
          <RecordDateFilter dates={availableDates} selectedDate={recordDate} onDateChange={setRecordDate} />

          {recordListRecords.length === 0 ? (
            <div className="alert alert-info">該当する記録がありません。</div>
          ) : (
            <>
              <p className="small-muted">{recordListRecords.length} 件の記録</p>
              {recordsByDate.map(([date, recs]) => (
                <div key={date} className="mb-4">
                  <div className="record-date-heading">{date}</div>
                  {recs.map((r) => (
                    <RecordCard
                      key={r.id}
                      record={r}
                      hideDate
                      onEditRequest={onEditRequest}
                      onDeleteRequest={onDeleteRequest}
                    />
                  ))}
                </div>
              ))}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}