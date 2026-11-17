'use client'

import { useMemo, useState } from 'react';
import RecordGroupCard from './RecordGroupCard';
import DetailsFilters from './DetailsFilters';
import RecordDateFilter from './RecordDateFilter';
import { buildExerciseCategoryMap } from '../../constants/exercises';
import { groupRecordsByExercise } from '../../lib/groupRecords';
import { ALL_VALUE, useExerciseFilter } from '../../hooks/useExerciseFilter';
import type { TrainingRecord, CustomExercise } from '../../types';
import Icon from '../Icon';

interface Props {
  records: TrainingRecord[];
  customExercisesWithCategory: CustomExercise[];
  onEditRequest: (record: TrainingRecord) => void;
  onDeleteRequest: (id: number) => void;
}

/** 記録詳細タブ：カテゴリ・種目・日付で絞り込んだ記録を、日付ごと・種目ごとに一覧表示する（編集・削除可） */
export default function RecordsTab({ records, customExercisesWithCategory, onEditRequest, onDeleteRequest }: Props) {
  const [date, setDate] = useState(ALL_VALUE);

  const categoryMap = useMemo(
    () => buildExerciseCategoryMap(customExercisesWithCategory),
    [customExercisesWithCategory]
  );
  const filter = useExerciseFilter(records, categoryMap);

  const availableDates = useMemo(
    () => Array.from(new Set(filter.filteredRecords.map((r) => r.date))).sort((a, b) => b.localeCompare(a)),
    [filter.filteredRecords]
  );

  const listRecords = useMemo(
    () => filter.filteredRecords.filter((r) => !date || r.date === date),
    [filter.filteredRecords, date]
  );

  // 日付ごとにグループ化し、新しい日付が上に来るように並べる
  const recordsByDate = useMemo(() => {
    const grouped = new Map<string, TrainingRecord[]>();
    for (const r of listRecords) {
      grouped.set(r.date, [...(grouped.get(r.date) ?? []), r]);
    }
    return Array.from(grouped.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [listRecords]);

  if (records.length === 0) {
    return (
      <div>
        <h3><Icon name="training-log" />記録詳細</h3>
        <div className="alert alert-info">まだ記録がありません。「記録追加」タブで追加してください。</div>
      </div>
    );
  }

  return (
    <div>
      <h3><Icon name="training-log" />記録詳細</h3>

      <DetailsFilters
        categories={filter.categories}
        exercises={filter.exerciseOptions}
        selectedCategory={filter.category}
        selectedExercise={filter.exercise}
        onCategoryChange={filter.setCategory}
        onExerciseChange={filter.setExercise}
      />
      <RecordDateFilter dates={availableDates} selectedDate={date} onDateChange={setDate} />

      {listRecords.length === 0 ? (
        <div className="alert alert-info">該当する記録がありません。</div>
      ) : (
        <>
          <p className="small-muted">{listRecords.length} 件の記録</p>
          {recordsByDate.map(([recordDate, recs]) => (
            <div key={recordDate} className="mb-4">
              <div className="record-date-heading">{recordDate}</div>
              {groupRecordsByExercise(recs).map((group) => (
                <RecordGroupCard
                  key={group.exercise}
                  exercise={group.exercise}
                  records={group.records}
                  onEditRequest={onEditRequest}
                  onDeleteRequest={onDeleteRequest}
                />
              ))}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
